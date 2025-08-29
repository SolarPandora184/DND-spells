import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollText } from "lucide-react";
import type { Spell } from "@shared/schema";

export function SpellLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const { data: spells = [], isLoading } = useQuery({
    queryKey: ['/api/spells', searchQuery, selectedLevel, selectedSchool],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel);
      if (selectedSchool && selectedSchool !== 'all') params.set('school', selectedSchool);
      
      const response = await fetch(`/api/spells?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch spells');
      return response.json();
    },
  });

  const spellLevels = ["Cantrip", "1st Level", "2nd Level", "3rd Level", "4th Level", "5th Level", "6th Level", "7th Level", "8th Level", "9th Level"];
  const spellSchools = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];

  const getLevelColor = (level: number) => {
    if (level === 0) return "bg-muted text-muted-foreground";
    if (level <= 2) return "bg-primary text-primary-foreground";
    if (level <= 5) return "bg-secondary text-secondary-foreground";
    if (level <= 7) return "bg-accent text-accent-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const formatLevel = (level: number) => {
    if (level === 0) return "Cantrip";
    if (level === 1) return "1st";
    if (level === 2) return "2nd";
    if (level === 3) return "3rd";
    return `${level}th`;
  };

  return (
    <Card id="spells" className="w-full">
      <CardHeader>
        <CardTitle className="font-fantasy text-xl font-bold text-primary flex items-center">
          <ScrollText className="mr-3 h-5 w-5" />
          Spell Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="spell-search">Search Spells</Label>
          <Input
            id="spell-search"
            placeholder="Search spells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-spell-search"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger data-testid="select-spell-level">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0">Cantrip</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                  <SelectItem key={level} value={level.toString()}>
                    {formatLevel(level)} Level
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>School</Label>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger data-testid="select-spell-school">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {spellSchools.map(school => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-4">
              Loading spells...
            </div>
          ) : spells.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No spells found
            </div>
          ) : (
            spells.map((spell: Spell) => (
              <Dialog key={spell.id}>
                <DialogTrigger asChild>
                  <div
                    className="p-3 bg-muted rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    data-testid={`spell-${spell.id}`}
                    onClick={() => setSelectedSpell(spell)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{spell.name}</div>
                      <Badge className={getLevelColor(spell.level)}>
                        {formatLevel(spell.level)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {spell.school} • {spell.range} • {spell.castingTime}
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>{spell.name}</span>
                      <Badge className={getLevelColor(spell.level)}>
                        {formatLevel(spell.level)} {spell.school}
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Casting Time:</span> {spell.castingTime}
                      </div>
                      <div>
                        <span className="font-semibold">Range:</span> {spell.range}
                      </div>
                      <div>
                        <span className="font-semibold">Components:</span> {spell.components}
                      </div>
                      <div>
                        <span className="font-semibold">Duration:</span> {spell.duration}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Description:</span>
                      <p className="mt-2 text-sm leading-relaxed">{spell.description}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
