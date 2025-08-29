import { UserCheck, Dices, Swords, ScrollText, FileText } from "lucide-react";

export function MobileNavigation() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="grid grid-cols-5 gap-1 p-2">
        <button
          onClick={() => scrollToSection('characters')}
          data-testid="mobile-nav-characters"
          className="flex flex-col items-center p-3 text-center hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <UserCheck className="h-5 w-5" />
          <span className="text-xs mt-1">Character</span>
        </button>
        <button
          onClick={() => scrollToSection('dice')}
          data-testid="mobile-nav-dice"
          className="flex flex-col items-center p-3 text-center hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <Dices className="h-5 w-5" />
          <span className="text-xs mt-1">Dice</span>
        </button>
        <button
          onClick={() => scrollToSection('initiative')}
          data-testid="mobile-nav-initiative"
          className="flex flex-col items-center p-3 text-center hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <Swords className="h-5 w-5" />
          <span className="text-xs mt-1">Combat</span>
        </button>
        <button
          onClick={() => scrollToSection('spells')}
          data-testid="mobile-nav-spells"
          className="flex flex-col items-center p-3 text-center hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <ScrollText className="h-5 w-5" />
          <span className="text-xs mt-1">Spells</span>
        </button>
        <button
          onClick={() => scrollToSection('notes')}
          data-testid="mobile-nav-notes"
          className="flex flex-col items-center p-3 text-center hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs mt-1">Notes</span>
        </button>
      </div>
    </nav>
  );
}
