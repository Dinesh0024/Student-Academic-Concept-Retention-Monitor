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
    { to: '/faculty/attendance', icon: HiOutlineUserGroup, label: 'Attendance' },
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
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed top-0 left-0 bottom-0 w-[72px] z-40 bg-white dark:bg-surface-secondary border-r border-border/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="h-full flex flex-col items-center">
                    {/* R Logo - inline with navbar (h-16 = 64px) */}
                    <div className="h-16 w-full flex items-center justify-center border-b border-border/10">
                        <Link to="/" className="sidebar-link group relative">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent text-white shadow-md shadow-accent/25 transition-transform group-hover:scale-110">
                                <span className="font-black text-sm">R</span>
                            </div>
                            <span className="sidebar-tooltip">Retain - Academic Monitor</span>
                        </Link>
                    </div>

                    {/* Close button - mobile only */}
                    {isOpen && (
                        <button onClick={onClose} className="md:hidden mt-2 p-2 text-text-tertiary hover:text-text-primary">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    )}

                    {/* Navigation Icons - straight alignment with highlighted bg */}
                    <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2.5 py-4">
                        {links.map((link) => {
                            const isActive = location.pathname === link.to;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={`sidebar-link relative flex items-center justify-center w-[46px] h-[46px] rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-br from-accent/20 to-indigo-400/10 text-accent shadow-sm'
                                        : 'text-text-tertiary hover:text-accent hover:bg-accent/8 bg-surface-secondary/40'
                                        }`}
                                >
                                    <link.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />

                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 w-[3px] h-4 bg-accent rounded-r-full"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {/* Tooltip */}
                                    <span className="sidebar-tooltip">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout - clearly visible at bottom */}
                    <div className="w-full px-2.5 pb-5">
                        <button
                            onClick={handleLogout}
                            className="sidebar-link relative flex items-center justify-center w-[46px] h-[46px] mx-auto rounded-xl bg-red-50 dark:bg-red-500/5 text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500 transition-all group"
                        >
                            <HiOutlineLogout className="w-5 h-5" />
                            <span className="sidebar-tooltip">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
