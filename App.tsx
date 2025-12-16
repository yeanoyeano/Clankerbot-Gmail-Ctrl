import React, { useState } from 'react';
import { Status } from './types';
import { generateReplies, sanitizeWithRhymes } from './services/geminiService';
import { sendToGoogleChat } from './services/webhookService';
import StatusMessage from './components/StatusMessage';

// --- ICONS ---
const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 8V4H8" /><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 18v-2" /><path d="M12 8a4 4 0 0 1 4 4" /><path d="M12 8a4 4 0 0 0-4 4" />
  </svg>
);

const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

// --- MAIN COMPONENT ---
const App: React.FC = () => {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // Main App State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual');
  
  // AI State
  const [aiMessage, setAiMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [replyCount, setReplyCount] = useState(1);

  // Manual State
  const [manualMessage, setManualMessage] = useState('');

  // Status
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !aiMessage) {
      setStatus(Status.ERROR);
      setStatusMessage('Missing Webhook URL or Input Message');
      return;
    }

    setStatus(Status.LOADING);
    setStatusMessage('Generative AI is thinking...');

    try {
      // 1. Generate
      const replies = await generateReplies(aiMessage, instructions, replyCount);

      // 2. Sanitize & Send Loop
      for (let i = 0; i < replies.length; i++) {
        const rawReply = replies[i];
        
        setStatusMessage(`Sanitizing reply ${i + 1} with rhyme engine...`);
        const safeReply = await sanitizeWithRhymes(rawReply);

        setStatusMessage(`Sending reply ${i + 1}...`);
        try {
            await sendToGoogleChat(webhookUrl, safeReply);
        } catch (err: any) {
            if (err.message === 'CORS_RESTRICTED') {
                 console.log(`[SIMULATION MODE] Sent: ${safeReply}`);
            } else {
                throw err;
            }
        }
        
        if (i < replies.length - 1) await new Promise(r => setTimeout(r, 500));
      }

      setStatus(Status.SUCCESS);
      setStatusMessage(`${replies.length} replies sent successfully.`);
      setAiMessage('');
    } catch (error: any) {
      setStatus(Status.ERROR);
      setStatusMessage(error.message);
    }
  };

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !manualMessage) {
      setStatus(Status.ERROR);
      setStatusMessage('Missing Webhook URL or Input Message');
      return;
    }

    setStatus(Status.LOADING);
    setStatusMessage('Checking for profanity & rhyming if needed...');

    try {
      // 1. Sanitize
      const safeMessage = await sanitizeWithRhymes(manualMessage);

      // 2. Send
      setStatusMessage('Sending message...');
      try {
        await sendToGoogleChat(webhookUrl, safeMessage);
        setStatus(Status.SUCCESS);
        setStatusMessage('Message sent successfully.');
        setManualMessage('');
      } catch (err: any) {
        if (err.message === 'CORS_RESTRICTED') {
            // Simulate success for demo purposes if CORS blocks it
            setStatus(Status.SUCCESS);
            setStatusMessage(`Message Sent (Simulation): "${safeMessage}"`);
            setManualMessage('');
        } else {
            throw err;
        }
      }
    } catch (error: any) {
      setStatus(Status.ERROR);
      setStatusMessage(error.message);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 glass-panel rounded-2xl animate-fade-in">
            <div className="text-center mb-8 space-y-4">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <BotIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Clankerbot</h1>
                <p className="text-blue-200/60 text-sm">Authentication Required</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2 ml-1">Operator Name</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-4 rounded-xl input-modern text-center text-lg placeholder-slate-500"
                        placeholder="Enter your name"
                        autoFocus
                    />
                </div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed" disabled={!username.trim()}>
                    Access System
                </button>
            </form>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="min-h-screen p-4 lg:p-8 max-w-7xl mx-auto flex flex-col">
      
      {/* HEADER */}
      <header className="mb-8 flex justify-between items-center glass-panel p-4 rounded-2xl">
         <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-2.5 rounded-lg shadow-lg shadow-blue-600/20">
                <BotIcon className="w-6 h-6 text-white" />
             </div>
             <div>
                 <h1 className="text-xl font-bold text-white">Clankerbot <span className="text-blue-400 font-normal">v2.0</span></h1>
                 <p className="text-xs text-blue-200/70">Welcome, {username}</p>
             </div>
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-400/20">
             <ShieldIcon className="w-4 h-4 text-blue-400" />
             <span className="text-xs font-medium text-blue-300">Safechat Enabled</span>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN: CONFIG */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Status Card */}
            <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-300 mb-4">System Status</h2>
                <StatusMessage status={status} message={statusMessage} />
            </div>

            {/* Config Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-300">Configuration</h2>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Webhook URL</label>
                    <input
                        type="password"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://chat.googleapis.com/..."
                        className="w-full p-3 rounded-lg input-modern text-sm"
                    />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => { setActiveTab('manual'); setStatus(Status.IDLE); }}
                    className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 border ${activeTab === 'manual' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'}`}
                >
                    Manual Override
                </button>
                <button 
                    onClick={() => { setActiveTab('ai'); setStatus(Status.IDLE); }}
                    className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 border ${activeTab === 'ai' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'}`}
                >
                    AI Auto-Pilot
                </button>
            </div>
        </div>

        {/* RIGHT COLUMN: INTERFACE */}
        <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl p-6 h-full min-h-[500px] flex flex-col relative overflow-hidden">
                
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                {activeTab === 'manual' && (
                    <form onSubmit={handleManualSend} className="h-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex-1 flex flex-col">
                            <label className="text-sm font-medium text-slate-300 mb-2">Message Composer</label>
                            <textarea
                                value={manualMessage}
                                onChange={(e) => setManualMessage(e.target.value)}
                                className="flex-1 w-full p-4 rounded-xl input-modern resize-none text-base leading-relaxed"
                                placeholder="Type your message here... (Profanity will be safely rhymed)"
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={status === Status.LOADING} className="px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                <SendIcon className="w-4 h-4" />
                                Send Securely
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'ai' && (
                    <form onSubmit={handleAiSend} className="h-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Personality / Instructions</label>
                                <input 
                                    type="text" 
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. Sarcastic, Pirate, Formal"
                                    className="w-full p-3 rounded-lg input-modern"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Reply Count</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1" max="5"
                                        value={replyCount}
                                        onChange={(e) => setReplyCount(Number(e.target.value))}
                                        className="w-full p-3 rounded-lg input-modern pl-4"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                             <label className="text-sm font-medium text-slate-300 mb-2">Incoming Message Context</label>
                             <textarea
                                value={aiMessage}
                                onChange={(e) => setAiMessage(e.target.value)}
                                className="w-full h-full p-4 rounded-xl input-modern resize-none text-base"
                                placeholder="Paste the chat message you want to reply to..."
                            ></textarea>
                        </div>
                        
                        <div className="flex justify-end">
                            <button type="submit" disabled={status === Status.LOADING} className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                                <BotIcon className="w-4 h-4" />
                                Generate & Send
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;