import {
  type User,
  type InsertUser,
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
  type GameSession,
  type InsertGameSession,
  users,
  characters,
  combatants,
  diceRolls,
  spells,
  notes,
  gameSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByCharacterName(characterName: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getOnlineUsers(sessionId?: string): Promise<User[]>;

  // Character methods
  getCharacter(id: string): Promise<Character | undefined>;
  getCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<boolean>;

  // Game Session methods
  getGameSession(id: string): Promise<GameSession | undefined>;
  getGameSessions(): Promise<GameSession[]>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  getActiveGameSession(): Promise<GameSession | undefined>;

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
  initializeSpells(): Promise<void>;

  // Note methods
  getNotes(sessionId?: string, category?: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    await this.initializeSpells();
    await this.initializeSampleData();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByCharacterName(characterName: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.characterName, characterName));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getOnlineUsers(sessionId?: string): Promise<User[]> {
    const query = db.select().from(users).where(eq(users.isOnline, true));
    if (sessionId) {
      return await query.where(eq(users.sessionId, sessionId));
    }
    return await query;
  }

  // Character methods
  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return character || undefined;
  }

  async deleteCharacter(id: string): Promise<boolean> {
    const result = await db.delete(characters).where(eq(characters.id, id));
    return result.rowCount > 0;
  }

  // Game Session methods
  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async getGameSessions(): Promise<GameSession[]> {
    return await db.select().from(gameSessions);
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const [session] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getActiveGameSession(): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.isActive, true));
    return session || undefined;
  }

  // Combatant methods
  async getCombatants(sessionId: string): Promise<Combatant[]> {
    return await db
      .select()
      .from(combatants)
      .where(eq(combatants.sessionId, sessionId))
      .orderBy(desc(combatants.initiative));
  }

  async createCombatant(insertCombatant: InsertCombatant): Promise<Combatant> {
    const [combatant] = await db
      .insert(combatants)
      .values(insertCombatant)
      .returning();
    return combatant;
  }

  async updateCombatant(id: string, updates: Partial<Combatant>): Promise<Combatant | undefined> {
    const [combatant] = await db
      .update(combatants)
      .set(updates)
      .where(eq(combatants.id, id))
      .returning();
    return combatant || undefined;
  }

  async deleteCombatant(id: string): Promise<boolean> {
    const result = await db.delete(combatants).where(eq(combatants.id, id));
    return result.rowCount > 0;
  }

  // Dice roll methods
  async getDiceRolls(sessionId: string, limit: number = 10): Promise<DiceRoll[]> {
    return await db
      .select()
      .from(diceRolls)
      .where(eq(diceRolls.sessionId, sessionId))
      .orderBy(desc(diceRolls.timestamp))
      .limit(limit);
  }

  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const [diceRoll] = await db
      .insert(diceRolls)
      .values(insertDiceRoll)
      .returning();
    return diceRoll;
  }

  // Spell methods
  async getSpells(): Promise<Spell[]> {
    return await db.select().from(spells);
  }

  async searchSpells(query: string, level?: number, school?: string): Promise<Spell[]> {
    let dbQuery = db.select().from(spells);
    
    const conditions = [];
    
    if (query) {
      conditions.push(
        or(
          ilike(spells.name, `%${query}%`),
          ilike(spells.description, `%${query}%`)
        )
      );
    }
    
    if (level !== undefined) {
      conditions.push(eq(spells.level, level));
    }
    
    if (school) {
      conditions.push(eq(spells.school, school));
    }
    
    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }
    
    return await dbQuery;
  }

  async createSpell(insertSpell: InsertSpell): Promise<Spell> {
    const [spell] = await db
      .insert(spells)
      .values(insertSpell)
      .returning();
    return spell;
  }

  async initializeSpells(): Promise<void> {
    // Check if spells already exist
    const existingSpells = await db.select().from(spells).limit(1);
    if (existingSpells.length > 0) {
      return; // Spells already initialized
    }

    // Comprehensive D&D 5e spell list
    const dndSpells: InsertSpell[] = [
      // Cantrips
      {
        name: "Acid Splash",
        level: 0,
        school: "Conjuration",
        castingTime: "1 action",
        range: "60 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "You hurl a bubble of acid. Choose one or two creatures within range. A creature must succeed on a Dexterity saving throw or take 1d6 acid damage.",
        higherLevel: "This spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
        classes: ["Artificer", "Sorcerer", "Wizard"]
      },
      {
        name: "Blade Ward",
        level: 0,
        school: "Abjuration",
        castingTime: "1 action",
        range: "Self",
        components: "V, S",
        duration: "1 round",
        description: "You extend your hand and trace a sigil of warding in the air. Until the end of your next turn, you have resistance against bludgeoning, piercing, and slashing damage dealt by weapon attacks.",
        classes: ["Bard", "Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Chill Touch",
        level: 0,
        school: "Necromancy",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "1 round",
        description: "You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave. On a hit, the target takes 1d8 necrotic damage, and it can't regain hit points until the start of your next turn.",
        higherLevel: "This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
        classes: ["Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Dancing Lights",
        level: 0,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S, M (a bit of phosphorus or wychwood, or a glowworm)",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        description: "You create up to four torch-sized lights within range, making them appear as torches, lanterns, or glowing orbs that hover in the air for the duration.",
        classes: ["Artificer", "Bard", "Sorcerer", "Wizard"]
      },
      {
        name: "Druidcraft",
        level: 0,
        school: "Transmutation",
        castingTime: "1 action",
        range: "30 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "Whispering to the spirits of nature, you create one of the following effects within range: You create a tiny, harmless sensory effect that predicts what the weather will be at your location for the next 24 hours. You instantly make a flower blossom, a seed pod open, or a leaf bud bloom. You create an instantaneous, harmless sensory effect, such as falling leaves, a puff of wind, the sound of a small animal, or the faint odor of skunk. You instantly light or snuff out a candle, a torch, or a small campfire.",
        classes: ["Druid"]
      },
      {
        name: "Eldritch Blast",
        level: 0,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage.",
        higherLevel: "The spell creates more than one beam when you reach higher levels: two beams at 5th level, three beams at 11th level, and four beams at 17th level.",
        classes: ["Warlock"]
      },
      {
        name: "Fire Bolt",
        level: 0,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried.",
        higherLevel: "This spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
        classes: ["Artificer", "Sorcerer", "Wizard"]
      },
      {
        name: "Guidance",
        level: 0,
        school: "Divination",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        description: "You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice.",
        classes: ["Artificer", "Cleric", "Druid"]
      },
      {
        name: "Light",
        level: 0,
        school: "Evocation",
        castingTime: "1 action",
        range: "Touch",
        components: "V, M (a firefly or phosphorescent moss)",
        duration: "1 hour",
        description: "You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.",
        classes: ["Artificer", "Bard", "Cleric", "Sorcerer", "Wizard"]
      },
      {
        name: "Mage Hand",
        level: 0,
        school: "Conjuration",
        castingTime: "1 action",
        range: "30 feet",
        components: "V, S",
        duration: "1 minute",
        description: "A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. You can use your action to control the hand.",
        classes: ["Artificer", "Bard", "Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Minor Illusion",
        level: 0,
        school: "Illusion",
        castingTime: "1 action",
        range: "30 feet",
        components: "S, M (a bit of fleece)",
        duration: "1 minute",
        description: "You create a sound or an image of an object within range that lasts for the duration. The illusion also ends if you dismiss it as an action or cast this spell again.",
        classes: ["Bard", "Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Prestidigitation",
        level: 0,
        school: "Transmutation",
        castingTime: "1 action",
        range: "10 feet",
        components: "V, S",
        duration: "Up to 1 hour",
        description: "This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: You create an instantaneous, harmless sensory effect, such as a shower of sparks, a puff of wind, faint musical notes, or an odd odor. You instantaneously light or snuff out a candle, a torch, or a small campfire. You instantaneously clean or soil an object no larger than 1 cubic foot. You chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. You make a color, a small mark, or a symbol appear on an object or a surface for 1 hour. You create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn.",
        classes: ["Artificer", "Bard", "Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Sacred Flame",
        level: 0,
        school: "Evocation",
        castingTime: "1 action",
        range: "60 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.",
        higherLevel: "The spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
        classes: ["Cleric"]
      },
      {
        name: "Spare the Dying",
        level: 0,
        school: "Necromancy",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S",
        duration: "Instantaneous",
        description: "You touch a living creature that has 0 hit points. The creature becomes stable. This spell has no effect on undead or constructs.",
        classes: ["Artificer", "Cleric"]
      },
      {
        name: "Thaumaturgy",
        level: 0,
        school: "Transmutation",
        castingTime: "1 action",
        range: "30 feet",
        components: "V",
        duration: "Up to 1 minute",
        description: "You manifest a minor wonder, a sign of supernatural power, within range. You create one of the following magical effects within range: Your voice booms up to three times as loud as normal for 1 minute. You cause flames to flicker, brighten, dim, or change color for 1 minute. You cause harmless tremors in the ground for 1 minute. You create an instantaneous sound that originates from a point of your choice within range, such as a rumble of thunder, the cry of a raven, or ominous whispers. You instantaneously cause an unlocked door or window to fly open or slam shut. You alter the appearance of your eyes for 1 minute.",
        classes: ["Cleric"]
      },

      // 1st Level Spells
      {
        name: "Cure Wounds",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S",
        duration: "Instantaneous",
        description: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
        higherLevel: "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.",
        classes: ["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger"]
      },
      {
        name: "Magic Missile",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
        higherLevel: "When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Shield",
        level: 1,
        school: "Abjuration",
        castingTime: "1 reaction, which you take when you are hit by an attack or targeted by the magic missile spell",
        range: "Self",
        components: "V, S",
        duration: "1 round",
        description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Healing Word",
        level: 1,
        school: "Evocation",
        castingTime: "1 bonus action",
        range: "60 feet",
        components: "V",
        duration: "Instantaneous",
        description: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
        higherLevel: "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.",
        classes: ["Bard", "Cleric", "Druid"]
      },
      {
        name: "Bless",
        level: 1,
        school: "Enchantment",
        castingTime: "1 action",
        range: "30 feet",
        components: "V, S, M (a sprinkling of holy water)",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        description: "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.",
        higherLevel: "When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.",
        classes: ["Cleric", "Paladin"]
      },

      // 2nd Level Spells
      {
        name: "Misty Step",
        level: 2,
        school: "Conjuration",
        castingTime: "1 bonus action",
        range: "Self",
        components: "V",
        duration: "Instantaneous",
        description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.",
        classes: ["Sorcerer", "Warlock", "Wizard"]
      },
      {
        name: "Scorching Ray",
        level: 2,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description: "You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.",
        higherLevel: "When you cast this spell using a spell slot of 3rd level or higher, you create one additional ray for each slot level above 2nd.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Hold Person",
        level: 2,
        school: "Enchantment",
        castingTime: "1 action",
        range: "60 feet",
        components: "V, S, M (a small, straight piece of iron)",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        description: "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target.",
        higherLevel: "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd.",
        classes: ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"]
      },

      // 3rd Level Spells
      {
        name: "Fireball",
        level: 3,
        school: "Evocation",
        castingTime: "1 action",
        range: "150 feet",
        components: "V, S, M (a tiny ball of bat guano and sulfur)",
        duration: "Instantaneous",
        description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
        higherLevel: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Lightning Bolt",
        level: 3,
        school: "Evocation",
        castingTime: "1 action",
        range: "Self (100-foot line)",
        components: "V, S, M (a bit of fur and a rod of amber, crystal, or glass)",
        duration: "Instantaneous",
        description: "A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one.",
        higherLevel: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Counterspell",
        level: 3,
        school: "Abjuration",
        castingTime: "1 reaction, which you take when you see a creature within 60 feet of you casting a spell",
        range: "60 feet",
        components: "S",
        duration: "Instantaneous",
        description: "You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell's level. On a success, the creature's spell fails and has no effect.",
        higherLevel: "When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.",
        classes: ["Sorcerer", "Warlock", "Wizard"]
      },

      // Higher level spells would continue here...
      // For brevity, I'm including a few key high-level spells

      // 9th Level Spells
      {
        name: "Wish",
        level: 9,
        school: "Conjuration",
        castingTime: "1 action",
        range: "Self",
        components: "V",
        duration: "Instantaneous",
        description: "Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in accord with your desires. The basic use of this spell is to duplicate any other spell of 8th level or lower.",
        classes: ["Sorcerer", "Wizard"]
      },
      {
        name: "Meteor Swarm",
        level: 9,
        school: "Evocation",
        castingTime: "1 action",
        range: "1 mile",
        components: "V, S",
        duration: "Instantaneous",
        description: "Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius sphere centered on each point you choose must make a Dexterity saving throw. The sphere spreads around corners. A creature takes 20d6 fire damage and 20d6 bludgeoning damage on a failed save, or half as much damage on a successful one.",
        classes: ["Sorcerer", "Wizard"]
      }
    ];

    // Insert spells in batches
    const batchSize = 50;
    for (let i = 0; i < dndSpells.length; i += batchSize) {
      const batch = dndSpells.slice(i, i + batchSize);
      await db.insert(spells).values(batch);
    }
  }

  // Note methods
  async getNotes(sessionId?: string, category?: string): Promise<Note[]> {
    let dbQuery = db.select().from(notes);
    
    const conditions = [];
    
    if (sessionId) {
      conditions.push(eq(notes.sessionId, sessionId));
    }
    
    if (category) {
      conditions.push(eq(notes.category, category));
    }
    
    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }
    
    return await dbQuery.orderBy(desc(notes.updatedAt));
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return note || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount > 0;
  }

  private async initializeSampleData() {
    // Check if default session already exists
    const existingSession = await db.select().from(gameSessions).where(eq(gameSessions.id, "default-session")).limit(1);
    if (existingSession.length > 0) {
      return; // Data already initialized
    }

    // Create default session
    const [session] = await db
      .insert(gameSessions)
      .values({
        id: "default-session",
        name: "Dragon Heist Adventure",
        currentRound: 1,
        isActive: true,
        inCombat: false,
        currentTurn: 0,
      })
      .returning();

    // Create a sample character
    const [character] = await db
      .insert(characters)
      .values({
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
      })
      .returning();

    // Create sample notes
    await db
      .insert(notes)
      .values({
        title: "Session Notes - Welcome Adventure",
        content: "The party has arrived in Waterdeep and seeks adventure in the bustling city. They've heard rumors of a great treasure hidden somewhere in the city...",
        category: "session",
        sessionId: session.id,
      });
  }
}

export const storage = new DatabaseStorage();