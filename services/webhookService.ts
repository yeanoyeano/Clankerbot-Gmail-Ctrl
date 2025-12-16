export const sendToGoogleChat = async (webhookUrl: string, text: string): Promise<boolean> => {
  if (!webhookUrl) {
    throw new Error("Webhook URL is not configured.");
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error ${response.status}: ${errorData.error?.message || 'Check URL'}`);
    }
    return true;
  } catch (error) {
    console.error('Webhook fetch failed (likely CORS):', error);
    
    // Attempt no-cors fallback if the standard one fails. 
    // Note: Google Chat likely won't accept this because it needs Content-Type json, 
    // but it's the only browser-based attempt left.
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' }, // Browser strips this in no-cors
            body: JSON.stringify({ text })
        });
        // If no-cors doesn't throw, we assume it *might* have sent, 
        // but we can't verify status.
        // We will throw anyway to let the UI show the "Simulation" message
        // because we can't be sure.
        throw new Error("CORS_RESTRICTED");
    } catch (innerError) {
        throw new Error("CORS_RESTRICTED");
    }
  }
};