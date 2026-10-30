import { motion } from 'framer-motion';

const colorMap = {
    coral: { bg: 'bg-gradient-to-br from-red-400 to-rose-500', light: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-500', shadow: 'shadow-red-500/20' },
    cyan: { bg: 'bg-gradient-to-br from-cyan-400 to-teal-500', light: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-500', shadow: 'shadow-cyan-500/20' },
    violet: { bg: 'bg-gradient-to-br from-violet-400 to-purple-600', light: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-500', shadow: 'shadow-violet-500/20' },
    emerald: { bg: 'bg-gradient-to-br from-emerald-400 to-green-600', light: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500', shadow: 'shadow-emerald-500/20' },
    indigo: { bg: 'bg-gradient-to-br from-indigo-400 to-blue-600', light: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500', shadow: 'shadow-indigo-500/20' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, index = 0, color = 'indigo', className, onClick, isActive = false, detailsId }) {
    const c = colorMap[color] || colorMap.indigo;
    const Card = onClick ? motion.button : motion.div;

    return (
        <Card
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            aria-expanded={onClick ? isActive : undefined}
            aria-controls={onClick ? detailsId : undefined}
            className={`premium-card p-6 flex items-center gap-5 group ${onClick ? 'w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent' : 'cursor-default'} ${isActive ? 'ring-2 ring-accent shadow-xl' : ''} hover:shadow-xl transition-all ${className || ''}`}
        >
            <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-white shadow-lg ${c.shadow} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-extrabold tracking-tight text-text-primary">{value}</h3>
                    {trend !== undefined && (
                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>
                <p className="text-[12px] font-semibold text-text-secondary mt-0.5 truncate">{title}</p>
                {subtitle && (
                    <p className="text-[10px] font-bold text-text-tertiary mt-0.5 truncate">{subtitle}</p>
                )}
            </div>
        </Card>
    );
}
