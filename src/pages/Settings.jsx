import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineBell, HiOutlineMoon, HiOutlineShieldCheck, HiOutlineCog } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false });
    const [profile, setProfile] = useState({ name: user?.name || 'Academic Admin', email: user?.email || 'admin@college.edu' });

    const handleSave = () => {
        toast.success('System preferences updated');
    };

    const Toggle = ({ active, onToggle }) => (
        <motion.button
            onClick={onToggle}
            className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-gray-900' : 'bg-gray-200'}`}
        >
            <motion.div
                animate={{ x: active ? 16 : 0 }}
                className="w-4 h-4 rounded-full bg-white shadow-sm"
            />
        </motion.button>
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
                            <div className="space-y-6">
                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Legal Name</label>
                                    <input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="apple-input py-3" />
                                </div>
                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Verified Email</label>
                                    <input value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} className="apple-input py-3" />
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex justify-end">
                                    <button onClick={handleSave} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-xs font-bold uppercase tracking-widest">Update Identity</button>
                                </div>
                            </div>
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
                                        <Toggle active={notifications[n.key]} onToggle={() => setNotifications(ns => ({ ...ns, [n.key]: !ns[n.key] }))} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="premium-card bg-white p-8 border-l-4 border-l-rose-500">
                            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6">Security Override</h3>
                            <div className="space-y-6">
                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Access Token Update (Password)</label>
                                    <input type="password" className="apple-input py-3" placeholder="••••••••" />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => toast.success('Protocol updated')} className="px-8 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors uppercase tracking-widest">Commit Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
