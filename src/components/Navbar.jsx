import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineMenu, HiOutlineSearch, HiOutlineUserCircle, HiOutlineChevronDown, HiOutlineCog, HiOutlineSun, HiOutlineMoon, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuToggle }) {
    const { user, logout, isAuthenticated } = useAuth();
    const { dark, toggle } = useTheme();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const location = useLocation();
    const isLanding = location.pathname === '/';

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const notifications = [
        { id: 1, text: '3 candidates identified as at-risk', time: '2h ago', unread: true },
        { id: 2, text: 'Consolidated retention dataset ready', time: '5h ago', unread: true },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-40 bg-surface/80 dark:bg-surface-secondary/80 backdrop-blur-2xl border-b border-border/10 h-16 transition-all duration-300 ${isLanding ? '' : 'md:pl-[72px]'}`}>
            <div className={`flex items-center justify-between h-full px-6 ${isLanding ? 'max-w-7xl mx-auto' : ''}`}>
                <div className="flex items-center gap-4">
                    {!isLanding && (
                        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-xl hover:bg-surface-tertiary text-text-secondary hover:text-text-primary transition-all">
                            <HiOutlineMenu className="w-5 h-5" />
                        </button>
                    )}
                    {isLanding && (
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent text-white shadow-lg shadow-accent/20 transition-transform group-hover:scale-105">
                                <span className="font-black text-sm">R</span>
                            </div>
                            <span className="font-black text-xl tracking-tighter text-text-primary">
                                Retain
                                <span className="text-accent">.</span>
                            </span>
                            {!isLanding && (
                                <div className="ml-2 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest hidden sm:block">
                                    {user?.role} Portal
                                </div>
                            )}
                        </Link>
                    )}
                </div>

                {!isLanding && (
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4 group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-surface-tertiary/60 border border-border/5 rounded-xl py-2.5 pl-11 pr-4 text-[13px] font-medium text-text-primary placeholder:text-text-tertiary focus:bg-surface focus:border-accent/30 focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggle}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-text-tertiary hover:bg-accent/10 hover:text-accent transition-all"
                        title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                    </button>

                    {isAuthenticated ? (
                        <>
                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${notifOpen ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:bg-accent/10 hover:text-accent'}`}
                                >
                                    <HiOutlineBell className="w-5 h-5" />
                                    {notifications.some(n => n.unread) && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-12 w-80 premium-card p-0 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-border/5 flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-text-primary">Notifications</h4>
                                                <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">2 new</span>
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {notifications.map(n => (
                                                    <div key={n.id} className="px-4 py-3 border-b border-border/5 hover:bg-accent/5 transition-colors cursor-pointer group">
                                                        <p className="text-[13px] font-medium text-text-secondary leading-snug group-hover:text-text-primary transition-colors">{n.text}</p>
                                                        <p className="text-[11px] text-text-tertiary mt-1">{n.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Profile */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all border ${profileOpen ? 'border-accent/20 bg-accent/5' : 'border-transparent hover:bg-surface-tertiary'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent overflow-hidden">
                                        <HiOutlineUserCircle className="w-6 h-6" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start pr-1">
                                        <span className="text-xs font-semibold text-text-primary leading-none mb-0.5">{user?.name?.split(' ')[0]}</span>
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-tight leading-none">{user?.role || 'Guest'}</span>
                                    </div>
                                    <HiOutlineChevronDown className={`hidden sm:block w-3 h-3 text-text-tertiary transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-12 w-52 premium-card p-1.5"
                                        >
                                            <div className="px-3 py-2.5 border-b border-border/5 mb-1">
                                                <p className="font-semibold text-sm text-text-primary truncate">{user?.name}</p>
                                                <p className="text-[11px] text-text-tertiary truncate mt-0.5">{user?.email}</p>
                                            </div>
                                            <Link to={`/${user?.role}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-text-secondary rounded-lg hover:bg-accent/5 hover:text-accent transition-all">
                                                <HiOutlineCog className="w-4 h-4" />
                                                Settings
                                            </Link>
                                            <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-text-secondary rounded-lg hover:bg-red-500/5 hover:text-red-500 transition-all text-left">
                                                <HiOutlineLogout className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/student/login" className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:text-accent transition-colors">Sign In</Link>
                            <Link to="/student/signup" className="apple-btn apple-btn-primary !py-2 !px-5 !text-[12px] !font-bold">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
