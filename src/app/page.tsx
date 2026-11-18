import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function Home() {
  return (
    <main className="p-8 space-y-4">
      <ThemeToggle />
      <h1 className="text-3xl font-bold">Agri Marketplace</h1>
      <p className="text-lg">ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಇಲ್ಲಿ ಮಾರಾಟ ಮಾಡಿ.</p>
      <Button size="lg">Add crop</Button>
    </main>
  );
}