
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateWallpaper = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `High resolution, aesthetic, professional smartphone wallpaper, 9:16 aspect ratio. Theme: ${prompt}. Cinematic lighting, detailed textures, high quality artistic render. No text, no watermarks.`
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("이미지 데이터를 찾을 수 없습니다.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
