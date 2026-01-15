import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate('/');
            toast.success('System Access Granted');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6">

            <div className="w-full max-w-md">

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
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full h-14 mt-8 flex items-center justify-between px-8 group"
                    >
                        <span className="font-serif italic text-lg">{loading ? 'Verifying Credentials...' : 'Enter Workspace'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>
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
