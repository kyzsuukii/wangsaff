import { WhatsAppBot } from "./core/bot";
import ms from "ms";
import { WhatsAppClient } from "./core/client";

const client = new WhatsAppClient({
  useQR: true,
  enableGroupCache: true,
  groupCacheTTL: ms("1 hour"),
});

const bot = new WhatsAppBot(client, {
  prefix: "!",
});

bot.command({
  name: "ping",
  handler: async (message) => {
    if (!message.key.remoteJid) return;
    await bot.sendMessage(message.key.remoteJid, { text: "Pong!" });
  },
});

const start = async () => {
  const clientInstance = await client.connect();

  client.event.onGroupParticipantsUpdate(async (event) => {
    if (event.action === "add") {
      const welcomeText = `Welcome to the group ${event.participants.map((p) => "@" + p.split("@")[0]).join(", ")}! 👋`;
      await clientInstance.sendMessage(event.id, {
        text: welcomeText,
        mentions: event.participants,
      });
    }
  });

  client.event.onCall(async (events) => {
    for (const event of events) {
      if (event.status === "offer") {
        await clientInstance.sendMessage(event.chatId, {
          text: "Sorry, I don't accept calls. Please send a message instead. 📞❌",
        });
      }
    }
  });
};

start();
