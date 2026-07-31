import Link from "next/link";
import type { SubjectSummary } from "@/course/types";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function SubjectCard({ subject }: { subject: SubjectSummary }) {
  return (
    <Link href={`/library/subjects/${subject.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: subject.color }}
            >
              {subject.icon.slice(0, 2).toUpperCase()}
            </div>
            <Badge>{subject.chapterCount} capitoli</Badge>
          </div>
          <CardTitle className="mt-3">{subject.name}</CardTitle>
          <CardDescription>
            {subject.courseCount} corsi · {subject.atomCount} concetti
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
