export const supportedLocales = ["en", "sr"] as const;

export function isSupportedLocale(value: string) {
  return supportedLocales.includes(value as (typeof supportedLocales)[number]);
}

const messages = {
  en: {
    home: "Home",
    browse: "Browse",
    search: "Search",
    sell: "Sell",
    admin: "Admin",
    title: "A specialized die-cast platform built around models first, listings second.",
    desc: "Search by SKU, browse by manufacturer and scale, open model hub pages, compare listings and see a value guide based on confirmed completed sales.",
    placeholder: "Search by SKU or model name"
  },
  sr: {
    home: "Početna",
    browse: "Pregled",
    search: "Pretraga",
    sell: "Prodaj",
    admin: "Admin",
    title: "Specijalizovana platforma za metalne autiće gde je model prvi sloj, a oglas drugi.",
    desc: "Pretraga po SKU oznaci, pregled po proizvođaču i razmeri, centralne model stranice, poređenje oglasa i value guide zasnovan samo na potvrđenim prodajama.",
    placeholder: "Pretraga po SKU ili nazivu modela"
  }
} as const;

export function getMessages(locale: string) {
  return messages[locale === "sr" ? "sr" : "en"];
}
