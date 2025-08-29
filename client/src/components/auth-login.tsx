import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, User } from "lucide-react";

interface LoginFormData {
  characterName: string;
  role: "player" | "dm";
}

interface AuthLoginProps {
  onLoginSuccess: (user: any) => void;
}

export function AuthLogin({ onLoginSuccess }: AuthLoginProps) {
  const [characterName, setCharacterName] = useState("");
  const [role, setRole] = useState<"player" | "dm">("player");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      return await response.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/online"] });
      onLoginSuccess(user);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterName.trim()) {
      loginMutation.mutate({ characterName: characterName.trim(), role });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="w-full max-w-md" data-testid="login-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-cinzel text-purple-600 dark:text-purple-400">
            D&D Companion
          </CardTitle>
          <CardDescription>
            Enter your character name to join the adventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input
                id="characterName"
                type="text"
                placeholder="Enter your character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                required
                data-testid="input-character-name"
              />
            </div>

            <div className="space-y-3">
              <Label>Role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "player" | "dm")}>
                <div className="flex items-center space-x-2" data-testid="radio-player">
                  <RadioGroupItem value="player" id="player" />
                  <Label htmlFor="player" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Player
                  </Label>
                </div>
                <div className="flex items-center space-x-2" data-testid="radio-dm">
                  <RadioGroupItem value="dm" id="dm" />
                  <Label htmlFor="dm" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    Dungeon Master
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !characterName.trim()}
              data-testid="button-join-session"
            >
              {loginMutation.isPending ? "Joining..." : "Join Session"}
            </Button>

            {loginMutation.error && (
              <p className="text-sm text-red-500 text-center" data-testid="error-login">
                Failed to join session. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}