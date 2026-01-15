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
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6">

            <div className="w-full max-w-md">

                <div className="text-center mb-12">
                    <div className="w-12 h-12 border border-ink-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Command className="w-6 h-6 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">Join Insure OS</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-300">New User Registration</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Public Name</label>
                        <input
                            type="text"
                            className="input-field text-xl"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Email Address</label>
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
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Set Passkey</label>
                        <input
                            type="password"
                            className="input-field text-xl"
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
                        className="btn-primary w-full h-14 mt-8 flex items-center justify-between px-8 group"
                    >
                        <span className="font-serif italic text-lg">{loading ? 'Processing...' : 'Confirm Registration'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                            Already have credentials? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
