import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiArrowRight, HiOutlineShieldCheck, HiChevronLeft } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const roleParam = location.pathname.includes('/faculty') ? 'faculty' : 'student';

    const { login, loginWithGoogle, user } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
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
            localStorage.setItem('intended_role', roleParam);
            await login(formData.email, formData.password);
            toast.success(`Welcome back!`);
        } catch (err) {
            console.error("Login error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                toast.error('Account not found or password incorrect. Please sign up if you are a new user.');
            } else {
                toast.error(err.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            localStorage.setItem('intended_role', roleParam);
            await loginWithGoogle();
            toast.success(`Welcome back!`);
        } catch (err) {
            console.error("Google Sign-In error:", err);
            toast.error(err.message || 'Google Sign-In failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[var(--color-surface-secondary)] flex flex-col items-center justify-center p-6">
                <Link to="/" className="fixed top-8 left-8 flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors group">
                    <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6 border border-[var(--color-border)]/30">
                            <HiOutlineShieldCheck className="w-8 h-8 text-[var(--color-accent)]" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {roleParam === 'faculty' ? 'Faculty Login' : 'Student Login'}
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">Enter your credentials to continue</p>
                    </div>

                    <div className="premium-card p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-medium">Password</label>
                                    <a href="#" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">Forgot?</a>
                                </div>
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
                                className="apple-btn apple-btn-primary w-full py-4 mt-4 gap-2 text-lg font-semibold"
                            >
                                {loading ? 'Authorizing...' : 'Sign In'}
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
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="apple-btn w-full py-3.5 gap-2 border border-[var(--color-border)] bg-gray-50/50 hover:bg-gray-100/50 text-gray-700 font-medium transition-colors"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                Sign in with Google
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[var(--color-border)]/50 text-center">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                New here? <Link to={`/${roleParam}/signup`} className="text-[var(--color-accent)] font-semibold hover:underline">Create an account</Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center mt-12 text-xs text-[var(--color-text-tertiary)] tracking-widest uppercase">
                        Secure Authentication Port
                    </p>
                </motion.div>
            </div>
        </PageTransition>
    );
}
