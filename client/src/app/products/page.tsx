'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetFabricBatchesQuery,
  useCreateVariantMutation,
} from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { formatPKR } from '@/utils/formatters';
import { FiPlus, FiBox, FiSearch, FiLayers, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const canEdit = user?.role === 'OWNER' || user?.role === 'STOREKEEPER';

  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const { data: response, isLoading } = useGetProductsQuery({
    search: searchTerm,
    lowStock: lowStockFilter ? 'true' : undefined,
  });
  const { data: fabricResponse } = useGetFabricBatchesQuery({});
  const [createProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const [createVariant, { isLoading: isCreatingVariant }] = useCreateVariantMutation();
  const [deleteProduct, { isLoading: isDeletingProduct }] = useDeleteProductMutation();

  const products = response?.data?.products || [];
  const fabricBatches = fabricResponse?.data?.batches || [];

  // Form for New Product Style + Variant Matrix
  const {
    register: regProduct,
    handleSubmit: handleProductSubmit,
    reset: resetProduct,
    formState: { errors: productErrors },
  } = useForm({
    defaultValues: {
      name: '',
      skuPrefix: '',
      category: 'Kids Wear',
      description: '',
      basePrice: 1500,
      color: 'Navy Blue',
      fabricBatchId: '',
      costPrice: 750,
      sizes: '0–5Y, 6–10Y, 11–14Y',
    },
  });

  // Form for single variant addition
  const {
    register: regVariant,
    handleSubmit: handleVariantSubmit,
    reset: resetVariant,
  } = useForm({
    defaultValues: {
      sku: '',
      size: 'M',
      color: 'Black',
      fabricBatchId: '',
      price: 1500,
      costPrice: 750,
      reorderLevel: 20,
    },
  });

  const onProductSubmit = async (formData: any) => {
    try {
      // Generate variants matrix from comma-separated sizes
      const sizeList = formData.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
      const variants = sizeList.map((size: string, idx: number) => ({
        sku: `${formData.skuPrefix.toUpperCase()}-${formData.color.toUpperCase().slice(0, 3)}-${size.replace(/[^a-zA-Z0-9]/g, '')}`,
        size,
        color: formData.color,
        fabricBatchId: formData.fabricBatchId || null,
        price: Number(formData.basePrice),
        costPrice: Number(formData.costPrice),
        reorderLevel: 20,
      }));

      await createProduct({
        name: formData.name,
        skuPrefix: formData.skuPrefix.toUpperCase(),
        category: formData.category,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        variants,
      }).unwrap();

      toast.success(`Product style '${formData.name}' created with ${variants.length} SKU variants!`);
      setIsProductModalOpen(false);
      resetProduct();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to create product');
    }
  };

  const onVariantSubmit = async (formData: any) => {
    if (!activeProductId) return;
    try {
      await createVariant({
        productId: activeProductId,
        sku: formData.sku,
        size: formData.size,
        color: formData.color,
        fabricBatchId: formData.fabricBatchId || null,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        reorderLevel: Number(formData.reorderLevel),
      }).unwrap();

      toast.success(`SKU variant '${formData.sku}' added!`);
      setIsVariantModalOpen(false);
      resetVariant();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to add variant');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    try {
      await deleteProduct(deleteProductId).unwrap();
      toast.success('Product style deleted');
      setDeleteProductId(null);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not delete product');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Products & SKU Matrix</h1>
            <p className="text-xs text-slate-400 mt-1">
              Styles, size/color variant matrix, stock levels and raw fabric traceability links.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Style + Matrix</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search styles by name, category, or SKU prefix..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center space-x-1.5 ${
                lowStockFilter
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FiAlertCircle className="w-3.5 h-3.5" />
              <span>Low-Stock Only</span>
            </button>
          </div>
        </div>

        {/* Product Style Cards & Variants Matrix */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <FiBox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No product styles found</p>
            <p className="text-xs text-slate-500 mt-1">Try modifying your search or add a new style.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product: any) => (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Product Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-800 rounded-lg text-teal-400 font-mono font-bold text-xs">
                      {product.skuPrefix}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>{product.name}</span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 font-normal px-2 py-0.5 rounded border border-slate-700">
                          {product.category}
                        </span>
                      </h2>
                      {product.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{product.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px]">Total Stock</span>
                      <p className="font-bold text-slate-200">
                        {product.totalStock || 0} <span className="font-normal text-slate-400">pcs</span>
                      </p>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setActiveProductId(product.id);
                          setIsVariantModalOpen(true);
                        }}
                        className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700 transition flex items-center space-x-1"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        <span>Add SKU</span>
                      </button>
                    )}

                    {user?.role === 'OWNER' && (
                      <button
                        onClick={() => setDeleteProductId(product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        title="Delete Style"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800/80">
                        <th className="px-4 py-2.5 font-semibold">SKU Code</th>
                        <th className="px-4 py-2.5 font-semibold">Size</th>
                        <th className="px-4 py-2.5 font-semibold">Color</th>
                        <th className="px-4 py-2.5 font-semibold">Fabric Batch Link</th>
                        <th className="px-4 py-2.5 font-semibold">Wholesale Price</th>
                        <th className="px-4 py-2.5 font-semibold">Current Stock</th>
                        <th className="px-4 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {product.variants.map((variant: any) => (
                        <tr key={variant.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-2.5 font-mono font-semibold text-teal-400">
                            {variant.sku}
                          </td>
                          <td className="px-4 py-2.5 text-slate-200 font-medium">
                            {variant.size}
                          </td>
                          <td className="px-4 py-2.5 text-slate-300">
                            {variant.color}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono">
                            {variant.fabricBatch ? (
                              <span className="inline-flex items-center space-x-1 text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                                <FiLayers className="w-3 h-3 text-teal-400" />
                                <span>{variant.fabricBatch.batchCode} ({variant.fabricBatch.fabricType})</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">No batch linked</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-200 font-medium">
                            {formatPKR(variant.price)}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-100">
                            {variant.currentStock || 0} pcs
                          </td>
                          <td className="px-4 py-2.5">
                            {variant.isLowStock ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
                                <FiAlertCircle className="w-3 h-3" />
                                <span>Low ({variant.currentStock} / {variant.reorderLevel})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Product + Matrix Modal */}
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title="Create Product Style + Matrix"
          subtitle="Define a style name and size list to generate variants automatically."
          maxWidth="lg"
        >
          <form onSubmit={handleProductSubmit(onProductSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Style Name *
                </label>
                <input
                  type="text"
                  {...regProduct('name', { required: true })}
                  placeholder="e.g. Kids Fleece Hoodie"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SKU Prefix *
                </label>
                <input
                  type="text"
                  {...regProduct('skuPrefix', { required: true })}
                  placeholder="e.g. KFH"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  {...regProduct('category')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                >
                  <option value="Kids Wear">Kids Wear</option>
                  <option value="Men Wear">Men Wear</option>
                  <option value="Women Wear">Women Wear</option>
                  <option value="Athleisure">Athleisure</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Base Wholesale Price (PKR) *
                </label>
                <input
                  type="number"
                  {...regProduct('basePrice', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  {...regProduct('color', { required: true })}
                  placeholder="e.g. Navy Blue"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Estimated Unit Cost (PKR) *
                </label>
                <input
                  type="number"
                  {...regProduct('costPrice', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Raw Fabric Batch Link (Traceability)
              </label>
              <select
                {...regProduct('fabricBatchId')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition font-mono"
              >
                <option value="">-- No raw batch linked yet --</option>
                {fabricBatches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} - {b.fabricType} ({b.color}, {b.supplier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Size Matrix (Comma-separated) *
              </label>
              <input
                type="text"
                {...regProduct('sizes', { required: true })}
                placeholder="e.g. 0–5Y, 6–10Y, 11–14Y or S, M, L, XL"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Each size will generate a unique SKU variant linked to this style.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingProduct}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {isCreatingProduct ? 'Creating...' : 'Generate Style & Variants'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Single Variant Modal */}
        <Modal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          title="Add SKU Variant"
          subtitle="Add an individual size/color SKU to the selected style."
          maxWidth="md"
        >
          <form onSubmit={handleVariantSubmit(onVariantSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SKU Code *
              </label>
              <input
                type="text"
                {...regVariant('sku', { required: true })}
                placeholder="e.g. 92204 or KFH-XL-NVY"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono uppercase focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Size *
                </label>
                <input
                  type="text"
                  {...regVariant('size', { required: true })}
                  placeholder="e.g. 0–5Y"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  {...regVariant('color', { required: true })}
                  placeholder="e.g. Navy Blue"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Price (PKR) *
                </label>
                <input
                  type="number"
                  {...regVariant('price', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cost (PKR) *
                </label>
                <input
                  type="number"
                  {...regVariant('costPrice', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fabric Batch (Traceability)
              </label>
              <select
                {...regVariant('fabricBatchId')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition font-mono"
              >
                <option value="">-- No batch linked --</option>
                {fabricBatches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} - {b.fabricType} ({b.color})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingVariant}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {isCreatingVariant ? 'Saving...' : 'Save SKU'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Style Dialog */}
        <ConfirmDialog
          isOpen={!!deleteProductId}
          onClose={() => setDeleteProductId(null)}
          onConfirm={handleDeleteProduct}
          title="Delete Product Style"
          message="Are you sure you want to delete this style and all its SKU variants? This cannot be undone."
          confirmText="Delete Style"
          isDestructive
          isLoading={isDeletingProduct}
        />
      </div>
    </AppLayout>
  );
}
