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
            localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
            toast.success('System Access Granted');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 relative overflow-hidden">

            {/* Ambient Background Animation */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-ink-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-accent-subtle/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-grain opacity-20"></div>
            </div>

            <div className="w-full max-w-md relative z-10">

                <div className="text-center mb-16">
                    <div className="w-16 h-16 border-2 border-ink-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Command className="w-8 h-8 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-ink-900 italic mb-2">Insure OS</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-300">Restricted Access Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Identity / Email</label>
                        <input
                            type="email"
                            className="input-field text-xl"
                            placeholder="user@organization.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Passkey</label>
                        <input
                            type="password"
                            className="input-field text-xl"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-ink-300 hover:text-ink-900 transition-colors">
                                Forgot Passkey?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full h-14 mt-8 flex items-center justify-between px-8 group"
                    >
                        <span className="font-serif italic text-lg">{loading ? 'Verifying Credentials...' : 'Enter Workspace'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/signup" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                            Request Access / Register
                        </Link>
                    </div>
                </form>

                <footer className="mt-16 text-center border-t border-line pt-8">
                    <p className="font-serif text-ink-300 italic text-sm">
                        &copy; 2024 Insure Operating System. secure_v4.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Login;
