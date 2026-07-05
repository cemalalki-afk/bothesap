import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error("DISCORD_BOT_TOKEN veya DISCORD_CLIENT_ID eksik!");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("hesap")
    .setDescription("Combolist'ten rastgele bir hesap alırsın (1 dakika bekleme süresi var)")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("yukle")
    .setDescription("Combolist'e hesap yükle (sadece yöneticiler)")
    .addAttachmentOption((opt) =>
      opt.setName("dosya").setDescription("email:sifre formatında .txt dosyası").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("stok")
    .setDescription("Combolist'te kaç hesap kaldığını gösterir")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("toplurolver")
    .setDescription("Sunucudaki herkese belirtilen rolü verir (sadece yöneticiler)")
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("Verilecek rol").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("autorol")
    .setDescription("Yeni katılan üyelere otomatik rol atar (sadece yöneticiler)")
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("Otomatik verilecek rol").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("dogrula")
    .setDescription("YouTube'da RiseVLTR'ye abone olduğunu, like ve yorum attığını SS ile kanıtla")
    .addAttachmentOption((opt) =>
      opt.setName("ss").setDescription("Abone, like ve yorum gösteren ekran görüntüsü").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("abonerol")
    .setDescription("Doğrulama sonrası verilecek rolü ayarla (sadece yöneticiler)")
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("Abone rolü").setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Slash komutlar kaydediliyor...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Komutlar başarıyla kaydedildi!");
  } catch (err) {
    console.error("Komut kaydı hatası:", err);
  }
})();
