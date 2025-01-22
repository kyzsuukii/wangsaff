import { WASocket, BaileysEventMap } from "baileys";
import { CommandHandler } from "./commandHandler";

type EventHandlerType<T extends keyof BaileysEventMap> = (data: BaileysEventMap[T]) => Promise<void> | void;

export class EventHandler {
    private socket: WASocket;
    private commandHandler?: CommandHandler;

    constructor(socket: WASocket, commandHandler?: CommandHandler) {
        this.socket = socket;
        this.commandHandler = commandHandler;
        this.setupHandlers();
    }

    setupCommandHandler(handler: CommandHandler) {
        this.commandHandler = handler;
        this.setupHandlers();
    }

    private setupHandlers() {
        if (this.commandHandler) {
            this.setupMessageHandler();
        }
    }

    private setupMessageHandler() {
        this.onMessageUpsert(async ({ messages }) => {
            const message = messages[0];
            if (!message?.message || !this.commandHandler) return;
            await this.commandHandler.handle(message);
        });
    }

    onMessageUpsert(handler: EventHandlerType<'messages.upsert'>) {
        this.socket.ev.on('messages.upsert', handler);
    }

    onMessageUpdate(handler: EventHandlerType<'messages.update'>) {
        this.socket.ev.on('messages.update', handler);
    }

    onMessageDelete(handler: EventHandlerType<'messages.delete'>) {
        this.socket.ev.on('messages.delete', handler);
    }

    onMessageReaction(handler: EventHandlerType<'messages.reaction'>) {
        this.socket.ev.on('messages.reaction', handler);
    }

    onGroupUpdate(handler: EventHandlerType<'groups.update'>) {
        this.socket.ev.on('groups.update', handler);
    }

    onGroupParticipantsUpdate(handler: EventHandlerType<'group-participants.update'>) {
        this.socket.ev.on('group-participants.update', handler);
    }

    onGroupJoinRequest(handler: EventHandlerType<'group.join-request'>) {
        this.socket.ev.on('group.join-request', handler);
    }

    onConnectionUpdate(handler: EventHandlerType<'connection.update'>) {
        this.socket.ev.on('connection.update', handler);
    }

    onCredentialsUpdate(handler: EventHandlerType<'creds.update'>) {
        this.socket.ev.on('creds.update', handler);
    }

    onPresenceUpdate(handler: EventHandlerType<'presence.update'>) {
        this.socket.ev.on('presence.update', handler);
    }

    onChatsUpsert(handler: EventHandlerType<'chats.upsert'>) {
        this.socket.ev.on('chats.upsert', handler);
    }

    onChatsUpdate(handler: EventHandlerType<'chats.update'>) {
        this.socket.ev.on('chats.update', handler);
    }

    onChatsDelete(handler: EventHandlerType<'chats.delete'>) {
        this.socket.ev.on('chats.delete', handler);
    }

    onContactsUpsert(handler: EventHandlerType<'contacts.upsert'>) {
        this.socket.ev.on('contacts.upsert', handler);
    }

    onContactsUpdate(handler: EventHandlerType<'contacts.update'>) {
        this.socket.ev.on('contacts.update', handler);
    }

    onCall(handler: EventHandlerType<'call'>) {
        this.socket.ev.on('call', handler);
    }

    onLabelsEdit(handler: EventHandlerType<'labels.edit'>) {
        this.socket.ev.on('labels.edit', handler);
    }

    onLabelsAssociation(handler: EventHandlerType<'labels.association'>) {
        this.socket.ev.on('labels.association', handler);
    }

    on<T extends keyof BaileysEventMap>(event: T, handler: EventHandlerType<T>) {
        this.socket.ev.on(event, handler);
    }

    off<T extends keyof BaileysEventMap>(event: T, handler: EventHandlerType<T>) {
        this.socket.ev.off(event, handler);
    }

    removeAllListeners<T extends keyof BaileysEventMap>(event: T) {
        this.socket.ev.removeAllListeners(event);
    }
} 