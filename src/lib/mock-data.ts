export type Model = {
  id: number;
  slug: string;
  manufacturer: string;
  manufacturerSku: string;
  aliases: string[];
  carBrand: string;
  carModel: string;
  generation?: string;
  versionTrim?: string;
  year?: number;
  scale: string;
  color?: string;
  displayName: string;
  issues: { title: string; description: string; severity: "low" | "medium" | "high" }[];
  valueGuide: Array<{
    conditionBucket: "mint" | "near_mint" | "loose";
    min: number;
    avg: number;
    max: number;
    salesCount: number;
    currency: "EUR";
    trend: "stable" | "rising" | "dropping" | "insufficient_data";
  }>;
  recentSales: Array<{
    id: number;
    price: number;
    currency: "EUR" | "USD" | "RSD";
    condition: string;
    completedAt: string;
  }>;
};

export type Listing = {
  id: number;
  modelId: number;
  slug: string;
  title: string;
  listingType: "fixed_price" | "auction";
  sellerUsername: string;
  condition: "mint" | "near_mint" | "excellent" | "good" | "fair" | "loose";
  priceAmount: number;
  priceCurrency: "EUR" | "USD" | "RSD";
  country: string;
  city: string;
  description: string;
  images: { id: number; colorA: string; colorB: string }[];
  auction?: {
    currentBid: number;
    startPrice: number;
    bidCount: number;
    endsAt: string;
    endingSoon: boolean;
  };
};

export type Profile = {
  username: string;
  displayName: string;
  badge: string;
  ratingAvg: number;
  ratingCount: number;
  isIdentityVerified: boolean;
  country: string;
  city: string;
  completedSalesCount: number;
  completionRate: number;
  bio: string;
};

export const models: Model[] = [
  {
    id: 1,
    slug: "mini-gt-red-bull-rb16b-33-max-verstappen-abu-dhabi-winner-2021-1-64",
    manufacturer: "Mini GT",
    manufacturerSku: "TSM430734",
    aliases: ["MGT00591-R", "430734"],
    carBrand: "Red Bull Racing",
    carModel: "RB16B",
    generation: "Formula 1",
    versionTrim: "Abu Dhabi Winner 2021",
    year: 2021,
    scale: "1:64",
    color: "Red Bull livery",
    displayName: "Mini GT Red Bull RB16B #33 Max Verstappen Abu Dhabi Winner 2021 1:64",
    issues: [{ title: "Thin front wing elements", description: "Unboxing too aggressively can stress the outer wing area.", severity: "medium" }],
    valueGuide: [
      { conditionBucket: "mint", min: 28, avg: 34, max: 41, salesCount: 14, currency: "EUR", trend: "rising" },
      { conditionBucket: "near_mint", min: 21, avg: 26, max: 30, salesCount: 11, currency: "EUR", trend: "stable" },
      { conditionBucket: "loose", min: 14, avg: 17, max: 20, salesCount: 5, currency: "EUR", trend: "insufficient_data" }
    ],
    recentSales: [
      { id: 1, price: 36, currency: "EUR", condition: "mint", completedAt: "2026-03-11" },
      { id: 2, price: 34, currency: "EUR", condition: "mint", completedAt: "2026-03-07" }
    ]
  },
  {
    id: 2,
    slug: "norev-porsche-911-dakar-oak-green-metallic-2023-1-18",
    manufacturer: "Norev",
    manufacturerSku: "187366",
    aliases: ["POR911DAKAR23"],
    carBrand: "Porsche",
    carModel: "911 Dakar",
    generation: "992",
    versionTrim: "Oak Green Metallic",
    year: 2023,
    scale: "1:18",
    color: "Oak Green Metallic",
    displayName: "Norev Porsche 911 Dakar Oak Green Metallic 2023 1:18",
    issues: [],
    valueGuide: [
      { conditionBucket: "mint", min: 89, avg: 96, max: 108, salesCount: 8, currency: "EUR", trend: "stable" }
    ],
    recentSales: [{ id: 3, price: 98, currency: "EUR", condition: "mint", completedAt: "2026-03-20" }]
  },
  {
    id: 3,
    slug: "solido-lancia-delta-hf-integrale-safari-rallye-kenya-1991-1-18",
    manufacturer: "Solido",
    manufacturerSku: "S1810505",
    aliases: ["1810505"],
    carBrand: "Lancia",
    carModel: "Delta HF Integrale",
    generation: "Group A",
    versionTrim: "Safari Rallye Kenya 1991",
    year: 1991,
    scale: "1:18",
    color: "Rally livery",
    displayName: "Solido Lancia Delta HF Integrale Safari Rallye Kenya 1991 1:18",
    issues: [{ title: "Door alignment variance", description: "Some pieces show slightly uneven door alignment after repeated opening.", severity: "low" }],
    valueGuide: [
      { conditionBucket: "mint", min: 51, avg: 58, max: 65, salesCount: 6, currency: "EUR", trend: "rising" }
    ],
    recentSales: [{ id: 4, price: 60, currency: "EUR", condition: "mint", completedAt: "2026-03-16" }]
  }
];

export const listings: Listing[] = [
  {
    id: 101,
    modelId: 1,
    slug: "mini-gt-red-bull-rb16b-33-max-verstappen-abu-dhabi-winner-2021-1-64",
    title: "Sealed box, sharp paint, collector-owned",
    listingType: "fixed_price",
    sellerUsername: "maxdiecast",
    condition: "mint",
    priceAmount: 39,
    priceCurrency: "EUR",
    country: "RS",
    city: "Novi Sad",
    description: "Excellent box condition, sharp tampos and clean acrylic display case. Stored away from direct sunlight and shipped with extra protection.",
    images: [
      { id: 1, colorA: "#203a43", colorB: "#2c5364" },
      { id: 2, colorA: "#ff512f", colorB: "#dd2476" },
      { id: 3, colorA: "#3a1c71", colorB: "#d76d77" }
    ]
  },
  {
    id: 102,
    modelId: 1,
    slug: "mini-gt-red-bull-rb16b-33-auction",
    title: "Auction with protective case included",
    listingType: "auction",
    sellerUsername: "mintgarage",
    condition: "near_mint",
    priceAmount: 22,
    priceCurrency: "EUR",
    country: "HR",
    city: "Zagreb",
    description: "Near mint piece with minor box wear. Auction listing with secure packing and regional shipping available.",
    images: [
      { id: 4, colorA: "#141e30", colorB: "#243b55" },
      { id: 5, colorA: "#355c7d", colorB: "#6c5b7b" }
    ],
    auction: { currentBid: 27, startPrice: 22, bidCount: 9, endsAt: "2026-04-02T19:30:00.000Z", endingSoon: true }
  },
  {
    id: 201,
    modelId: 2,
    slug: "norev-porsche-911-dakar-oak-green-metallic-2023-1-18",
    title: "Oak Green Metallic, display-only example",
    listingType: "fixed_price",
    sellerUsername: "mintgarage",
    condition: "mint",
    priceAmount: 109,
    priceCurrency: "EUR",
    country: "HR",
    city: "Zagreb",
    description: "Display-only example with beautiful metallic depth. Doors and hood open smoothly. Premium packing included.",
    images: [
      { id: 6, colorA: "#355e3b", colorB: "#18361e" },
      { id: 7, colorA: "#3e5151", colorB: "#decba4" }
    ]
  }
];

export const profiles: Profile[] = [
  {
    username: "maxdiecast",
    displayName: "Max Diecast",
    badge: "Collector Pro",
    ratingAvg: 4.96,
    ratingCount: 128,
    isIdentityVerified: true,
    country: "RS",
    city: "Novi Sad",
    completedSalesCount: 94,
    completionRate: 98.5,
    bio: "Collector focused on F1, endurance racing and limited 1:64 releases."
  },
  {
    username: "mintgarage",
    displayName: "Mint Garage",
    badge: "Performance Dealer",
    ratingAvg: 4.88,
    ratingCount: 63,
    isIdentityVerified: true,
    country: "HR",
    city: "Zagreb",
    completedSalesCount: 51,
    completionRate: 97.2,
    bio: "Premium boxed models, careful packing and fast regional shipping."
  }
];

export function getModelBySlug(slug: string) {
  return models.find((item) => item.slug === slug) ?? null;
}
export function getModelById(id: number) {
  return models.find((item) => item.id === id) ?? null;
}
export function getListingById(id: number) {
  return listings.find((item) => item.id === id) ?? null;
}
export function getListingsForModel(modelId: number) {
  return listings.filter((item) => item.modelId === modelId);
}
export function getProfileByUsername(username: string) {
  return profiles.find((item) => item.username === username) ?? null;
}
