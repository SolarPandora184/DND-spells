import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertCharacterSchema, insertCombatantSchema, insertDiceRollSchema, insertNoteSchema, insertSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Character routes
  app.get("/api/characters", async (req, res) => {
    try {
      const characters = await storage.getCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  app.get("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch character" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(validatedData);
      res.status(201).json(character);
    } catch (error) {
      res.status(400).json({ error: "Invalid character data" });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.updateCharacter(req.params.id, req.body);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      broadcast({ type: 'character_updated', data: character });
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  // Session routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      const session = await storage.getActiveSession();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Combat routes
  app.get("/api/sessions/:sessionId/combatants", async (req, res) => {
    try {
      const combatants = await storage.getCombatants(req.params.sessionId);
      res.json(combatants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch combatants" });
    }
  });

  app.post("/api/sessions/:sessionId/combatants", async (req, res) => {
    try {
      const validatedData = insertCombatantSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId,
      });
      const combatant = await storage.createCombatant(validatedData);
      broadcast({ type: 'combatant_added', data: combatant });
      res.status(201).json(combatant);
    } catch (error) {
      res.status(400).json({ error: "Invalid combatant data" });
    }
  });

  app.patch("/api/combatants/:id", async (req, res) => {
    try {
      const combatant = await storage.updateCombatant(req.params.id, req.body);
      if (!combatant) {
        return res.status(404).json({ error: "Combatant not found" });
      }
      broadcast({ type: 'combatant_updated', data: combatant });
      res.json(combatant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update combatant" });
    }
  });

  // Dice roll routes
  app.get("/api/sessions/:sessionId/dice-rolls", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const rolls = await storage.getDiceRolls(req.params.sessionId, limit);
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dice rolls" });
    }
  });

  app.post("/api/sessions/:sessionId/dice-rolls", async (req, res) => {
    try {
      const validatedData = insertDiceRollSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId,
      });
      const roll = await storage.createDiceRoll(validatedData);
      broadcast({ type: 'dice_rolled', data: roll });
      res.status(201).json(roll);
    } catch (error) {
      res.status(400).json({ error: "Invalid dice roll data" });
    }
  });

  // Spell routes
  app.get("/api/spells", async (req, res) => {
    try {
      const { query, level, school } = req.query;
      const spells = await storage.searchSpells(
        query as string || "",
        level ? parseInt(level as string) : undefined,
        school as string
      );
      res.json(spells);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spells" });
    }
  });

  // Note routes
  app.get("/api/notes", async (req, res) => {
    try {
      const { sessionId, category } = req.query;
      const notes = await storage.getNotes(sessionId as string, category as string);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  return httpServer;
}
