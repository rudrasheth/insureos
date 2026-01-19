import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../api/client';

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Access Request Approved. Please Login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 relative overflow-hidden">

            {/* Ambient Background Animation - Consistent with Login */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ink-900/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-orange-200/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <div className="w-full max-w-md relative z-10 bg-white/50 backdrop-blur-xl border border-white/40 p-10 rounded-2xl shadow-2xl shadow-stone-200/50">

                <div className="text-center mb-12">
                    <div className="w-12 h-12 border border-ink-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Command className="w-6 h-6 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">Join InsureOS</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-300">Agency Management System</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Public Name</label>
                        <input
                            type="text"
                            className="w-full bg-white/60 border border-line px-4 py-3 text-ink-900 text-sm font-medium focus:border-ink-900 focus:outline-none transition-colors rounded-md placeholder:text-ink-300"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full bg-white/60 border border-line px-4 py-3 text-ink-900 text-sm font-medium focus:border-ink-900 focus:outline-none transition-colors rounded-md placeholder:text-ink-300"
                            placeholder="user@organization.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Set Passkey</label>
                        <input
                            type="password"
                            className="w-full bg-white/60 border border-line px-4 py-3 text-ink-900 text-sm font-medium focus:border-ink-900 focus:outline-none transition-colors rounded-md placeholder:text-ink-300"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ink-900 text-white h-12 rounded-md font-sans text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Processing...' : 'Confirm Registration'}
                        {!loading && <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                        Already have credentials? Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
