import React from 'react';
import { Card, Suit } from '../types';

interface CardProps {
  card: Card;
  className?: string;
}

const SuitIcon: React.FC<{ suit: Suit; className?: string }> = ({ suit, className }) => {
  switch (suit) {
    case 's': return <span className={`text-gray-900 ${className}`}>♠</span>;
    case 'h': return <span className={`text-red-600 ${className}`}>♥</span>;
    case 'd': return <span className={`text-red-600 ${className}`}>♦</span>;
    case 'c': return <span className={`text-green-700 ${className}`}>♣</span>; // 4-color deck style for clubs usually Green
    default: return null;
  }
};

export const CardDisplay: React.FC<CardProps> = ({ card, className = '' }) => {
  const isRed = card.suit === 'h' || card.suit === 'd';
  
  return (
    <div className={`
      relative w-24 h-36 bg-white rounded-lg shadow-xl border-2 border-gray-200 
      flex flex-col items-center justify-between p-2 select-none transform transition-transform hover:-translate-y-1
      ${className}
    `}>
      <div className="self-start text-2xl font-bold leading-none flex flex-col items-center">
        <span className={isRed ? 'text-red-600' : 'text-gray-900'}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="text-xl" />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
         <SuitIcon suit={card.suit} className="text-6xl" />
      </div>

      <div className="self-end text-2xl font-bold leading-none flex flex-col items-center transform rotate-180">
        <span className={isRed ? 'text-red-600' : 'text-gray-900'}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="text-xl" />
      </div>
    </div>
  );
};
