import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  name: text("name").notNull(),
  level: integer("level").notNull(),
  school: text("school").notNull(),
  castingTime: text("casting_time").notNull(),
  range: text("range").notNull(),
  components: text("components").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
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

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  currentRound: integer("current_round").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
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

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
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
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

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
