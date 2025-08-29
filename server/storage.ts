import {
  type Character,
  type InsertCharacter,
  type Combatant,
  type InsertCombatant,
  type DiceRoll,
  type InsertDiceRoll,
  type Spell,
  type InsertSpell,
  type Note,
  type InsertNote,
  type Session,
  type InsertSession,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Character methods
  getCharacter(id: string): Promise<Character | undefined>;
  getCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<boolean>;

  // Session methods
  getSession(id: string): Promise<Session | undefined>;
  getSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  getActiveSession(): Promise<Session | undefined>;

  // Combatant methods
  getCombatants(sessionId: string): Promise<Combatant[]>;
  createCombatant(combatant: InsertCombatant): Promise<Combatant>;
  updateCombatant(id: string, updates: Partial<Combatant>): Promise<Combatant | undefined>;
  deleteCombatant(id: string): Promise<boolean>;

  // Dice roll methods
  getDiceRolls(sessionId: string, limit?: number): Promise<DiceRoll[]>;
  createDiceRoll(roll: InsertDiceRoll): Promise<DiceRoll>;

  // Spell methods
  getSpells(): Promise<Spell[]>;
  searchSpells(query: string, level?: number, school?: string): Promise<Spell[]>;
  createSpell(spell: InsertSpell): Promise<Spell>;

  // Note methods
  getNotes(sessionId?: string, category?: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private characters: Map<string, Character> = new Map();
  private sessions: Map<string, Session> = new Map();
  private combatants: Map<string, Combatant> = new Map();
  private diceRolls: Map<string, DiceRoll> = new Map();
  private spells: Map<string, Spell> = new Map();
  private notes: Map<string, Note> = new Map();

  constructor() {
    this.initializeSpells();
    this.initializeSampleData();
  }

  private initializeSpells() {
    const basicSpells: InsertSpell[] = [
      {
        name: "Fireball",
        level: 3,
        school: "Evocation",
        castingTime: "1 action",
        range: "150 feet",
        components: "V, S, M",
        duration: "Instantaneous",
        description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame."
      },
      {
        name: "Magic Missile",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "You create three glowing darts of magical force that automatically hit their targets."
      },
      {
        name: "Cure Wounds",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S",
        duration: "Instantaneous",
        description: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier."
      }
    ];

    basicSpells.forEach(spell => {
      const id = randomUUID();
      this.spells.set(id, { ...spell, id });
    });
  }

  private initializeSampleData() {
    // Create a sample character
    const characterId = randomUUID();
    const sampleCharacter: Character = {
      id: characterId,
      name: "Elara Moonwhisper",
      race: "Elf",
      characterClass: "Wizard",
      level: 3,
      armorClass: 13,
      speed: "30 ft",
      currentHP: 18,
      maxHP: 18,
      tempHP: 0,
      hitDice: "3d6",
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 17,
        wisdom: 12,
        charisma: 10
      },
      conditions: [],
      createdAt: new Date(),
    };
    this.characters.set(characterId, sampleCharacter);

    // Create a sample session
    const sessionId = "default-session";
    const sampleSession: Session = {
      id: sessionId,
      name: "Dragon Heist Adventure",
      currentRound: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.sessions.set(sessionId, sampleSession);

    // Create sample notes
    const noteId = randomUUID();
    const sampleNote: Note = {
      id: noteId,
      title: "Session Notes - Welcome Adventure",
      content: "The party has arrived in Waterdeep and seeks adventure in the bustling city. They've heard rumors of a great treasure hidden somewhere in the city...",
      category: "session",
      sessionId: sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(noteId, sampleNote);
  }

  // Character methods
  async getCharacter(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = randomUUID();
    const character: Character = {
      name: insertCharacter.name,
      race: insertCharacter.race,
      characterClass: insertCharacter.characterClass,
      level: insertCharacter.level || 1,
      armorClass: insertCharacter.armorClass || 10,
      speed: insertCharacter.speed || "30 ft",
      currentHP: insertCharacter.currentHP || 1,
      maxHP: insertCharacter.maxHP || 1,
      tempHP: insertCharacter.tempHP || 0,
      hitDice: insertCharacter.hitDice || "1d8",
      abilityScores: insertCharacter.abilityScores || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      conditions: insertCharacter.conditions || [],
      id,
      createdAt: new Date(),
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;

    const updated = { ...character, ...updates };
    this.characters.set(id, updated);
    return updated;
  }

  async deleteCharacter(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      name: insertSession.name,
      currentRound: insertSession.currentRound || 1,
      isActive: insertSession.isActive || false,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  async getActiveSession(): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.isActive);
  }

  // Combatant methods
  async getCombatants(sessionId: string): Promise<Combatant[]> {
    return Array.from(this.combatants.values())
      .filter(combatant => combatant.sessionId === sessionId)
      .sort((a, b) => b.initiative - a.initiative);
  }

  async createCombatant(insertCombatant: InsertCombatant): Promise<Combatant> {
    const id = randomUUID();
    const combatant: Combatant = {
      sessionId: insertCombatant.sessionId,
      name: insertCombatant.name,
      initiative: insertCombatant.initiative || 0,
      armorClass: insertCombatant.armorClass || 10,
      currentHP: insertCombatant.currentHP || 1,
      maxHP: insertCombatant.maxHP || 1,
      isActive: insertCombatant.isActive || false,
      characterId: insertCombatant.characterId || null,
      id,
      createdAt: new Date(),
    };
    this.combatants.set(id, combatant);
    return combatant;
  }

  async updateCombatant(id: string, updates: Partial<Combatant>): Promise<Combatant | undefined> {
    const combatant = this.combatants.get(id);
    if (!combatant) return undefined;

    const updated = { ...combatant, ...updates };
    this.combatants.set(id, updated);
    return updated;
  }

  async deleteCombatant(id: string): Promise<boolean> {
    return this.combatants.delete(id);
  }

  // Dice roll methods
  async getDiceRolls(sessionId: string, limit: number = 10): Promise<DiceRoll[]> {
    return Array.from(this.diceRolls.values())
      .filter(roll => roll.sessionId === sessionId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const id = randomUUID();
    const diceRoll: DiceRoll = {
      sessionId: insertDiceRoll.sessionId,
      playerName: insertDiceRoll.playerName,
      formula: insertDiceRoll.formula,
      result: insertDiceRoll.result,
      details: insertDiceRoll.details || null,
      id,
      timestamp: new Date(),
    };
    this.diceRolls.set(id, diceRoll);
    return diceRoll;
  }

  // Spell methods
  async getSpells(): Promise<Spell[]> {
    return Array.from(this.spells.values());
  }

  async searchSpells(query: string, level?: number, school?: string): Promise<Spell[]> {
    const allSpells = Array.from(this.spells.values());
    
    return allSpells.filter(spell => {
      const matchesQuery = !query || spell.name.toLowerCase().includes(query.toLowerCase());
      const matchesLevel = level === undefined || spell.level === level;
      const matchesSchool = !school || spell.school.toLowerCase() === school.toLowerCase();
      
      return matchesQuery && matchesLevel && matchesSchool;
    });
  }

  async createSpell(insertSpell: InsertSpell): Promise<Spell> {
    const id = randomUUID();
    const spell: Spell = { ...insertSpell, id };
    this.spells.set(id, spell);
    return spell;
  }

  // Note methods
  async getNotes(sessionId?: string, category?: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => {
        const matchesSession = !sessionId || note.sessionId === sessionId;
        const matchesCategory = !category || note.category === category;
        return matchesSession && matchesCategory;
      })
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      title: insertNote.title,
      content: insertNote.content,
      category: insertNote.category || "session",
      sessionId: insertNote.sessionId || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const updated = { ...note, ...updates, updatedAt: new Date() };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }
}

export const storage = new MemStorage();
