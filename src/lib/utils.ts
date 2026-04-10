export function formatMoney(amount: number, currency: "EUR" | "USD" | "RSD") {
  return new Intl.NumberFormat(currency === "RSD" ? "sr-RS" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "RSD" ? 0 : 2,
  }).format(amount);
}

export function normalizeSku(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[-_/]/g, "");
}

export function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string | null | undefined) {
  return normalizeName(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleCaseManufacturer(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return "Unknown manufacturer";

  const dictionary: Record<string, string> = {
    "MINI GT": "MINI GT",
    "GT SPIRIT": "GT Spirit",
    "BM CREATIONS": "BM Creations",
    "AUTOART": "AUTOArt",
    "GREENLIGHT": "GreenLight",
    "MINICHAMPS": "Minichamps",
    "DEALER MODEL": "Dealer Model",
    "LUCKY DIE CAST": "Lucky Die Cast",
    "AUTO WORLD": "Auto World",
    "AMERICAN DIORAMA": "American Diorama",
    "ABREX": "Abrex",
    "CMC": "CMC",
    "IXO": "IXO",
    "NOREV": "Norev",
    "SOLIDO": "Solido",
    "TARMAC": "Tarmac",
    "ACME": "ACME",
    "WELLY": "Welly",
  };

  return dictionary[raw.toUpperCase()] ?? raw;
}

export function normalizeScaleLabel(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return "Unknown";
  return raw.replace("/", ":");
}

const CAR_BRAND_PREFIXES: Array<[string, string]> = [
  ["MERCEDES-BENZ", "Mercedes-Benz"],
  ["ALFA ROMEO", "Alfa Romeo"],
  ["ASTON MARTIN", "Aston Martin"],
  ["LAND ROVER", "Land Rover"],
  ["RANGE ROVER", "Land Rover"],
  ["ROLLS-ROYCE", "Rolls-Royce"],
  ["LAMBORGHINI", "Lamborghini"],
  ["MASERATI", "Maserati"],
  ["PORSCHE", "Porsche"],
  ["FERRARI", "Ferrari"],
  ["MCLAREN", "McLaren"],
  ["CITROEN", "Citroën"],
  ["CITROËN", "Citroën"],
  ["PEUGEOT", "Peugeot"],
  ["RENAULT", "Renault"],
  ["DACIA", "Dacia"],
  ["BUGATTI", "Bugatti"],
  ["BENTLEY", "Bentley"],
  ["JAGUAR", "Jaguar"],
  ["LOTUS", "Lotus"],
  ["LANCIA", "Lancia"],
  ["FIAT", "Fiat"],
  ["ABARTH", "Abarth"],
  ["SKODA", "Škoda"],
  ["ŠKODA", "Škoda"],
  ["VOLKSWAGEN", "Volkswagen"],
  ["VW", "Volkswagen"],
  ["AUDI", "Audi"],
  ["BMW", "BMW"],
  ["OPEL", "Opel"],
  ["FORD", "Ford"],
  ["CHEVROLET", "Chevrolet"],
  ["CADILLAC", "Cadillac"],
  ["DODGE", "Dodge"],
  ["CHRYSLER", "Chrysler"],
  ["PLYMOUTH", "Plymouth"],
  ["PONTIAC", "Pontiac"],
  ["BUICK", "Buick"],
  ["OLDSMOBILE", "Oldsmobile"],
  ["GMC", "GMC"],
  ["LINCOLN", "Lincoln"],
  ["JEEP", "Jeep"],
  ["TESLA", "Tesla"],
  ["TOYOTA", "Toyota"],
  ["LEXUS", "Lexus"],
  ["NISSAN", "Nissan"],
  ["INFINITI", "Infiniti"],
  ["MAZDA", "Mazda"],
  ["HONDA", "Honda"],
  ["ACURA", "Acura"],
  ["MITSUBISHI", "Mitsubishi"],
  ["SUBARU", "Subaru"],
  ["SUZUKI", "Suzuki"],
  ["ISUZU", "Isuzu"],
  ["HYUNDAI", "Hyundai"],
  ["KIA", "Kia"],
  ["GENESIS", "Genesis"],
  ["VOLVO", "Volvo"],
  ["SAAB", "Saab"],
  ["LADA", "Lada"],
  ["TRABANT", "Trabant"],
  ["WARTBURG", "Wartburg"],
  ["SIMCA", "Simca"],
  ["NSU", "NSU"],
  ["DE TOMASO", "De Tomaso"],
  ["KOENIGSEGG", "Koenigsegg"],
  ["PAGANI", "Pagani"],
  ["RUF", "RUF"],
  ["BRABUS", "Brabus"],
  ["IVECO", "Iveco"],
  ["MAN", "MAN"],
  ["MACK", "Mack"],
  ["SCANIA", "Scania"],
  ["DAF", "DAF"],
  ["PETERBILT", "Peterbilt"],
  ["KENWORTH", "Kenworth"],
  ["KAIDO HOUSE", "Unknown / Imported"],
  ["PACK", "Unknown / Imported"],
];

export function inferCarBrandName(productName: string | null | undefined) {
  const raw = (productName ?? "").trim();
  if (!raw) return "Unknown / Imported";

  const upper = raw.toUpperCase();
  for (const [prefix, label] of CAR_BRAND_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return label;
    }
  }

  const firstWord = raw.split(/[\s,/-]+/).find(Boolean)?.trim();
  if (!firstWord) return "Unknown / Imported";
  if (/^\d/.test(firstWord)) return "Unknown / Imported";
  if (firstWord.length <= 1) return "Unknown / Imported";

  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}
