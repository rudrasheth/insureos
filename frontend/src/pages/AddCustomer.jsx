import React, { useState } from 'react';
import { createCustomer } from '../api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';

const AddCustomer = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCustomer(formData);
            toast.success('Client entity successfully registered');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white border border-line p-16 shadow-[20px_20px_0px_0px_#f0ede6]">

                <div className="flex items-center justify-between mb-16">
                    <div>
                        <h1 className="font-sans text-4xl font-bold text-ink-900">New Client Entry</h1>
                        <p className="text-ink-500 mt-2 font-medium">Please fill in the official registry details below.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full border border-line flex items-center justify-center hover:bg-ink-900 hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">

                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-accent transition-colors">Client Legal Name</label>
                        <input
                            required
                            type="text"
                            className="input-field text-3xl font-sans font-bold py-4"
                            placeholder="e.g. Rahul Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="group">
                            <label className="block text-xs font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-accent transition-colors">Primary Email</label>
                            <input
                                required
                                type="email"
                                className="input-field text-xl"
                                placeholder="contact@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-accent transition-colors">Contact Phone</label>
                            <input
                                type="text"
                                className="input-field text-xl"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-widest text-ink-300 mb-2 group-focus-within:text-accent transition-colors">Headquarters Location</label>
                        <input
                            required
                            type="text"
                            className="input-field text-xl"
                            placeholder="e.g. Mumbai, Maharashtra"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={loading} className="btn-primary text-lg h-14 px-10 rounded-full">
                            {loading ? 'Registering...' : 'Confirm Registration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomer;
