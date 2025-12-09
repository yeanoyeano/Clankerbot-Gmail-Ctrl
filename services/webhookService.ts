export const sendToGoogleChat = async (webhookUrl: string, text: string): Promise<void> => {
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
      // Try to parse error from Google Chat, but have a fallback.
      const errorData = await response.json().catch(() => ({ 
        error: { message: 'Failed to parse error response from Google Chat.' } 
      }));
      console.error('Google Chat API Error:', errorData);
      throw new Error(`Failed to send message. Status: ${response.status}. Message: ${errorData.error?.message || 'Unknown error.'}`);
    }
  } catch (error) {
    console.error('Error sending to Google Chat webhook:', error);
    if (error instanceof Error) {
        // Re-throw with a more user-friendly message
        throw new Error(`Network error or invalid webhook: ${error.message}`);
    }
    throw new Error('An unknown network error occurred while sending the message.');
  }
};
