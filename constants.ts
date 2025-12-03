import { Rank, Suit, Position, ActionType } from './types';

export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

// Simplified GTO 6-Max RFI (Raise First In) Ranges for training purposes
// Format: Set of hands that should be Opened. All others are Folds.
// Note: 3-Bet ranges would be a separate layer, but for this trainer, we can simulate 
// "Top of Range" as 3-Bet candidates in a specific drill, or keep it strictly RFI.
// To meet the user requirement of "Fold / Open / 3-Bet", we will assume a "Facing Open" scenario 
// for late positions or map Top % of hands to "3-Bet" value if the user selects a specific mode.
// For simplicity in this implementation, we will use RFI ranges where Action is Fold vs Open, 
// and a "Defense" mode where we check against a 3-bet range.

// Let's implement a solid RFI logic.
export const RFI_RANGES: Record<Position, string[]> = {
  'UTG': [
    'AA','KK','QQ','JJ','TT','99','88','77',
    'AKs','AQs','AJs','ATs','KQs','KJs','KTs','QJs','JTs',
    'AKo','AQo'
  ],
  'MP': [
    'AA','KK','QQ','JJ','TT','99','88','77','66',
    'AKs','AQs','AJs','ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','J9s','T9s',
    'AKo','AQo','AJo','KQo'
  ],
  'CO': [
    'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
    'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
    'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s',
    'AKo','AQo','AJo','ATo','KQo','KJo','QJo'
  ],
  'BTN': [
    // Approx 45-50% range
    'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
    'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
    'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
    'QJs','QTs','Q9s','Q8s','Q6s','Q5s',
    'JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s','54s',
    'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A5o',
    'KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o'
  ],
  'SB': [
    // RFI in SB is usually very wide (blind vs blind) or tight (if 3-bet or fold strategy).
    // We'll use a standard wide RFI (approx 40-45%).
    'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
    'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
    'KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s','76s','65s','54s',
    'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'
  ],
  'BB': [
    // BB RFI doesn't exist (you check or raise facing limp).
    // For the purpose of "Trainer", we'll treat BB as "Defending against a BTN open".
    // 3-Bet Value: top range. Call: middle. Fold: trash.
    // This is a special case in the logic.
    'AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','KQs' // Pure Value 3-bet examples
  ]
};

// Simple helper to check if a hand is in a list (handling suited/offsuit/pair logic)
export const isHandInRange = (handStr: string, range: string[]): boolean => {
  return range.includes(handStr);
};

// Logic for the trainer
export const getCorrectAction = (handStr: string, position: Position): ActionType => {
  // BB Special Logic: Facing BTN Open
  if (position === 'BB') {
    const value3Bet = ['AA','KK','QQ','JJ','TT','AKs','AKo','AQs','AJs','KQs'];
    const callRange = [
        '99','88','77','66','55','44','33','22',
        'ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
        'KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','54s',
        'AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'
    ];
    
    if (value3Bet.includes(handStr)) return '3-Bet';
    if (callRange.includes(handStr)) return 'Open'; // In our UI "Open" will act as "Continue/Call" for BB
    return 'Fold';
  }

  // Standard RFI Logic for other positions
  const range = RFI_RANGES[position];
  
  // To satisfy "3-Bet" option in RFI mode, we consider the absolute top premium hands 
  // as hands you would happily 4-bet or are "super strong". 
  // However, technically RFI is just "Open". 
  // To make the game playable with 3 buttons, we will map "Open" to standard open, 
  // and "3-Bet" to "Premium/Nut Range" if the user wants to distinguish, 
  // BUT strict RFI usually just has Open/Fold.
  // We will treat Open as the correct answer for ANY playable hand in RFI positions, 
  // and 3-Bet as incorrect (or maybe acceptable alias for AA/KK).
  // FOR THIS TRAINER: If you are UTG-SB, "Open" is the correct play for playable hands. "3-Bet" is N/A (or wrong).
  
  if (range.includes(handStr)) {
    return 'Open';
  }
  
  return 'Fold';
};

// Generates the 13x13 grid structure
export const getGridData = () => {
  const grid: { row: Rank; col: Rank; hand: string; type: string }[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = 0; j < RANKS.length; j++) {
      const r1 = RANKS[i];
      const r2 = RANKS[j];
      let hand = '';
      let type = '';

      if (i === j) {
        hand = `${r1}${r2}`;
        type = 'Pair';
      } else if (i < j) {
        hand = `${r1}${r2}s`; // Suited (Upper Triangle)
        type = 'Suited';
      } else {
        hand = `${r2}${r1}o`; // Offsuit (Lower Triangle)
        type = 'Offsuit';
      }
      grid.push({ row: r1, col: r2, hand, type });
    }
  }
  return grid;
};
