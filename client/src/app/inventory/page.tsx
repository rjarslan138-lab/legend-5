'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGetFabricBatchesQuery,
  useCreateFabricBatchMutation,
  useUpdateFabricBatchMutation,
  useDeleteFabricBatchMutation,
} from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { formatPKR, formatDate, formatWeight, formatLength } from '@/utils/formatters';
import { FiPlus, FiEdit2, FiTrash2, FiLayers } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const fabricSchema = z.object({
  batchCode: z.string().min(1, 'Batch code is required (e.g. B-2409)'),
  fabricType: z.string().min(1, 'Fabric type is required'),
  color: z.string().min(1, 'Color is required'),
  supplier: z.string().min(1, 'Supplier name is required'),
  rollCount: z.coerce.number().int().min(1),
  weightKg: z.coerce.number().positive('Weight must be > 0'),
  lengthMeters: z.coerce.number().positive().optional().nullable(),
  costPerUnit: z.coerce.number().positive('Cost/kg must be > 0'),
  wastageKg: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

type FabricFormData = z.infer<typeof fabricSchema>;

export default function InventoryPage() {
  const { user } = useAppSelector((state) => state.auth);
  const canEdit = user?.role === 'OWNER' || user?.role === 'STOREKEEPER';

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: response, isLoading } = useGetFabricBatchesQuery({ search });
  const [createBatch, { isLoading: isCreating }] = useCreateFabricBatchMutation();
  const [updateBatch, { isLoading: isUpdating }] = useUpdateFabricBatchMutation();
  const [deleteBatch, { isLoading: isDeleting }] = useDeleteFabricBatchMutation();

  const batches = response?.data?.batches || [];
  const summary = response?.data?.summary;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FabricFormData>({
    resolver: zodResolver(fabricSchema),
  });

  const openAddModal = () => {
    setSelectedBatch(null);
    reset({
      batchCode: '',
      fabricType: 'Single Jersey (180 GSM)',
      color: '',
      supplier: '',
      rollCount: 1,
      weightKg: 50,
      lengthMeters: null,
      costPerUnit: 1100,
      wastageKg: 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (batch: any) => {
    setSelectedBatch(batch);
    reset({
      batchCode: batch.batchCode,
      fabricType: batch.fabricType,
      color: batch.color,
      supplier: batch.supplier,
      rollCount: batch.rollCount,
      weightKg: batch.weightKg,
      lengthMeters: batch.lengthMeters,
      costPerUnit: batch.costPerUnit,
      wastageKg: batch.wastageKg,
      notes: batch.notes || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FabricFormData) => {
    try {
      if (selectedBatch) {
        await updateBatch({ id: selectedBatch.id, ...data }).unwrap();
        toast.success(`Batch ${data.batchCode} updated`);
      } else {
        await createBatch(data).unwrap();
        toast.success(`Fabric batch ${data.batchCode} added`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBatch(deleteId).unwrap();
      toast.success('Fabric batch deleted');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not delete batch');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'batchCode',
      header: 'Batch Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-semibold text-teal-400">{item.batchCode}</span>
      ),
    },
    {
      key: 'fabricType',
      header: 'Fabric Type',
      sortable: true,
      render: (item) => (
        <div>
          <span className="text-slate-100 font-medium">{item.fabricType}</span>
          <p className="text-[11px] text-slate-500">{item.color}</p>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortable: true,
    },
    {
      key: 'weightKg',
      header: 'Weight / Rolls',
      sortable: true,
      render: (item) => (
        <div>
          <span className="text-slate-200 font-medium">{formatWeight(item.weightKg)}</span>
          <p className="text-[11px] text-slate-500">{item.rollCount} rolls</p>
        </div>
      ),
    },
    {
      key: 'costPerUnit',
      header: 'Cost / Kg',
      sortable: true,
      render: (item) => formatPKR(item.costPerUnit),
    },
    {
      key: 'wastageKg',
      header: 'Wastage',
      render: (item) => (
        <span className={item.wastageKg > 0 ? 'text-amber-400' : 'text-slate-500'}>
          {formatWeight(item.wastageKg)}
        </span>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Received Date',
      sortable: true,
      render: (item) => formatDate(item.receivedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(item);
              }}
              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition"
              title="Edit Batch"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          )}
          {user?.role === 'OWNER' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(item.id);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
              title="Delete Batch"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Fabric Inventory</h1>
            <p className="text-xs text-slate-400 mt-1">
              Raw fabric rolls, batches, yarn weight, supplier cost & wastage tracking.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition"
            >
              <FiPlus className="w-4 h-4" />
              <span>Receive New Fabric</span>
            </button>
          )}
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400">Total Available Fabric</span>
            <p className="text-xl font-bold text-white mt-1">
              {formatWeight(summary?.totalNetWeightKg)}
            </p>
            <p className="text-[11px] text-teal-400 mt-0.5">
              Net of wastage ({formatLength(summary?.totalLengthMeters)})
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400">Total Raw Inventory Value</span>
            <p className="text-xl font-bold text-teal-300 mt-1">
              {formatPKR(summary?.totalValuePkr)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">At landed cost per kg</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400">Recorded Scrap & Wastage</span>
            <p className="text-xl font-bold text-amber-400 mt-1">
              {formatWeight(summary?.totalWastageKg)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cutting room loss</p>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={batches}
          isLoading={isLoading}
          searchPlaceholder="Search by batch code, fabric type, supplier or color..."
        />

        {/* Add / Edit Batch Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedBatch ? 'Edit Fabric Batch' : 'Receive Fabric Lot'}
          subtitle="Record new fabric arrival with supplier details and weight."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Batch Code *
                </label>
                <input
                  type="text"
                  {...register('batchCode')}
                  placeholder="e.g. B-2409"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-mono"
                />
                {errors.batchCode && (
                  <p className="mt-1 text-xs text-rose-400">{errors.batchCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier / Mill *
                </label>
                <input
                  type="text"
                  {...register('supplier')}
                  placeholder="e.g. Sitara Textiles"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
                {errors.supplier && (
                  <p className="mt-1 text-xs text-rose-400">{errors.supplier.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fabric Type *
                </label>
                <input
                  type="text"
                  {...register('fabricType')}
                  placeholder="e.g. Heavy Fleece (320 GSM)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
                {errors.fabricType && (
                  <p className="mt-1 text-xs text-rose-400">{errors.fabricType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  {...register('color')}
                  placeholder="e.g. Navy Blue"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
                {errors.color && (
                  <p className="mt-1 text-xs text-rose-400">{errors.color.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Weight (Kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weightKg')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
                {errors.weightKg && (
                  <p className="mt-1 text-xs text-rose-400">{errors.weightKg.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Roll Count *
                </label>
                <input
                  type="number"
                  {...register('rollCount')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cost (PKR/Kg) *
                </label>
                <input
                  type="number"
                  {...register('costPerUnit')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Length (Meters - optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('lengthMeters')}
                  placeholder="e.g. 140"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cutting Wastage (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('wastageKg')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Dye lot, GSM details, or receiving remarks..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {selectedBatch ? 'Save Changes' : 'Save Fabric Batch'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Fabric Batch"
          message="Are you sure you want to delete this fabric batch? This will detach any product variants linked to it."
          confirmText="Delete Batch"
          isDestructive
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
