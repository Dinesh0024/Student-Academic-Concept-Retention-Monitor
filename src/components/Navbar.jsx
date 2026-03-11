import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineMenu, HiOutlineSearch, HiOutlineUserCircle, HiOutlineChevronDown, HiOutlineCog } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuToggle }) {
    const { user, logout, isAuthenticated } = useAuth();
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
        <nav className={`fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 h-16 transition-all ${isLanding ? '' : 'md:pl-[260px]'}`}>
            <div className={`flex items-center justify-between h-full px-8 ${isLanding ? 'max-w-7xl mx-auto' : ''}`}>
                <div className="flex items-center gap-4">
                    {!isLanding && (
                        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <HiOutlineMenu className="w-6 h-6 text-gray-900" />
                        </button>
                    )}
                    {isLanding && (
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-105 ${user?.role === 'faculty' ? 'bg-indigo-500 shadow-indigo-500/20' : user?.role === 'student' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-gray-900 shadow-gray-200'}`}>
                                <span className="font-bold text-sm">{user?.role === 'faculty' ? 'F' : user?.role === 'student' ? 'S' : 'A'}</span>
                            </div>
                            <span className="font-black text-xl tracking-tighter text-gray-900">
                                {user?.role === 'faculty' ? 'Command' : user?.role === 'student' ? 'Learn' : 'Retain'}
                                <span className={user?.role === 'faculty' ? 'text-indigo-500' : user?.role === 'student' ? 'text-emerald-500' : 'text-blue-500'}>.</span>
                            </span>
                        </Link>
                    )}
                </div>

                {!isLanding && (
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={user?.role === 'faculty' ? 'Search academic performance...' : 'Search learning concepts...'}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-2 pl-11 pr-4 text-[13px] font-bold text-gray-700 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-opacity-5 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${notifOpen ? 'bg-blue-50 text-blue-500' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <HiOutlineBell className="w-5 h-5" />
                                    {notifications.some(n => n.unread) && (
                                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full ring-2 ring-white" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-14 w-80 premium-card bg-white p-0 shadow-2xl border border-gray-100 overflow-hidden"
                                        >
                                            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">System Alerts</h4>
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">New</span>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.map(n => (
                                                    <div key={n.id} className="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                                        <p className="text-[13px] font-bold text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">{n.text}</p>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter mt-1">{n.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className={`flex items-center gap-3 p-1 rounded-2xl transition-all border ${profileOpen ? 'border-gray-100 bg-gray-50' : 'border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-lg shadow-gray-200 overflow-hidden">
                                        <HiOutlineUserCircle className="w-8 h-8 opacity-50" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start pr-2">
                                        <span className="text-xs font-bold text-gray-900 leading-none mb-0.5">{user?.name?.split(' ')[0]}</span>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter leading-none">{user?.role || 'Guest'}</span>
                                    </div>
                                    <HiOutlineChevronDown className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-14 w-56 premium-card bg-white p-2 shadow-2xl border border-gray-100"
                                        >
                                            <div className="px-3 py-3 border-b border-gray-50 mb-1">
                                                <p className="font-bold text-sm text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-[10px] font-black text-gray-400 truncate uppercase mt-0.5 tracking-tighter">{user?.email}</p>
                                            </div>
                                            <Link to={`/${user?.role}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all">
                                                <HiOutlineCog className="w-4 h-4" />
                                                Portal Settings
                                            </Link>
                                            <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-rose-500 rounded-xl hover:bg-rose-50 transition-all text-left">
                                                <HiOutlineUserCircle className="w-4 h-4 opacity-0" /> {/* Spacer */}
                                                Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/student/login" className="px-4 py-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">Sign In</Link>
                            <Link to="/student/signup" className="apple-btn apple-btn-primary !py-2.5 !px-6 !text-[10px] !font-black !uppercase !tracking-widest">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
