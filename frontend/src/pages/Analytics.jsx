import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertCircle, ArrowDown } from 'lucide-react';

const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
];

const Analytics = () => {
    const handleDownload = () => {
        const headers = ['Month', 'Value'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => `${row.name},${row.value}`)
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

    return (
        <div className="max-w-7xl mx-auto">

            <header className="flex justify-between items-end mb-16 border-b border-line pb-8">
                <div>
                    <h1 className="font-serif text-5xl font-bold text-ink-900 italic">Performance Insights</h1>
                    <p className="text-ink-500 mt-2 font-serif text-lg">Metrics and trends for the current quarter.</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="border border-line px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-ink-900 hover:text-white transition-colors cursor-pointer"
                >
                    Download Report
                </button>
            </header>

            {/* KPIs - Editorial Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-line border border-line mb-16">
                <div className="bg-white p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Revenue</span>
                    </div>
                    <div className="font-serif text-4xl font-bold text-ink-900 italic tracking-tight">₹84.2L</div>
                    <div className="mt-2 text-xs text-accent font-medium">+12.5% vs. last month</div>
                </div>

                <div className="bg-white p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Clients</span>
                    </div>
                    <div className="font-serif text-4xl font-bold text-ink-900 italic tracking-tight">1,248</div>
                    <div className="mt-2 text-xs text-ink-900 font-medium">+48 acquired</div>
                </div>

                <div className="bg-white p-8 group hover:bg-surface transition-colors">
                    <div className="flex items-center gap-2 mb-4 text-ink-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
                    </div>
                    <div className="font-serif text-4xl font-bold text-ink-900 italic tracking-tight">14</div>
                    <div className="mt-2 text-xs text-ink-300 font-medium">Claims processing</div>
                </div>

                <div className="bg-ink-900 p-8 text-white flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Q1 Target</div>
                    <div className="font-serif text-5xl italic">92%</div>
                </div>
            </div>

            {/* Charts - Minimalist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-900 mb-8 border-b border-ink-900 pb-2">Revenue Velocity</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
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
                </div>

                <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-900 mb-8 border-b border-ink-900 pb-2">Client Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
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
