import React, { useState, useEffect } from 'react';
import { getCustomers } from '../api/client';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreHorizontal } from 'lucide-react';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCustomers({ limit: 100 })
            .then(res => setCustomers(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-7xl mx-auto">

            {/* Editorial Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="max-w-xl">
                    <h1 className="text-5xl mb-4 text-ink-900">Client Directory</h1>
                    <p className="text-ink-500 text-lg font-serif italic">
                        "A curated registry of all active partnerships and entities."
                    </p>
                </div>

                <div className="flex items-end gap-6 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search the registry..."
                            className="input-field text-xl py-4 border-b-2 border-line focus:border-ink-900 placeholder:text-ink-300"
                        />
                        <Search className="absolute right-0 top-4 w-6 h-6 text-ink-300 group-focus-within:text-ink-900 transition-colors" />
                    </div>

                    <Link to="/add-customer" className="btn-primary rounded-full px-8 py-4 h-auto shadow-xl shadow-accent/20">
                        <Plus className="w-5 h-5 mr-2" />
                        <span>New Entry</span>
                    </Link>
                </div>
            </div>

            {/* Unique "Paper" List */}
            <div className="bg-white border border-line shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 py-6 px-8 border-b border-line bg-surface/30 text-xs font-bold uppercase tracking-widest text-ink-500">
                    <div className="col-span-5">Entity Name</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="divide-y divide-line">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-ink-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <span className="font-serif italic text-ink-500">Retrieving records...</span>
                        </div>
                    ) : (
                        customers.map((customer) => (
                            <div key={customer.id} className="flex flex-col md:grid md:grid-cols-12 py-6 px-6 md:px-8 hover:bg-surface/50 transition-colors cursor-pointer group items-start md:items-center gap-4 md:gap-0">
                                <div className="md:col-span-5 w-full">
                                    <div className="font-serif text-xl md:text-2xl text-ink-900 group-hover:text-accent transition-colors font-medium">
                                        {customer.name}
                                    </div>
                                    <div className="text-[10px] text-ink-300 font-mono mt-1 uppercase tracking-wider">
                                        REF: {customer.id.slice(0, 8)}
                                    </div>
                                </div>
                                <div className="md:col-span-3 text-sm text-ink-500 font-medium flex flex-col justify-center">
                                    <div className="flex items-center">
                                        <span className="w-2 h-px bg-ink-300 mr-2 hidden md:block"></span>
                                        {customer.email}
                                    </div>
                                    <div className="md:ml-4 text-[11px] text-ink-400 mt-0.5">
                                        {customer.phone || 'No Phone'}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="font-serif italic text-ink-900 text-lg">
                                        {customer.city}
                                    </span>
                                </div>
                                <div className="md:col-span-2 w-full md:text-right">
                                    {(customer._count?.policies || 0) > 0 ? (
                                        <span className="inline-block px-3 py-1 bg-ink-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                            Active Partnership
                                        </span>
                                    ) : (
                                        <span className="text-ink-300 text-sm font-serif italic">
                                            No active contracts
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerList;
