import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById, getModelById, getProfileByUsername } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

function approximateConversions(amount: number, currency: "EUR" | "USD" | "RSD") {
  const eurBase = currency === "EUR" ? amount : currency === "USD" ? amount * 0.92 : amount / 117;
  return { EUR: eurBase, USD: eurBase * 1.09, RSD: eurBase * 117 };
}

export default async function ListingPage({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  const { locale, id } = await params;
  const listing = getListingById(Number(id));
  if (!listing) notFound();

  const model = getModelById(listing.modelId);
  const seller = getProfileByUsername(listing.sellerUsername);
  if (!model || !seller) notFound();

  const conversions = approximateConversions(listing.priceAmount, listing.priceCurrency);

  return (
    <main className="container-shell py-8 md:py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="kicker">Listing page</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{listing.title}</h1>
          <p className="mt-2 text-white/60">Catalog model: <Link className="underline decoration-white/15 underline-offset-4" href={`/${locale}/models/${model.slug}`}>{model.displayName}</Link></p>
        </div>
        <span className="badge-chip">{listing.listingType}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="aspect-[4/3] rounded-3xl border border-white/10" style={{ background: `linear-gradient(135deg, ${listing.images[0]?.colorA ?? "#203a43"} 0%, ${listing.images[0]?.colorB ?? "#2c5364"} 100%)` }} />
            <div className="grid grid-cols-3 gap-3">
              {listing.images.slice(1).map((image) => (
                <div key={image.id} className="aspect-square rounded-2xl border border-white/10" style={{ background: `linear-gradient(135deg, ${image.colorA} 0%, ${image.colorB} 100%)` }} />
              ))}
            </div>
          </div>

          <div className="panel">
            <p className="section-title">Description</p>
            <p className="mt-4 leading-7 text-white/72">{listing.description}</p>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="panel-strong">
            <p className="kicker">Price</p>
            <p className="mt-2 text-4xl font-semibold">{formatMoney(listing.priceAmount, listing.priceCurrency)}</p>
            <p className="mt-3 text-sm text-white/55">Condition: {listing.condition}</p>
            <p className="mt-1 text-sm text-white/55">Location: {listing.city}, {listing.country}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold">Approximate conversions</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-white/60">EUR</span><span>{formatMoney(conversions.EUR, "EUR")}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/60">USD</span><span>{formatMoney(conversions.USD, "USD")}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/60">RSD</span><span>{formatMoney(conversions.RSD, "RSD")}</span></div>
              </div>
            </div>

            {listing.listingType === "auction" && listing.auction ? (
              <div className="mt-5 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4">
                <p className="font-semibold">Auction module</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-white/60">Current bid</span><span>{formatMoney(listing.auction.currentBid, listing.priceCurrency)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-white/60">Start price</span><span>{formatMoney(listing.auction.startPrice, listing.priceCurrency)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-white/60">Bid count</span><span>{listing.auction.bidCount}</span></div>
                  <div className="flex items-center justify-between"><span className="text-white/60">Ends at</span><span>{new Date(listing.auction.endsAt).toLocaleString()}</span></div>
                </div>
                <button className="btn-primary mt-4 w-full">Place bid (demo)</button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <button className="btn-primary">Message seller</button>
              <button className="btn-secondary">Report listing</button>
            </div>
          </div>

          <div className="panel">
            <p className="kicker">Seller</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <Link href={`/${locale}/u/${seller.username}`} className="text-xl font-semibold hover:text-white/80">{seller.displayName}</Link>
                <p className="mt-1 text-sm text-white/60">@{seller.username}</p>
              </div>
              <span className="badge-chip">{seller.badge}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Rating", `${seller.ratingAvg.toFixed(2)} / 5`],
                ["Sales", String(seller.completedSalesCount)],
                ["Completion", `${seller.completionRate}%`],
                ["Verification", seller.isIdentityVerified ? "Verified" : "Not verified"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
