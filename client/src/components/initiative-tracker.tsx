import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Swords, Plus, SkipForward, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Combatant } from "@shared/schema";

export function InitiativeTracker() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCombatant, setNewCombatant] = useState({
    name: "",
    initiative: 0,
    armorClass: 10,
    currentHP: 1,
    maxHP: 1,
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  // For now, use a default session ID - in a real app this would come from context
  const sessionId = "default-session";

  const { data: combatants = [] } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'combatants'],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/combatants`);
      if (!response.ok) throw new Error('Failed to fetch combatants');
      return response.json();
    },
  });

  const addCombatantMutation = useMutation({
    mutationFn: async (combatantData: typeof newCombatant) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/combatants`, combatantData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
      setIsAddDialogOpen(false);
      setNewCombatant({
        name: "",
        initiative: 0,
        armorClass: 10,
        currentHP: 1,
        maxHP: 1,
      });
    },
  });

  const updateCombatantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Combatant> }) => {
      const response = await apiRequest('PATCH', `/api/combatants/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
    },
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'combatant_added' || lastMessage?.type === 'combatant_updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
    }
  }, [lastMessage, queryClient, sessionId]);

  const nextTurn = () => {
    if (combatants.length === 0) return;

    // Clear active status from current combatant
    if (combatants[activeIndex]) {
      updateCombatantMutation.mutate({
        id: combatants[activeIndex].id,
        updates: { isActive: false },
      });
    }

    let nextIndex = activeIndex + 1;
    let nextRound = currentRound;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound = currentRound + 1;
      setCurrentRound(nextRound);
    }

    setActiveIndex(nextIndex);

    // Set new active combatant
    if (combatants[nextIndex]) {
      updateCombatantMutation.mutate({
        id: combatants[nextIndex].id,
        updates: { isActive: true },
      });
    }
  };

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    addCombatantMutation.mutate(newCombatant);
  };

  const updateHP = (combatant: Combatant, newHP: number) => {
    const clampedHP = Math.max(0, Math.min(combatant.maxHP, newHP));
    updateCombatantMutation.mutate({
      id: combatant.id,
      updates: { currentHP: clampedHP },
    });
  };

  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  return (
    <Card id="initiative" className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-fantasy text-xl font-bold text-primary flex items-center">
            <Swords className="mr-3 h-5 w-5" />
            Initiative
          </CardTitle>
          <div className="flex space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-add-combatant">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Combatant</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="combatant-name">Name</Label>
                    <Input
                      id="combatant-name"
                      value={newCombatant.name}
                      onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                      data-testid="input-combatant-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combatant-initiative">Initiative</Label>
                      <Input
                        id="combatant-initiative"
                        type="number"
                        value={newCombatant.initiative}
                        onChange={(e) => setNewCombatant({ ...newCombatant, initiative: parseInt(e.target.value) || 0 })}
                        data-testid="input-combatant-initiative"
                      />
                    </div>
                    <div>
                      <Label htmlFor="combatant-ac">AC</Label>
                      <Input
                        id="combatant-ac"
                        type="number"
                        value={newCombatant.armorClass}
                        onChange={(e) => setNewCombatant({ ...newCombatant, armorClass: parseInt(e.target.value) || 10 })}
                        data-testid="input-combatant-ac"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combatant-current-hp">Current HP</Label>
                      <Input
                        id="combatant-current-hp"
                        type="number"
                        value={newCombatant.currentHP}
                        onChange={(e) => setNewCombatant({ ...newCombatant, currentHP: parseInt(e.target.value) || 1 })}
                        data-testid="input-combatant-current-hp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="combatant-max-hp">Max HP</Label>
                      <Input
                        id="combatant-max-hp"
                        type="number"
                        value={newCombatant.maxHP}
                        onChange={(e) => setNewCombatant({ ...newCombatant, maxHP: parseInt(e.target.value) || 1 })}
                        data-testid="input-combatant-max-hp"
                      />
                    </div>
                  </div>
                  <Button onClick={addCombatant} className="w-full" data-testid="button-save-combatant">
                    Add Combatant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={nextTurn}
              disabled={combatants.length === 0}
              data-testid="button-next-turn"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCombatants.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No combatants added yet. Click the + button to add one.
          </div>
        ) : (
          <>
            {sortedCombatants.map((combatant, index) => (
              <div
                key={combatant.id}
                className={`flex items-center p-3 rounded-lg ${
                  index === activeIndex ? 'bg-primary/10 border border-primary' : 'bg-muted'
                }`}
                data-testid={`combatant-${combatant.id}`}
              >
                <div className="flex-1">
                  <div className="font-semibold">{combatant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    AC {combatant.armorClass} • HP {combatant.currentHP}/{combatant.maxHP}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateHP(combatant, combatant.currentHP - 1)}
                    data-testid={`button-decrease-hp-${combatant.id}`}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={combatant.currentHP}
                    onChange={(e) => updateHP(combatant, parseInt(e.target.value) || 0)}
                    className="w-16 text-center"
                    data-testid={`input-hp-${combatant.id}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateHP(combatant, combatant.currentHP + 1)}
                    data-testid={`button-increase-hp-${combatant.id}`}
                  >
                    +
                  </Button>
                </div>
                <div className="text-right ml-4">
                  <div className="font-mono font-bold text-lg">{combatant.initiative}</div>
                  <div className="text-xs text-muted-foreground">Initiative</div>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold" data-testid="text-current-round">Round {currentRound}</div>
                  <div className="text-sm text-muted-foreground" data-testid="text-current-turn">
                    {sortedCombatants[activeIndex]?.name || "No one"}'s Turn
                  </div>
                </div>
                <Button onClick={nextTurn} data-testid="button-end-turn">
                  End Turn
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
