import { UserCheck, Dices, Swords, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterSheet } from "@/components/character-sheet";
import { DiceRoller } from "@/components/dice-roller";
import { EnhancedInitiativeTracker } from "@/components/enhanced-initiative-tracker";
import { SpellLookup } from "@/components/spell-lookup";
import { Notes } from "@/components/notes";
import { User } from "@shared/schema";

interface DashboardProps {
  user?: User | null;
}

export default function Dashboard({ user }: DashboardProps = {}) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-8 pb-24 md:pb-8">
      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          onClick={() => scrollToSection('characters')}
          className="bg-primary text-primary-foreground p-4 h-auto flex-col space-y-2 glow-effect hover:bg-primary/90 transition-all"
          data-testid="quick-action-character"
        >
          <UserCheck className="h-6 w-6" />
          <span className="font-semibold">New Character</span>
        </Button>
        <Button
          onClick={() => scrollToSection('dice')}
          className="bg-accent text-accent-foreground p-4 h-auto flex-col space-y-2 glow-effect hover:bg-accent/90 transition-all"
          data-testid="quick-action-dice"
        >
          <Dices className="h-6 w-6" />
          <span className="font-semibold">Quick Roll</span>
        </Button>
        <Button
          onClick={() => scrollToSection('initiative')}
          className="bg-secondary text-secondary-foreground p-4 h-auto flex-col space-y-2 glow-effect hover:bg-secondary/90 transition-all"
          data-testid="quick-action-combat"
        >
          <Swords className="h-6 w-6" />
          <span className="font-semibold">Start Combat</span>
        </Button>
        <Button
          onClick={() => scrollToSection('spells')}
          variant="outline"
          className="p-4 h-auto flex-col space-y-2 glow-effect hover:bg-accent hover:text-accent-foreground transition-all"
          data-testid="quick-action-spells"
        >
          <ScrollText className="h-6 w-6" />
          <span className="font-semibold">Spell Lookup</span>
        </Button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-8">
          <CharacterSheet />
          <DiceRoller />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <EnhancedInitiativeTracker user={user} />
          <SpellLookup />
          <Notes />
        </div>
      </div>
    </main>
  );
}
