import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dices, Percent, DicesIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import type { DiceRoll, DiceType } from "@shared/schema";
import type { DiceRollResult } from "@/types/dnd";

export function DiceRoller() {
  const [customRoll, setCustomRoll] = useState("");
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  // For now, use a default session ID - in a real app this would come from context
  const sessionId = "default-session";

  const { data: rollHistory = [] } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'dice-rolls'],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/dice-rolls?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch roll history');
      return response.json();
    },
  });

  const rollDiceMutation = useMutation({
    mutationFn: async (rollData: { formula: string; result: number; details: string; playerName: string }) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/dice-rolls`, rollData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'dice-rolls'] });
    },
  });

  // Handle real-time dice roll updates
  useEffect(() => {
    if (lastMessage?.type === 'dice_rolled') {
      const roll = lastMessage.data as DiceRoll;
      setLastRoll({
        formula: roll.formula,
        result: roll.result,
        details: roll.details || "",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'dice-rolls'] });
    }
  }, [lastMessage, queryClient, sessionId]);

  const rollDice = (diceType: DiceType, modifier = 0, advantage = false, disadvantage = false) => {
    const sides = parseInt(diceType.replace('d', ''));
    let result: number;
    let details: string;

    if (advantage || disadvantage) {
      const roll1 = Math.floor(Math.random() * sides) + 1;
      const roll2 = Math.floor(Math.random() * sides) + 1;
      result = advantage ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      details = `${advantage ? 'Advantage' : 'Disadvantage'}: ${roll1}, ${roll2} → ${result}`;
    } else {
      result = Math.floor(Math.random() * sides) + 1;
      details = `Natural ${result}`;
    }

    const finalResult = result + modifier;
    const formula = modifier !== 0 ? `1${diceType}${modifier >= 0 ? '+' : ''}${modifier}` : `1${diceType}`;

    if (modifier !== 0) {
      details += ` + ${modifier} modifier`;
    }

    const rollResult: DiceRollResult = {
      formula,
      result: finalResult,
      details,
    };

    setLastRoll(rollResult);

    // Save to backend
    rollDiceMutation.mutate({
      formula,
      result: finalResult,
      details,
      playerName: "Player", // In a real app, this would be the actual player name
    });
  };

  const rollCustomDice = () => {
    if (!customRoll.trim()) return;

    try {
      // Simple dice notation parser (e.g., "2d6+3", "1d20", "3d8-2")
      const match = customRoll.match(/(\d+)d(\d+)([+-]\d+)?/i);
      if (!match) {
        throw new Error("Invalid dice formula");
      }

      const [, numDice, sides, modifierStr] = match;
      const diceCount = parseInt(numDice);
      const diceSides = parseInt(sides);
      const modifier = modifierStr ? parseInt(modifierStr) : 0;

      const rolls: number[] = [];
      let total = 0;

      for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
      }

      const finalResult = total + modifier;
      const details = `Rolls: [${rolls.join(', ')}] = ${total}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`;

      const rollResult: DiceRollResult = {
        formula: customRoll,
        result: finalResult,
        details,
        individual: rolls,
      };

      setLastRoll(rollResult);

      // Save to backend
      rollDiceMutation.mutate({
        formula: customRoll,
        result: finalResult,
        details,
        playerName: "Player",
      });

      setCustomRoll("");
    } catch (error) {
      console.error("Error rolling custom dice:", error);
    }
  };

  const diceTypes: { type: DiceType; icon: typeof Dices }[] = [
    { type: 'd4', icon: DicesIcon },
    { type: 'd6', icon: Dices },
    { type: 'd8', icon: DicesIcon },
    { type: 'd10', icon: DicesIcon },
    { type: 'd12', icon: DicesIcon },
    { type: 'd20', icon: Dices },
    { type: 'd100', icon: Percent },
  ];

  return (
    <Card id="dice" className="w-full">
      <CardHeader>
        <CardTitle className="font-fantasy text-2xl font-bold text-primary flex items-center">
          <Dices className="mr-3 h-6 w-6" />
          Dice Roller
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {diceTypes.map(({ type, icon: Icon }) => (
            <Button
              key={type}
              onClick={() => rollDice(type)}
              className={`dice-face p-4 h-auto flex-col space-y-2 hover:scale-105 transition-transform glow-effect ${
                type === 'd20' ? 'border-2 border-primary' : ''
              }`}
              variant="outline"
              data-testid={`button-roll-${type}`}
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="font-mono font-bold">{type}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-roll">Custom Roll</Label>
              <div className="flex space-x-2">
                <Input
                  id="custom-roll"
                  placeholder="2d8+3"
                  value={customRoll}
                  onChange={(e) => setCustomRoll(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && rollCustomDice()}
                  className="font-mono"
                  data-testid="input-custom-roll"
                />
                <Button 
                  onClick={rollCustomDice}
                  disabled={!customRoll.trim()}
                  data-testid="button-roll-custom"
                >
                  Roll
                </Button>
              </div>
            </div>

            <div>
              <Label>Quick Modifiers</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice('d20', 1)}
                  data-testid="button-roll-d20-plus1"
                >
                  +1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice('d20', 2)}
                  data-testid="button-roll-d20-plus2"
                >
                  +2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice('d20', 3)}
                  data-testid="button-roll-d20-plus3"
                >
                  +3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice('d20', 0, true)}
                  data-testid="button-roll-d20-advantage"
                >
                  Adv
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice('d20', 0, false, true)}
                  data-testid="button-roll-d20-disadvantage"
                >
                  Dis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const result = Math.floor(Math.random() * 20) + 1;
                    if (result === 20) {
                      rollDice('d20');
                      rollDice('d20');
                    } else {
                      rollDice('d20');
                    }
                  }}
                  data-testid="button-roll-d20-crit"
                >
                  Crit
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {lastRoll && (
              <div>
                <Label>Last Roll</Label>
                <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {lastRoll.formula}
                    </span>
                    <span 
                      className={`font-mono text-2xl font-bold ${
                        lastRoll.result === 20 ? 'text-primary' : 
                        lastRoll.result === 1 ? 'text-destructive' : ''
                      }`}
                      data-testid="text-last-roll-result"
                    >
                      {lastRoll.result}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1" data-testid="text-last-roll-details">
                    {lastRoll.details}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Roll History</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {rollHistory.map((roll: DiceRoll) => (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                    data-testid={`roll-history-${roll.id}`}
                  >
                    <span className="font-mono text-muted-foreground">{roll.formula}</span>
                    <span className={`font-mono font-semibold ${
                      roll.result === 20 ? 'text-primary' : ''
                    }`}>
                      {roll.result}
                    </span>
                  </div>
                ))}
                {rollHistory.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No rolls yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
