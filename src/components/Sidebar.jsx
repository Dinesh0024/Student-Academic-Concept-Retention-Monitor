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
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
    { to: '/admin', icon: HiOutlineShieldCheck, label: 'Control Center' },
    { to: '/admin/departments', icon: HiOutlineOfficeBuilding, label: 'Academic Units' },
    { to: '/admin/users', icon: HiOutlineUserGroup, label: 'Member Access' },
    { to: '/admin/reports', icon: HiOutlineDocumentReport, label: 'Audit Logs' },
    { to: '/admin/settings', icon: HiOutlineCog, label: 'Preferences' },
];

const facultyLinks = [
    { to: '/faculty', icon: HiOutlineViewGrid, label: 'Overview' },
    { to: '/faculty/students', icon: HiOutlineUserGroup, label: 'Diagnostics' },
    { to: '/faculty/concepts', icon: HiOutlineLightBulb, label: 'Knowledge Graph' },
    { to: '/faculty/questions', icon: HiOutlineDocumentText, label: 'AI Generator' },
    { to: '/faculty/tests', icon: HiOutlineCalendar, label: 'Scheduler' },
    { to: '/faculty/reports', icon: HiOutlineDocumentReport, label: 'Analytics' },
    { to: '/faculty/settings', icon: HiOutlineCog, label: 'Settings' },
];

const studentLinks = [
    { to: '/student', icon: HiOutlineViewGrid, label: 'Learning Path' },
    { to: '/student/assessments', icon: HiOutlineDocumentText, label: 'Live Assessment' },
    { to: '/student/concepts', icon: HiOutlineLightBulb, label: 'Knowledge Map' },
    { to: '/student/reports', icon: HiOutlineDocumentReport, label: 'Academic Matrix' },
    { to: '/student/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose, role }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    let links = studentLinks;
    if (role === 'admin') links = adminLinks;
    else if (role === 'faculty') links = facultyLinks;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/5 backdrop-blur-sm z-30 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed top-0 left-0 bottom-0 w-[260px] z-30 pt-4 bg-white border-r border-gray-100 transition-transform duration-500 ease-[cubic-bezier(0.16, 1, 0.3, 1)] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="h-full flex flex-col px-4">
                    <div className="px-4 mb-10 mt-2 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-105 ${role === 'faculty' ? 'bg-indigo-500 shadow-indigo-500/20' : role === 'student' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-gray-900 shadow-gray-200'}`}>
                                <span className="font-bold text-sm">{role === 'faculty' ? 'F' : role === 'student' ? 'S' : 'A'}</span>
                            </div>
                            <span className="font-black text-xl tracking-tighter text-inherit">
                                {role === 'faculty' ? 'Command' : role === 'student' ? 'Learn' : 'Retain'}
                                <span className={role === 'faculty' ? 'text-indigo-400' : role === 'student' ? 'text-emerald-400' : 'text-blue-500'}>.</span>
                            </span>
                        </Link>
                        {isOpen && (
                            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-black">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 space-y-1">
                        <div className="px-4 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                {role === 'faculty' ? 'Advanced Analytics' : role === 'student' ? 'Knowledge Map' : 'System Protocol'}
                            </p>
                        </div>
                        {links.map((link) => {
                            const isActive = location.pathname === link.to;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 relative group overflow-hidden ${isActive
                                        ? 'text-blue-600 bg-blue-50/80 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <link.icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'scale-110 text-blue-500' : 'group-hover:scale-110'}`} />
                                    <span className="relative z-10">{link.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-bar"
                                            className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="py-8 mt-auto border-t border-gray-50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] text-red-400 hover:text-red-500 hover:bg-red-50 transition-all w-full group"
                        >
                            <HiOutlineLogout className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Terminate Session
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
