import { notFound } from "next/navigation";
import { CreateListingDemoForm } from "@/components/create-listing-demo-form";
import { getModelById } from "@/lib/mock-data";

export default async function CreateListingPage({ params }: { params: Promise<{ locale: string; modelId: string }> }) {
  const { modelId } = await params;
  const model = getModelById(Number(modelId));
  if (!model) notFound();

  return (
    <main className="container-shell py-8 md:py-10">
      <CreateListingDemoForm model={model} />
    </main>
  );
}
