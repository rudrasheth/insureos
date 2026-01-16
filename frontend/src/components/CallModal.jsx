import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, PhoneOff, User, Volume2 } from 'lucide-react';
import { getPoliciesByCustomer } from '../api/client';

const CallModal = ({ customer, onClose }) => {
    const [status, setStatus] = useState('connecting'); // connecting, connected, speaking, ended
    const [script, setScript] = useState('');
    const [duration, setDuration] = useState(0);
    const synth = useRef(window.speechSynthesis);

    // Timer
    useEffect(() => {
        let interval;
        if (status === 'connected' || status === 'speaking') {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Main Logic
    useEffect(() => {
        const startCall = async () => {
            // 1. Simulate Connection Ringing
            await new Promise(r => setTimeout(r, 1500));
            setStatus('connected');

            // 2. Fetch Data
            try {
                const res = await getPoliciesByCustomer(customer.id);
                const policies = res.data;

                // 3. Generate concise script
                const totalPremium = policies.reduce((sum, p) => sum + p.premiumAmount, 0);
                const activeCount = policies.filter(p => p.status === 'active').length;

                let text = `Hello. This is your Insure-O-S briefing for client, ${customer.name}. `;

                if (policies.length === 0) {
                    text += `This client currently has no active policies on file. They are located in ${customer.city}. You might consider proposing a new Life or Health insurance plan.`;
                } else {
                    text += `They currently have ${activeCount} active contracts with a total annual premium value of ${totalPremium.toLocaleString()} rupees. `;
                    text += `Their most recent policy is a ${policies[0].policyType} plan. `;
                    text += `They are based in ${customer.city}. Relationship status is healthy.`;
                }

                setScript(text);
                setStatus('speaking');

                // 4. Speak
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9; // Slightly slower, more professional
                utterance.pitch = 1;

                // Optional: Select a better voice
                const voices = synth.current.getVoices();
                const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.onend = () => {
                    setStatus('connected'); // Silent after speaking
                };

                synth.current.speak(utterance);

            } catch (err) {
                console.error(err);
                const errorText = "I apologize. I am unable to retrieve the policy details at this moment.";
                const utterance = new SpeechSynthesisUtterance(errorText);
                synth.current.speak(utterance);
            }
        };

        startCall();

        return () => {
            synth.current.cancel(); // Stop talking if closed
        };
    }, [customer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMicClick = () => {
        // Simple Speech Recognition Check
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition isn't supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();

        setStatus('connecting'); // Show listening state visually

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Heard:", transcript);

            // Simple AI Logic (Rule Based)
            let reply = "I'm sorry, I didn't catch that.";

            if (transcript.includes('premium') || transcript.includes('cost') || transcript.includes('much')) {
                // Calculate premium again or use saved state (simplified here)
                reply = "The total annual premium for this client is calculated based on their active policies. Please refer to the dashboard for the exact figure.";
            } else if (transcript.includes('status') || transcript.includes('active')) {
                reply = "This client has an active partnership status.";
            } else if (transcript.includes('hello') || transcript.includes('hi')) {
                reply = "Hello there. How can I assist you with this policy?";
            } else if (transcript.includes('thank')) {
                reply = "You are very welcome.";
            }

            // Speak Response
            const utterance = new SpeechSynthesisUtterance(reply);
            utterance.rate = 0.9;
            utterance.onend = () => setStatus('connected');

            setScript(reply);
            setStatus('speaking');
            synth.current.speak(utterance);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setStatus('connected');
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm bg-[#1c1c1e] rounded-[40px] shadow-2xl overflow-hidden border border-white/10 relative h-[600px] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 pt-12">
                    <div className="w-8"></div> {/* Spacer */}
                    <div className="text-white/50 text-xs font-medium tracking-widest uppercase">InsureOS Intelligence</div>
                    <div className="w-8"></div> {/* Spacer */}
                </div>

                {/* Profile */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-ink-900 to-ink-500 p-[2px] mb-6 relative">
                        <div className="w-full h-full rounded-full bg-[#1c1c1e] p-1">
                            <img
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${customer.name}`}
                                alt="Avatar"
                                className="w-full h-full rounded-full bg-white"
                            />
                        </div>
                        {status === 'speaking' && (
                            <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-ping"></div>
                        )}
                    </div>

                    <h2 className="text-2xl font-serif text-white font-medium mb-2">{customer.name}</h2>

                    {status === 'connecting' && <div className="text-white/50 animate-pulse">Connecting...</div>}
                    {status === 'speaking' && <div className="text-accent font-medium">Briefing in progress...</div>}
                    {status === 'connected' && <div className="text-white/50">{formatTime(duration)}</div>}

                    {/* Audio Visualizer Mock */}
                    {status === 'speaking' && (
                        <div className="flex gap-1 h-8 items-center mt-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: Math.random() * 24 + 8 + 'px', animationDelay: i * 0.1 + 's' }}></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subtitles (Optional) */}
                {status === 'speaking' && (
                    <div className="px-8 text-center mb-8 h-20 flex items-center justify-center">
                        <p className="text-white/60 text-sm font-medium leading-relaxed line-clamp-3">
                            "{script}"
                        </p>
                    </div>
                )}

                {/* Controls */}
                <div className="bg-[#2c2c2e] p-8 pb-12 rounded-t-[40px] flex justify-around items-center">
                    <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                        <Volume2 className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-all scale-100 active:scale-95"
                    >
                        <PhoneOff className="w-8 h-8 fill-current" />
                    </button>
                    <button
                        onClick={handleMicClick}
                        className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors active:bg-accent/20"
                    >
                        <Mic className="w-6 h-6" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CallModal;
