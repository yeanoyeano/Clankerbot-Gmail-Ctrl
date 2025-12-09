import { GoogleGenAI, Type } from "@google/genai";

export const generateReplies = async (chatMessage: string, instructions: string, count: number): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Here is the message to reply to:\n\n"""\n${chatMessage}\n"""`;

  if (count === 1) {
    const systemInstruction = instructions
      ? `You are a helpful assistant in a group chat. Your task is to write a reply. Follow these instructions for the reply: ${instructions}`
      : `You are a helpful assistant in a group chat. Your task is to write a concise and professional reply.`;

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
    const systemInstruction = `You are a helpful assistant in a group chat. Your task is to write ${count} different and varied replies to a message.
      ${instructions ? `Follow these general instructions for all replies: ${instructions}` : 'The replies should be concise and professional.'}
      Return the replies as a JSON object with a single key "replies" which is an array of strings. Each string in the array is a distinct reply.`;

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
                  description: 'A single, distinct reply text.'
                },
                description: `An array of exactly ${count} different reply strings.`
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
      if (error instanceof SyntaxError) {
        throw new Error("Failed to parse Gemini's JSON response.");
      }
      throw new Error("Failed to get response from Gemini.");
    }
  }
};
