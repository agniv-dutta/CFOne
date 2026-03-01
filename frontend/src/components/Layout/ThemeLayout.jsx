import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ThemeLayout() {
    const [isDark, setIsDark] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Initialize theme from localStorage on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('cfone-theme');
        if (savedTheme === 'light') {
            setIsDark(false);
            document.documentElement.classList.add('light');
        } else {
            setIsDark(true);
            document.documentElement.classList.remove('light');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.add('light');
            localStorage.setItem('cfone-theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.remove('light');
            localStorage.setItem('cfone-theme', 'dark');
            setIsDark(true);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden pb-10">
            <div className="scanlines"></div>
            <div className="vignette"></div>

            {/* Ticker Bar */}
            <div className="sticky top-0 z-[100] h-8 flex items-center overflow-hidden font-mono text-xs" style={{ backgroundColor: 'var(--ticker-bg)', color: 'var(--ticker-text-color)' }}>
                <div className="animate-ticker">
                    <div className="flex space-x-12 px-6">
                        {/* Duplicate items for seamless loop */}
                        {[...Array(4)].map((_, i) => (
                            <React.Fragment key={i}>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">CASH.FLOW</span> <span>₹2.4L</span> <span style={{ color: 'var(--ticker-up)' }}>▲+12.3%</span></span>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">GST.DUE</span> <span>₹18,400</span> <span style={{ color: 'var(--ticker-down)' }}>▼-3.1%</span></span>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">RISK.SCORE</span> <span>LOW</span> <span style={{ color: 'var(--ticker-up)' }}>▲STABLE</span></span>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">REVENUE</span> <span>₹9.8L</span> <span style={{ color: 'var(--ticker-up)' }}>▲+8.7%</span></span>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">AGENTS</span> <span>5/5</span> <span style={{ color: 'var(--ticker-up)' }}>▲ONLINE</span></span>
                                <span className="flex items-center space-x-2 whitespace-nowrap"><span className="text-[var(--bg-color)] opacity-70">ACCURACY</span> <span>98.5%</span> <span style={{ color: 'var(--ticker-up)' }}>▲+0.3%</span></span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="sticky top-8 z-[90] h-14 flex items-center justify-between px-6 border-b" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}>
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-sm" style={{ border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', backgroundColor: 'var(--surface-card)' }}>C</div>
                    <span className="font-bold tracking-widest text-lg font-body" style={{ color: 'var(--text-primary)' }}>CFONE</span>
                </div>

                <div className="hidden md:flex flex-1 justify-center space-x-2 font-mono text-[10px] tracking-wider">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `px-5 py-2.5 transition-colors ${isActive ? 'shadow-sm rounded-sm' : ''}`}
                        style={({ isActive }) => isActive ? { backgroundColor: 'var(--surface-card)', color: 'var(--primary-accent)' } : { color: 'var(--text-muted)' }}
                    >
                        DASHBOARD
                    </NavLink>
                    <NavLink
                        to="/documents"
                        className={({ isActive }) => `px-5 py-2.5 transition-colors ${isActive ? 'shadow-sm rounded-sm' : ''}`}
                        style={({ isActive }) => isActive ? { backgroundColor: 'var(--surface-card)', color: 'var(--primary-accent)' } : { color: 'var(--text-muted)' }}
                    >
                        DOCUMENTS
                    </NavLink>
                    <NavLink
                        to="/analysis"
                        className={({ isActive }) => `px-5 py-2.5 transition-colors ${isActive ? 'shadow-sm rounded-sm' : ''}`}
                        style={({ isActive }) => isActive ? { backgroundColor: 'var(--surface-card)', color: 'var(--primary-accent)' } : { color: 'var(--text-muted)' }}
                    >
                        ANALYSIS
                    </NavLink>
                    <NavLink
                        to="/reports"
                        className={({ isActive }) => `px-5 py-2.5 transition-colors ${isActive ? 'shadow-sm rounded-sm' : ''}`}
                        style={({ isActive }) => isActive ? { backgroundColor: 'var(--surface-card)', color: 'var(--primary-accent)' } : { color: 'var(--text-muted)' }}
                    >
                        REPORTS
                    </NavLink>
                </div>

                <div className="flex items-center space-x-6 text-sm font-mono">
                    <span className="hidden lg:block text-[var(--text-muted)] text-[10px] tracking-wider">{user?.email || 'Guest'}</span>
                    <button onClick={handleLogout} className="px-4 py-1.5 border border-[var(--border-color)] hover:border-[var(--primary-accent)] transition-colors text-[10px] tracking-wider text-[var(--text-secondary)] bg-[var(--surface-card)]">LOGOUT</button>
                    <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-card)] hover:scale-105 transition-transform" style={{ color: 'var(--text-primary)' }}>
                        {isDark ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </div>
            </nav>

            <main className="max-w-[1280px] mx-auto px-6 mt-10 relative z-10 w-full">
                <Outlet />
            </main>
        </div>
    );
}
