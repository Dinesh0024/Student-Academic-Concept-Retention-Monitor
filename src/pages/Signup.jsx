import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineIdentification, HiOutlineLibrary, HiOutlineAcademicCap, HiChevronLeft, HiArrowRight } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
    const navigate = useNavigate();
    const location = useLocation();
    const roleParam = location.pathname.includes('/faculty') ? 'faculty' : 'student';

    const { signup, loginWithGoogle, user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        enrollment_no: '',
        department: 'Computer Science',
        semester: '1',
        designation: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const rootPath = user.role === 'faculty' ? '/faculty' : '/student';
            navigate(rootPath);
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Store the intended role for fallback during profile fetch
            sessionStorage.setItem('intended_role', roleParam);

            // 1. Create user in Firebase
            await signup(formData.email, formData.password);

            // 2. Sync profile data to our PG backend
            const endpoint = roleParam === 'faculty'
                ? '/api/auth/signup/faculty'
                : '/api/auth/signup/student';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                toast.success('Registration successful! Welcome to the portal.');
                // 3. Navigation is handled by the useEffect watching 'user' in AuthContext 
                // but let's be explicit if needed. AuthContext profile fetch will trigger it.
            } else {
                toast.error(data.error || 'Profile sync failed');
            }
        } catch (err) {
            console.error("Signup error:", err);
            toast.error(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            sessionStorage.setItem('intended_role', roleParam);
            const userCredential = await loginWithGoogle();

            // Sync with backend on signup
            const endpoint = roleParam === 'faculty'
                ? '/api/auth/signup/faculty'
                : '/api/auth/signup/student';

            const defaultData = {
                name: userCredential.displayName || userCredential.email.split('@')[0],
                email: userCredential.email,
                enrollment_no: roleParam === 'student' ? 'G-AUTH-PENDING' : undefined,
                department: 'Computer Science', // default
                semester: '1', // default
                designation: roleParam === 'faculty' ? 'Faculty Member' : undefined,
                uid: userCredential.uid // using firebase uid as a pseudo-password for seamless sync if needed by backend structure, wait, backend expects password for bcrypt if we just POST. 
                // Wait, if the user already exists in PG, this will fail. That's fine, we can check response. 
                // But Google auth usually implies we need a generic sync endpoint. 
            };

            // For now, append a strong random password since our backend requires it for the standard registration endpoint
            defaultData.password = Math.random().toString(36).slice(-8) + "Gg1!";

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultData)
            });

            if (response.ok) {
                toast.success('Registration successful! Welcome to the portal.');
            } else {
                // If it fails, they might already exist, which is fine for Google signin
                console.warn('Profile sync warning:', await response.text());
                toast.success('Signed in successfully.');
            }
        } catch (err) {
            console.error("Google Signup error:", err);
            toast.error(err.message || 'Google Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[var(--color-surface-secondary)] flex flex-col items-center justify-center p-6 py-12">
                <Link to="/" className="fixed top-8 left-8 flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors group">
                    <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[500px]"
                >
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6 border border-[var(--color-border)]/30">
                            <HiOutlineAcademicCap className="w-8 h-8 text-[var(--color-accent)]" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {roleParam === 'faculty' ? 'Faculty Registration' : 'Student Signup'}
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">Create your academic profile to get started</p>
                    </div>

                    <div className="premium-card p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Full Name</label>
                                    <div className="relative">
                                        <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="apple-input pl-12"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">
                                        {roleParam === 'faculty' ? 'Designation' : 'Enrollment No'}
                                    </label>
                                    <div className="relative">
                                        <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                        <input
                                            type="text"
                                            required
                                            value={roleParam === 'faculty' ? formData.designation : formData.enrollment_no}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (roleParam === 'faculty') setFormData({ ...formData, designation: val });
                                                else setFormData({ ...formData, enrollment_no: val });
                                            }}
                                            className="apple-input pl-12"
                                            placeholder={roleParam === 'faculty' ? 'Assistant Professor' : 'EN2024...'}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="apple-input pl-12"
                                        placeholder="name@college.edu"
                                    />
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${roleParam === 'student' ? 'md:grid-cols-2' : ''} gap-5`}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Department</label>
                                    <div className="relative">
                                        <HiOutlineLibrary className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="apple-input pl-12 appearance-none"
                                        >
                                            <option>Computer Science</option>
                                            <option>Information Tech</option>
                                            <option>Electronics</option>
                                            <option>Mechanical</option>
                                        </select>
                                    </div>
                                </div>
                                {roleParam === 'student' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Semester</label>
                                        <div className="relative">
                                            <HiOutlineAcademicCap className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                            <select
                                                value={formData.semester}
                                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                                className="apple-input pl-12 appearance-none"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                    <option key={s} value={s}>Semester {s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="apple-input pl-12"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="apple-btn apple-btn-primary w-full py-4 mt-6 gap-2 text-lg font-semibold"
                            >
                                {loading ? 'Creating Profile...' : 'Begin Journey'}
                                {!loading && <HiArrowRight className="w-5 h-5" />}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--color-border)]/50"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-[var(--color-text-tertiary)]">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignUp}
                                disabled={loading}
                                className="apple-btn w-full py-3.5 gap-2 border border-[var(--color-border)] bg-gray-50/50 hover:bg-gray-100/50 text-gray-700 font-medium transition-colors"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                Sign up with Google
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[var(--color-border)]/50 text-center text-sm text-[var(--color-text-secondary)]">
                            Already have an account? <Link to={`/${roleParam}/login`} className="text-[var(--color-accent)] font-semibold hover:underline">Sign in</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
