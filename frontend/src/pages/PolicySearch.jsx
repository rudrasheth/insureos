import React, { useState, useEffect } from 'react';
import { searchPolicies } from '../api/client';
import { Search, Filter, ArrowUpRight } from 'lucide-react';

const PolicySearch = () => {
    const [filters, setFilters] = useState({ city: '', policyType: '', status: '' });
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { handleSearch(); }, []); // Init load

    const handleSearch = async () => {
        setSearching(true);
        try {
            const res = await searchPolicies(filters);
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { handleSearch(); }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">

            <div className="mb-16 border-b border-line pb-8">
                <h1 className="font-serif text-5xl font-bold text-ink-900 italic mb-4">Policy Archives</h1>
                <div className="flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 w-full">
                        <div className="relative group">
                            <input
                                type="text"
                                className="input-field text-xl py-4"
                                placeholder="Filter by City..."
                                value={filters.city}
                                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            />
                            <Search className="absolute right-0 top-5 w-5 h-5 text-ink-300" />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="relative group">
                            <input
                                type="text"
                                className="input-field text-xl py-4"
                                placeholder="Filter by Policy Type..."
                                value={filters.policyType}
                                onChange={(e) => setFilters({ ...filters, policyType: e.target.value })}
                            />
                            <Filter className="absolute right-0 top-5 w-5 h-5 text-ink-300" />
                        </div>
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="input-field py-4 cursor-pointer text-base uppercase tracking-widest font-bold"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Status: All Records</option>
                            <option value="active">Active Only</option>
                            <option value="expired">expired Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Editorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 pb-16">
                {results.map((policy, i) => (
                    <div key={policy.id} className="group cursor-pointer">
                        <div className="border-t border-ink-900 pt-4 mb-4 flex justify-between items-start">
                            <span className="font-mono text-xs text-ink-300">{(i + 1).toString().padStart(2, '0')}</span>
                            <ArrowUpRight className="w-5 h-5 text-ink-300 group-hover:text-accent transition-colors" />
                        </div>

                        <h3 className="font-serif text-3xl text-ink-900 italic mb-2 group-hover:text-accent transition-colors leading-tight">
                            {policy.customer?.name}
                        </h3>

                        <p className="text-sm font-bold uppercase tracking-widest text-ink-500 mb-6">
                            {policy.policyType}
                        </p>

                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-ink-300 mb-1">Key Location</div>
                                <div className="font-serif text-lg text-ink-900">{policy.customerId?.city || 'Unknown'}</div>
                                <div className="text-[10px] uppercase tracking-widest text-ink-300 mt-2 mb-1">Expires</div>
                                <div className="font-mono text-xs text-ink-500">{new Date(policy.endDate).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest text-ink-300 mb-1">Premium</div>
                                <div className="font-serif text-xl font-bold text-ink-900">₹{policy.premiumAmount?.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                ))}

                {results.length === 0 && !searching && (
                    <div className="col-span-full py-24 text-center border border-dashed border-line">
                        <p className="font-serif text-2xl text-ink-300 italic">No records matching your inquiry.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PolicySearch;
