
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-image-preview';

export const generateWallpaper = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string> => {
  // Create a new instance right before the call to ensure the latest API key is used.
  // Using process.env.API_KEY directly as per strict requirement.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
          aspectRatio: "9:16",
          imageSize: size
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("이미지 데이터를 찾을 수 없습니다.");
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  // Creating a new instance right before the call to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
    });
    return true;
  } catch (error) {
    return false;
  }
};
