import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sanitizeWithRhymes = async (text: string): Promise<string> => {
  const ai = getAiClient();
  // Prompt specifically for the rhyming safechat logic
  const prompt = `Task: Review the following text for any offensive language, profanity, or toxic content. 
  If found, replace ONLY the offensive words with a harmless, rhyming alternative (e.g., "hell" becomes "bell", "sh*t" becomes "kit").
  The sentence structure should remain exactly the same. 
  If the text is already safe, return it exactly as is.
  
  Text to review: "${text}"
  
  Return ONLY the final text string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.warn("Sanitization failed, returning original text", error);
    return text; // Fallback to original if AI fails
  }
};

export const generateReplies = async (chatMessage: string, instructions: string, count: number): Promise<string[]> => {
  const ai = getAiClient();

  const prompt = `Here is the message to reply to:\n\n"""\n${chatMessage}\n"""`;

  if (count === 1) {
    const systemInstruction = instructions
      ? `You are a helpful assistant. Instructions: ${instructions}. IMPORTANT: Ensure your reply is clean. If you must use a strong word, rhyme it with a safe word instead.`
      : `You are a helpful assistant. Write a concise reply. Ensure it is clean/safe.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return [response.text];
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw new Error("Failed to get response from Gemini.");
    }
  } else {
    const systemInstruction = `You are a helpful assistant. Write ${count} distinct replies.
      ${instructions ? `Instructions: ${instructions}` : 'Keep it professional.'}
      IMPORTANT: All replies must be safe for work. Rhyme any potential profanity with safe words.
      Return JSON: { "replies": ["..."] }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replies: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: ['replies'],
          },
        },
      });
      
      const responseText = response.text.trim();
      const result = JSON.parse(responseText);

      if (result && Array.isArray(result.replies)) {
        return result.replies;
      } else {
        throw new Error("Gemini returned an invalid JSON structure.");
      }
    } catch (error) {
      console.error("Gemini API call failed or JSON parsing failed:", error);
      throw new Error("Failed to get response from Gemini.");
    }
  }
};