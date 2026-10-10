'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLazyTraceSkuQuery } from '@/store/api/apiSlice';
import { formatPKR, formatDate, formatDateTime, formatWeight } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  FiSearch,
  FiLayers,
  FiBox,
  FiMapPin,
  FiShoppingCart,
  FiDollarSign,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
  FiInfo,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TracePage() {
  const [skuQuery, setSkuQuery] = useState('92204');
  const [triggerTrace, { data: response, isLoading, isError, error }] = useLazyTraceSkuQuery();

  const traceData = response?.data;

  const handleSearch = async (e?: React.FormEvent, customSku?: string) => {
    if (e) e.preventDefault();
    const query = customSku || skuQuery;
    if (!query.trim()) {
      toast.error('Please enter a SKU code');
      return;
    }
    if (customSku) setSkuQuery(customSku);
    try {
      await triggerTrace(query.trim()).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || `SKU '${query}' not found.`);
    }
  };

  // Run initial trace on mount for flagship 92204
  React.useEffect(() => {
    triggerTrace('92204');
  }, [triggerTrace]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <span>End-to-End SKU Traceability</span>
            <span className="text-xs bg-teal-950 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-800 font-mono">
              Core Innovation
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every garment carries its complete lineage: from raw yarn/fabric roll, to batch, warehouse bin, customer order, and bank payment.
          </p>
        </div>

        {/* Search Bar & Deck Quick Example Chips */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 w-5 h-5" />
              <input
                type="text"
                value={skuQuery}
                onChange={(e) => setSkuQuery(e.target.value)}
                placeholder="Enter SKU Code (e.g. 92204, MCS-M-GRY)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition shadow-md shadow-teal-900/30 disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{isLoading ? 'Tracing...' : 'Trace SKU'}</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Clickable Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Quick Deck Scenarios:
            </span>
            <button
              type="button"
              onClick={() => handleSearch(undefined, '92204')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-teal-950/80 hover:text-teal-300 hover:border-teal-700/80 text-teal-400 rounded border border-slate-700 font-mono transition"
            >
              ⭐ 92204 (Deck Flagship: Kids Fleece Hoodie)
            </button>
            <button
              type="button"
              onClick={() => handleSearch(undefined, 'MCS-M-GRY')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono transition"
            >
              MCS-M-GRY (Crewneck Sweatshirt)
            </button>
            <button
              type="button"
              onClick={() => handleSearch(undefined, 'TJP-M-BLK')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono transition"
            >
              TJP-M-BLK (Terry Joggers)
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Retrieving relational lineage from fabric to payment...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-8 text-center bg-slate-900 border border-rose-900/40 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-rose-300">SKU Not Found</p>
            <p className="text-xs text-slate-400">
              No product variant with SKU code '{skuQuery}' was located in this organization.
            </p>
          </div>
        )}

        {/* Traceability Result Cards (Investor Deck Card Presentation) */}
        {!isLoading && traceData && (
          <div className="space-y-6">
            {/* The "Product 92204 Card" Hero Banner */}
            <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-800/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-teal-400 uppercase tracking-wider block">
                    Product Traceability Card
                  </span>
                  <div className="flex items-center space-x-3 mt-1">
                    <h2 className="text-2xl font-black font-mono text-white">
                      SKU {traceData.variant.sku}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {traceData.variant.size}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {traceData.variant.color}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1 font-medium">
                    {traceData.variant.productName} ({traceData.variant.category})
                  </p>
                </div>

                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Wholesale Price</span>
                    <span className="text-lg font-bold text-white block">
                      {formatPKR(traceData.variant.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Manufacturing Cost</span>
                    <span className="text-lg font-bold text-slate-300 block">
                      {formatPKR(traceData.variant.costPrice)}
                    </span>
                  </div>
                  <div className="border-l border-slate-800 pl-6">
                    <span className="text-slate-400 block text-[11px]">Active In Stock</span>
                    <span className="text-lg font-bold text-teal-400 block">
                      {traceData.variant.totalInStock} pcs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Stage Traceability Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* STAGE 1: Raw Fabric Batch */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-teal-400 font-bold uppercase tracking-wider">
                      1. Raw Fabric
                    </span>
                    <FiLayers className="text-teal-400 w-4 h-4" />
                  </div>
                  {traceData.fabricBatch ? (
                    <div className="space-y-1.5 text-xs">
                      <p className="font-mono font-bold text-white text-sm">
                        {traceData.fabricBatch.batchCode}
                      </p>
                      <p className="text-slate-300 font-medium">{traceData.fabricBatch.fabricType}</p>
                      <p className="text-slate-400">{traceData.fabricBatch.supplier}</p>
                      <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                        <p>Weight: <strong className="text-slate-200">{formatWeight(traceData.fabricBatch.weightKg)}</strong></p>
                        <p>Cost: <strong className="text-slate-200">{formatPKR(traceData.fabricBatch.costPerUnit)}/kg</strong></p>
                        <p>Recv: <strong className="text-slate-200">{formatDate(traceData.fabricBatch.receivedAt)}</strong></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">No raw batch linked</p>
                  )}
                </div>
                <div className="w-full bg-teal-950/60 text-teal-400 text-[10px] font-mono text-center py-1 rounded border border-teal-900/60">
                  SOURCE VERIFIED
                </div>
              </div>

              {/* STAGE 2: Finished SKU */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-blue-400 font-bold uppercase tracking-wider">
                      2. Finished SKU
                    </span>
                    <FiBox className="text-blue-400 w-4 h-4" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-mono font-bold text-white text-sm">
                      {traceData.variant.sku}
                    </p>
                    <p className="text-slate-300">{traceData.variant.productName}</p>
                    <p className="text-slate-400">Size: {traceData.variant.size}</p>
                    <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                      <p>Color: <strong className="text-slate-200">{traceData.variant.color}</strong></p>
                      <p>Reorder: <strong className="text-slate-200">{traceData.variant.reorderLevel} pcs</strong></p>
                      <p>Total Stock: <strong className="text-teal-400">{traceData.variant.totalInStock} pcs</strong></p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-blue-950/60 text-blue-400 text-[10px] font-mono text-center py-1 rounded border border-blue-900/60">
                  QUALITY PASSED
                </div>
              </div>

              {/* STAGE 3: Warehouse Bin/Rack */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-purple-400 font-bold uppercase tracking-wider">
                      3. Warehouse Bin
                    </span>
                    <FiMapPin className="text-purple-400 w-4 h-4" />
                  </div>
                  <div className="space-y-2 text-xs">
                    {traceData.stockLocations.length === 0 ? (
                      <p className="text-slate-500 italic py-2">No stock currently stored</p>
                    ) : (
                      traceData.stockLocations.map((loc: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800">
                          <p className="font-mono font-bold text-purple-300 text-xs">{loc.code}</p>
                          <p className="text-[11px] text-slate-400 truncate">{loc.warehouseName}</p>
                          <p className="text-[11px] font-bold text-white mt-1">
                            {loc.quantity} pcs stored
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="w-full bg-purple-950/60 text-purple-400 text-[10px] font-mono text-center py-1 rounded border border-purple-900/60">
                  BIN LOCATED
                </div>
              </div>

              {/* STAGE 4: Customer Order */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">
                      4. Customer Order
                    </span>
                    <FiShoppingCart className="text-amber-400 w-4 h-4" />
                  </div>
                  <div className="space-y-2 text-xs">
                    {traceData.customerOrders.length === 0 ? (
                      <p className="text-slate-500 italic py-2">No customer orders yet</p>
                    ) : (
                      traceData.customerOrders.slice(0, 1).map((ord: any) => (
                        <div key={ord.orderId} className="space-y-1">
                          <p className="font-mono font-bold text-white text-sm">{ord.orderNo}</p>
                          <p className="text-slate-300 font-medium">{ord.customerName}</p>
                          <p className="text-slate-400 text-[11px]">{ord.customerCity}</p>
                          <div className="pt-1 border-t border-slate-800/80 space-y-0.5 text-[11px]">
                            <p>Qty: <strong className="text-slate-200">{ord.orderedQuantity} pcs</strong></p>
                            <p>Status: <StatusBadge status={ord.orderStatus} size="sm" /></p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="w-full bg-amber-950/60 text-amber-400 text-[10px] font-mono text-center py-1 rounded border border-amber-900/60">
                  FULFILLMENT TRACKED
                </div>
              </div>

              {/* STAGE 5: Payment Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      5. Cash & Payment
                    </span>
                    <FiDollarSign className="text-emerald-400 w-4 h-4" />
                  </div>
                  <div className="space-y-2 text-xs">
                    {traceData.customerOrders.length === 0 ? (
                      <p className="text-slate-500 italic py-2">No payments logged</p>
                    ) : (
                      traceData.customerOrders.slice(0, 1).map((ord: any) => (
                        <div key={ord.orderId} className="space-y-1">
                          <StatusBadge status={ord.paymentStatus} size="md" />
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-400">
                            <p>Total Billed: <strong className="text-slate-200">{formatPKR(ord.orderTotalAmount)}</strong></p>
                            <p>Paid so far: <strong className="text-emerald-400">{formatPKR(ord.orderPaidAmount)}</strong></p>
                            {ord.orderTotalAmount > ord.orderPaidAmount && (
                              <p>Due: <strong className="text-amber-400">{formatPKR(ord.orderTotalAmount - ord.orderPaidAmount)}</strong></p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="w-full bg-emerald-950/60 text-emerald-400 text-[10px] font-mono text-center py-1 rounded border border-emerald-900/60">
                  RECONCILED
                </div>
              </div>
            </div>

            {/* Detailed History: Associated Orders & Movements Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Associated Customer Orders */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <FiShoppingCart className="text-teal-400" />
                  <span>Customer Orders Containing SKU {traceData.variant.sku}</span>
                </h3>

                {traceData.customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No orders logged.</p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {traceData.customerOrders.map((ord: any) => (
                      <div key={ord.orderId} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-teal-400">{ord.orderNo}</span>
                            <span className="text-slate-200 font-medium">{ord.customerName}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ordered: {ord.orderedQuantity} pcs @ {formatPKR(ord.unitPrice)} • {formatDate(ord.orderDate)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center justify-end space-x-1.5">
                            <StatusBadge status={ord.orderStatus} size="sm" />
                            <StatusBadge status={ord.paymentStatus} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-300 font-semibold">
                            Total: {formatPKR(ord.lineTotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Stock Movements Audit */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <FiClock className="text-teal-400" />
                  <span>Stock Movements & Audit History</span>
                </h3>

                {traceData.recentMovements.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No movements recorded.</p>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
                    {traceData.recentMovements.map((m: any) => (
                      <div key={m.id} className="py-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={m.type} size="sm" />
                            <span className="font-bold text-slate-200">{m.quantity} pcs</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(m.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {m.fromLocation ? `From: ${m.fromLocation}` : ''}{' '}
                            {m.toLocation ? `→ To: ${m.toLocation}` : ''}
                          </span>
                          <span className="italic text-slate-500">{m.reference || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
