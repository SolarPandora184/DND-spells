import { Moon, Sun, Menu, Swords, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { User as UserType } from "@shared/schema";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export function Header({ onMobileMenuToggle, user, onLogout }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Swords className="text-primary text-3xl h-8 w-8" />
            <h1 className="font-fantasy text-2xl md:text-3xl font-bold text-primary">
              D&D Companion
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#characters" 
              data-testid="nav-characters"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Characters
            </a>
            <a 
              href="#dice" 
              data-testid="nav-dice"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Dice
            </a>
            <a 
              href="#initiative" 
              data-testid="nav-initiative"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Initiative
            </a>
            <a 
              href="#spells" 
              data-testid="nav-spells"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Spells
            </a>
            <a 
              href="#notes" 
              data-testid="nav-notes"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Notes
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-2 bg-muted rounded-md px-3 py-1">
                  {user.role === "dm" ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="font-medium" data-testid="user-name">
                    {user.characterName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({user.role === "dm" ? "DM" : "Player"})
                  </span>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user && onLogout && (
              <Button
                variant="outline"
                size="icon"
                onClick={onLogout}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Logout</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={onMobileMenuToggle}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
