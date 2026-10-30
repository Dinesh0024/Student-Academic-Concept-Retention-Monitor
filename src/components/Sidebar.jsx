import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineViewGrid,
    HiOutlineUserGroup,
    HiOutlineLightBulb,
    HiOutlineDocumentText,
    HiOutlineCalendar,
    HiOutlineDocumentReport,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlineX,
    HiOutlineShieldCheck,
    HiOutlineOfficeBuilding,
    HiOutlineUserCircle,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const MotionDiv = motion.div;

const adminLinks = [
    { to: '/admin', icon: HiOutlineShieldCheck, label: 'Control Center' },
    { to: '/admin/departments', icon: HiOutlineOfficeBuilding, label: 'Academic Units' },
    { to: '/admin/users', icon: HiOutlineUserGroup, label: 'Member Access' },
    { to: '/admin/settings', icon: HiOutlineCog, label: 'Preferences' },
];

const facultyLinks = [
    { to: '/faculty', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/faculty/students', icon: HiOutlineUserGroup, label: 'Students' },
    { to: '/faculty/doubts', icon: HiOutlineLightBulb, label: 'QueryCoach' },
    { to: '/faculty/questions', icon: HiOutlineDocumentText, label: 'AI Generator' },
    { to: '/faculty/attendance', icon: HiOutlineUserGroup, label: 'Attendance' },
    { to: '/faculty/settings', icon: HiOutlineCog, label: 'Settings' },
];

const studentLinks = [
    { to: '/student', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/student/assessments', icon: HiOutlineDocumentText, label: 'Assessments' },
    { to: '/student/doubts', icon: HiOutlineLightBulb, label: 'QueryCoach' },
    { to: '/student/feedback', icon: HiOutlineDocumentReport, label: 'Mentorship' },
    { to: '/student/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose, role }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [hasNewFeedback, setHasNewFeedback] = useState(false);

    useEffect(() => {
        if (user?.role === 'student') {
            const checkFeedback = async () => {
                const results = await mockDb.getResultsByStudent(user.email);
                const unread = results.some(r => r.teacherFeedback && !r.isFeedbackRead);
                setHasNewFeedback(unread);
            };
            checkFeedback();
            // Optional: Listen for storage changes to update live
            window.addEventListener('storage', checkFeedback);
            return () => window.removeEventListener('storage', checkFeedback);
        }
    }, [user, location.pathname]);

    let links = studentLinks;
    if (role === 'admin') links = adminLinks;
    else if (role === 'faculty') links = facultyLinks;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const firstName = user?.name?.split(' ')[0] || 'User';
    const roleLabel = role === 'faculty' ? 'Faculty' : role === 'admin' ? 'Admin' : 'Student';

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed top-0 left-0 bottom-0 z-40 sidebar-wide transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="h-16 flex items-center px-6 gap-3 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-400/20 text-white shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105 border border-indigo-400/30">
                                <span className="font-black text-sm">A</span>
                            </div>
                            <span className="font-black text-lg tracking-tight text-white">
                                AcademiQ<span className="text-indigo-300">.</span>
                            </span>
                        </Link>

                        {/* Close button - mobile only */}
                        {isOpen && (
                            <button onClick={onClose} className="md:hidden ml-auto p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-all">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1 px-4 py-5 overflow-y-auto">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 mb-2">
                            {roleLabel} Portal
                        </p>
                        {links.map((link) => {
                            const isActive = location.pathname === link.to;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                    <span>{link.label}</span>

                                    {/* Unread Feedback Notification Dot */}
                                    {link.label === 'Mentorship' && hasNewFeedback && (
                                        <span className="ml-auto w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-sm shadow-red-400/50" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section at Bottom */}
                    <div className="px-4 pb-5 space-y-3">
                        {/* Usage Indicator */}
                        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Activity</span>
                                <span className="text-[10px] font-bold text-indigo-300">Active</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" style={{ width: '72%' }} />
                            </div>
                        </div>

                        {/* User Avatar + Name */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                            <div className="w-9 h-9 rounded-full bg-indigo-400/20 flex items-center justify-center text-indigo-300 border border-indigo-400/30">
                                <HiOutlineUserCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{firstName}</p>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">{roleLabel}</p>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="sidebar-nav-item w-full !text-red-300/70 hover:!text-red-300 hover:!bg-red-500/10"
                        >
                            <HiOutlineLogout className="w-[18px] h-[18px]" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
