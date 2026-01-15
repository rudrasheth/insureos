import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/client';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    // Get email passed from previous screen or let user type it
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        otp: '',
        newPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword(formData);
            toast.success('Password successfully updated. Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
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
                    <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">Set New Passkey</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-300">Secure Update</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Identity / Email</label>
                        <input
                            type="email"
                            className="input-field text-xl"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">Verification Code (OTP)</label>
                        <input
                            type="text"
                            className="input-field text-xl tracking-widest font-mono"
                            placeholder="000000"
                            maxLength={6}
                            value={formData.otp}
                            onChange={e => setFormData({ ...formData, otp: e.target.value })}
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-ink-900">New Passkey</label>
                        <input
                            type="password"
                            className="input-field text-xl"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full h-14 mt-8 flex items-center justify-between px-8 group"
                    >
                        <span className="font-serif italic text-lg">{loading ? 'Updating...' : 'Update & Login'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900 border-b border-transparent hover:border-ink-900 transition-all pb-0.5">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
