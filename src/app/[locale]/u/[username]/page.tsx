import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileByUsername, listings, models } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string; username: string }> }) {
  const { locale, username } = await params;
  const profile = getProfileByUsername(username);
  if (!profile) notFound();

  const userListings = listings.filter((item) => item.sellerUsername === username);

  return (
    <main className="container-shell py-8 md:py-10">
      <section className="panel-strong">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="kicker">Public profile</p>
            <h1 className="mt-2 text-4xl font-semibold">{profile.displayName}</h1>
            <p className="mt-2 text-white/60">@{profile.username}</p>
            <p className="mt-5 max-w-2xl text-white/70">{profile.bio}</p>
          </div>
          <span className="badge-chip">{profile.badge}</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Rating", `${profile.ratingAvg.toFixed(2)} / 5`],
            ["Ratings", String(profile.ratingCount)],
            ["Completed sales", String(profile.completedSalesCount)],
            ["Completion rate", `${profile.completionRate}%`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</p>
              <p className="mt-2 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 panel">
        <p className="section-title">Active listings</p>
        <div className="mt-5 grid gap-4">
          {userListings.map((listing) => {
            const model = models.find((item) => item.id === listing.modelId);
            return (
              <Link key={listing.id} href={`/${locale}/listings/${listing.id}-${listing.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.08]">
                <p className="text-lg font-semibold">{listing.title}</p>
                <p className="mt-2 text-white/60">{model?.displayName ?? "Unknown model"}</p>
                <p className="mt-2 text-sm text-white/55">{listing.condition} · {formatMoney(listing.priceAmount, listing.priceCurrency)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
