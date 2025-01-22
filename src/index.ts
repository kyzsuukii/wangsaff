import { WhatsAppBot } from "./core/bot";
import ms from "ms";
import { WhatsAppClient } from "./core/client";
import consola from "consola";

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
  await client.connect();

  client.event.onMessageUpsert(async ({ messages }) => {
    for (const message of messages) {
      if (message.message?.conversation) {
        consola.info(message.message.conversation);
      }
    }
  });
};

start();
