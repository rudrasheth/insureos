import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../api/client';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await login(formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('agent_session_token', data.token); // Sync for Agent
            localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
            toast.success('System Access Granted');
            navigate('/agent');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 relative overflow-hidden">

            {/* Ambient Background Animation - Enhanced */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Moving Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ink-900/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-orange-200/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 bg-white/50 backdrop-blur-xl border border-white/40 p-10 rounded-2xl shadow-2xl shadow-stone-200/50">

                <div className="text-center mb-10">
                    <div className="w-14 h-14 border border-ink-900 rounded-full flex items-center justify-center mx-auto mb-6 bg-white shadow-sm">
                        <Command className="w-6 h-6 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">InsureOS</h1>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Advanced Agency Operating System</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-50 border border-ink-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Optimus AI: Active</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Identity</label>
                        <input
                            type="email"
                            className="w-full bg-white/60 border border-line px-4 py-3 text-ink-900 text-sm font-medium focus:border-ink-900 focus:outline-none transition-colors rounded-md placeholder:text-ink-300"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Passkey</label>
                        <input
                            type="password"
                            className="w-full bg-white/60 border border-line px-4 py-3 text-ink-900 text-sm font-medium focus:border-ink-900 focus:outline-none transition-colors rounded-md placeholder:text-ink-300"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-ink-400 hover:text-ink-900 transition-colors">
                                Recall Password?
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => {
                                const convexUrl = import.meta.env.VITE_CONVEX_URL || "";
                                const authUrl = convexUrl.includes("convex.cloud")
                                    ? convexUrl.replace("convex.cloud", "convex.site") + "/auth/google"
                                    : "https://third-fly-393.convex.site/auth/google";
                                window.location.href = authUrl;
                            }}
                            className="w-full bg-white border border-line text-ink-900 h-11 rounded-md font-sans text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-line" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-canvas px-2 text-ink-300 font-bold bg-white/50 backdrop-blur-xl">Or continue with email</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ink-900 text-white h-12 rounded-md font-sans text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                        >
                            {loading ? 'Authenticating...' : 'Access Workspace'}
                            {!loading && <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <Link to="/signup" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                            New User? Create Account
                        </Link>
                    </div>
                </form>

                <p className="mt-8 text-center text-[10px] text-ink-400 font-medium">
                    Powered by Optimus Engine | Secure 256-bit Encryption
                </p>
            </div>
        </div>
    );
};

export default Login;
