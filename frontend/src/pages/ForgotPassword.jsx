import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword } from '../api/client';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword({ email });
            toast.success('Password reset instructions sent to your email.');
            navigate('/reset-password', { state: { email } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-16">
                    <div className="w-16 h-16 border-2 border-ink-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Command className="w-8 h-8 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-ink-900 italic mb-2">Recovery</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-300">Account Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Registered Email</label>
                        <input
                            type="email"
                            className="input-field text-xl"
                            placeholder="user@organization.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full h-14 mt-8 flex items-center justify-between px-8 group"
                    >
                        <span className="font-serif italic text-lg">{loading ? 'Sending Code...' : 'Send Recovery Code'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                            Return to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
