export default function StatCard({ title, value, icon, color = 'blue', subtitle }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const iconColors = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        purple: 'text-purple-600',
    };

    return (
        <div className={`rounded-xl border p-5 ${colors[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-white/60 ${iconColors[color]}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                </div>
            </div>
        </div>
    );
}
