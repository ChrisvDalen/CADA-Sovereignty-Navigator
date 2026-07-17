import { redirect } from "next/navigation";

export default async function AssessmentIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/assessment/${id}/toepassingen`);
}
