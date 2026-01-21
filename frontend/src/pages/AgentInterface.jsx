import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Mail, ShieldAlert, BarChart3, MessageSquare, FileText } from 'lucide-react';
import { clsx } from 'clsx';


const AgentInterface = () => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'agent', content: "Hello! I'm Agent Insure. I can analyze your emails, assess risk, or answer policy questions. How can I help today?", type: 'text' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Helper to call Convex HTTP Actions
    const callConvexHttp = async (endpoint, body = {}) => {
        const convexUrl = import.meta.env.VITE_CONVEX_URL || "";
        const baseUrl = convexUrl.replace(".cloud", ".site"); // Ensure we hit the HTTP actions
        const token = localStorage.getItem('agent_session_token');

        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response.json();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Handle OAuth callback
        const params = new URLSearchParams(window.location.search);
        if (params.get('sync') === 'success') {
            const token = params.get('auth_token');
            if (token) {
                localStorage.setItem('agent_session_token', token);
            }

            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'agent',
                content: "✅ Sync Complete! I've securely connected to your Gmail. Now scanning your emails to build your profile...",
                type: 'success'
            }]);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Trigger Real Sync and Analysis
            const syncAndAnalyze = async () => {
                try {
                    // 1. Trigger Gmail Sync
                    await callConvexHttp('/gmail/sync');

                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        role: 'agent',
                        content: "Emails synced. Generating your insurance persona...",
                        type: 'text'
                    }]);

                    // 2. Generate Persona
                    const personaResult = await callConvexHttp('/mcp/persona');
                    const { persona } = personaResult;

                    const summary = `Analysis Done: based on ${personaResult.reasoning || 'your emails'}.
                    Risk Profile: ${persona.risk_profile}
                    Key Concerns: ${persona.key_concerns?.join(", ") || 'None detected'}
                    Est. Premium: ${persona.estimated_annual_premium || 'Unknown'}`;

                    setMessages(prev => [...prev, {
                        id: Date.now() + 2,
                        role: 'agent',
                        content: summary,
                        type: 'success'
                    }]);
                } catch (error) {
                    console.error("Analysis Failed:", error);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 3,
                        role: 'agent',
                        content: `Analysis failed: ${error.message}. Please try syncing again.`,
                        type: 'error'
                    }]);
                }
            };

            syncAndAnalyze();
        }
    }, []);

    const handleRiskAnalysis = async () => {
        setLoading(true);
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'agent',
            content: "Analyzing your risk profile based on your emails and claims history...",
            type: 'text'
        }]);

        try {
            const result = await callConvexHttp('/mcp/risk');
            const { risk_score, risk_level, mitigation_strategies } = result;

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `Risk Analysis Complete. Score: ${risk_score}/100 (${risk_level}). \n\nTip: ${mitigation_strategies[0] || "Review your coverage."}`,
                type: 'success'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `Risk analysis failed: ${error.message}`,
                type: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePolicyAudit = async () => {
        setLoading(true);
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'agent',
            content: "Auditing your policy documents for coverage gaps...",
            type: 'text'
        }]);

        try {
            const result = await callConvexHttp('/mcp/policy');
            const { policies, recommendations } = result;

            const policyCount = policies.length;
            const rec = recommendations[0] || "No specific recommendations found.";

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `Audit Complete. Found ${policyCount} active policies. \n\nRecommendation: ${rec}`,
                type: 'success'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `Policy audit failed: ${error.message}`,
                type: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadAndSendReport = async () => {
        try {
            setLoading(true);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'agent',
                content: "Generating and emailing your PDF report...",
                type: 'text'
            }]);

            // 1. Generate PDF (Client Side)
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.text("InsureOS Analysis Report", 20, 20);

            doc.setFontSize(12);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
            doc.line(20, 35, 190, 35);

            let y = 50;
            messages.forEach(msg => {
                if (y > 270) { doc.addPage(); y = 20; }
                const role = msg.role === 'agent' ? "Agent:" : "You:";
                doc.setFont("helvetica", "bold");
                doc.text(role, 20, y);

                doc.setFont("helvetica", "normal");
                const splitText = doc.splitTextToSize(msg.content, 160);
                doc.text(splitText, 35, y);

                y += (splitText.length * 7) + 10;
            });

            // Download Locally
            doc.save("InsureOS_Report.pdf");

            // 2. Send via Email (Backend)
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            // Assuming we have the user's email from somewhere, or prompting roughly. 
            // For now, let's assume the user's email is linked to the session and backend knows it from 'gmail sync',
            // or we ask the user. Since backend has the token, it *can* send TO itself easily.
            // Let's rely on backend extracting 'me' email or just sending to 'me' alias.

            // Wait, sendReportAction expects userEmail. mcp/report endpoint?
            // Let's decode the token or just send to "me" (Gmail API allows sending to self easily or we hardcode the To as the authorized user).
            // Actually, for better UX, let's fetch 'me' first? 
            // Simplified: The backend sendReportAction sends to `me` if no email provided? 
            // Let's update backend logic later if needed, but for now passing a placeholder or extracting from token if possible.
            // Re-reading sendReport.ts: It takes `userEmail`. 
            // I'll fetch /me first to get email.

            const meRes = await callConvexHttp('/me');
            const userEmail = meRes.email;

            await callConvexHttp('/mcp/report', {
                pdfBase64,
                userEmail
            });

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `✅ Report downloaded and sent to ${userEmail}!`,
                type: 'success'
            }]);

        } catch (error) {
            console.error("Report Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: `Failed to process report: ${error.message}`,
                type: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = () => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'agent',
            content: "Redirecting you to Google for secure authorization...",
            type: 'text'
        }]);

        setTimeout(() => {
            const convexUrl = import.meta.env.VITE_CONVEX_URL || "";
            const authUrl = convexUrl.includes("convex.cloud")
                ? convexUrl.replace("convex.cloud", "convex.site") + "/auth/google"
                : "https://third-fly-393.convex.site/auth/google";
            window.location.href = authUrl;
        }, 1000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', content: input, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Call Convex HTTP Endpoint for Chat
            const response = await callConvexHttp('/mcp/chat', {
                message: input,
                history: messages.map(m => ({ role: m.role, content: m.content }))
            });

            const agentMsg = {
                id: Date.now() + 1,
                role: 'agent',
                content: response.agent_response || JSON.stringify(response),
                type: 'text'
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: "I'm having trouble connecting to my cognitive engine right now. Please ensure you have synced your email first.",
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
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Llama 3 (Groq) Connected</span>
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
                    <button
                        onClick={handleRiskAnalysis}
                        className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                        <ShieldAlert className="w-3 h-3" /> Risk Analysis
                    </button>
                    <button
                        onClick={handlePolicyAudit}
                        className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                        <BarChart3 className="w-3 h-3" /> Policy Audit
                    </button>
                    <button
                        onClick={handleDownloadAndSendReport}
                        className="px-3 py-1 rounded-full bg-white border border-line flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                        <FileText className="w-3 h-3" /> Report
                    </button>
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
                            <span className="text-xs font-medium text-ink-400">Processing...</span>
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
