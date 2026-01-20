import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Mail, ShieldAlert, BarChart3, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useMutation, useAction } from "convex/react";
import { api } from "../../../insurance-agent/insurance-agent-backend/convex/_generated/api";

const AgentInterface = () => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'agent', content: "Hello! I'm Agent Insure. I can analyze your emails, assess risk, or answer policy questions. How can I help today?", type: 'text' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Convex Mutations (Using the backend we just set up)
    // Note: These hook calls will only work once the ConvexProvider is wrapped in App.jsx
    // For now, we stub them to not crash the build if not yet wrapped, but implementation assumes wrapper exists.
    const sendMessage = useAction(api.mcp.chat.chat) || (() => Promise.resolve({ reply: "AI Connection Pending..." }));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSync = async () => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'agent',
            content: "Initiating secure Gmail synchronization...",
            type: 'text'
        }]);

        try {
            // Trigger the Google Auth flow
            // Note: In a real implementation, this would redirect to Google's OAuth URL
            // For this demo, we'll simulate the successful sync
            setLoading(true);
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'agent',
                    content: "✅ Sync Complete! I've analyzed your last 30 days of emails. I found 2 policy documents from HDFC Life and ICICI Lombard. Your estimated annual premium is ₹45,000. Would you like a risk assessment based on this?",
                    type: 'success'
                }]);
                setLoading(false);
            }, 2500);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'agent',
                content: "Sync failed. Please try again.",
                type: 'error'
            }]);
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', content: input, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Call Convex Backend
            const response = await sendMessage({
                message: input,
                user_id: "demo-user-123" // In production, get this from auth context
            });

            const agentMsg = {
                id: Date.now() + 1,
                role: 'agent',
                content: response.reply || "I processed that request.",
                type: 'text'
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: "I'm having trouble connecting to my cognitive engine right now. Please check my configuration.",
                type: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-line overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-line bg-canvas/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-serif text-lg font-bold text-ink-900">Agent Insure</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Gemini 2.5 Flash Connected</span>
                        </div>
                    </div>
                </div>

                {/* Capabilities Chips */}
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={handleSync}
                        className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                        <Mail className="w-3 h-3" /> Email Sync
                    </button>
                    <div className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm">
                        <ShieldAlert className="w-3 h-3" /> Risk Analysis
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm">
                        <BarChart3 className="w-3 h-3" /> Policy Audit
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex gap-4 max-w-[80%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                            msg.role === 'user' ? "bg-ink-900 text-white" : "bg-white border border-line text-indigo-600"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>

                        <div className={clsx(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-ink-900 text-white rounded-tr-none"
                                : "bg-white border border-line text-ink-700 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-white border border-line text-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-line px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                            <span className="text-xs font-medium text-ink-400">Processing with Gemini...</span>
                        </div>
                    </div>
                )}

                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-line">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about a policy, risk, or sync emails..."
                        className="w-full bg-canvas border border-line pl-4 pr-12 py-4 rounded-xl text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-ink-300 uppercase tracking-widest font-bold">
                        AI can make mistakes. Verify important insurance data.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default AgentInterface;
