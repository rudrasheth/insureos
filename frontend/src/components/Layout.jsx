import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Search, PieChart, Users, ShieldCheck, ArrowRight, LogOut, Command, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';

const Layout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { to: '/', label: 'Overview', icon: LayoutGrid },
        { to: '/search', label: 'Directory', icon: Search },
        { to: '/analytics', label: 'Insights', icon: PieChart },
    ];

    const quickActions = [
        { to: '/add-customer', label: 'New Client', icon: Users },
        { to: '/add-policy', label: 'Bind Policy', icon: ShieldCheck },
    ];

    return (
        <div className="flex h-screen bg-canvas overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                className: '!bg-ink-900 !text-white !font-sans !rounded-sm !px-6 !py-3 !shadow-2xl',
                iconTheme: { primary: '#c2410c', secondary: '#fff' }
            }} />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-ink-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 w-[260px] flex flex-col bg-white border-r border-border-subtle z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>

                {/* Brand */}
                <div className="h-24 flex items-center justify-between px-8">
                    <div className="mb-10 px-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center text-white">
                            <Command className="w-4 h-4" />
                        </div>
                        <h1 className="font-sans font-bold text-xl text-ink-900 tracking-tight">Optimize</h1>
                    </div>            </div>
                {/* Mobile Close Button */}
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-ink-500 hover:text-ink-900">
                    <X className="w-6 h-6" />
                </button>
        </div>

                {/* Navigation */ }
    <div className="flex-1 py-10 px-6 flex flex-col gap-10 overflow-y-auto">

        {/* Main Nav */}
        <div>
            <div className="text-[11px] font-sans font-bold text-ink-300 uppercase tracking-widest mb-6 border-b border-line pb-2 mx-2">
                Menu
            </div>
            <nav className="space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            clsx(
                                'group flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-300',
                                isActive
                                    ? 'bg-ink-900 text-white shadow-md'
                                    : 'text-ink-500 hover:bg-white hover:text-ink-900 hover:shadow-sm'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="flex items-center gap-4">
                                    <item.icon className={clsx("w-4 h-4 transition-colors", isActive ? "text-accent" : "text-ink-300 group-hover:text-ink-900")} strokeWidth={2} />
                                    <span className={clsx("font-medium", isActive ? "font-serif italic text-lg" : "text-sm")}>{item.label}</span>
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 bg-accent rounded-full" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>

        {/* Quick Ops */}
        <div>
            <div className="text-[11px] font-sans font-bold text-ink-300 uppercase tracking-widest mb-6 border-b border-line pb-2 mx-2">
                Operations
            </div>
            <nav className="space-y-2">
                {quickActions.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-300 border border-transparent',
                                isActive
                                    ? 'border-line bg-white'
                                    : 'text-ink-900 hover:border-line hover:bg-white'
                            )
                        }
                    >
                        <div className="flex items-center gap-4">
                            <item.icon className="w-4 h-4 text-ink-900" strokeWidth={1.5} />
                            <span className="font-medium text-lg">{item.label}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>
        </div>
    </div>

    {/* User Block */ }
    <div className="p-6 border-t border-line">
        <div className="flex items-center gap-4 p-3 rounded-sm hover:bg-white border border-transparent hover:border-line transition-all cursor-pointer group">
            <img
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}`}
                alt="User"
                className="w-10 h-10 rounded-full bg-line"
            />
            <div className="flex-1 min-w-0">
                <div className="font-serif font-bold text-ink-900 leading-tight truncate">
                    {JSON.parse(localStorage.getItem('user') || '{}').name || 'Jane Smith'}
                </div>
                <div className="text-xs text-ink-500 mt-0.5">
                    {(JSON.parse(localStorage.getItem('user') || '{}').role === 'admin') ? 'Admin Workspace' : 'Agent Workspace'}
                </div>
            </div>
            <LogOut className="w-4 h-4 text-ink-300 group-hover:text-ink-900 transition-colors" onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
            }} />
        </div>
    </div>
            </aside >

    {/* Main Content Area */ }
    < div className = "flex-1 flex flex-col min-w-0 bg-canvas relative transition-all duration-300" >
        {/* Top Bar */ }
        < header className = "h-24 flex items-center justify-between px-6 md:px-12 border-b border-line bg-canvas/80 backdrop-blur-sm sticky top-0 z-30" >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-ink-900 p-2 hover:bg-line rounded-md">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2 text-ink-300 text-sm font-medium">
                            <span>Workspace</span>
                            <span>/</span>
                            <span className="text-ink-900 font-medium">{location.pathname === '/' ? 'Overview' : location.pathname.slice(1)}</span>
                        </div>
                    </div>
                    <div className="text-sm font-sans font-bold tracking-widest text-ink-900 hidden md:block">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </header >

    <main className="flex-1 overflow-auto p-4 md:p-12 relative w-full">
        <Outlet />
    </main>
            </div >
        </div >
    );
};

export default Layout;
