import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Save, Download, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Character, AbilityScores } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

export function CharacterSheet() {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
  });

  const { data: character } = useQuery<Character>({
    queryKey: ['/api/characters', selectedCharacterId],
    enabled: !!selectedCharacterId,
  });

  const updateCharacterMutation = useMutation({
    mutationFn: async (updates: Partial<Character>) => {
      const response = await apiRequest('PATCH', `/api/characters/${selectedCharacterId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
    },
  });

  // Auto-select first character if available
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'character_updated' && lastMessage.data.id === selectedCharacterId) {
      queryClient.setQueryData(['/api/characters', selectedCharacterId], lastMessage.data);
    }
  }, [lastMessage, queryClient, selectedCharacterId]);

  if (!character) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No character selected
          </div>
        </CardContent>
      </Card>
    );
  }

  const abilityScores = character.abilityScores as AbilityScores;
  const conditions = character.conditions as string[] || [];

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const updateCharacter = (updates: Partial<Character>) => {
    updateCharacterMutation.mutate(updates);
  };

  const adjustHP = (amount: number) => {
    const newHP = Math.max(0, Math.min(character.maxHP, character.currentHP + amount));
    updateCharacter({ currentHP: newHP });
  };

  const hpPercentage = (character.currentHP / character.maxHP) * 100;

  return (
    <Card id="characters" className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-fantasy text-2xl font-bold text-primary flex items-center">
            <UserCheck className="mr-3 h-6 w-6" />
            Active Character
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" data-testid="button-save-character">
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" data-testid="button-export-character">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {characters.length > 1 && (
          <div>
            <Label htmlFor="character-select">Select Character</Label>
            <select
              id="character-select"
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="w-full p-3 bg-input border border-border rounded-lg"
              data-testid="select-character"
            >
              {characters.map((char: Character) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Character Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="character-name">Character Name</Label>
              <Input
                id="character-name"
                value={character.name}
                onChange={(e) => updateCharacter({ name: e.target.value })}
                data-testid="input-character-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="character-race">Race</Label>
                <Input
                  id="character-race"
                  value={character.race}
                  onChange={(e) => updateCharacter({ race: e.target.value })}
                  data-testid="input-character-race"
                />
              </div>
              <div>
                <Label htmlFor="character-class">Class</Label>
                <Input
                  id="character-class"
                  value={character.characterClass}
                  onChange={(e) => updateCharacter({ characterClass: e.target.value })}
                  data-testid="input-character-class"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="character-level">Level</Label>
                <Input
                  id="character-level"
                  type="number"
                  value={character.level}
                  onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                  className="text-center font-mono"
                  data-testid="input-character-level"
                />
              </div>
              <div>
                <Label htmlFor="character-ac">AC</Label>
                <Input
                  id="character-ac"
                  type="number"
                  value={character.armorClass}
                  onChange={(e) => updateCharacter({ armorClass: parseInt(e.target.value) || 10 })}
                  className="text-center font-mono"
                  data-testid="input-character-ac"
                />
              </div>
              <div>
                <Label htmlFor="character-speed">Speed</Label>
                <Input
                  id="character-speed"
                  value={character.speed}
                  onChange={(e) => updateCharacter({ speed: e.target.value })}
                  className="text-center font-mono"
                  data-testid="input-character-speed"
                />
              </div>
            </div>
          </div>

          {/* HP and Status */}
          <div className="space-y-4">
            <div className="stat-block p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label>Hit Points</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustHP(-1)}
                    className="text-destructive hover:text-destructive/80"
                    data-testid="button-decrease-hp"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustHP(1)}
                    className="text-green-600 hover:text-green-500"
                    data-testid="button-increase-hp"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  value={character.currentHP}
                  onChange={(e) => updateCharacter({ currentHP: parseInt(e.target.value) || 0 })}
                  className="w-20 text-center font-mono font-bold text-lg"
                  data-testid="input-current-hp"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  value={character.maxHP}
                  onChange={(e) => updateCharacter({ maxHP: parseInt(e.target.value) || 1 })}
                  className="w-20 text-center font-mono"
                  data-testid="input-max-hp"
                />
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    hpPercentage > 60 ? 'bg-green-600' :
                    hpPercentage > 30 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                  data-testid="hp-bar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="stat-block p-3 rounded-lg text-center">
                <Label className="text-sm text-muted-foreground">Temp HP</Label>
                <Input
                  type="number"
                  value={character.tempHP}
                  onChange={(e) => updateCharacter({ tempHP: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 text-center font-mono"
                  data-testid="input-temp-hp"
                />
              </div>
              <div className="stat-block p-3 rounded-lg text-center">
                <Label className="text-sm text-muted-foreground">Hit Dice</Label>
                <div className="font-mono font-bold mt-1" data-testid="text-hit-dice">
                  {character.hitDice}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" data-testid={`condition-${condition}`}>
                    {condition}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" data-testid="button-add-condition">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Ability Scores</h3>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(abilityScores).map(([ability, score]) => (
              <div key={ability} className="stat-block p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase font-medium">
                  {ability.slice(0, 3)}
                </div>
                <div className="text-2xl font-bold font-mono" data-testid={`ability-score-${ability}`}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground" data-testid={`ability-modifier-${ability}`}>
                  {formatModifier(getAbilityModifier(score))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
