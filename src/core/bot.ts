import { proto, AnyMessageContent, MiscMessageGenerationOptions } from "baileys";
import { WhatsAppClient, WhatsAppClientInstance } from "./client";
import { CommandHandler, type Command } from "./commandHandler";

export interface BotOptions {
    prefix?: string;
}

export class WhatsAppBot {
    private client: WhatsAppClient;
    private commandHandler: CommandHandler;
    private clientInstance?: WhatsAppClientInstance;

    constructor(client: WhatsAppClient, options: BotOptions = {}) {
        this.client = client;
        this.commandHandler = new CommandHandler(options.prefix);
        this.setupClient();
    }

    private setupClient() {
        this.client.onConnect((instance) => {
            this.clientInstance = instance;
            this.client.event.setupCommandHandler(this.commandHandler);
        });
    }

    command(command: Command): this {
        this.commandHandler.register(command);
        return this;
    }

    async sendMessage(jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) {
        return await this.clientInstance?.sock.sendMessage(jid, content, options);
    }

    async reply(message: proto.IWebMessageInfo, content: AnyMessageContent, options?: MiscMessageGenerationOptions) {
        return await this.clientInstance?.sock.sendMessage(
            message.key.remoteJid!,
            content,
            { quoted: message, ...options }
        );
    }

    disconnect() {
        this.clientInstance?.disconnect();
    }
}
