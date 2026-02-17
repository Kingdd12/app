import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getGeminiCommentary = async (
  event: string, 
  player: string, 
  detail: string
): Promise<string> => {
  if (!ai) return "Gemini API Key missing! Enjoy the game!";

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are an energetic, extremely hype Ugandan Ludo commentator named "Uncle K". 
      The game is "Voxel Ludo Champions".
      
      Current Event: ${event}
      Player Involved: ${player}
      Details: ${detail}

      Your personality:
      - You use Ugandan English slang (e.g., "Eh!", "Bambi!", "Kati!", "Wueh!", "Ka-danger!", "Ssebo!").
      - You are very emotional about captures.
      - Keep it short (max 1-2 sentences).
      - If it's a capture, go wild.
      - If it's a 6, scream about "The SIX!".
      
      Output ONLY the commentary string.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "What a move!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The crowd goes wild!";
  }
};
