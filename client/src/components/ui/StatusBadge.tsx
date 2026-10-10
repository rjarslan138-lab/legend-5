import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      // Order Statuses
      case 'DRAFT':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'CONFIRMED':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'PACKED':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'DISPATCHED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'DELIVERED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'CANCELLED':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';

      // Payment Statuses
      case 'PAID':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'PARTIAL':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'PENDING':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';

      // Movement Types
      case 'RECEIVE':
        return 'bg-teal-950/80 text-teal-300 border-teal-800';
      case 'TRANSFER':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
      case 'SALE':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'RETURN':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'DAMAGED':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'ADJUSTMENT':
        return 'bg-violet-950/80 text-violet-300 border-violet-800';

      // Customer Types / Roles
      case 'WHOLESALER':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
      case 'SHOP':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'OWNER':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'STOREKEEPER':
        return 'bg-teal-950/80 text-teal-300 border-teal-800';
      case 'SALES':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'PRODUCTION':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';

      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {normalized}
    </span>
  );
}
