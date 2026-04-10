import { getCurrentUser } from "@/lib/auth/get-user";

const sections = [
  "Catalog moderation",
  "Brand and scale management",
  "User-submitted model approvals",
  "Listings review",
  "Auction oversight",
  "Reports & disputes",
];

export default async function AdminPage() {
  const session = await getCurrentUser();

  return (
    <main className="container-shell py-8 md:py-10">
      <div className="panel-strong mb-6">
        <p className="kicker">Protected admin</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin console foundation</h1>
        <p className="mt-3 max-w-3xl text-white/65">
          Ovaj ekran je sada zaključan iza server-side auth + role guard-a. Sledeći korak je da u ove module ubacimo real actions, filters i real tables.
        </p>

        {session?.profile ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-white/60">Signed in as</p>
            <p className="mt-1 font-medium">{session.profile.displayName}</p>
            <p className="text-sm text-white/50">
              @{session.profile.username} · {session.user?.email} · role: {session.profile.role}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <div key={section} className="panel">
            <p className="text-xl font-semibold">{section}</p>
            <p className="mt-3 text-white/60">
              Foundation module prepared for the real workflow.
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
