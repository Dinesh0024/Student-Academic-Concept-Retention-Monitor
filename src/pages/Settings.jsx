import mockDb from '../utils/apiDb';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    HiOutlineUser, 
    HiOutlineMail,
    HiOutlineBell,
    HiOutlineMoon,
    HiOutlineSun,
    HiOutlineDownload,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle
} from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const Motion = motion;

export default function Settings() {
    const { user } = useAuth();
    const { dark, toggle: toggleTheme } = useTheme();
    const settingsKey = `portal_settings_${user?.uid || user?.email || 'guest'}`;
    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? { email: true, push: true, weekly: false, ...JSON.parse(saved) } : { email: true, push: true, weekly: false };
        } catch {
            return { email: true, push: true, weekly: false };
        }
    });
    const [isExporting, setIsExporting] = useState(false);

    // Security Override (Password Update) State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetSending, setIsResetSending] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorLoading, setTwoFactorLoading] = useState(true);
    const [twoFactorBusy, setTwoFactorBusy] = useState(false);
    const [twoFactorPassword, setTwoFactorPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorSetup, setTwoFactorSetup] = useState(null);

    const requestTwoFactor = async (path, body) => {
        const token = auth.currentUser
            ? await auth.currentUser.getIdToken()
            : sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) throw new Error('Sign in again to manage two-factor authentication.');

        const response = await fetch(`/api/auth/2fa/${path}`, {
            method: body ? 'POST' : 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                ...(body ? { 'Content-Type': 'application/json' } : {})
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Two-factor request failed.');
        return result;
    };

    useEffect(() => {
        let cancelled = false;
        setTwoFactorLoading(true);
        requestTwoFactor('status')
            .then((result) => {
                if (!cancelled) setTwoFactorEnabled(result.enabled);
            })
            .catch((error) => {
                if (!cancelled) toast.error(error.message || 'Could not load two-factor status.');
            })
            .finally(() => {
                if (!cancelled) setTwoFactorLoading(false);
            });
        return () => { cancelled = true; };
    }, [user?.email]);

    const handleTwoFactorSetup = async () => {
        setTwoFactorBusy(true);
        try {
            const result = await requestTwoFactor('setup', { password: twoFactorPassword });
            setTwoFactorSetup(result);
            setTwoFactorCode('');
            toast.success('Scan the QR code, then enter a code to confirm setup.');
        } catch (error) {
            toast.error(error.message || 'Could not start two-factor setup.');
        } finally {
            setTwoFactorBusy(false);
        }
    };

    const handleTwoFactorEnable = async () => {
        setTwoFactorBusy(true);
        try {
            await requestTwoFactor('enable', { code: twoFactorCode });
            setTwoFactorEnabled(true);
            setTwoFactorSetup(null);
            setTwoFactorPassword('');
            setTwoFactorCode('');
            toast.success('Two-factor authentication enabled.');
        } catch (error) {
            toast.error(error.message || 'Could not enable two-factor authentication.');
        } finally {
            setTwoFactorBusy(false);
        }
    };

    const handleTwoFactorDisable = async () => {
        setTwoFactorBusy(true);
        try {
            await requestTwoFactor('disable', { password: twoFactorPassword, code: twoFactorCode });
            setTwoFactorEnabled(false);
            setTwoFactorPassword('');
            setTwoFactorCode('');
            toast.success('Two-factor authentication disabled.');
        } catch (error) {
            toast.error(error.message || 'Could not disable two-factor authentication.');
        } finally {
            setTwoFactorBusy(false);
        }
    };

    const handleNotificationToggle = (key) => {
        setNotifications(current => {
            const updated = { ...current, [key]: !current[key] };
            localStorage.setItem(settingsKey, JSON.stringify(updated));
            return updated;
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const [allResults, tests] = await Promise.all([mockDb.getResults(), mockDb.getTests()]);
            const results = user?.role === 'student'
                ? allResults.filter(result => result.studentEmail === user.email)
                : allResults;
            const exportData = {
                exportedAt: new Date().toISOString(),
                account: { name: user?.name || '', email: user?.email || '', role: user?.role || '' },
                results,
                assessments: tests,
                preferences: { notifications, theme: dark ? 'dark' : 'light' }
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `academic-portal-data-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Your account data export is ready');
        } catch (error) {
            console.error('Data export failed:', error);
            toast.error('Could not export account data');
        } finally {
            setIsExporting(false);
        }
    };

    // Password strength evaluator
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: 'Unset', color: 'bg-gray-200', text: 'text-gray-400' };
        let score = 0;
        if (pwd.length >= 6) score += 1;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
        if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
        if (score === 3) return { score: 3, label: 'Strong', color: 'bg-blue-500', text: 'text-blue-500' };
        return { score: 4, label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
    };

    const strength = getPasswordStrength(newPassword);
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

    // Handle Password Update Commit
    const handlePasswordUpdate = async (e) => {
        e?.preventDefault();

        if (!newPassword) {
            toast.error('Please enter a new password token');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Access token must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New token and confirmation token do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const currentUser = auth.currentUser;

            // If user logged in with password and provided current password, re-authenticate
            if (currentUser && currentPassword) {
                const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
                try {
                    const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
                    await reauthenticateWithCredential(currentUser, cred);
                } catch (reauthErr) {
                    if (reauthErr.code === 'auth/wrong-password' || reauthErr.code === 'auth/invalid-credential') {
                        toast.error('Current access token is incorrect');
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // Update in Firebase Auth
            if (currentUser) {
                const { updatePassword } = await import('firebase/auth');
                await updatePassword(currentUser, newPassword);
            }

            // Synchronize with backend Postgres database
            try {
                await fetch('/api/auth/update-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user?.email || '',
                        currentPassword,
                        newPassword,
                        role: user?.role || 'student'
                    })
                });
            } catch (dbErr) {
                console.warn('Backend sync skipped or running in mock mode:', dbErr);
            }

            toast.success('Security Override accepted! Access token successfully updated.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Password update failure:', err);
            if (err.code === 'auth/requires-recent-login') {
                toast.error('Security timeout: Please enter your Current Token above to verify identity.');
            } else {
                toast.error(err.message || 'Failed to commit security override');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Send Password Reset Link to Email
    const handleSendResetEmail = async () => {
        const targetEmail = user?.email || '';
        if (!targetEmail) {
            toast.error('No verified email available');
            return;
        }

        setIsResetSending(true);
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            await sendPasswordResetEmail(auth, targetEmail);
            toast.success(`Reset dispatch transmitted to ${targetEmail}`);
        } catch (err) {
            console.error('Reset email error:', err);
            toast.error(err.message || 'Failed to dispatch reset email');
        } finally {
            setIsResetSending(false);
        }
    };

    const Toggle = ({ active, label, onToggle }) => (
        <Motion.button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={label}
            onClick={onToggle}
            className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-gray-900' : 'bg-gray-200'}`}
        >
            <Motion.div
                animate={{ x: active ? 16 : 0 }}
                className="w-4 h-4 rounded-full bg-white shadow-sm"
            />
        </Motion.button>
    );

    return (
        <PageTransition>
            <div className="pb-12 max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Configuration</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Management of security, access, and portal preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="md:col-span-1">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Identity & Access</h3>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed">Update your clinical profile and authentication credentials to maintain secure access.</p>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="premium-card bg-white p-8">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <HiOutlineUser className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account name</p>
                                        <p className="text-sm font-semibold text-gray-800">{user?.name || 'Account name unavailable'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <HiOutlineMail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified email</p>
                                        <p className="text-sm font-semibold text-gray-800">{user?.email || 'Email unavailable'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account role</span>
                                    <span className="text-xs font-black text-accent uppercase tracking-widest">{user?.role || 'Member'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card bg-white p-8">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Two-factor authentication</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Require an authenticator-app code after your password at sign-in.
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {twoFactorLoading ? 'Checking' : twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>

                            {twoFactorSetup ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                        Add a time-based account in your authenticator app using this setup key. Choose six-digit codes with a 30-second period.
                                    </p>
                                    <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">{twoFactorSetup.secret}</p>
                                    <details className="text-xs text-gray-500">
                                        <summary className="cursor-pointer font-semibold">Show setup URI</summary>
                                        <p className="mt-2 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono">{twoFactorSetup.otpauthUrl}</p>
                                    </details>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500" htmlFor="two-factor-enable-code">Authenticator code</label>
                                    <input
                                        id="two-factor-enable-code"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={twoFactorCode}
                                        onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="apple-input"
                                        placeholder="Enter six-digit code"
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <button type="button" onClick={handleTwoFactorEnable} disabled={twoFactorBusy || twoFactorCode.length !== 6}
                                            className="apple-btn apple-btn-primary !py-2.5 !px-5 text-xs font-bold disabled:opacity-50">
                                            {twoFactorBusy ? 'Confirming…' : 'Confirm and enable'}
                                        </button>
                                        <button type="button" onClick={() => { setTwoFactorSetup(null); setTwoFactorCode(''); }}
                                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800">
                                            Cancel setup
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {!twoFactorEnabled && (
                                        <p className="text-xs text-gray-500">Enable this to require a time-based code from an authenticator app during password sign-in.</p>
                                    )}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input
                                            type="password"
                                            autoComplete="current-password"
                                            value={twoFactorPassword}
                                            onChange={(event) => setTwoFactorPassword(event.target.value)}
                                            className="apple-input"
                                            placeholder="Confirm account password"
                                            aria-label="Confirm account password for two-factor settings"
                                        />
                                        {twoFactorEnabled && (
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                pattern="[0-9]{6}"
                                                maxLength={6}
                                                value={twoFactorCode}
                                                onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="apple-input"
                                                placeholder="Current authenticator code"
                                                aria-label="Current authenticator code"
                                            />
                                        )}
                                    </div>
                                    {twoFactorEnabled ? (
                                        <button type="button" onClick={handleTwoFactorDisable}
                                            disabled={twoFactorBusy || !twoFactorPassword || twoFactorCode.length !== 6}
                                            className="apple-btn !py-2.5 !px-5 text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                                            {twoFactorBusy ? 'Updating…' : 'Disable two-factor authentication'}
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleTwoFactorSetup}
                                            disabled={twoFactorBusy || twoFactorLoading || !twoFactorPassword}
                                            className="apple-btn apple-btn-primary !py-2.5 !px-5 text-xs font-bold disabled:opacity-50">
                                            {twoFactorBusy ? 'Starting setup…' : 'Set up authenticator app'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="premium-card bg-white p-8">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Notification Protocols</h3>
                            <div className="space-y-6">
                                {[
                                    { key: 'email', label: 'Critical Alerts', desc: 'Real-time email triggers for significant retention drops.' },
                                    { key: 'push', label: 'Interface Pings', desc: 'Direct portal notifications for immediate student action.' },
                                    { key: 'weekly', label: 'Sector Audit', desc: 'Consolidated weekly summaries of departmental health.' },
                                ].map(n => (
                                    <div key={n.key} className="flex items-center justify-between group">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{n.label}</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-0.5">{n.desc}</p>
                                        </div>
                                        <Toggle active={notifications[n.key]} label={n.label} onToggle={() => handleNotificationToggle(n.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="premium-card bg-white p-8">
                            <div className="flex items-center gap-3 mb-5">
                                {dark ? <HiOutlineMoon className="w-5 h-5 text-accent" /> : <HiOutlineSun className="w-5 h-5 text-amber-500" />}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Appearance</h3>
                                    <p className="text-xs text-gray-400 mt-1">Choose the theme used across the portal.</p>
                                </div>
                            </div>
                            <div className="inline-flex p-1 rounded-xl bg-gray-100" role="group" aria-label="Appearance theme">
                                <button type="button" onClick={() => dark && toggleTheme()} aria-pressed={!dark}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${!dark ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                    <HiOutlineSun className="inline w-4 h-4 mr-1.5" />Light
                                </button>
                                <button type="button" onClick={() => !dark && toggleTheme()} aria-pressed={dark}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${dark ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                    <HiOutlineMoon className="inline w-4 h-4 mr-1.5" />Dark
                                </button>
                            </div>
                        </div>

                        <div className="premium-card bg-white p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <HiOutlineDownload className="w-5 h-5 text-accent" />
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Export account data</h3>
                                        <p className="text-xs text-gray-400 mt-1">Download assessment records and saved portal preferences as JSON.</p>
                                    </div>
                                </div>
                                <button type="button" onClick={handleExport} disabled={isExporting}
                                    className="apple-btn apple-btn-primary !py-2.5 !px-5 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                                    {isExporting ? 'Preparing…' : 'Export data'}
                                </button>
                            </div>
                        </div>

                        {/* ── SECURITY OVERRIDE (Fully Developed Interactive Usage) ── */}
                        <div className="premium-card bg-white p-8 border-l-4 border-l-rose-500 shadow-xl shadow-rose-500/5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Security Override</h3>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                                    256-Bit Encrypted
                                </span>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                {/* Current Password Field */}
                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        Current Access Token (Password)
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showCurrent ? "text" : "password"} 
                                            className="apple-input py-3 pr-12 text-sm font-medium" 
                                            placeholder="Enter existing password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(!showCurrent)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            title={showCurrent ? "Hide password" : "Show password"}
                                        >
                                            {showCurrent ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password Field */}
                                <div className="apple-input-group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            New Access Token (Password)
                                        </label>
                                        {newPassword && (
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${strength.text}`}>
                                                {strength.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type={showNew ? "text" : "password"} 
                                            className="apple-input py-3 pr-12 text-sm font-medium focus:border-rose-400" 
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            title={showNew ? "Hide password" : "Show password"}
                                        >
                                            {showNew ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Strength Meter Bar */}
                                    {newPassword && (
                                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                                            {[1, 2, 3, 4].map((step) => (
                                                <div 
                                                    key={step} 
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        step <= strength.score ? strength.color : 'bg-gray-100'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm New Password Field */}
                                <div className="apple-input-group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Confirm New Access Token
                                        </label>
                                        {confirmPassword && (
                                            <span className={`flex items-center gap-1 text-[10px] font-bold ${
                                                passwordsMatch ? 'text-emerald-600' : 'text-rose-500'
                                            }`}>
                                                {passwordsMatch ? (
                                                    <><HiOutlineCheckCircle className="w-3.5 h-3.5" /> Tokens Match</>
                                                ) : (
                                                    <><HiOutlineExclamationCircle className="w-3.5 h-3.5" /> Tokens Mismatch</>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type={showConfirm ? "text" : "password"} 
                                            className="apple-input py-3 pr-12 text-sm font-medium focus:border-rose-400" 
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            title={showConfirm ? "Hide password" : "Show password"}
                                        >
                                            {showConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="pt-2 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <button 
                                        type="button"
                                        onClick={handleSendResetEmail}
                                        disabled={isResetSending}
                                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors text-left disabled:opacity-50 underline decoration-dashed underline-offset-4"
                                    >
                                        {isResetSending ? 'Transmitting reset link...' : 'Forgot token? Send reset link to email'}
                                    </button>

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || !newPassword}
                                        className="px-8 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none self-end"
                                    >
                                        {isSubmitting ? 'Committing...' : 'Commit Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
