import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../api/client';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE"; // User needs to replace this

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
            localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
            toast.success('System Access Granted');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            console.log("Google User:", decoded);
            // In a real app, send this token to backend to verify and create session
            // For now, we simulate a successful login for the UI flow

            // Mock User Object
            const mockUser = {
                id: decoded.sub,
                name: decoded.name,
                email: decoded.email,
                role: 'agent', // Default role for Google Signups
                picture: decoded.picture
            };

            localStorage.setItem('token', 'mock-google-token'); // Mock token
            localStorage.setItem('user', JSON.stringify(mockUser));

            toast.success(`Welcome, ${decoded.given_name}`);
            navigate('/');
        } catch (err) {
            console.error("Google Login Error:", err);
            toast.error("Google Authentication Failed");
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
                        <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">Insure OS</h1>
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Authorized Personnel Only</p>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ink-900 text-white h-12 rounded-md font-sans text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                        >
                            {loading ? 'Authenticating...' : 'Access Workspace'}
                            {!loading && <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-line"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-canvas px-4 text-ink-300">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error('Google Login Failed')}
                            type="standard"
                            theme="filled_black"
                            size="large"
                            text="continue_with"
                            shape="rectangular"
                            width="100%"
                        />
                    </div>

                    <p className="mt-8 text-center text-[10px] text-ink-400 font-medium">
                        Secure connection via InsureOS Gateway v4.0
                    </p>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
