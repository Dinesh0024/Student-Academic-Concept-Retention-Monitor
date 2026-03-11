export default function SkeletonLoader({ lines = 3, className = '' }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton"
                    style={{
                        height: i === 0 ? '24px' : '16px',
                        width: i === lines - 1 ? '60%' : '100%',
                    }}
                />
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-4">
                <div className="skeleton w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-6 w-16" />
                </div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="glass-card p-6 space-y-4">
            <div className="skeleton h-6 w-48 mb-6" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                    <div className="skeleton h-4 w-8" />
                    <div className="skeleton h-4 flex-1" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-20" />
                </div>
            ))}
        </div>
    );
}
