import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale, `/${locale}/admin`);

  return children;
}
