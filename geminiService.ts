import { GoogleGenAI } from "@google/genai";
import { Position, Hand, ActionType } from './types';

// Helper to get the AI instance
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getHandAnalysis = async (
  hand: Hand,
  position: Position,
  correctAction: ActionType,
  userAction: ActionType | null
): Promise<string> => {
  try {
    const ai = getAI();
    
    const prompt = `
      你是一位世界级的德州扑克教练，专注于 GTO 翻前 6 人桌现金局策略。
      
      场景：
      - 位置：${position}
      - 手牌：${hand.display}
      - 正确的 GTO 行动：${correctAction}
      ${userAction ? `- 用户行动：${userAction}` : ''}
      
      请简明扼要地（最多3句话）解释为什么这是正确的行动。
      关注范围连接性、权益实现、阻断牌或位置劣势等概念。
      不要写通用的开场白，直接讲策略。请用中文回答。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法获取分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 教练当前不可用，请检查您的 API 密钥。";
  }
};