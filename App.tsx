import React, { useState } from 'react';
import { Status } from './types';
import { generateReplies } from './services/geminiService';
import { sendToGoogleChat } from './services/webhookService';
import StatusMessage from './components/StatusMessage';

const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 8V4H8" />
    <rect x="4" y="12" width="16" height="8" rx="2" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M12 18v-2" />
    <path d="M12 8a4 4 0 0 1 4 4" />
    <path d="M12 8a4 4 0 0 0-4 4" />
  </svg>
);

const App: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [replyCount, setReplyCount] = useState(1);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerateAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !message) {
      setStatus(Status.ERROR);
      setStatusMessage('Webhook URL and message cannot be empty.');
      return;
    }

    setStatus(Status.LOADING);
    const replyText = replyCount > 1 ? 'replies' : 'reply';
    setStatusMessage(`Generating ${replyCount} ${replyText} with Gemini...`);

    try {
      const replies = await generateReplies(message, instructions, replyCount);
      
      if (!replies || replies.length === 0) {
          throw new Error("Gemini returned no replies.");
      }

      for (let i = 0; i < replies.length; i++) {
        setStatusMessage(`Sending reply ${i + 1} of ${replies.length} to Google Chat...`);
        await sendToGoogleChat(webhookUrl, replies[i]);
         // Add a small delay between messages to avoid rate limiting
        if (i < replies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setStatus(Status.SUCCESS);
      setStatusMessage(`Successfully sent ${replies.length} ${replies.length > 1 ? 'replies' : 'reply'}!`);
      setMessage(''); // Clear message input on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setStatus(Status.ERROR);
      setStatusMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
            <BotIcon className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Gemini Google Chat Smart Reply</h1>
            <p className="text-gray-400 mt-2">
                Paste a message from Google Chat, and Gemini will generate and send a reply via your webhook.
            </p>
        </div>

        <form onSubmit={handleGenerateAndSend} className="space-y-6">
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Google Chat Webhook URL
            </label>
            <input
              id="webhookUrl"
              type="password"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Enter your webhook URL here"
              className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="replyCount" className="block text-sm font-medium text-gray-300 mb-2">
              Number of Replies
            </label>
            <input
              id="replyCount"
              type="number"
              value={replyCount}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setReplyCount(isNaN(value) ? 1 : Math.max(1, Math.min(5, value)));
              }}
              min="1"
              max="5"
              className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
              Reply Instructions <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., 'Make it funny and use emojis.' or 'Write a 3 paragraph detailed explanation.'"
              rows={3}
              className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
              Message to Reply To
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste the message you want to reply to..."
              rows={6}
              className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === Status.LOADING}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
          >
            Generate & Send {replyCount > 1 ? `${replyCount} Replies` : 'Reply'}
          </button>
        </form>

        <div className="mt-6 min-h-[50px]">
            <StatusMessage status={status} message={statusMessage} />
        </div>
        
      </div>
    </div>
  );
};

export default App;
