import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Search, PieChart, Users, ShieldCheck, ArrowRight, LogOut, Command } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';

const Layout = () => {
    const location = useLocation();

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

            {/* Sidebar - The "Ine" (Line) Restored */}
            <aside className="w-[260px] flex flex-col bg-white border-r border-border-subtle z-20" style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.02)' }}>

                {/* Brand - Editorial Style */}
                <div className="h-24 flex items-center px-8">
                    <div className="w-10 h-10 border border-ink-900 flex items-center justify-center mr-4 rounded-full">
                        <Command className="w-5 h-5 text-ink-900" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl font-bold italic tracking-tight text-ink-900 leading-none">Insure</h1>
                        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-ink-500">Operating System</span>
                    </div>
                </div>

                {/* Navigation */}
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
                                        <span className="font-serif italic text-lg">{item.label}</span>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-6 border-t border-line">
                    <div className="flex items-center gap-4 p-3 rounded-sm hover:bg-white border border-transparent hover:border-line transition-all cursor-pointer group">
                        <img
                            src="https://api.dicebear.com/7.x/notionists/svg?seed=Jane"
                            alt="User"
                            className="w-10 h-10 rounded-full bg-line"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="font-serif font-bold text-ink-900 leading-tight">Jane Smith</div>
                            <div className="text-xs text-ink-500 mt-0.5">Senior Broker</div>
                        </div>
                        <LogOut className="w-4 h-4 text-ink-300 group-hover:text-ink-900 transition-colors" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-canvas relative">
                {/* Top Bar - Minimal */}
                <header className="h-24 flex items-center justify-between px-12 border-b border-line bg-canvas/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-ink-300 text-sm font-medium">
                        <span>Workspace</span>
                        <span>/</span>
                        <span className="text-ink-900 font-serif italic">{location.pathname === '/' ? 'Overview' : location.pathname.slice(1)}</span>
                    </div>
                    <div className="text-sm font-sans font-bold tracking-widest text-ink-900">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-12 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
