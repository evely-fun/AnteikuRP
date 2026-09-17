// Single place to edit every server-specific value on the site.
// Nothing below is hardcoded anywhere else.
window.ANTEIKU = {
  // Java Edition address players paste into the multiplayer list
  serverIp: "play.anteiku.fun",
  // Minecraft versions accepted by the proxy
  version: "1.16.5 - 1.21.x",
  // Promo code shown in the hero ticker
  promoCode: "ANTEIKU",

  // Live player count. Leave endpoint null to use the fallback number.
  // Any endpoint returning { "players": { "online": 123 } } works,
  // which is the shape of the public mcsrvstat.us API.
  statusEndpoint: null,
  fallbackOnline: 1240,

  links: {
    discord: "https://discord.gg/anteiku",
    telegram: "https://t.me/anteikurp",
    youtube: "https://youtube.com/@anteikurp",
    tiktok: "https://tiktok.com/@anteikurp",
    vk: "https://vk.com/anteikurp",
    support: "https://t.me/anteiku_support_bot",
    donate: "/donate",
    rules: "/rules"
  },

  stats: {
    registered: 48000,
    years: 4,
    modes: 17
  }
};
