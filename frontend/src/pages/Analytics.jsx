import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertCircle } from 'lucide-react';
import { getDashboardStats } from '../api/client';
import toast from 'react-hot-toast';

const Analytics = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        activeClients: 0,
        activePolicies: 0,
        pendingClaims: 0,
        chartData: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                // Fallback / Initial blank state is already set
                toast.error("Could not load real-time insights");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleDownload = () => {
        if (!stats.chartData || stats.chartData.length === 0) return;

        const headers = ['Month', 'Revenue'];
        const csvContent = [
            headers.join(','),
            ...stats.chartData.map(row => `${row.name},${row.value}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'insureos_analytics_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Formatter for Currency
    const formatCurrency = (amount) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return <div className="p-8 text-center font-serif text-ink-500">Loading Insights...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 border-b border-line pb-8 gap-4">
                <div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 italic">Performance Insights</h1>
                    <p className="text-ink-500 mt-2 font-serif text-lg">Real-time metrics from your portfolio.</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="border border-line px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-ink-900 hover:text-white transition-colors cursor-pointer w-full md:w-auto"
                >
                    Download Report
                </button>
            </header>

            {/* KPIs - Editorial Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-line border border-line mb-16 shadow-sm">
                <div className="bg-white p-6 md:p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Total Revenue</span>
                    </div>
                    <div className="font-serif text-3xl md:text-4xl font-bold text-ink-900 italic tracking-tight">{formatCurrency(stats.revenue)}</div>
                    <div className="mt-2 text-xs text-accent font-medium">Lifetime</div>
                </div>

                <div className="bg-white p-6 md:p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Total Clients</span>
                    </div>
                    <div className="font-serif text-3xl md:text-4xl font-bold text-ink-900 italic tracking-tight">{stats.activeClients}</div>
                    <div className="mt-2 text-xs text-ink-900 font-medium">Registered</div>
                </div>

                <div className="bg-white p-6 md:p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Policies</span>
                    </div>
                    <div className="font-serif text-3xl md:text-4xl font-bold text-ink-900 italic tracking-tight">{stats.activePolicies}</div>
                    <div className="mt-2 text-xs text-ink-300 font-medium">Currently covered</div>
                </div>

                <div className="bg-ink-900 p-6 md:p-8 text-white flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</div>
                    <div className="font-serif text-4xl md:text-5xl italic">Live</div>
                </div>
            </div>

            {/* Charts - Minimalist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-900 mb-8 border-b border-ink-900 pb-2">Revenue Velocity</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData.length > 0 ? stats.chartData : [{ name: 'No Data', value: 0 }]}>
                                <XAxis dataKey="name" stroke="#a3a29e" tickLine={false} axisLine={false} dy={10} tick={{ fontFamily: 'sans-serif', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: 'none', color: '#fff', fontFamily: 'serif', padding: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ stroke: '#e2e0d8' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#1a1a1a" strokeWidth={2} fill="#f7f5f0" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {stats.chartData.length === 0 && <p className="text-center text-xs text-ink-400 mt-2">No transaction data yet (Start creating policies)</p>}
                </div>

                <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-900 mb-8 border-b border-ink-900 pb-2">Monthly Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData.length > 0 ? stats.chartData : [{ name: 'No Data', value: 0 }]}>
                                <XAxis dataKey="name" stroke="#a3a29e" tickLine={false} axisLine={false} dy={10} tick={{ fontFamily: 'sans-serif', fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ fill: '#f7f5f0' }}
                                    contentStyle={{ background: '#1a1a1a', border: 'none', color: '#fff', fontFamily: 'serif', padding: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#c2410c" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
