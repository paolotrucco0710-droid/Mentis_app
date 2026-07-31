import type { SubjectId } from "@/domain/ids";
import { SubjectDetailView } from "@/components/course";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { id } = await params;
  return <SubjectDetailView subjectId={id as SubjectId} />;
}
