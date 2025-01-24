import makeWASocket, {
  DisconnectReason,
  AuthenticationState,
  GroupMetadata,
  WASocket,
  AnyMessageContent,
  MiscMessageGenerationOptions,
  proto,
} from "baileys";
import { Boom } from "@hapi/boom";
import { LRUCache } from "lru-cache";
import pino from "pino";
import { EventHandler } from "./eventHandler";
import { useDatabaseAuth } from "./database/auth";

interface BaseConnectionOptions {
  sessionId?: string;
  enableGroupCache?: boolean;
  groupCacheTTL?: number;
}

type WithQR = BaseConnectionOptions & {
  useQR: true;
  phoneNumber?: never;
};

type WithPhone = BaseConnectionOptions & {
  useQR: false;
  phoneNumber: string;
};

export type ConnectionOptions = WithQR | WithPhone;

export interface WhatsAppClientInstance {
  sock: WASocket;
  groupCache?: LRUCache<string, GroupMetadata>;
  disconnect: () => void;
  sendMessage: (
    jid: string,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ) => Promise<proto.WebMessageInfo | undefined>;
  reply: (
    message: proto.IWebMessageInfo,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ) => Promise<proto.WebMessageInfo | undefined>;
}

export class WhatsAppClient {
  private sock?: WASocket;
  private groupCache?: LRUCache<string, GroupMetadata>;
  private authState?: { state: AuthenticationState; saveCreds: () => void };
  private readonly options: ConnectionOptions;
  private connectCallback?: (instance: WhatsAppClientInstance) => void;
  public event!: EventHandler;

  constructor(options: ConnectionOptions) {
    const defaultOptions: Partial<BaseConnectionOptions> = {
      sessionId: "default_session",
      enableGroupCache: false,
      groupCacheTTL: 300,
    };

    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  public onConnect(callback: (instance: WhatsAppClientInstance) => void): void {
    this.connectCallback = callback;
  }

  public async connect(): Promise<WhatsAppClientInstance> {
    await this.initializeConnection();
    return this.createClientInstance();
  }

  private async initializeConnection(): Promise<void> {
    this.authState = await this.getAuthState();
    this.initializeGroupCache();
    this.sock = this.createSocket();
    this.event = new EventHandler(this.sock);

    await this.handlePairingIfNeeded();
    this.setupHandlers();
  }

  private initializeGroupCache(): void {
    if (this.options.enableGroupCache) {
      this.groupCache = new LRUCache<string, GroupMetadata>({
        ttl: this.options.groupCacheTTL! * 1000,
        ttlAutopurge: true,
      });
    }
  }

  private createClientInstance(): WhatsAppClientInstance {
    if (!this.sock) {
      throw new Error("Socket not initialized");
    }

    const instance: WhatsAppClientInstance = {
      sock: this.sock,
      groupCache: this.groupCache,
      disconnect: () => this.disconnect(),
      sendMessage: (jid, content, options) =>
        this.sendMessage(jid, content, options),
      reply: (message, content, options) =>
        this.reply(message, content, options),
    };

    this.connectCallback?.(instance);
    return instance;
  }

  private async getAuthState() {
    if (!this.options.sessionId) {
      throw new Error("Session ID not specified");
    }
    const auth = new useDatabaseAuth(this.options.sessionId);
    return auth.getAuthFromDatabase();
  }

  private createSocket(): WASocket {
    if (!this.authState) {
      throw new Error("Auth state not initialized");
    }

    return makeWASocket({
      auth: this.authState.state,
      printQRInTerminal: this.options.useQR,
      logger: pino({ level: "debug" }),
      cachedGroupMetadata: this.groupCache
        ? async (jid) => this.groupCache!.get(jid)
        : undefined,
    });
  }

  private async handlePairingIfNeeded(): Promise<void> {
    if (!this.options.useQR && this.options.phoneNumber && this.sock) {
      if (!this.sock.authState.creds.registered) {
        const code = await this.sock.requestPairingCode(
          this.options.phoneNumber,
        );
        console.info(`Pairing Code: ${code}`);
      }
    }
  }

  private setupHandlers(): void {
    this.setupConnectionHandler();
    this.setupCredentialsHandler();
    this.setupGroupHandlersIfNeeded();
  }

  private setupConnectionHandler(): void {
    this.event.onConnectionUpdate((update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close" && this.isBoom(lastDisconnect?.error)) {
        const shouldReconnect =
          lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.connect();
        }
      }
    });
  }

  private setupCredentialsHandler(): void {
    if (!this.authState) {
      throw new Error("Auth state not initialized");
    }
    this.event.onCredentialsUpdate(this.authState.saveCreds);
  }

  private setupGroupHandlersIfNeeded(): void {
    if (this.groupCache) {
      this.setupGroupHandlers();
    }
  }

  private setupGroupHandlers(): void {
    if (!this.sock || !this.groupCache) return;

    this.event.onGroupUpdate(async ([event]) => {
      if (event.id) {
        await this.updateGroupMetadata(event.id);
      }
    });

    this.event.onGroupParticipantsUpdate(async (event) => {
      await this.updateGroupMetadata(event.id);
    });
  }

  private async updateGroupMetadata(groupId: string): Promise<void> {
    if (!this.sock || !this.groupCache) return;

    const metadata = await this.sock.groupMetadata(groupId);
    if (metadata) {
      this.groupCache.set(groupId, metadata);
    }
  }

  private isBoom(error: unknown): error is Boom {
    return (
      typeof error === "object" &&
      error !== null &&
      "isBoom" in error &&
      (error as { isBoom: boolean }).isBoom === true
    );
  }

  private disconnect(): void {
    this.sock?.end(undefined);
  }

  public async sendMessage(
    jid: string,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.sock) {
      throw new Error("Client is not connected");
    }
    return this.sock.sendMessage(jid, content, options);
  }

  public async reply(
    message: proto.IWebMessageInfo,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.sock || !message.key.remoteJid) {
      throw new Error("Client is not connected or invalid message");
    }
    return this.sock.sendMessage(message.key.remoteJid, content, {
      quoted: message,
      ...options,
    });
  }
}
