import {
  Client,
  GatewayIntentBits,
  Interaction,
  AttachmentBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getRandomAccount, removeAccount, addAccounts, accountCount } from "./combolist.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error("HATA: DISCORD_BOT_TOKEN veya DISCORD_CLIENT_ID eksik!");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 60_000;

client.once("ready", () => {
  console.log(`Bot aktif: ${client.user?.tag}`);
  console.log(`Combolist'te ${accountCount()} hesap var.`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === "hesap") {
    const member = interaction.guild?.members.cache.get(user.id);
    const hasBlockedRole = member?.roles.cache.some((r) => r.name === "üye");

    if (hasBlockedRole) {
      await interaction.reply({
        content: "❌ **Üye** rolüyle bu komutu kullanamazsın!",
        ephemeral: true,
      });
      return;
    }

    const now = Date.now();
    const lastUsed = cooldowns.get(user.id) ?? 0;
    const remaining = COOLDOWN_MS - (now - lastUsed);

    if (remaining > 0) {
      const secs = Math.ceil(remaining / 1000);
      await interaction.reply({
        content: `⏳ Bekle! **${secs} saniye** sonra tekrar kullanabilirsin.`,
        ephemeral: true,
      });
      return;
    }

    const account = getRandomAccount();

    if (!account) {
      await interaction.reply({
        content: "❌ Combolist boş! Yöneticiden hesap yüklemesini iste.",
        ephemeral: true,
      });
      return;
    }

    removeAccount(account);
    cooldowns.set(user.id, now);

    await interaction.reply({
      content: `✅ **Hesabın hazır!**\n\`\`\`\n${account}\n\`\`\`\n⏳ Bir sonraki hesabı **1 dakika** sonra alabilirsin.`,
      ephemeral: true,
    });

    console.log(`[${new Date().toISOString()}] ${user.tag} → hesap verildi, stok: ${accountCount()}`);
    return;
  }

  if (commandName === "yukle") {
    const member = interaction.guild?.members.cache.get(user.id);
    const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator);

    if (!isAdmin) {
      await interaction.reply({
        content: "❌ Bu komutu sadece **yöneticiler** kullanabilir.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const attachment = interaction.options.getAttachment("dosya", true);

    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error("Dosya indirilemedi");

      const text = await response.text();
      const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      const added = addAccounts(lines);

      await interaction.editReply({
        content: `✅ **${added}** yeni hesap eklendi! Toplam stok: **${accountCount()}**`,
      });

      console.log(`[${new Date().toISOString()}] ${user.tag} → ${added} hesap yükledi`);
    } catch (err) {
      await interaction.editReply({
        content: "❌ Dosya okunurken hata oluştu. .txt formatında yüklediğinden emin ol.",
      });
    }
    return;
  }

  if (commandName === "stok") {
    const count = accountCount();
    await interaction.reply({
      content: `📦 Combolist'te şu an **${count}** hesap var.`,
      ephemeral: true,
    });
    return;
  }
});

client.login(token);
