import React from 'react';
import { getGridData, RFI_RANGES, isHandInRange } from '../constants';
import { Position, Rank } from '../types';

interface RangeChartProps {
  position: Position;
  highlightHand?: string | null;
}

export const RangeChart: React.FC<RangeChartProps> = ({ position, highlightHand }) => {
  const grid = getGridData();
  const range = RFI_RANGES[position] || [];

  // Special coloring for BB logic (Simplified for visualization as "Defense")
  // If BB, we just show value 3bets as Green for now, others neutral, as BB RFI doesn't exist.
  const isBB = position === 'BB';

  return (
    <div className="w-full max-w-lg aspect-square bg-gray-900 p-1 rounded-lg border border-gray-700">
      <div className="grid grid-cols-13 gap-[1px] h-full w-full bg-gray-800">
        {grid.map((cell) => {
          const inRange = isBB 
            ? ['AA','KK','QQ','JJ','TT','AKs','AKo'].includes(cell.hand) // Mock BB value range
            : isHandInRange(cell.hand, range);
            
          const isHighlight = highlightHand === cell.hand;
          
          let bgColor = 'bg-gray-800';
          let textColor = 'text-gray-500';

          if (inRange) {
            bgColor = 'bg-emerald-600';
            textColor = 'text-white';
          } else if (cell.type === 'Pair') {
            bgColor = 'bg-slate-700'; // Slight highlight for pairs
          }
          
          if (isHighlight) {
            bgColor = 'bg-yellow-400 animate-pulse';
            textColor = 'text-black font-bold';
          }

          return (
            <div
              key={cell.hand}
              className={`
                ${bgColor} ${textColor}
                text-[0.55rem] sm:text-[0.65rem] flex items-center justify-center
                cursor-default select-none
                hover:opacity-80 transition-opacity
              `}
              title={cell.hand}
            >
              {cell.hand}
            </div>
          );
        })}
      </div>
    </div>
  );
};
