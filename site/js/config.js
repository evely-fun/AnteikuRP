// Every server specific value lives here and nowhere else.
window.ANTEIKU = {
    serverIp: "play.anteiku.fun",
    promoCode: "ANTEIKU",

    // Live player count. Any endpoint returning { players: { online: N } } works,
    // which is the shape of the public mcsrvstat.us API. Null uses the fallback.
    statusEndpoint: null,
    fallbackOnline: 1240,

    links: {
        discord: "https://discord.gg/anteiku",
        telegram: "https://t.me/anteikurp",
        youtube: "https://youtube.com/@anteikurp",
        tiktok: "https://tiktok.com/@anteikurp",
        vk: "https://vk.com/anteikurp",
        support: "https://t.me/anteiku_support_bot",
        rules: "/rules",
        donate: "/donate"
    }
};
