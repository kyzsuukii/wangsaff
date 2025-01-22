import {
  proto,
  AnyMessageContent,
  MiscMessageGenerationOptions,
  BaileysEventMap,
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
      this.setupEventHandlers();
    });
  }

  private setupEventHandlers(): void {
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    this.client.event.onMessageUpsert(this.handleIncomingMessage.bind(this));
  }

  private async handleIncomingMessage({
    messages,
  }: BaileysEventMap["messages.upsert"]): Promise<void> {
    const [message] = messages;
    if (!this.isValidMessage(message)) return;
    await this.commandHandler.handleMessage(message);
  }

  private isValidMessage(
    message?: proto.IWebMessageInfo,
  ): message is proto.IWebMessageInfo {
    return message?.message !== null && message?.message !== undefined;
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
    return this.clientInstance.sendMessage(jid, content, options);
  }

  public async reply(
    message: proto.IWebMessageInfo,
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.clientInstance) {
      throw new Error("Client is not connected");
    }
    return this.clientInstance.reply(message, content, options);
  }

  public disconnect(): void {
    this.clientInstance?.disconnect();
  }
}
