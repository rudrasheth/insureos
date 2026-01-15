import React, { useState, useEffect } from 'react';
import { createPolicy, getCustomers } from '../api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Shield, Calendar, Receipt } from 'lucide-react';

const AddPolicy = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerId: '',
        policyType: '',
        premiumAmount: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        getCustomers({ limit: 100 }).then(res => setCustomers(res.data.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createPolicy({
                ...formData,
                premiumAmount: parseFloat(formData.premiumAmount),
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                status: 'active',
            });
            toast.success('Insurance contract successfully bound');
            navigate('/');
        } catch (err) {
            toast.error('Binding Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-5xl bg-white border border-line shadow-[24px_24px_0px_0px_#f7f5f0] flex flex-col md:flex-row overflow-hidden">

                {/* Form Area */}
                <div className="flex-1 p-16">
                    <button onClick={() => navigate('/')} className="mb-12 group flex items-center text-sm font-bold uppercase tracking-widest text-ink-300 hover:text-ink-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Cancel & Return
                    </button>

                    <h2 className="font-serif text-4xl font-bold text-ink-900 italic mb-12">New Policy Contract</h2>

                    <form onSubmit={handleSubmit} className="space-y-12">

                        <div className="group">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-300 mb-4 group-focus-within:text-accent">
                                <User className="w-4 h-4" /> Beneficiary Client
                            </label>
                            <select
                                required
                                className="input-field cursor-pointer appearance-none text-xl p-0"
                                value={formData.customerId}
                                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            >
                                <option value="">Select Entity...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="group">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-300 mb-4 group-focus-within:text-accent">
                                <Shield className="w-4 h-4" /> Coverage Scope
                            </label>
                            <input
                                required
                                type="text"
                                className="input-field text-xl"
                                placeholder="e.g. Corporate Liability Shield"
                                value={formData.policyType}
                                onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-300 mb-4">
                                    <Calendar className="w-4 h-4" /> Effective From
                                </label>
                                <input
                                    required
                                    type="date"
                                    className="input-field text-lg font-serif"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-300 mb-4">
                                    <Calendar className="w-4 h-4" /> Valid Until
                                </label>
                                <input
                                    required
                                    type="date"
                                    className="input-field text-lg font-serif"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-ink-900 text-white w-full py-5 text-sm font-bold uppercase tracking-widest hover:bg-accent transition-colors mt-8"
                        >
                            {loading ? 'Binding Contract...' : 'Execute Contract'}
                        </button>

                    </form>
                </div>

                {/* Editorial Sidebar */}
                <div className="w-96 bg-canvas border-l border-line p-16 flex flex-col justify-between relative hidden md:flex">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 border border-ink-900 rounded-full flex items-center justify-center mb-8">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif text-2xl italic text-ink-900 mb-2">Premium Calculation</h3>
                        <p className="text-sm text-ink-500 font-serif italic">Annual payable amount.</p>
                    </div>

                    <div className="relative z-10">
                        <div className="text-6xl font-serif font-bold text-ink-900 mb-2 tracking-tighter">
                            <span className="text-2xl align-top mr-1">₹</span>
                            {formData.premiumAmount || '0'}
                            <span className="text-xl text-ink-300 ml-1">.00</span>
                        </div>
                        <div className="border-t border-ink-900 pt-6 mt-6">
                            <label className="block text-xs font-bold uppercase tracking-widest text-ink-300 mb-4">Manual Entry</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-white border border-line p-3 font-mono text-sm focus:border-ink-900 focus:outline-none"
                                placeholder="0.00"
                                value={formData.premiumAmount}
                                onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddPolicy;
