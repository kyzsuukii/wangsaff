import { WASocket, BaileysEventMap } from "baileys";

type EventHandlerType<T extends keyof BaileysEventMap> = (
  data: BaileysEventMap[T],
) => Promise<void> | void;

export class EventHandler {
  constructor(private readonly socket: WASocket) {}

  // Message Events
  onMessageUpsert(handler: EventHandlerType<"messages.upsert">) {
    this.bindEvent("messages.upsert", handler);
  }

  onMessageUpdate(handler: EventHandlerType<"messages.update">) {
    this.bindEvent("messages.update", handler);
  }

  onMessageDelete(handler: EventHandlerType<"messages.delete">) {
    this.bindEvent("messages.delete", handler);
  }

  onMessageReaction(handler: EventHandlerType<"messages.reaction">) {
    this.bindEvent("messages.reaction", handler);
  }

  // Group Events
  onGroupUpdate(handler: EventHandlerType<"groups.update">) {
    this.bindEvent("groups.update", handler);
  }

  onGroupParticipantsUpdate(
    handler: EventHandlerType<"group-participants.update">,
  ) {
    this.bindEvent("group-participants.update", handler);
  }

  onGroupJoinRequest(handler: EventHandlerType<"group.join-request">) {
    this.bindEvent("group.join-request", handler);
  }

  // Connection Events
  onConnectionUpdate(handler: EventHandlerType<"connection.update">) {
    this.bindEvent("connection.update", handler);
  }

  onCredentialsUpdate(handler: EventHandlerType<"creds.update">) {
    this.bindEvent("creds.update", handler);
  }

  // Presence Events
  onPresenceUpdate(handler: EventHandlerType<"presence.update">) {
    this.bindEvent("presence.update", handler);
  }

  // Chat Events
  onChatsUpsert(handler: EventHandlerType<"chats.upsert">) {
    this.bindEvent("chats.upsert", handler);
  }

  onChatsUpdate(handler: EventHandlerType<"chats.update">) {
    this.bindEvent("chats.update", handler);
  }

  onChatsDelete(handler: EventHandlerType<"chats.delete">) {
    this.bindEvent("chats.delete", handler);
  }

  // Contact Events
  onContactsUpsert(handler: EventHandlerType<"contacts.upsert">) {
    this.bindEvent("contacts.upsert", handler);
  }

  onContactsUpdate(handler: EventHandlerType<"contacts.update">) {
    this.bindEvent("contacts.update", handler);
  }

  // Call Events
  onCall(handler: EventHandlerType<"call">) {
    this.bindEvent("call", handler);
  }

  // Label Events
  onLabelsEdit(handler: EventHandlerType<"labels.edit">) {
    this.bindEvent("labels.edit", handler);
  }

  onLabelsAssociation(handler: EventHandlerType<"labels.association">) {
    this.bindEvent("labels.association", handler);
  }

  // Generic Event Methods
  on<T extends keyof BaileysEventMap>(event: T, handler: EventHandlerType<T>) {
    this.bindEvent(event, handler);
  }

  off<T extends keyof BaileysEventMap>(event: T, handler: EventHandlerType<T>) {
    this.socket.ev.off(event, handler);
  }

  removeAllListeners<T extends keyof BaileysEventMap>(event: T) {
    this.socket.ev.removeAllListeners(event);
  }

  private bindEvent<T extends keyof BaileysEventMap>(
    event: T,
    handler: EventHandlerType<T>,
  ) {
    this.socket.ev.on(event, handler);
  }
}
