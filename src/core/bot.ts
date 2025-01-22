import {
  proto,
  AnyMessageContent,
  MiscMessageGenerationOptions,
} from "baileys";
import { WhatsAppClient, WhatsAppClientInstance } from "./client";
import { CommandHandler, type Command } from "./commandHandler";

export interface BotOptions {
  prefix?: string;
}

export class WhatsAppBot {
  private readonly client: WhatsAppClient;
  private readonly commandHandler: CommandHandler;
  private clientInstance?: WhatsAppClientInstance;

  constructor(client: WhatsAppClient, options: BotOptions = {}) {
    this.client = client;
    this.commandHandler = new CommandHandler(options.prefix);
    this.initialize();
  }

  private initialize(): void {
    this.setupClientConnection();
  }

  private setupClientConnection(): void {
    this.client.onConnect((instance) => {
      this.clientInstance = instance;
      this.client.event.setupCommandHandler(this.commandHandler);
    });
  }

  public command(command: Command): this {
    this.commandHandler.register(command);
    return this;
  }

  public async sendMessage(
    jid: string,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.clientInstance) {
      throw new Error("Client is not connected");
    }
    return this.clientInstance.sock.sendMessage(jid, content, options);
  }

  public async reply(
    message: proto.IWebMessageInfo,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.clientInstance || !message.key.remoteJid) {
      throw new Error("Client is not connected or invalid message");
    }
    return this.clientInstance.sock.sendMessage(
      message.key.remoteJid,
      content,
      { quoted: message, ...options },
    );
  }

  public disconnect(): void {
    this.clientInstance?.disconnect();
  }
}
