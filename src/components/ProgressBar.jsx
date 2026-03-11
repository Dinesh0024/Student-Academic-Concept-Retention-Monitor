import { motion } from 'framer-motion';

export default function ProgressBar({ value, max = 100, label, color, showLabel = true, height = 6 }) {
    const percent = Math.min((value / max) * 100, 100);
    const barColor = color || (percent >= 90 ? '#10B981' : percent >= 70 ? '#3B82F6' : percent >= 50 ? '#F59E0B' : '#EF4444');

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {label || 'Retention Gauge'}
                    </span>
                    <span className="text-xs font-black tracking-tight" style={{ color: barColor }}>
                        {Math.round(percent)}%
                    </span>
                </div>
            )}
            <div
                className="w-full rounded-full bg-gray-50 overflow-hidden border border-gray-100/50"
                style={{ height }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="h-full rounded-full transition-colors duration-500"
                    style={{ backgroundColor: barColor }}
                />
            </div>
        </div>
    );
}
