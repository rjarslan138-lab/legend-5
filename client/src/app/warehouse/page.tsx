'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  useGetWarehousesQuery,
  useGetStockQuery,
  useGetStockMovementsQuery,
  useReceiveStockMutation,
  useTransferStockMutation,
  useRecordDamagedStockMutation,
  useGetProductsQuery,
  useCreateWarehouseMutation,
  useCreateLocationMutation,
} from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { formatDate, formatDateTime } from '@/utils/formatters';
import {
  FiTruck,
  FiMapPin,
  FiRepeat,
  FiPlus,
  FiAlertTriangle,
  FiActivity,
} from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function WarehousePage() {
  const { user } = useAppSelector((state) => state.auth);
  const canEdit = user?.role === 'OWNER' || user?.role === 'STOREKEEPER';

  const [activeTab, setActiveTab] = useState<'inventory' | 'ledger' | 'warehouses'>('inventory');

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isAddWarehouseModalOpen, setIsAddWarehouseModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Queries
  const { data: whResponse, isLoading: isLoadingWh } = useGetWarehousesQuery({});
  const { data: stockResponse, isLoading: isLoadingStock } = useGetStockQuery({});
  const { data: movementsResponse, isLoading: isLoadingMovements } = useGetStockMovementsQuery({});
  const { data: productsResponse } = useGetProductsQuery({});

  // Mutations
  const [receiveStock, { isLoading: isReceiving }] = useReceiveStockMutation();
  const [transferStock, { isLoading: isTransferring }] = useTransferStockMutation();
  const [recordDamaged, { isLoading: isDamaging }] = useRecordDamagedStockMutation();
  const [createWarehouse, { isLoading: isCreatingWh }] = useCreateWarehouseMutation();
  const [createLocation, { isLoading: isCreatingLoc }] = useCreateLocationMutation();

  const warehouses = whResponse?.data || [];
  const stockItems = stockResponse?.data || [];
  const movements = movementsResponse?.data?.movements || [];
  const products = productsResponse?.data?.products || [];

  // Extract all variants for selectors
  const allVariants = products.flatMap((p: any) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
    }))
  );

  // Extract all locations across warehouses
  const allLocations = warehouses.flatMap((w: any) =>
    (w.locations || []).map((loc: any) => ({
      ...loc,
      warehouseName: w.name,
    }))
  );

  // Forms
  const { register: regReceive, handleSubmit: handleReceiveSubmit, reset: resetReceive } = useForm();
  const { register: regTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer } = useForm();
  const { register: regDamage, handleSubmit: handleDamageSubmit, reset: resetDamage } = useForm();
  const { register: regWh, handleSubmit: handleWhSubmit, reset: resetWh } = useForm();
  const { register: regLoc, handleSubmit: handleLocSubmit, reset: resetLoc } = useForm();

  const onReceiveSubmit = async (formData: any) => {
    try {
      await receiveStock({
        variantId: formData.variantId,
        locationId: formData.locationId,
        quantity: Number(formData.quantity),
        reference: formData.reference || 'Manual Production Intake',
      }).unwrap();
      toast.success('Finished goods received into warehouse rack!');
      setIsReceiveModalOpen(false);
      resetReceive();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to receive stock');
    }
  };

  const onTransferSubmit = async (formData: any) => {
    try {
      await transferStock({
        variantId: formData.variantId,
        fromLocationId: formData.fromLocationId,
        toLocationId: formData.toLocationId,
        quantity: Number(formData.quantity),
        reference: formData.reference || 'Bin-to-Bin Relocation',
      }).unwrap();
      toast.success('Stock relocated successfully!');
      setIsTransferModalOpen(false);
      resetTransfer();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Transfer failed');
    }
  };

  const onDamageSubmit = async (formData: any) => {
    try {
      await recordDamaged({
        variantId: formData.variantId,
        locationId: formData.locationId,
        quantity: Number(formData.quantity),
        reason: formData.reason,
      }).unwrap();
      toast.success('Damaged inventory written off from rack.');
      setIsDamageModalOpen(false);
      resetDamage();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Action failed');
    }
  };

  const onWhSubmit = async (formData: any) => {
    try {
      await createWarehouse(formData).unwrap();
      toast.success('Warehouse created');
      setIsAddWarehouseModalOpen(false);
      resetWh();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not create warehouse');
    }
  };

  const onLocSubmit = async (formData: any) => {
    try {
      await createLocation({
        warehouseId: selectedWarehouseId,
        code: formData.code,
        description: formData.description,
      }).unwrap();
      toast.success('Rack/Bin location created');
      setIsAddLocationModalOpen(false);
      resetLoc();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not create location');
    }
  };

  // Columns for Stock By Location
  const stockColumns: Column<any>[] = [
    {
      key: 'sku',
      header: 'SKU / Product',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono font-semibold text-teal-400">{item.variant?.sku}</span>
          <p className="text-slate-200 font-medium">{item.variant?.product?.name}</p>
          <p className="text-[11px] text-slate-500">
            Size: {item.variant?.size} • Color: {item.variant?.color}
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Warehouse & Rack',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono text-slate-200 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {item.location?.code}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            {item.location?.warehouse?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'fabricBatch',
      header: 'Raw Fabric Origin',
      render: (item) => (
        item.variant?.fabricBatch ? (
          <span className="text-slate-300 font-mono text-xs">
            {item.variant.fabricBatch.batchCode} ({item.variant.fabricBatch.color})
          </span>
        ) : (
          <span className="text-slate-600 italic">None</span>
        )
      ),
    },
    {
      key: 'quantity',
      header: 'Rack Stock',
      sortable: true,
      render: (item) => (
        <span className="text-base font-bold text-white">
          {item.quantity} <span className="text-xs font-normal text-slate-400">pcs</span>
        </span>
      ),
    },
  ];

  // Columns for Movement Ledger
  const ledgerColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="text-slate-300 text-xs">{formatDateTime(item.createdAt)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Action',
      sortable: true,
      render: (item) => <StatusBadge status={item.type} size="sm" />,
    },
    {
      key: 'variant',
      header: 'Product / SKU',
      render: (item) => (
        <div>
          <span className="font-mono text-teal-400 font-medium">{item.variant?.sku}</span>
          <p className="text-[11px] text-slate-400">{item.variant?.product?.name}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-200">{item.quantity} pcs</span>
      ),
    },
    {
      key: 'fromLocation',
      header: 'From Rack',
      render: (item) => item.fromLocation ? (
        <span className="font-mono text-xs text-slate-300">{item.fromLocation.code}</span>
      ) : (
        <span className="text-slate-600">-</span>
      ),
    },
    {
      key: 'toLocation',
      header: 'To Rack',
      render: (item) => item.toLocation ? (
        <span className="font-mono text-xs text-teal-300">{item.toLocation.code}</span>
      ) : (
        <span className="text-slate-600">-</span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference Note',
      render: (item) => (
        <span className="text-slate-400 text-xs max-w-xs truncate block">{item.reference || '-'}</span>
      ),
    },
    {
      key: 'user',
      header: 'Staff',
      render: (item) => (
        <span className="text-slate-400 text-xs">{item.user?.name || 'System'}</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Warehouse Stock & Racks</h1>
            <p className="text-xs text-slate-400 mt-1">
              Bin-level inventory positions, internal rack transfers and immutable ledger movements.
            </p>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsReceiveModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Receive Finished Goods</span>
              </button>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <FiRepeat className="w-3.5 h-3.5" />
                <span>Move Rack Stock</span>
              </button>

              <button
                onClick={() => setIsDamageModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-semibold transition"
              >
                <FiAlertTriangle className="w-3.5 h-3.5" />
                <span>Write-Off Damaged</span>
              </button>
            </div>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-800 space-x-6 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-medium transition border-b-2 ${
              activeTab === 'inventory'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Stock By Rack Position
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 font-medium transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'ledger'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiActivity className="w-4 h-4" />
            <span>Immutable Ledger Movements</span>
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pb-3 font-medium transition border-b-2 ${
              activeTab === 'warehouses'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Warehouses & Bins Structure
          </button>
        </div>

        {/* Content by active tab */}
        {activeTab === 'inventory' && (
          <DataTable
            columns={stockColumns}
            data={stockItems}
            isLoading={isLoadingStock}
            searchPlaceholder="Search by SKU, product name, or rack code (e.g. A-03 / Rack 7)..."
          />
        )}

        {activeTab === 'ledger' && (
          <DataTable
            columns={ledgerColumns}
            data={movements}
            isLoading={isLoadingMovements}
            searchPlaceholder="Filter audit movements by reference, staff, or action type..."
          />
        )}

        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              {canEdit && (
                <button
                  onClick={() => setIsAddWarehouseModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs font-medium transition"
                >
                  + Add Warehouse
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {warehouses.map((wh: any) => (
                <div
                  key={wh.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <FiTruck className="text-teal-400" />
                        <span>{wh.name}</span>
                      </h3>
                      {wh.address && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                          <FiMapPin className="w-3 h-3 text-slate-500" />
                          <span>{wh.address}</span>
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setSelectedWarehouseId(wh.id);
                          setIsAddLocationModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded text-xs border border-slate-700 transition"
                      >
                        + Add Rack
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Bins / Racks:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {wh.locations?.map((loc: any) => {
                        const totalUnits = (loc.stockItems || []).reduce(
                          (sum: number, si: any) => sum + si.quantity,
                          0
                        );
                        return (
                          <div
                            key={loc.id}
                            className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-semibold text-teal-400">
                                {loc.code}
                              </span>
                              {loc.description && (
                                <p className="text-[11px] text-slate-500">{loc.description}</p>
                              )}
                            </div>
                            <span className="text-slate-300 font-medium">
                              {totalUnits} pcs stored
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal 1: Receive Stock */}
        <Modal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          title="Receive Finished Goods into Warehouse"
          subtitle="Deposit produced garment units into a specific warehouse rack."
          maxWidth="md"
        >
          <form onSubmit={handleReceiveSubmit(onReceiveSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product SKU *
              </label>
              <select
                {...regReceive('variantId', { required: true })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select SKU variant...</option>
                {allVariants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.productName} ({v.size}, {v.color})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Destination Warehouse Rack *
              </label>
              <select
                {...regReceive('locationId', { required: true })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select rack/bin...</option>
                {allLocations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} ({loc.warehouseName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity (pcs) *
              </label>
              <input
                type="number"
                {...regReceive('quantity', { required: true, min: 1 })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reference / Note
              </label>
              <input
                type="text"
                {...regReceive('reference')}
                placeholder="e.g. Production Run Lot 14 Completed"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReceiving}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {isReceiving ? 'Receiving...' : 'Confirm Stock Intake'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Transfer Stock */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Relocate Stock Between Racks"
          subtitle="Move garments from one bin to another with audit tracking."
          maxWidth="md"
        >
          <form onSubmit={handleTransferSubmit(onTransferSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product SKU *
              </label>
              <select
                {...regTransfer('variantId', { required: true })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select SKU variant...</option>
                {allVariants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.productName} ({v.size})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Rack (From) *
                </label>
                <select
                  {...regTransfer('fromLocationId', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                >
                  <option value="">From location...</option>
                  {allLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.warehouseName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Destination Rack (To) *
                </label>
                <select
                  {...regTransfer('toLocationId', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                >
                  <option value="">To location...</option>
                  {allLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.warehouseName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity (pcs) *
              </label>
              <input
                type="number"
                {...regTransfer('quantity', { required: true, min: 1 })}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                {...regTransfer('reference')}
                placeholder="e.g. Moving to dispatch rack for upcoming shipment"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTransferring}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
              >
                {isTransferring ? 'Moving...' : 'Execute Stock Transfer'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 3: Record Damaged */}
        <Modal
          isOpen={isDamageModalOpen}
          onClose={() => setIsDamageModalOpen(false)}
          title="Write-Off Damaged Stock"
          subtitle="Deducts damaged pieces from rack and records audit loss."
          maxWidth="md"
        >
          <form onSubmit={handleDamageSubmit(onDamageSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product SKU *
              </label>
              <select
                {...regDamage('variantId', { required: true })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select SKU variant...</option>
                {allVariants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.productName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Location Bin *
              </label>
              <select
                {...regDamage('locationId', { required: true })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select location...</option>
                {allLocations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} ({loc.warehouseName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity (pcs) *
              </label>
              <input
                type="number"
                {...regDamage('quantity', { required: true, min: 1 })}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Damage Reason *
              </label>
              <input
                type="text"
                {...regDamage('reason', { required: true })}
                placeholder="e.g. Oil stain / torn stitching during transit"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDamageModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDamaging}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition disabled:opacity-50"
              >
                {isDamaging ? 'Writing off...' : 'Confirm Write-Off'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 4: Add Warehouse */}
        <Modal
          isOpen={isAddWarehouseModalOpen}
          onClose={() => setIsAddWarehouseModalOpen(false)}
          title="Add New Warehouse"
          maxWidth="sm"
        >
          <form onSubmit={handleWhSubmit(onWhSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Warehouse Name *
              </label>
              <input
                type="text"
                {...regWh('name', { required: true })}
                placeholder="e.g. Lahore Depot"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                {...regWh('address')}
                placeholder="City / Area"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddWarehouseModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingWh}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition"
              >
                Create Warehouse
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 5: Add Location / Rack */}
        <Modal
          isOpen={isAddLocationModalOpen}
          onClose={() => setIsAddLocationModalOpen(false)}
          title="Add Rack / Bin Location"
          maxWidth="sm"
        >
          <form onSubmit={handleLocSubmit(onLocSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rack Code *
              </label>
              <input
                type="text"
                {...regLoc('code', { required: true })}
                placeholder="e.g. A-04 / Rack 8"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                {...regLoc('description')}
                placeholder="e.g. Export Cartons Only"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddLocationModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingLoc}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition"
              >
                Create Rack
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
