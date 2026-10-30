import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    HiOutlineAcademicCap, 
    HiOutlineUserGroup, 
    HiArrowRight, 
    HiOutlineChartBar, 
    HiOutlineSparkles, 
    HiOutlineCheckCircle,
    HiOutlineShieldCheck,
    HiOutlineMail,
    HiOutlineLockClosed
} from 'react-icons/hi';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Landing() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activePortal, setActivePortal] = useState('student'); // 'student' | 'faculty'
    const [studentEmail, setStudentEmail] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [facultyEmail, setFacultyEmail] = useState('');
    const [facultyPassword, setFacultyPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStudentLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            sessionStorage.setItem('intended_role', 'student');
            await login(studentEmail, studentPassword);
            toast.success('Welcome back to your Learning Portal!');
            navigate('/student');
        } catch (err) {
            console.error('Student front login error:', err);
            toast.error(err.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleFacultyLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            sessionStorage.setItem('intended_role', 'faculty');
            await login(facultyEmail, facultyPassword);
            toast.success('Welcome back!');
            navigate('/faculty');
        } catch (err) {
            console.error('Faculty front login error:', err);
            toast.error(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-surface selection:bg-accent selection:text-white">
                <Navbar />

                {/* Hero Section */}
                <main className="apple-container pt-28 pb-20">
                    <section className="text-center mb-12 fade-in">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/10 mb-5">
                                <HiOutlineShieldCheck className="w-4 h-4 text-accent" />
                                <span className="text-accent font-black text-[11px] uppercase tracking-[0.2em]">Institutional Retention Ecosystem</span>
                            </div>
                            <h1 className="text-title md:text-6xl mb-6 font-black tracking-tighter text-text-primary">
                                AI-Powered Academic Performance Analytics <br />
                                <span className="text-accent">and Personalized Learning Recommendation System for Higher Education Institutions</span>
                            </h1>
                            <p className="text-subtitle max-w-2xl mx-auto mb-8 text-text-secondary/80">
                                A higher-education intelligence platform that combines academic performance analytics with personalized learning recommendations for students and institutions.
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center items-center mb-12">
                                <Link
                                    to="/login"
                                    className="apple-btn apple-btn-primary px-8 py-3.5 text-sm font-black flex items-center gap-2.5 shadow-xl shadow-accent/20 hover:scale-[1.02] transition-transform"
                                >
                                    <HiOutlineUserGroup className="w-5 h-5" />
                                    <span>Login</span>
                                    <HiArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Front-and-Center Interactive Dual-Portal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="max-w-xl mx-auto text-left"
                        >
                            <div className="premium-card p-8 sm:p-10 border-2 border-accent/20 shadow-2xl shadow-accent/10 bg-white/95 dark:bg-surface-secondary/95 backdrop-blur-xl relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${activePortal === 'faculty' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-accent via-blue-500 to-cyan-500'}`}></div>

                                {/* Portal Mode Selector Tabs */}
                                <div className="flex items-center p-1.5 bg-surface-tertiary rounded-2xl mb-8 border border-border/10">
                                    <button
                                        type="button"
                                        onClick={() => setActivePortal('student')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                            activePortal === 'student'
                                                ? 'bg-accent text-white shadow-md shadow-accent/20'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        <HiOutlineUserGroup className="w-4 h-4" />
                                        <span>Student Portal</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActivePortal('faculty')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                            activePortal === 'faculty'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        <HiOutlineAcademicCap className="w-4 h-4" />
                                        <span>Faculty Portal</span>
                                    </button>
                                </div>

                                {activePortal === 'student' ? (
                                    /* STUDENT LOGIN PORTAL */
                                    <div>
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xl shadow-inner">
                                                    <HiOutlineUserGroup className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-text-primary tracking-tight">Student Learning Portal</h3>
                                                    <p className="text-[11px] font-bold text-accent uppercase tracking-widest">Cognitive Retention & Assessments</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                Active Portal
                                            </span>
                                        </div>

                                        <form onSubmit={handleStudentLogin} className="space-y-5">
                                            <div>
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
                                                    Student Email Identity
                                                </label>
                                                <div className="relative">
                                                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
                                                    <input
                                                        type="email"
                                                        required
                                                        value={studentEmail}
                                                        onChange={(e) => setStudentEmail(e.target.value)}
                                                        placeholder="student@institution.edu"
                                                        className="apple-input pl-12 !py-3.5 text-sm font-medium w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                        Access Password
                                                    </label>
                                                    <Link to="/login?role=student" className="text-xs font-bold text-accent hover:underline">
                                                        Dedicated Login ➔
                                                    </Link>
                                                </div>
                                                <div className="relative">
                                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
                                                    <input
                                                        type="password"
                                                        value={studentPassword}
                                                        onChange={(e) => setStudentPassword(e.target.value)}
                                                        placeholder="Enter student password..."
                                                        className="apple-input pl-12 !py-3.5 text-sm font-medium w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="apple-btn apple-btn-primary !py-3.5 !px-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                                                >
                                                    <HiOutlineUserGroup className="w-4 h-4" />
                                                    {loading ? 'Authorizing...' : 'Sign In as Student'}
                                                </button>

                                                <Link
                                                    to="/student/signup"
                                                    className="apple-btn !py-3.5 !px-6 text-xs font-black uppercase tracking-widest bg-surface-tertiary text-text-primary hover:bg-surface border border-border/20 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <span>Register Student</span>
                                                    <HiArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </form>

                                        {/* Student Highlights */}
                                        <div className="mt-8 pt-6 border-t border-border/10 grid grid-cols-2 gap-3 text-[11px] font-bold text-text-secondary">
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineSparkles className="w-4 h-4 text-accent" />
                                                <span>Adaptive Assessments</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineChartBar className="w-4 h-4 text-blue-500" />
                                                <span>Retention Decay Tracker</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span>Concept Mastery Path</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineAcademicCap className="w-4 h-4 text-purple-500" />
                                                <span>Faculty Mentorship</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* FACULTY LOGIN PORTAL */
                                    <div>
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-inner">
                                                    <HiOutlineAcademicCap className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-text-primary tracking-tight">Faculty Command Center</h3>
                                                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Curriculum & Class Analytics</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                Node Online
                                            </span>
                                        </div>

                                        <form onSubmit={handleFacultyLogin} className="space-y-5">
                                            <div>
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
                                                    Faculty Email Identifier
                                                </label>
                                                <div className="relative">
                                                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
                                                    <input
                                                        type="email"
                                                        required
                                                        value={facultyEmail}
                                                        onChange={(e) => setFacultyEmail(e.target.value)}
                                                        placeholder="faculty@institution.edu"
                                                        className="apple-input pl-12 !py-3.5 text-sm font-medium w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                        Access Key / Password
                                                    </label>
                                                    <Link to="/login?role=faculty" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        Standard Login ➔
                                                    </Link>
                                                </div>
                                                <div className="relative">
                                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
                                                    <input
                                                        type="password"
                                                        value={facultyPassword}
                                                        onChange={(e) => setFacultyPassword(e.target.value)}
                                                        placeholder="Enter password..."
                                                        className="apple-input pl-12 !py-3.5 text-sm font-medium w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="apple-btn !py-3.5 !px-6 text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                                >
                                                    <HiOutlineShieldCheck className="w-4 h-4" />
                                                    {loading ? 'Verifying...' : 'Sign In as Faculty'}
                                                </button>

                                                <Link
                                                    to="/login?role=faculty"
                                                    className="apple-btn !py-3.5 !px-6 text-xs font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <span>Dedicated Portal</span>
                                                    <HiArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>

                                        </form>

                                        {/* Faculty Highlights */}
                                        <div className="mt-8 pt-6 border-t border-border/10 grid grid-cols-2 gap-3 text-[11px] font-bold text-text-secondary">
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineChartBar className="w-4 h-4 text-indigo-600" />
                                                <span>Concept Decay Heatmaps</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineSparkles className="w-4 h-4 text-purple-600" />
                                                <span>AI Question Generator</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span>Attendance Matrix</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-tertiary/60">
                                                <HiOutlineUserGroup className="w-4 h-4 text-blue-500" />
                                                <span>Class Mastery Health</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </section>

                    {/* Features Grid */}
                    <section className="grid md:grid-cols-3 gap-12 max-w-7xl mx-auto mb-32 px-6">
                        {[
                            {
                                icon: HiOutlineSparkles,
                                title: 'AI Question Generation',
                                description: 'Faculty can generate context-aware, topic-specific assessments instantly using Google Gemini AI models.',
                            },
                            {
                                icon: HiOutlineChartBar,
                                title: 'Retention Heatmaps',
                                description: 'Visualize student learning decay over time based on Hermann Ebbinghaus\'s forgetting curve data.',
                            },
                            {
                                icon: HiOutlineCheckCircle,
                                title: 'Automated Testing',
                                description: 'Schedule and deploy tests directly to student dashboards with real-time performance tracking.',
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="premium-card p-8 bg-white border border-gray-100 hover:shadow-xl transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-surface-secondary text-text-primary flex items-center justify-center mb-6 group-hover:bg-text-primary group-hover:text-surface transition-all duration-500">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-text-primary mb-3 tracking-tight">{feature.title}</h3>
                                <p className="text-sm font-medium text-text-secondary leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </section>

                    {/* Dual Intelligence Section */}
                    <section className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6">
                        <div className="premium-card p-12 relative overflow-hidden group hover:shadow-2xl transition-all border border-border/5">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6">For Educators</h3>
                            <h2 className="text-3xl font-black text-text-primary mb-6 tracking-tight">Precision Instruction Management</h2>
                            <ul className="space-y-4 text-sm font-medium text-text-secondary mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Monitor overall class health and identify at-risk students
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Generate tests with tailored difficulty via AI
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    View deep analytics on concept mastery
                                </li>
                            </ul>
                            <div className="flex gap-4">
                                <Link to="/login?role=faculty" className="px-6 py-3 bg-text-primary text-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">Access Faculty Portal</Link>
                            </div>
                        </div>

                        <div className="premium-card p-12 relative overflow-hidden group hover:shadow-2xl transition-all border border-border/5">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6">For Learners</h3>
                            <h2 className="text-3xl font-black text-text-primary mb-6 tracking-tight">Cognitive Retention Path</h2>
                            <ul className="space-y-4 text-sm font-medium text-text-secondary mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Take assigned tests in a clean, distraction-free interface
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Track your own performance history across subjects
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    View personalized retention scores to plan study sessions
                                </li>
                            </ul>
                            <div className="flex gap-4">
                                <Link to="/student/signup" className="px-6 py-3 bg-text-primary text-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">Start Learning</Link>
                            </div>
                        </div>
                    </section>

                    {/* System Snapshot */}
                    <section className="mt-40 max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-4">Infrastructure Status</h3>
                            <h2 className="text-4xl font-black text-text-primary tracking-tighter">Digital Academic Reservoir</h2>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-2">Live synchronization with institutional nodes</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Candidates', value: '1,240+', trend: '+12%' },
                                { label: 'Knowledge Units', value: '142', trend: 'Stable' },
                                { label: 'Retention Index', value: '78.4%', trend: 'Optimal' },
                                { label: 'System Uptime', value: '99.9%', trend: 'Live' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="premium-card p-10 bg-white text-center border-b-2 border-b-transparent hover:border-b-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/5 cursor-default group"
                                >
                                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-4 group-hover:text-text-primary transition-colors">{stat.label}</p>
                                    <h4 className="text-5xl font-black text-text-primary mb-3 tracking-tighter">{stat.value}</h4>
                                    <span className="text-[9px] font-black text-text-primary bg-surface-secondary px-3 py-1 rounded-full uppercase tracking-widest border border-border/5">{stat.trend}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Visual Flourish */}
                    <section className="mt-40 text-center pb-20 border-t border-gray-50 pt-20">
                        <div className="flex flex-col items-center gap-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Engineered for Scalability</h3>
                            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">React 19.x</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">PostgreSQL Matrix</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">AI Cognitive Node</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">Edge Runtime v5</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">JWT Protocol</span>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="py-12 border-t border-gray-50 bg-white">
                    <div className="apple-container flex flex-col md:flex-row justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-300">
                        <p>© 2026 AcademiQ. AI-Powered Learning for Higher Education.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
                        </div>
                    </div>
                </footer>
            </div>
        </PageTransition>
    );
}
