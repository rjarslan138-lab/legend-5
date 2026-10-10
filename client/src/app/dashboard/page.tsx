'use client';

import React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useGetDashboardSummaryQuery } from '@/store/api/apiSlice';
import { formatPKR, formatWeight } from '@/utils/formatters';
import {
  FiLayers,
  FiBox,
  FiShoppingCart,
  FiDollarSign,
  FiAlertTriangle,
  FiArrowRight,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { data: response, isLoading, refetch } = useGetDashboardSummaryQuery(undefined);
  const data = response?.data;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Operations Overview
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Real-time factory metrics answering your core operational questions.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/trace"
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800/80 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition shadow-sm"
            >
              <span>Instant SKU Trace</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* 1. Four Main KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Fabric Stock */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fabric In Stock
                </span>
                <div className="p-2 bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-800/50 shadow-sm">
                  <FiLayers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatWeight(data?.kpis?.fabricStockKg)}
                </div>
                <div className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-1">
                  Valued at {formatPKR(data?.kpis?.fabricStockValuePkr)}
                </div>
              </div>
            </div>

            {/* KPI 2: Finished Goods Count */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Finished Goods
                </span>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
                  <FiBox className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {data?.kpis?.finishedGoodsCount?.toLocaleString('en-PK') || 0}{' '}
                  <span className="text-xs font-normal text-slate-500">pcs</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Across warehouse racks
                </div>
              </div>
            </div>

            {/* KPI 3: Open Orders */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Open Orders
                </span>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm">
                  <FiShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {data?.kpis?.openOrdersCount || 0}{' '}
                  <span className="text-xs font-normal text-slate-500">orders</span>
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">
                  Queue value: {formatPKR(data?.kpis?.openOrdersValuePkr)}
                </div>
              </div>
            </div>

            {/* KPI 4: Sales This Month */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sales (This Month)
                </span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatPKR(data?.kpis?.thisMonthSalesPkr)}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  Uncollected: {formatPKR(data?.kpis?.outstandingReceivablesPkr)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Investor Deck Answers Section: "The 6 Factory Questions" */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
              Factory Operating Health & Answers
            </h2>
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-mono font-medium">Traceability Engine Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">1. How much fabric do we have left?</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {formatWeight(data?.kpis?.fabricStockKg)} ({data?.stockFlow?.fabricRolls || 0} batches)
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">2. Who owes us payment right now?</p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatPKR(data?.kpis?.outstandingReceivablesPkr)} across {data?.topCustomers?.filter((c: any) => c.outstanding > 0).length || 0} clients
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">3. Items below reorder threshold?</p>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                {data?.lowStockItems?.length || 0} SKU variants require restock
              </p>
            </div>
          </div>
        </div>

        {/* 3. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: 6-Month Sales Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Sales Trend</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total revenue generated (PKR)</p>
              </div>
              <FiTrendingUp className="text-teal-600 dark:text-teal-400 w-4 h-4" />
            </div>

            <div className="h-64 w-full">
              {data?.monthlyTrend && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#64748b" textAnchor="end" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#ffffff',
                      }}
                      formatter={(value: any) => [formatPKR(Number(value)), 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Top Selling Products */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Selling Products</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Units sold per style</p>
              </div>
              <FiBox className="text-teal-600 dark:text-teal-400 w-4 h-4" />
            </div>

            <div className="h-64 w-full">
              {data?.topSellingProducts && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topSellingProducts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#ffffff',
                      }}
                      formatter={(value: any) => [`${value} pcs`, 'Quantity Sold']}
                    />
                    <Bar dataKey="units" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 4. Bottom Grid: Popular Sizes, Top Customers & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Sizes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Popular Sizes Breakdown</h3>
            <div className="space-y-3">
              {data?.popularSizes?.map((s: any) => {
                const totalUnits = data.popularSizes.reduce((sum: number, cur: any) => sum + cur.units, 0) || 1;
                const percentage = Math.round((s.units / totalUnits) * 100);
                return (
                  <div key={s.size} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{s.size}</span>
                      <span className="text-slate-500 dark:text-slate-400">{s.units} pcs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-teal-500 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Customers & Outstanding Receivables */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Clients & Balances</h3>
              <Link href="/customers" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data?.topCustomers?.slice(0, 5).map((c: any) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-[11px] text-slate-500">{c.city} • {c.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{formatPKR(c.totalBilled)}</p>
                    {c.outstanding > 0 ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        Due: {formatPKR(c.outstanding)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Settled</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <FiAlertTriangle className="text-amber-500 w-4 h-4" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Low Stock Warning</h3>
              </div>
              <Link href="/products" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                Manage
              </Link>
            </div>

            {data?.lowStockItems?.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                All SKUs are above reorder thresholds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data?.lowStockItems?.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-amber-50/60 dark:bg-slate-950/80 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">{item.sku}</span>
                      <p className="text-slate-800 dark:text-slate-300 font-medium">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.size} • {item.color}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{item.currentStock} pcs</span>
                      <p className="text-[10px] text-slate-500">Threshold: {item.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
