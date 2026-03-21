import React from 'react';

export default function StatCard({ icon, value, label, color = 'azure' }) {
  const colorClasses = {
    azure: 'bg-azure/10 text-azure border-azure/20',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`rounded-xl border p-6 transition-all hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium opacity-80">{label}</div>
    </div>
  );
}