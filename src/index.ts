import {
  Client,
  GatewayIntentBits,
  Interaction,
  PermissionFlagsBits,
} from "discord.js";
import { getRandomAccount, removeAccount, addAccounts, accountCount } from "./combolist.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error("HATA: DISCORD_BOT_TOKEN veya DISCORD_CLIENT_ID eksik!");
  process.exit(1);
}

const guildMembersEnabled = process.env["GUILD_MEMBERS_INTENT"] === "true";
const client = new Client({
  intents: guildMembersEnabled
    ? [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
    : [GatewayIntentBits.Guilds],
});

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 60_000;
let autoRoleId: string | null = null;

client.once("clientReady", () => {
  console.log(`Bot aktif: ${client.user?.tag}`);
  console.log(`Combolist'te ${accountCount()} hesap var.`);
});

client.on("guildMemberAdd", async (member) => {
  if (!autoRoleId) return;
  try {
    const role = member.guild.roles.cache.get(autoRoleId);
    if (!role) return;
    await member.roles.add(role);
    console.log(`[Autorol] ${member.user.tag} → ${role.name}`);
  } catch (err) {
    console.error("[Autorol] Rol verilemedi:", err);
  }
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  try {

  if (commandName === "hesap") {
    const member = interaction.guild?.members.cache.get(user.id);
    const hasBlockedRole = member?.roles.cache.some((r) => r.name === "üye");

    if (hasBlockedRole) {
      await interaction.reply({
        content: "❌ **üye** rolüyle bu komutu kullanamazsın!",
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
    } catch {
      await interaction.editReply({
        content: "❌ Dosya okunurken hata oluştu. .txt formatında yüklediğinden emin ol.",
      });
    }
    return;
  }

  if (commandName === "stok") {
    await interaction.reply({
      content: `📦 Combolist'te şu an **${accountCount()}** hesap var.`,
      ephemeral: true,
    });
    return;
  }

  if (commandName === "toplurolver") {
    const member = interaction.guild?.members.cache.get(user.id);
    const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator);
    if (!isAdmin) {
      await interaction.reply({
        content: "❌ Bu komutu sadece **yöneticiler** kullanabilir.",
        ephemeral: true,
      });
      return;
    }

    const role = interaction.options.getRole("rol", true);
    const guild = interaction.guild!;

    await interaction.deferReply({ ephemeral: true });

    try {
      const members = guild.members.cache.filter((m) => !m.user.bot && !m.roles.cache.has(role.id));
      let success = 0;
      let fail = 0;

      for (const [, m] of members) {
        try {
          await m.roles.add(role.id);
          success++;
        } catch {
          fail++;
        }
      }

      await interaction.editReply({
        content: `✅ **${success}** üyeye **${role.name}** rolü verildi.${fail > 0 ? ` (${fail} kişiye verilemedi)` : ""}`,
      });
      console.log(`[Toplu Rol] ${user.tag} → ${role.name}, başarı: ${success}, hata: ${fail}`);
    } catch {
      await interaction.editReply({
        content: "❌ Rol verilirken hata oluştu. Botun rolü verme yetkisi olduğundan emin ol.",
      });
    }
    return;
  }

  if (commandName === "autorol") {
    const member = interaction.guild?.members.cache.get(user.id);
    const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator);
    if (!isAdmin) {
      await interaction.reply({
        content: "❌ Bu komutu sadece **yöneticiler** kullanabilir.",
        ephemeral: true,
      });
      return;
    }

    const role = interaction.options.getRole("rol", true);
    autoRoleId = role.id;

    await interaction.reply({
      content: `✅ Autorol ayarlandı! Sunucuya yeni katılan herkese **${role.name}** rolü otomatik verilecek.`,
      ephemeral: true,
    });
    console.log(`[Autorol] ${user.tag} → ${role.name} ayarlandı`);
    return;
  }

  } catch (err) {
    console.error("Interaction hatası:", err);
  }
});

client.login(token);
