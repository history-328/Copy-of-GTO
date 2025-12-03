export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export type ActionType = 'Fold' | 'Open' | '3-Bet';

export interface Hand {
  card1: Card;
  card2: Card;
  type: 'Pair' | 'Suited' | 'Offsuit';
  display: string; // e.g., "AKs", "TT"
}

export interface RangeCell {
  hand: string; // "AA", "AKs"
  action: ActionType;
}

export interface UserStats {
  correct: number;
  total: number;
  streak: number;
  mistakes: HandRecord[];
}

export interface HandRecord {
  hand: Hand;
  position: Position;
  userAction: ActionType;
  correctAction: ActionType;
  timestamp: number;
}

export interface GameState {
  currentPosition: Position;
  currentHand: Hand | null;
  feedback: {
    lastResult: 'Correct' | 'Incorrect' | null;
    message: string;
    correctAction?: ActionType;
  } | null;
}
