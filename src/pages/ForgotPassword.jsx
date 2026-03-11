import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiArrowLeft } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('loading');
        setTimeout(() => {
            setStatus('success');
        }, 1500);
    };

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center p-4 auth-gradient">
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">S</div>
                        <span className="font-bold text-xl tracking-tight">StudentRetain</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card p-8 sm:p-10 glow-indigo">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-6">
                            <HiArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>

                        {status === 'success' ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 scale-110">
                                    ✨
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                                <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mb-6">
                                    We've sent password reset instructions to <br /><span className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">{email}</span>
                                </p>
                                <Link to="/login" className="btn-primary w-full inline-block text-center py-3">
                                    Return to login
                                </Link>
                            </motion.div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold mb-2">Reset password</h1>
                                    <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">Enter your email and we'll send you instructions.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
                                        <div className="relative">
                                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="input-field pl-11"
                                                placeholder="name@college.edu"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="btn-primary w-full py-3"
                                    >
                                        {status === 'loading' ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                                        ) : (
                                            'Send reset link'
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
