import Link from "next/link";
import { Button, Card, CardDescription, CardHeader, CardTitle, Chip } from "@/components/ui";

const goals = ["Esami", "Ripasso quotidiano", "Migliorare i voti", "Studiare più veloce"];

export default function OnboardingPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Personalizza Mentis</CardTitle>
        <CardDescription>
          Scegli il tuo obiettivo principale. Potrai modificarlo in seguito.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-2">
        {goals.map((goal) => (
          <Chip key={goal}>{goal}</Chip>
        ))}
      </div>
      <Link href="/home" className="mt-6 block">
        <Button fullWidth>Inizia</Button>
      </Link>
    </Card>
  );
}
