import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to prevent immediate crash, handle error gracefully later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const sendMessageToGemini = async (
  message: string,
  contextData: string
): Promise<string> => {
  if (!ai) {
    return "配置错误：未找到 API Key。请确保环境变量 API_KEY 已正确设置。";
  }

  try {
    // Use gemini-3-flash-preview for optimal performance on text tasks
    const model = 'gemini-3-flash-preview'; 
    
    const combinedPrompt = `
      ${SYSTEM_PROMPT}
      
      CURRENT DASHBOARD DATA CONTEXT:
      ${contextData}

      USER QUERY:
      ${message}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: combinedPrompt,
    });

    return response.text || "数据已处理，但未能生成文本回复。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `连接 AI 服务时出错: ${error.message || '请稍后再试'}。`;
  }
};