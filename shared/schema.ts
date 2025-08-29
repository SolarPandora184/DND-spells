import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterName: text("character_name").notNull().unique(),
  role: text("role").notNull().default("player"), // "player" or "dm"
  sessionId: varchar("session_id"),
  isOnline: boolean("is_online").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  race: text("race").notNull(),
  characterClass: text("character_class").notNull(),
  level: integer("level").notNull().default(1),
  armorClass: integer("armor_class").notNull().default(10),
  speed: text("speed").notNull().default("30 ft"),
  currentHP: integer("current_hp").notNull().default(1),
  maxHP: integer("max_hp").notNull().default(1),
  tempHP: integer("temp_hp").notNull().default(0),
  hitDice: text("hit_dice").notNull().default("1d8"),
  abilityScores: jsonb("ability_scores").notNull().default({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  }),
  conditions: jsonb("conditions").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const combatants = pgTable("combatants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  name: text("name").notNull(),
  initiative: integer("initiative").notNull().default(0),
  armorClass: integer("armor_class").notNull().default(10),
  currentHP: integer("current_hp").notNull().default(1),
  maxHP: integer("max_hp").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  characterId: varchar("character_id"),
  statusEffects: jsonb("status_effects").notNull().default([]),
  initiativeOrder: integer("initiative_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const diceRolls = pgTable("dice_rolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  playerName: text("player_name").notNull(),
  formula: text("formula").notNull(),
  result: integer("result").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const spells = pgTable("spells", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  level: integer("level").notNull(),
  school: text("school").notNull(),
  castingTime: text("casting_time").notNull(),
  range: text("range").notNull(),
  components: text("components").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  higherLevel: text("higher_level"),
  ritual: boolean("ritual").notNull().default(false),
  concentration: boolean("concentration").notNull().default(false),
  classes: jsonb("classes").notNull().default([]),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("session"),
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  currentRound: integer("current_round").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  inCombat: boolean("in_combat").notNull().default(false),
  currentTurn: integer("current_turn").notNull().default(0),
  dmUserId: varchar("dm_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertCombatantSchema = createInsertSchema(combatants).omit({
  id: true,
  createdAt: true,
});

export const insertDiceRollSchema = createInsertSchema(diceRolls).omit({
  id: true,
  timestamp: true,
});

export const insertSpellSchema = createInsertSchema(spells).omit({
  id: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Combatant = typeof combatants.$inferSelect;
export type InsertCombatant = z.infer<typeof insertCombatantSchema>;
export type DiceRoll = typeof diceRolls.$inferSelect;
export type InsertDiceRoll = z.infer<typeof insertDiceRollSchema>;
export type Spell = typeof spells.$inferSelect;
export type InsertSpell = z.infer<typeof insertSpellSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

// Additional types for frontend
export type AbilityScores = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type UserRole = 'player' | 'dm';

export type StatusEffect = {
  name: string;
  description?: string;
  duration?: number;
  source?: string;
};
