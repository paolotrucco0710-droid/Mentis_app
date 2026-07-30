import Link from "next/link";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";

export default function FeedPage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Feed di studio</CardTitle>
          <CardDescription>
            Layout full-screen pronto. Le card interattive arrivano con la
            Milestone 11.
          </CardDescription>
        </CardHeader>
        <EmptyState
          title="Nessuna card attiva"
          description="Avvia una sessione dal backend per vedere qui la prossima card del feed."
          action={
            <Link href="/home">
              <Button variant="secondary">Torna alla home</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
