import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className={`min-h-screen theme-transition bg-surface-secondary text-text-primary ${user?.role === 'student' ? 'portal-student' : 'portal-faculty'}`}>
            <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} role={user?.role} />
            <main className="pt-16 md:pl-[72px]">
                <div className="p-6 max-w-7xl mx-auto">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
}
