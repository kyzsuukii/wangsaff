import { WASocket, BaileysEventMap } from "baileys";

type EventHandlerType<T extends keyof BaileysEventMap> = (
  data: BaileysEventMap[T],
) => Promise<void> | void;

export class EventHandler {
  constructor(private readonly socket: WASocket) {}

  private static createEventHandler<T extends keyof BaileysEventMap>(event: T) {
    return function (this: EventHandler, handler: EventHandlerType<T>) {
      this.bindEvent(event, handler);
    };
  }

  // Message Events
  public onMessageUpsert = EventHandler.createEventHandler("messages.upsert");
  public onMessageUpdate = EventHandler.createEventHandler("messages.update");
  public onMessageDelete = EventHandler.createEventHandler("messages.delete");
  public onMessageReaction =
    EventHandler.createEventHandler("messages.reaction");

  // Group Events
  public onGroupUpdate = EventHandler.createEventHandler("groups.update");
  public onGroupParticipantsUpdate = EventHandler.createEventHandler(
    "group-participants.update",
  );
  public onGroupJoinRequest =
    EventHandler.createEventHandler("group.join-request");

  // Connection Events
  public onConnectionUpdate =
    EventHandler.createEventHandler("connection.update");
  public onCredentialsUpdate = EventHandler.createEventHandler("creds.update");

  // Presence Events
  public onPresenceUpdate = EventHandler.createEventHandler("presence.update");

  // Chat Events
  public onChatsUpsert = EventHandler.createEventHandler("chats.upsert");
  public onChatsUpdate = EventHandler.createEventHandler("chats.update");
  public onChatsDelete = EventHandler.createEventHandler("chats.delete");

  // Contact Events
  public onContactsUpsert = EventHandler.createEventHandler("contacts.upsert");
  public onContactsUpdate = EventHandler.createEventHandler("contacts.update");

  // Call Events
  public onCall = EventHandler.createEventHandler("call");

  // Label Events
  public onLabelsEdit = EventHandler.createEventHandler("labels.edit");
  public onLabelsAssociation =
    EventHandler.createEventHandler("labels.association");

  // Generic Event Methods
  public on<T extends keyof BaileysEventMap>(
    event: T,
    handler: EventHandlerType<T>,
  ) {
    this.bindEvent(event, handler);
  }

  public off<T extends keyof BaileysEventMap>(
    event: T,
    handler: EventHandlerType<T>,
  ) {
    this.socket.ev.off(event, handler);
  }

  public removeAllListeners<T extends keyof BaileysEventMap>(event: T) {
    this.socket.ev.removeAllListeners(event);
  }

  protected bindEvent<T extends keyof BaileysEventMap>(
    event: T,
    handler: EventHandlerType<T>,
  ) {
    this.socket.ev.on(event, handler);
  }
}
