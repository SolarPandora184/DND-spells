export interface DiceRollResult {
  formula: string;
  result: number;
  details: string;
  individual?: number[];
}

export interface WebSocketMessage {
  type: 'dice_rolled' | 'character_updated' | 'combatant_added' | 'combatant_updated' | 'initiative_updated';
  data: any;
}
