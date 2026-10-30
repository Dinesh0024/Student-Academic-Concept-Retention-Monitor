import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiArrowRight, HiOutlineShieldCheck, HiChevronLeft, HiOutlineFingerPrint } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Motion = motion;

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const roleParam = location.pathname.includes('/faculty') ? 'faculty' : params.get('role') === 'faculty' ? 'faculty' : 'student';

    const { login, verifyTwoFactorLogin, loginWithGoogle, loginWithBiometric, enrollBiometric, user } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [twoFactorChallenge, setTwoFactorChallenge] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        setBiometricAvailable(
            roleParam === 'faculty' &&
            window.isSecureContext &&
            typeof window.PublicKeyCredential !== 'undefined' &&
            typeof navigator.credentials?.get === 'function'
        );
        if (user) {
            const rootPath = user.role === 'faculty' ? '/faculty' : '/student';
            navigate(rootPath);
        }
    }, [user, navigate, roleParam]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (twoFactorChallenge) {
                await verifyTwoFactorLogin(twoFactorChallenge, twoFactorCode);
                toast.success('Two-factor verification successful.');
                return;
            }

            // Store the intended role for fallback during profile fetch
            sessionStorage.setItem('intended_role', roleParam);
            const result = await login(formData.email, formData.password);
            if (result?.requiresTwoFactor) {
                setTwoFactorChallenge(result.challengeToken);
                return;
            }
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
            sessionStorage.setItem('intended_role', roleParam);
            await loginWithGoogle();
            toast.success(`Welcome back!`);
        } catch (err) {
            console.error("Google Sign-In error:", err);
            toast.error(err.message || 'Google Sign-In failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricSignIn = async () => {
        if (roleParam !== 'faculty') return;
        if (!biometricAvailable) {
            toast.error('Biometric login needs Chrome, Edge, or Safari on localhost/HTTPS with a device passkey or sensor.');
            return;
        }
        try {
            setLoading(true);
            await loginWithBiometric(formData.email);
            toast.success('Faculty biometric login successful.');
        } catch (err) {
            console.error('Biometric login error:', err);
            toast.error(err.message || 'Biometric login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricEnrollment = async () => {
        if (roleParam !== 'faculty') return;
        if (!biometricAvailable) {
            toast.error('Biometric enrollment needs Chrome, Edge, or Safari on localhost/HTTPS with a device passkey or sensor.');
            return;
        }
        try {
            setLoading(true);
            sessionStorage.setItem('intended_role', 'faculty');
            await login(formData.email, formData.password);
            await enrollBiometric(formData.email);
            toast.success('Biometric login enabled on this device.');
        } catch (err) {
            console.error('Biometric enrollment error:', err);
            toast.error(err.message || 'Could not enable biometric login.');
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

                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-surface shadow-sm flex items-center justify-center mx-auto mb-6 border border-[var(--color-border)]/30">
                            <HiOutlineShieldCheck className="w-8 h-8 text-[var(--color-accent)]" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {roleParam === 'faculty' ? 'Faculty Login' : 'Student Login'}
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">Enter your credentials to continue</p>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-surface-tertiary/80 p-1.5 border border-[var(--color-border)]/40">
                        <button
                            type="button"
                            onClick={() => navigate('/login?role=student')}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${roleParam === 'student' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-[var(--color-text-secondary)]'}`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/login?role=faculty')}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${roleParam === 'faculty' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--color-text-secondary)]'}`}
                        >
                            Faculty
                        </button>
                    </div>

                    <div className="premium-card p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {twoFactorChallenge ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1 text-[var(--color-text-primary)]" htmlFor="two-factor-code">
                                            Authenticator code
                                        </label>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            Enter the current six-digit code from your authenticator app to finish signing in.
                                        </p>
                                        <input
                                            id="two-factor-code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            required
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="apple-input text-center tracking-[0.4em] text-lg"
                                            placeholder="000000"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || twoFactorCode.length !== 6}
                                        className="apple-btn apple-btn-primary w-full py-4 gap-2 text-lg font-semibold"
                                    >
                                        {loading ? 'Verifying...' : 'Verify and sign in'}
                                        {!loading && <HiArrowRight className="w-5 h-5" />}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => {
                                            setTwoFactorChallenge('');
                                            setTwoFactorCode('');
                                        }}
                                        className="w-full text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                                    >
                                        Back to password
                                    </button>
                                </>
                            ) : <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1 text-[var(--color-text-primary)]">Email Address</label>
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
                                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Password</label>
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
                            </>}

                            {!twoFactorChallenge && roleParam === 'faculty' && (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleBiometricSignIn}
                                        disabled={loading || !formData.email || !biometricAvailable}
                                        className="apple-btn w-full py-3.5 gap-2 border border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <HiOutlineFingerPrint className="w-5 h-5" />
                                        Sign in with biometric sensor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBiometricEnrollment}
                                        disabled={loading || !formData.email || !formData.password || !biometricAvailable}
                                        className="w-full text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
                                    >
                                        Enable biometric login on this device
                                    </button>
                                    {!biometricAvailable && (
                                        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                                            Use this page on <strong>http://localhost:5000</strong> or an HTTPS deployment with Windows Hello, Touch ID, Android biometrics, or a passkey.
                                        </p>
                                    )}
                                </div>
                            )}

                            {!twoFactorChallenge && <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--color-border)]/50"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-surface text-[var(--color-text-tertiary)]">Or continue with</span>
                                </div>
                            </div>}

                            {!twoFactorChallenge && <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="apple-btn w-full py-3.5 gap-2 border border-[var(--color-border)] bg-surface-secondary/50 hover:bg-surface-tertiary/50 text-[var(--color-text-secondary)] font-medium transition-colors"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                Sign in with Google
                            </button>}
                        </form>

                        {!twoFactorChallenge && <div className="mt-8 pt-6 border-t border-[var(--color-border)]/50 text-center">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                New here? <Link to={`/${roleParam}/signup`} className="text-[var(--color-accent)] font-semibold hover:underline">Create an account</Link>
                            </p>
                        </div>}
                    </div>

                    <p className="text-center mt-12 text-xs text-[var(--color-text-tertiary)] tracking-widest uppercase">
                        Secure Authentication Port
                    </p>
                </Motion.div>
            </div>
        </PageTransition>
    );
}
