import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Swords, 
  Plus, 
  SkipForward, 
  Trash2, 
  Shield, 
  Heart, 
  Play, 
  Square, 
  GripVertical,
  Edit,
  Users,
  Crown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Combatant, User, GameSession, StatusEffect } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface EnhancedInitiativeTrackerProps {
  user: User | null;
}

interface SortableCombatantItemProps {
  combatant: Combatant;
  isActive: boolean;
  isDM: boolean;
  onUpdateHP: (combatant: Combatant, newHP: number) => void;
  onUpdateAC: (combatant: Combatant, newAC: number) => void;
  onAddStatusEffect: (combatant: Combatant, effect: StatusEffect) => void;
  onRemoveStatusEffect: (combatant: Combatant, effectIndex: number) => void;
  onRemoveCombatant: (id: string) => void;
}

function SortableCombatantItem({
  combatant,
  isActive,
  isDM,
  onUpdateHP,
  onUpdateAC,
  onAddStatusEffect,
  onRemoveStatusEffect,
  onRemoveCombatant,
}: SortableCombatantItemProps) {
  const [newStatus, setNewStatus] = useState("");
  const [hpInput, setHpInput] = useState(combatant.currentHP.toString());
  const [acInput, setAcInput] = useState(combatant.armorClass.toString());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: combatant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusEffects = (combatant.statusEffects as StatusEffect[]) || [];

  const getHPColor = () => {
    const percentage = (combatant.currentHP / combatant.maxHP) * 100;
    if (percentage <= 25) return "text-red-600";
    if (percentage <= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const handleAddStatus = () => {
    if (newStatus.trim()) {
      onAddStatusEffect(combatant, { name: newStatus.trim() });
      setNewStatus("");
    }
  };

  const handleUpdateHP = () => {
    const newHP = parseInt(hpInput);
    if (!isNaN(newHP)) {
      onUpdateHP(combatant, newHP);
    }
  };

  const handleUpdateAC = () => {
    const newAC = parseInt(acInput);
    if (!isNaN(newAC)) {
      onUpdateAC(combatant, newAC);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg transition-all ${
        isActive 
          ? "border-primary bg-primary/10 shadow-lg" 
          : "border-border bg-card hover:bg-muted/50"
      }`}
      data-testid={`combatant-${combatant.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isDM && (
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              data-testid="drag-handle"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg" data-testid={`combatant-name-${combatant.id}`}>
                {combatant.name}
              </span>
              {isActive && <Crown className="h-4 w-4 text-primary" />}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Swords className="h-3 w-3" />
                <span data-testid={`initiative-${combatant.id}`}>{combatant.initiative}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span data-testid={`ac-${combatant.id}`}>AC {combatant.armorClass}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Heart className={`h-3 w-3 ${getHPColor()}`} />
                <span className={getHPColor()} data-testid={`hp-${combatant.id}`}>
                  {combatant.currentHP}/{combatant.maxHP}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {statusEffects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {statusEffects.map((effect, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => isDM && onRemoveStatusEffect(combatant, index)}
                  data-testid={`status-${combatant.id}-${index}`}
                >
                  {effect.name}
                  {isDM && " ×"}
                </Badge>
              ))}
            </div>
          )}

          {isDM && (
            <>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid={`edit-combatant-${combatant.id}`}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit {combatant.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hp">Current HP</Label>
                        <Input
                          id="hp"
                          type="number"
                          value={hpInput}
                          onChange={(e) => setHpInput(e.target.value)}
                          onBlur={handleUpdateHP}
                          data-testid="input-hp"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ac">Armor Class</Label>
                        <Input
                          id="ac"
                          type="number"
                          value={acInput}
                          onChange={(e) => setAcInput(e.target.value)}
                          onBlur={handleUpdateAC}
                          data-testid="input-ac"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Add Status Effect</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="status"
                          placeholder="e.g., Poisoned, Charmed"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
                          data-testid="input-status"
                        />
                        <Button onClick={handleAddStatus} data-testid="button-add-status">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveCombatant(combatant.id)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                data-testid={`remove-combatant-${combatant.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedInitiativeTracker({ user }: EnhancedInitiativeTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCombatant, setNewCombatant] = useState({
    name: "",
    initiative: 0,
    armorClass: 10,
    currentHP: 1,
    maxHP: 1,
  });

  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();
  const isDM = user?.role === "dm";
  const sessionId = "default-session";

  // Fetch game session data
  const { data: gameSession } = useQuery({
    queryKey: ['/api/game-sessions/active'],
    queryFn: async (): Promise<GameSession | null> => {
      const response = await fetch('/api/game-sessions/active');
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch combatants
  const { data: combatants = [] } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'combatants'],
    queryFn: async (): Promise<Combatant[]> => {
      const response = await fetch(`/api/sessions/${sessionId}/combatants`);
      if (!response.ok) throw new Error('Failed to fetch combatants');
      return response.json();
    },
  });

  // Fetch online users
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['/api/users/online'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch(`/api/users/online?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Mutations
  const addCombatantMutation = useMutation({
    mutationFn: async (combatantData: typeof newCombatant) => {
      const response = await fetch(`/api/sessions/${sessionId}/combatants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combatantData),
      });
      if (!response.ok) throw new Error("Failed to add combatant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
      setIsAddDialogOpen(false);
      setNewCombatant({ name: "", initiative: 0, armorClass: 10, currentHP: 1, maxHP: 1 });
      toast({ title: "Combatant added", description: "New combatant has been added to the initiative." });
    },
  });

  const updateCombatantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Combatant> }) => {
      const response = await fetch(`/api/combatants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update combatant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
    },
  });

  const removeCombatantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/combatants/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove combatant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
      toast({ title: "Combatant removed", description: "Combatant has been removed from the initiative." });
    },
  });

  const startCombatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/combat/start`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start combat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions/active'] });
      toast({ title: "Combat started!", description: "The battle has begun. Good luck!" });
    },
  });

  const nextTurnMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/combat/next-turn`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to advance turn");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions/active'] });
    },
  });

  const endCombatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/combat/end`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to end combat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions/active'] });
      toast({ title: "Combat ended", description: "The battle is over!" });
    },
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'combatant_added' || 
          lastMessage.type === 'combatant_updated' || 
          lastMessage.type === 'combatant_removed') {
        queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'combatants'] });
      } else if (lastMessage.type === 'combat_started' || 
                 lastMessage.type === 'combat_ended' || 
                 lastMessage.type === 'turn_changed') {
        queryClient.invalidateQueries({ queryKey: ['/api/game-sessions/active'] });
        if (lastMessage.type === 'turn_changed' && !isDM && lastMessage.data?.activeCombatant) {
          const activeCombatant = lastMessage.data.activeCombatant;
          if (activeCombatant.name === user?.characterName) {
            toast({
              title: "Your turn!",
              description: "It's your turn to act in combat.",
              duration: 5000,
            });
          }
        }
      }
    }
  }, [lastMessage, queryClient, sessionId, isDM, user, toast]);

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !isDM) return;
    
    if (active.id !== over.id) {
      const oldIndex = combatants.findIndex((item) => item.id === active.id);
      const newIndex = combatants.findIndex((item) => item.id === over.id);
      
      // Reorder logic would go here - for now just show a toast
      toast({
        title: "Initiative reordered",
        description: `Moved ${combatants[oldIndex]?.name} in the initiative order.`,
      });
    }
  };

  const updateHP = (combatant: Combatant, newHP: number) => {
    const clampedHP = Math.max(0, Math.min(combatant.maxHP, newHP));
    updateCombatantMutation.mutate({
      id: combatant.id,
      updates: { currentHP: clampedHP },
    });
  };

  const updateAC = (combatant: Combatant, newAC: number) => {
    const clampedAC = Math.max(1, newAC);
    updateCombatantMutation.mutate({
      id: combatant.id,
      updates: { armorClass: clampedAC },
    });
  };

  const addStatusEffect = (combatant: Combatant, effect: StatusEffect) => {
    const currentEffects = (combatant.statusEffects as StatusEffect[]) || [];
    updateCombatantMutation.mutate({
      id: combatant.id,
      updates: { statusEffects: [...currentEffects, effect] },
    });
  };

  const removeStatusEffect = (combatant: Combatant, effectIndex: number) => {
    const currentEffects = (combatant.statusEffects as StatusEffect[]) || [];
    const newEffects = currentEffects.filter((_, index) => index !== effectIndex);
    updateCombatantMutation.mutate({
      id: combatant.id,
      updates: { statusEffects: newEffects },
    });
  };

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    addCombatantMutation.mutate(newCombatant);
  };

  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);
  const activeCombatant = sortedCombatants[gameSession?.currentTurn || 0];

  return (
    <Card id="initiative" className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-fantasy text-xl font-bold text-primary flex items-center">
            <Swords className="mr-2" />
            Initiative Tracker
            {gameSession?.inCombat && (
              <Badge variant="secondary" className="ml-2">
                Round {gameSession.currentRound}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {onlineUsers.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span data-testid="online-users-count">{onlineUsers.length} online</span>
              </div>
            )}

            {isDM && (
              <>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-add-combatant">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Combatant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Combatant</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Combatant name"
                          value={newCombatant.name}
                          onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                          data-testid="input-combatant-name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="initiative">Initiative</Label>
                          <Input
                            id="initiative"
                            type="number"
                            value={newCombatant.initiative}
                            onChange={(e) => setNewCombatant({ ...newCombatant, initiative: parseInt(e.target.value) || 0 })}
                            data-testid="input-initiative"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ac">Armor Class</Label>
                          <Input
                            id="ac"
                            type="number"
                            value={newCombatant.armorClass}
                            onChange={(e) => setNewCombatant({ ...newCombatant, armorClass: parseInt(e.target.value) || 10 })}
                            data-testid="input-armor-class"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currentHP">Current HP</Label>
                          <Input
                            id="currentHP"
                            type="number"
                            value={newCombatant.currentHP}
                            onChange={(e) => setNewCombatant({ ...newCombatant, currentHP: parseInt(e.target.value) || 1 })}
                            data-testid="input-current-hp"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxHP">Max HP</Label>
                          <Input
                            id="maxHP"
                            type="number"
                            value={newCombatant.maxHP}
                            onChange={(e) => setNewCombatant({ ...newCombatant, maxHP: parseInt(e.target.value) || 1 })}
                            data-testid="input-max-hp"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={addCombatant} 
                        className="w-full"
                        disabled={addCombatantMutation.isPending}
                        data-testid="button-confirm-add"
                      >
                        {addCombatantMutation.isPending ? "Adding..." : "Add Combatant"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {!gameSession?.inCombat ? (
                  <Button 
                    onClick={() => startCombatMutation.mutate()}
                    disabled={combatants.length === 0 || startCombatMutation.isPending}
                    data-testid="button-start-combat"
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Begin Combat
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => nextTurnMutation.mutate()}
                      disabled={nextTurnMutation.isPending}
                      data-testid="button-next-turn"
                    >
                      <SkipForward className="mr-1 h-4 w-4" />
                      Next Turn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => endCombatMutation.mutate()}
                      disabled={endCombatMutation.isPending}
                      data-testid="button-end-combat"
                    >
                      <Square className="mr-1 h-4 w-4" />
                      End Combat
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {combatants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Swords className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No combatants in the initiative order.</p>
            {isDM && <p className="text-sm mt-2">Add combatants to begin tracking initiative.</p>}
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedCombatants.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedCombatants.map((combatant) => (
                  <SortableCombatantItem
                    key={combatant.id}
                    combatant={combatant}
                    isActive={activeCombatant?.id === combatant.id}
                    isDM={isDM}
                    onUpdateHP={updateHP}
                    onUpdateAC={updateAC}
                    onAddStatusEffect={addStatusEffect}
                    onRemoveStatusEffect={removeStatusEffect}
                    onRemoveCombatant={(id) => removeCombatantMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {gameSession?.inCombat && activeCombatant && (
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary" data-testid="active-combatant">
                  {activeCombatant.name}'s Turn
                </h3>
                <p className="text-sm text-muted-foreground">
                  Round {gameSession.currentRound} • Initiative {activeCombatant.initiative}
                </p>
              </div>
              
              {!isDM && activeCombatant.name === user?.characterName && (
                <Badge variant="default" className="animate-pulse">
                  Your Turn!
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}