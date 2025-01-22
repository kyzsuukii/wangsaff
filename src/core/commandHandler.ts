import { proto } from "baileys";

export type CommandHandlerType = (message: proto.IWebMessageInfo, args: string[]) => Promise<void> | void;

export interface Command {
    name: string;
    handler: CommandHandlerType;
    description?: string;
    aliases?: string[];
}

export class CommandHandler {
    private commands: Map<string, Command>;
    private aliasMap: Map<string, string>;
    private prefix: string;

    constructor(prefix: string = "!") {
        this.commands = new Map();
        this.aliasMap = new Map();
        this.prefix = prefix;
    }

    register(command: Command): this {
        this.commands.set(command.name, command);
        command.aliases?.forEach(alias => {
            this.aliasMap.set(alias, command.name);
        });
        return this;
    }

    async handle(message: proto.IWebMessageInfo): Promise<void> {
        const messageText = this.extractMessageText(message);
        if (!messageText.startsWith(this.prefix)) return;

        const { commandName, args } = this.parseCommand(messageText);
        const command = this.findCommand(commandName);

        if (command) {
            try {
                await command.handler(message, args);
            } catch (error) {
                console.error(`Error executing command ${commandName}:`, error);
            }
        }
    }

    private extractMessageText(message: proto.IWebMessageInfo): string {
        return message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            "";
    }

    private parseCommand(text: string) {
        const withoutPrefix = text.slice(this.prefix.length).trim();
        const [commandName, ...args] = withoutPrefix.split(" ");
        return { commandName: commandName.toLowerCase(), args };
    }

    private findCommand(name: string): Command | undefined {
        const directCommand = this.commands.get(name);
        if (directCommand) return directCommand;

        const mainCommandName = this.aliasMap.get(name);
        return mainCommandName ? this.commands.get(mainCommandName) : undefined;
    }

    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }
}
