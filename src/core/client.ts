import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  AuthenticationState,
  GroupMetadata,
  WASocket,
} from "baileys";
import { Boom } from "@hapi/boom";
import { LRUCache } from "lru-cache";
import consola from "consola";
import pino from "pino";
import { EventHandler } from "./eventHandler";

export interface ConnectionOptions {
  useQR?: boolean;
  phoneNumber?: string;
  authDir?: string;
  enableGroupCache?: boolean;
  groupCacheTTL?: number;
}

export interface WhatsAppClientInstance {
  sock: WASocket;
  groupCache?: LRUCache<string, GroupMetadata>;
  disconnect: () => void;
}

export class WhatsAppClient {
  private sock?: WASocket;
  private groupCache?: LRUCache<string, GroupMetadata>;
  private authState?: { state: AuthenticationState; saveCreds: () => void };
  private options: ConnectionOptions;
  private connectCallback?: (instance: WhatsAppClientInstance) => void;
  public event!: EventHandler;

  constructor(options: ConnectionOptions) {
    this.options = {
      useQR: true,
      authDir: "auth_info_baileys",
      enableGroupCache: false,
      groupCacheTTL: 300,
      ...options
    };
  }

  onConnect(callback: (instance: WhatsAppClientInstance) => void) {
    this.connectCallback = callback;
  }

  async connect(): Promise<WhatsAppClientInstance> {
    this.authState = await this.getAuthState();
    
    if (this.options.enableGroupCache) {
      this.groupCache = new LRUCache<string, GroupMetadata>({
        ttl: this.options.groupCacheTTL! * 1000,
        ttlAutopurge: true,
      });
    }

    this.sock = this.createSocket();
    this.event = new EventHandler(this.sock);

    if (!this.options.useQR && this.options.phoneNumber) {
      const code = await this.requestPairingCode();
      consola.info("Pairing Code:", code);
    }

    this.setupHandlers();

    const instance = {
      sock: this.sock,
      groupCache: this.groupCache,
      disconnect: () => this.disconnect()
    };

    this.connectCallback?.(instance);
    return instance;
  }

  private async getAuthState() {
    return useMultiFileAuthState(this.options.authDir!);
  }

  private createSocket() {
    return makeWASocket({
      auth: this.authState!.state,
      printQRInTerminal: this.options.useQR,
      logger: pino({ level: "debug" }),
      cachedGroupMetadata: this.groupCache
        ? async (jid) => this.groupCache!.get(jid)
        : undefined,
    });
  }

  private async requestPairingCode() {
    if (!this.sock?.authState.creds.registered) {
      return this.sock!.requestPairingCode(this.options.phoneNumber!);
    }
    throw new Error("Device is already registered.");
  }

  private setupHandlers() {
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

    this.event.onCredentialsUpdate(this.authState!.saveCreds);

    if (this.groupCache) {
      this.setupGroupCacheHandlers();
    }
  }

  private setupGroupCacheHandlers() {
    this.event.onGroupUpdate(async ([event]) => {
      if (event.id) {
        const metadata = await this.sock!.groupMetadata(event.id);
        if (metadata) {
          this.groupCache!.set(event.id, metadata);
        }
      }
    });

    this.event.onGroupParticipantsUpdate(async (event) => {
      const metadata = await this.sock!.groupMetadata(event.id);
      if (metadata) {
        this.groupCache!.set(event.id, metadata);
      }
    });
  }

  private isBoom(error: unknown): error is Boom {
    return (
      typeof error === "object" &&
      error !== null &&
      "isBoom" in error &&
      (error as { isBoom: boolean }).isBoom === true
    );
  }

  private disconnect() {
    this.sock?.end(undefined);
  }
}