import React from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineUsers,
    HiOutlineAcademicCap,
    HiOutlineOfficeBuilding,
    HiOutlineShieldCheck,
    HiOutlineDatabase,
    HiOutlineLightningBolt
} from 'react-icons/hi';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
    const deptData = {
        labels: ['CS', 'ECE', 'MECH', 'IT'],
        datasets: [{
            label: 'Avg Retention %',
            data: [82, 68, 71, 75],
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            barThickness: 32,
        }]
    };

    const userTypeData = {
        labels: ['Students', 'Faculty', 'Admins'],
        datasets: [{
            data: [1240, 86, 12],
            backgroundColor: [
                '#6366F1',
                '#EC4899',
                '#10B981',
            ],
            borderWidth: 0,
            hoverOffset: 20
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                padding: 12,
                titleFont: { size: 10, weight: 'bold' },
                bodyFont: { size: 12, weight: 'bold' },
                cornerRadius: 12,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#F3F4F6', drawBorder: false },
                ticks: { font: { size: 10, weight: 'bold' }, color: '#9CA3AF' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: 'bold' }, color: '#9CA3AF' }
            }
        }
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Command Center</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Enterprise-wide academic intelligence and system vitality</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <StatCard title="Active Candidates" value="1,338" trend={12.5} icon={HiOutlineUsers} color="#3B82F6" />
                    <StatCard title="Curriculum Units" value="142" trend={4.2} icon={HiOutlineAcademicCap} color="#10B981" />
                    <StatCard title="Sector Count" value="8" icon={HiOutlineOfficeBuilding} color="#F59E0B" />
                    <StatCard title="System Integrity" value="99.9%" icon={HiOutlineShieldCheck} color="#6366F1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-2 premium-card bg-white p-10 h-[450px] flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Discipline Performance Delta</h3>
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-[10px] font-black text-gray-900 uppercase">Retention index</span>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <Bar data={deptData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="premium-card bg-white p-10 h-[450px] flex flex-col">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10">Candidate Distribution</h3>
                        <div className="flex-1 relative flex items-center justify-center">
                            <Pie data={userTypeData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, padding: 20 } } } }} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="premium-card bg-white p-10">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Administrative Ledger</h3>
                            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors">Access All Logs</button>
                        </div>
                        <div className="space-y-6">
                            {[
                                { action: 'Faculty Initialization', user: 'Dr. Sarah Smith', time: '2h ago', status: 'Success' },
                                { action: 'System Equilibrium Sync', user: 'Protocol Alpha', time: '5h ago', status: 'Operational' },
                                { action: 'Data redundancy archive', user: 'System', time: '12h ago', status: 'Completed' },
                                { action: 'Curriculum mutation', user: 'Mod-A7', time: '1d ago', status: 'Verified' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-6 bg-gray-100 group-hover:bg-blue-500 rounded-full transition-colors"></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 tracking-tight">{log.action}</p>
                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">by {log.user}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="premium-card bg-white p-10">
                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-10 pb-6 border-b border-gray-50">System Vitality</h3>
                        <div className="space-y-8">
                            {[
                                { label: 'Database Uplink', status: 'OPTIMAL', color: 'text-emerald-500' },
                                { label: 'AI Cognition Engine', status: 'READY', color: 'text-emerald-500' },
                                { label: 'Export Rendering Port', status: 'OPERATIONAL', color: 'text-emerald-500' },
                                { label: 'Signal Transmission (SMTP)', status: 'DELAYED', color: 'text-amber-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text', 'bg')}`}></div>
                                        <span className={`text-[10px] font-black ${item.color} tracking-widest`}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-6 border-t border-gray-50">
                                <button className="apple-btn apple-btn-primary w-full flex items-center justify-center gap-3 !py-4 shadow-xl shadow-blue-500/10">
                                    <HiOutlineLightningBolt className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initialize Diagnostic Scan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
