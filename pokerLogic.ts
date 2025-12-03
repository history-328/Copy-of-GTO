import { RANKS, SUITS } from './constants';
import { Card, Hand } from './types';

export const getRandomHand = (): Hand => {
  const r1Idx = Math.floor(Math.random() * 13);
  let r2Idx = Math.floor(Math.random() * 13);
  
  // Ensure cards aren't identical physically if suits match, 
  // but for abstract range training, we generate the 'type' first.
  
  // Algorithm to simulate 1326 combinations probability roughly:
  // 78 Pairs (6 combos each)
  // 78 Suited (4 combos each)
  // 78 Offsuit (12 combos each)
  
  const seed = Math.random();
  let type: 'Pair' | 'Suited' | 'Offsuit';
  let card1: Card;
  let card2: Card;

  // Weighted generation to match real frequency
  // Pair: 6/1326 ~= 0.45% per pair * 13 = 5.88%
  // Suited: 4/1326 ~= 0.3% per hand * 78 = 23.53%
  // Offsuit: 12/1326 ~= 0.9% per hand * 78 = 70.59%
  
  if (seed < 0.0588) {
    type = 'Pair';
    const rank = RANKS[Math.floor(Math.random() * 13)];
    // Pick 2 distinct suits
    const s1 = Math.floor(Math.random() * 4);
    let s2 = Math.floor(Math.random() * 4);
    while (s1 === s2) s2 = Math.floor(Math.random() * 4);
    card1 = { rank, suit: SUITS[s1] };
    card2 = { rank, suit: SUITS[s2] };
  } else if (seed < 0.2941) { // 0.0588 + 0.2353
    type = 'Suited';
    const s = SUITS[Math.floor(Math.random() * 4)];
    const r1 = Math.floor(Math.random() * 13);
    let r2 = Math.floor(Math.random() * 13);
    while (r1 === r2) r2 = Math.floor(Math.random() * 13);
    // Sort logic: Higher rank first
    const first = Math.min(r1, r2);
    const second = Math.max(r1, r2);
    card1 = { rank: RANKS[first], suit: s };
    card2 = { rank: RANKS[second], suit: s };
  } else {
    type = 'Offsuit';
    const r1 = Math.floor(Math.random() * 13);
    let r2 = Math.floor(Math.random() * 13);
    while (r1 === r2) r2 = Math.floor(Math.random() * 13);
    const first = Math.min(r1, r2);
    const second = Math.max(r1, r2);
    
    const s1 = Math.floor(Math.random() * 4);
    let s2 = Math.floor(Math.random() * 4);
    while (s1 === s2) s2 = Math.floor(Math.random() * 4); // Just to be distinct, though technically handled by rank diff
    // Actually for offsuit, suits must strictly NOT match if ranks are different? No, just any suits.
    // Wait, if suits match, it's suited. So we must force different suits.
    card1 = { rank: RANKS[first], suit: SUITS[s1] };
    card2 = { rank: RANKS[second], suit: SUITS[s2] };
    if (card1.suit === card2.suit) {
        // Force different suit
        card2.suit = SUITS[(s1 + 1) % 4];
    }
  }

  // Construct display string e.g., "AKs"
  let display = '';
  if (type === 'Pair') {
    display = `${card1.rank}${card2.rank}`;
  } else {
    // Determine high card
    const idx1 = RANKS.indexOf(card1.rank);
    const idx2 = RANKS.indexOf(card2.rank);
    const high = idx1 < idx2 ? card1.rank : card2.rank;
    const low = idx1 < idx2 ? card2.rank : card1.rank;
    display = `${high}${low}${type === 'Suited' ? 's' : 'o'}`;
  }

  return { card1, card2, type, display };
};
