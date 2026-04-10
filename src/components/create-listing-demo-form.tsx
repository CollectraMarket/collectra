"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/lib/mock-data";

export function CreateListingDemoForm({ model }: { model: Model }) {
  const [listingType, setListingType] = useState<"fixed_price" | "auction">("fixed_price");
  const [condition, setCondition] = useState("mint");
  const [price, setPrice] = useState("39");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "RSD">("EUR");
  const [country, setCountry] = useState("RS");
  const [city, setCity] = useState("Novi Sad");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);

  const payload = useMemo(() => ({ listingType, condition, price, currency, country, city, description }), [listingType, condition, price, currency, country, city, description]);

  return (
    <div className="panel">
      <p className="kicker">Pre-bound model</p>
      <h1 className="mt-2 text-3xl font-semibold">{model.displayName}</h1>
      <p className="mt-2 text-white/60">Ovo je demo forma. Pravi sledeći korak je insert u bazu sa auth korisnikom i upload slikama.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm text-white/70">Listing type</span>
          <select className="field" value={listingType} onChange={(e) => setListingType(e.target.value as "fixed_price" | "auction")}>
            <option value="fixed_price">Fixed price</option>
            <option value="auction">Auction</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/70">Condition</span>
          <select className="field" value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="mint">Mint</option>
            <option value="near_mint">Near mint</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="loose">Loose</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/70">Price</span>
          <input className="field" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/70">Currency</span>
          <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value as "EUR" | "USD" | "RSD")}>
            <option>EUR</option>
            <option>USD</option>
            <option>RSD</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/70">Country</span>
          <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="RS">Serbia</option>
            <option value="HR">Croatia</option>
            <option value="BA">Bosnia and Herzegovina</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/70">City</span>
          <input className="field" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      <label className="mt-4 grid gap-2">
        <span className="text-sm text-white/70">Description</span>
        <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <button type="button" className="btn-primary" onClick={() => setPublished(true)}>Publish demo listing</button>
        <button type="button" className="btn-secondary" onClick={() => setPublished(false)}>Reset</button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="kicker">Payload preview</p>
        <pre className="mt-3 overflow-auto text-sm text-white/75">{JSON.stringify(payload, null, 2)}</pre>
      </div>

      {published ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-semibold text-emerald-300">Demo publish completed.</p>
          <p className="mt-1 text-sm text-emerald-100/85">Sledeći backend korak je save draft + images + moderation + publish flow.</p>
        </div>
      ) : null}
    </div>
  );
}
