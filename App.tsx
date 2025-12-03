import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, BarChart2, Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { 
  Position, Hand, ActionType, UserStats, GameState 
} from './types';
import { POSITIONS, getCorrectAction } from './constants';
import { getRandomHand } from './pokerLogic';
import { CardDisplay } from './components/CardDisplay';
import { RangeChart } from './components/RangeChart';
import { getHandAnalysis } from './geminiService';

const App: React.FC = () => {
  // --- State ---
  const [position, setPosition] = useState<Position>('BTN');
  const [gameState, setGameState] = useState<GameState>({
    currentPosition: 'BTN',
    currentHand: null,
    feedback: null
  });
  const [stats, setStats] = useState<Record<Position, UserStats>>(() => {
    const initialStats: any = {};
    POSITIONS.forEach(p => {
      initialStats[p] = { correct: 0, total: 0, streak: 0, mistakes: [] };
    });
    return initialStats;
  });
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showRange, setShowRange] = useState(false);

  // --- Actions ---
  
  const generateNewHand = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentPosition: position, // Sync position
      currentHand: getRandomHand(),
      feedback: null
    }));
    setAiAnalysis('');
    setShowRange(false);
  }, [position]);

  // Initial Load
  useEffect(() => {
    generateNewHand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Position Change Handler
  const handlePositionChange = (newPos: Position) => {
    setPosition(newPos);
    // When changing position, generate new hand immediately for better flow
    setGameState(prev => ({
      ...prev,
      currentPosition: newPos,
      currentHand: getRandomHand(),
      feedback: null
    }));
    setAiAnalysis('');
    setShowRange(false);
  };

  const formatActionName = (act: ActionType, pos: Position) => {
    if (pos === 'BB' && act === 'Open') return '跟注';
    const map: Record<string, string> = { 'Fold': '弃牌', 'Open': '开池', '3-Bet': '3-Bet' };
    return map[act] || act;
  };

  const formatUserAction = (act: ActionType, pos: Position) => {
    if (pos === 'BB' && act === 'Open') return '跟注';
    const map: Record<string, string> = { 'Fold': '弃牌', 'Open': '开池', '3-Bet': '3-Bet' };
    return map[act] || act;
  };

  const handleDecision = (action: ActionType) => {
    if (!gameState.currentHand || gameState.feedback) return; // Prevent double clicking

    const correctAction = getCorrectAction(gameState.currentHand.display, position);
    const isCorrect = action === correctAction;
    
    // Update Stats
    setStats(prev => {
      const posStats = prev[position];
      const newMistakes = isCorrect ? posStats.mistakes : [
        {
            hand: gameState.currentHand!,
            position: position,
            userAction: action,
            correctAction: correctAction,
            timestamp: Date.now()
        },
        ...posStats.mistakes
      ].slice(0, 20); // Keep last 20 mistakes

      return {
        ...prev,
        [position]: {
          correct: posStats.correct + (isCorrect ? 1 : 0),
          total: posStats.total + 1,
          streak: isCorrect ? posStats.streak + 1 : 0,
          mistakes: newMistakes
        }
      };
    });

    // Set Feedback
    setGameState(prev => ({
      ...prev,
      feedback: {
        lastResult: isCorrect ? 'Correct' : 'Incorrect',
        message: isCorrect ? '回答正确！' : `回答错误。GTO 建议：${formatActionName(correctAction, position)}`,
        correctAction
      }
    }));
  };

  const requestAnalysis = async () => {
    if (!gameState.currentHand || !gameState.feedback) return;
    
    setIsLoadingAnalysis(true);
    const analysis = await getHandAnalysis(
      gameState.currentHand,
      position,
      gameState.feedback.correctAction!,
      null
    );
    setAiAnalysis(analysis);
    setIsLoadingAnalysis(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.feedback) {
        if (e.code === 'Space' || e.key === 'Enter') {
          generateNewHand();
        }
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'f': handleDecision('Fold'); break;
        case 'o': handleDecision('Open'); break;
        case 'r': handleDecision('3-Bet'); break; // R for Raise/3bet
        case '3': handleDecision('3-Bet'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, position, generateNewHand]);

  // --- Render Helpers ---

  const getAccuracy = () => {
    const s = stats[position];
    if (s.total === 0) return 0;
    return Math.round((s.correct / s.total) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* --- Sidebar (Controls & Stats) --- */}
      <aside className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-auto md:h-screen overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <BarChart2 className="w-6 h-6" />
            GTO 训练器
          </h1>
          <p className="text-xs text-slate-400 mt-1">翻前范围大师</p>
        </div>

        {/* Position Selector */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">选择位置</h3>
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => handlePositionChange(pos)}
                className={`
                  py-2 px-3 rounded text-sm font-medium transition-all
                  ${position === pos 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                `}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="p-6 border-t border-slate-700 flex-grow">
           <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">当前数据 ({position})</h3>
           
           <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
               <div className="text-2xl font-bold text-white">{getAccuracy()}%</div>
               <div className="text-xs text-slate-500">正确率</div>
             </div>
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
               <div className="text-2xl font-bold text-orange-400">{stats[position].streak}</div>
               <div className="text-xs text-slate-500">连对</div>
             </div>
           </div>

           {stats[position].mistakes.length > 0 && (
             <div className="mt-4">
               <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                 <AlertTriangle className="w-3 h-3" /> 最近错题
               </h4>
               <div className="space-y-2">
                 {stats[position].mistakes.slice(0, 5).map((m, idx) => (
                   <div key={idx} className="bg-slate-900/50 p-2 rounded text-xs flex justify-between items-center border border-slate-800">
                     <span className="font-mono text-emerald-400 font-bold">{m.hand.display}</span>
                     <span className="text-slate-400">
                       你选了 <span className="text-red-400">{formatUserAction(m.userAction, m.position)}</span>
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </aside>

      {/* --- Main Game Area --- */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* Header/Top Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase">当前场景</span>
               <span className="text-lg font-bold text-white flex items-center gap-2">
                 你的位置：<span className="text-emerald-400">{position}</span>
                 {position === 'BB' && <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">面对 BTN 开池</span>}
               </span>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowRange(!showRange)}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-slate-300 border border-slate-700 transition"
            >
              {showRange ? '隐藏范围' : '查看范围'}
            </button>
          </div>
        </header>

        {/* Game Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[500px]">
          
          {/* Poker Table Visual (Simplified) */}
          <div className="relative w-full max-w-2xl aspect-[2/1] bg-poker-table rounded-full border-8 border-poker-dark shadow-2xl mb-8 flex items-center justify-center">
            {/* Table Felt Texture/Gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-emerald-800 to-emerald-900 opacity-50 pointer-events-none"></div>
            
            {/* Community Cards (Empty for Preflop) or Chips */}
            <div className="absolute top-1/4 opacity-30 text-emerald-200 font-bold tracking-widest">
              TEXAS HOLD'EM
            </div>

            {/* Hand Display */}
            <div className="z-10 flex gap-4 transform translate-y-4 transition-all duration-500 ease-out">
              {gameState.currentHand && (
                <>
                  <CardDisplay card={gameState.currentHand.card1} className="transform -rotate-6 origin-bottom-right" />
                  <CardDisplay card={gameState.currentHand.card2} className="transform rotate-6 origin-bottom-left" />
                </>
              )}
            </div>

            {/* Position Badges on Table */}
            <div className="absolute inset-0">
               {POSITIONS.map((pos, i) => {
                 // Simple positioning logic around an ellipse
                 // 6 max: UTG, MP, CO, BTN, SB, BB
                 // Angles: roughly 60 deg apart
                 const isActive = position === pos;
                 const styles: any = {};
                 // Hardcoded positions for 6-max nice look
                 const tablePos = {
                   'SB': { bottom: '10%', right: '25%' },
                   'BB': { bottom: '10%', left: '25%' },
                   'UTG': { left: '5%', top: '40%' },
                   'MP': { left: '20%', top: '10%' },
                   'CO': { right: '20%', top: '10%' },
                   'BTN': { right: '5%', top: '40%' },
                 };
                 const pStyle = tablePos[pos];
                 
                 return (
                   <div 
                    key={pos}
                    style={pStyle}
                    className={`
                      absolute w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg transition-all
                      ${isActive 
                        ? 'bg-yellow-500 border-yellow-300 text-black scale-110 z-20 shadow-yellow-500/50' 
                        : 'bg-slate-800 border-slate-600 text-slate-400 opacity-70'}
                    `}
                   >
                     {pos}
                     {isActive && <div className="absolute -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500"></div>}
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Action Area */}
          <div className="w-full max-w-md space-y-4 z-20">
            
            {/* Feedback Toast */}
            {gameState.feedback ? (
              <div className={`
                p-4 rounded-xl border flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300
                ${gameState.feedback.lastResult === 'Correct' 
                  ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' 
                  : 'bg-red-900/80 border-red-500/50 text-red-100'}
              `}>
                <div className="flex items-center gap-3">
                  {gameState.feedback.lastResult === 'Correct' 
                    ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                    : <XCircle className="w-6 h-6 text-red-400" />
                  }
                  <div className="flex-1">
                    <p className="font-bold text-lg">{gameState.feedback.message}</p>
                    {gameState.feedback.lastResult === 'Incorrect' && (
                      <p className="text-sm opacity-80 mt-1">
                        手牌类型：{gameState.currentHand?.type} - {gameState.currentHand?.display}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={generateNewHand}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded font-semibold transition flex items-center justify-center gap-2"
                  >
                    下一手牌 <span className="text-xs opacity-60">(Space)</span>
                  </button>
                  
                  <button 
                    onClick={requestAnalysis}
                    disabled={isLoadingAnalysis}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 py-2 rounded font-semibold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingAnalysis ? '分析中...' : <><Brain className="w-4 h-4" /> AI 教练</>}
                  </button>
                </div>
                
                {aiAnalysis && (
                  <div className="bg-black/30 p-3 rounded text-sm text-indigo-100 mt-2 border-l-2 border-indigo-400">
                    {aiAnalysis}
                  </div>
                )}
              </div>
            ) : (
              // Decision Buttons
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleDecision('Fold')}
                  className="group relative h-16 bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-lg font-bold text-xl text-slate-200 transition-all"
                >
                  <span className="flex flex-col items-center">
                    弃牌
                    <span className="text-[10px] uppercase tracking-widest font-normal opacity-50 group-hover:opacity-100 transition">(F)</span>
                  </span>
                </button>
                
                <button
                  onClick={() => handleDecision('Open')}
                  className="group relative h-16 bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 rounded-lg font-bold text-xl text-white transition-all shadow-lg shadow-emerald-900/20"
                >
                   <span className="flex flex-col items-center">
                    {position === 'BB' ? '跟注' : '开池'}
                    <span className="text-[10px] uppercase tracking-widest font-normal opacity-50 group-hover:opacity-100 transition">(O)</span>
                  </span>
                </button>
                
                <button
                  onClick={() => handleDecision('3-Bet')}
                  className={`
                    group relative h-16 border-b-4 active:border-b-0 active:translate-y-1 rounded-lg font-bold text-xl text-white transition-all shadow-lg
                    ${position === 'BB' 
                        ? 'bg-red-600 hover:bg-red-500 border-red-800 shadow-red-900/20' 
                        : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-800 shadow-indigo-900/20' // 3-bet aesthetic
                    }
                  `}
                >
                   <span className="flex flex-col items-center">
                    3-Bet
                    <span className="text-[10px] uppercase tracking-widest font-normal opacity-50 group-hover:opacity-100 transition">(R)</span>
                  </span>
                </button>
              </div>
            )}
            
            <div className="text-center text-xs text-slate-500 mt-4">
              快捷键：F (弃牌), O (开池), R (3-Bet)
            </div>
          </div>
        </div>

        {/* Range Chart Overlay (Bottom or Modal) */}
        {showRange && (
           <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-start justify-center">
                <div className="flex-1">
                   <h2 className="text-2xl font-bold text-white mb-2">{position} 范围策略</h2>
                   <p className="text-slate-400 text-sm mb-4">
                     {position === 'BB' 
                       ? "防守对抗按钮位开池。绿色 = 价值 3-Bet，黄色 = 跟注，灰色 = 弃牌。" 
                       : "率先加注 (RFI) 范围。绿色 = 开池，灰色 = 弃牌。"}
                   </p>
                   <RangeChart position={position} highlightHand={gameState.currentHand?.display} />
                </div>
                <div className="flex flex-col gap-4 mt-8 md:mt-0">
                   <div className="bg-slate-800 p-4 rounded border border-slate-700 w-64">
                      <h3 className="font-bold text-emerald-400 mb-2">图例</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 bg-emerald-600"></div>
                           <span>{position === 'BB' ? '价值 3-Bet' : '开池 / 加注'}</span>
                        </div>
                        {position === 'BB' && (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-500"></div> 
                                <span>注：BB 跟注范围在简易图表中暂未显示。</span>
                            </div>
                        )}
                         <div className="flex items-center gap-2">
                           <div className="w-4 h-4 bg-gray-800 border border-gray-600"></div>
                           <span>弃牌</span>
                        </div>
                         <div className="flex items-center gap-2">
                           <div className="w-4 h-4 bg-yellow-400 animate-pulse"></div>
                           <span>当前手牌</span>
                        </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => setShowRange(false)}
                     className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-bold"
                   >
                     关闭图表
                   </button>
                </div>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;