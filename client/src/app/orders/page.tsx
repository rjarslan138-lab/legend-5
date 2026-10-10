'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useConfirmOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useRecordPaymentMutation,
  useGetCustomersQuery,
  useGetProductsQuery,
} from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { formatPKR, formatDate, formatDateTime } from '@/utils/formatters';
import {
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiTrash2,
  FiArrowRight,
  FiCalendar,
} from 'react-icons/fi';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Queries
  const { data: response, isLoading } = useGetOrdersQuery({
    status: selectedStatusTab === 'ALL' ? undefined : selectedStatusTab,
  });
  const { data: orderDetailResponse, isLoading: isLoadingDetail } = useGetOrderQuery(
    selectedOrderId as string,
    { skip: !selectedOrderId }
  );
  const { data: customersResponse } = useGetCustomersQuery({});
  const { data: productsResponse } = useGetProductsQuery({});

  // Mutations
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation();

  const orders = response?.data?.orders || [];
  const activeOrder = orderDetailResponse?.data;
  const customers = customersResponse?.data?.customers || [];
  const products = productsResponse?.data?.products || [];

  const allVariants = products.flatMap((p: any) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
    }))
  );

  // Create Order Form
  const {
    register: regOrder,
    control: controlOrder,
    handleSubmit: handleOrderSubmit,
    reset: resetOrder,
    watch: watchOrder,
  } = useForm({
    defaultValues: {
      customerId: '',
      deliveryDate: '',
      notes: '',
      items: [{ variantId: '', quantity: 10, unitPrice: 1500 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: controlOrder,
    name: 'items',
  });

  // Record Payment Form
  const {
    register: regPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
  } = useForm({
    defaultValues: {
      amount: 0,
      method: 'CASH',
      note: '',
    },
  });

  const onCreateSubmit = async (formData: any) => {
    try {
      const items = formData.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));

      const res = await createOrder({
        customerId: formData.customerId,
        deliveryDate: formData.deliveryDate || null,
        notes: formData.notes || null,
        items,
      }).unwrap();

      toast.success(`Order ${res.data.orderNo} created as DRAFT!`);
      setIsCreateModalOpen(false);
      resetOrder();
      setSelectedOrderId(res.data.id);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to create order');
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId).unwrap();
      toast.success('Order CONFIRMED! Warehouse inventory deducted.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not confirm order');
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await updateStatus({ id: orderId, status: nextStatus }).unwrap();
      toast.success(`Order status changed to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to change status');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    try {
      await cancelOrder(selectedOrderId).unwrap();
      toast.success('Order CANCELLED. Any deducted inventory has been restored.');
      setIsCancelConfirmOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to cancel order');
    }
  };

  const onPaymentSubmit = async (formData: any) => {
    if (!selectedOrderId) return;
    try {
      await recordPayment({
        orderId: selectedOrderId,
        amount: Number(formData.amount),
        method: formData.method,
        note: formData.note || null,
      }).unwrap();

      toast.success('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      resetPayment();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not record payment');
    }
  };

  const statusTabs = [
    'ALL',
    'DRAFT',
    'CONFIRMED',
    'PACKED',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
  ];

  const columns: Column<any>[] = [
    {
      key: 'orderNo',
      header: 'Order #',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-teal-400">{item.orderNo}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-100">{item.customer?.name}</span>
          <p className="text-[11px] text-slate-500">{item.customer?.city}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Fulfillment',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.paymentStatus} size="sm" />,
    },
    {
      key: 'totalAmount',
      header: 'Order Total',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-200">{formatPKR(item.totalAmount)}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid Amount',
      sortable: true,
      render: (item) => (
        <span className="text-emerald-400 font-medium">{formatPKR(item.paidAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Order Date',
      sortable: true,
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item) => (
        <button
          onClick={() => setSelectedOrderId(item.id)}
          className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center space-x-1"
        >
          <span>Details</span>
          <FiArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Orders & Payments</h1>
            <p className="text-xs text-slate-400 mt-1">
              Fulfillment lifecycle, automatic inventory reservation upon confirmation, and payment collections.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create New Order</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                selectedStatusTab === tab
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          searchPlaceholder="Search by order number (e.g. SHOP-1842) or customer name..."
          onRowClick={(item) => setSelectedOrderId(item.id)}
        />

        {/* Order Details Drawer / Modal */}
        <Modal
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          title={activeOrder ? `Order ${activeOrder.orderNo}` : 'Order Details'}
          subtitle={activeOrder ? `${activeOrder.customer?.name} • ${formatDate(activeOrder.createdAt)}` : ''}
          maxWidth="xl"
        >
          {isLoadingDetail || !activeOrder ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading order info...</div>
          ) : (
            <div className="space-y-5 text-xs">
              {/* Status & Summary Badges */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Fulfillment Status</span>
                  <div className="mt-1">
                    <StatusBadge status={activeOrder.status} />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Status</span>
                  <div className="mt-1">
                    <StatusBadge status={activeOrder.paymentStatus} />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Outstanding</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    {formatPKR(Math.max(0, activeOrder.totalAmount - activeOrder.paidAmount))}
                  </span>
                </div>
              </div>

              {/* Order Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeOrder.status === 'DRAFT' && (
                  <button
                    onClick={() => handleConfirmOrder(activeOrder.id)}
                    disabled={isConfirming}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-semibold transition flex items-center space-x-1.5"
                  >
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Order (Deduct Stock)</span>
                  </button>
                )}

                {activeOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusChange(activeOrder.id, 'PACKED')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-medium transition"
                  >
                    Mark as PACKED
                  </button>
                )}

                {activeOrder.status === 'PACKED' && (
                  <button
                    onClick={() => handleStatusChange(activeOrder.id, 'DISPATCHED')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium transition"
                  >
                    Mark as DISPATCHED
                  </button>
                )}

                {activeOrder.status === 'DISPATCHED' && (
                  <button
                    onClick={() => handleStatusChange(activeOrder.id, 'DELIVERED')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium transition"
                  >
                    Mark as DELIVERED
                  </button>
                )}

                {activeOrder.status !== 'CANCELLED' && activeOrder.paymentStatus !== 'PAID' && (
                  <button
                    onClick={() => {
                      resetPayment({
                        amount: activeOrder.totalAmount - activeOrder.paidAmount,
                        method: 'CASH',
                        note: '',
                      });
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-900/50 rounded font-medium transition flex items-center space-x-1.5"
                  >
                    <FiDollarSign className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}

                {activeOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-900/60 rounded font-medium transition ml-auto flex items-center space-x-1"
                  >
                    <FiXCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              {/* Order Line Items */}
              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
                  Line Items ({activeOrder.items?.length || 0})
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                        <th className="p-2.5">SKU / Product</th>
                        <th className="p-2.5">Size / Color</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {activeOrder.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-2.5">
                            <span className="font-mono text-teal-400 font-semibold">{item.variant?.sku}</span>
                            <p className="text-[11px] text-slate-300">{item.variant?.product?.name}</p>
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {item.variant?.size} • {item.variant?.color}
                          </td>
                          <td className="p-2.5 font-bold text-slate-200">{item.quantity}</td>
                          <td className="p-2.5 text-slate-300">{formatPKR(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-100">
                            {formatPKR(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
                  Payment History ({activeOrder.payments?.length || 0})
                </h4>
                {activeOrder.payments?.length === 0 ? (
                  <p className="text-slate-500 italic py-2">No payments received yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeOrder.payments?.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-400">
                            {formatPKR(payment.amount)}
                          </span>
                          <span className="text-slate-400 ml-2">via {payment.method}</span>
                          {payment.note && <p className="text-[11px] text-slate-500 mt-0.5">{payment.note}</p>}
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {formatDateTime(payment.receivedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Create Order Wizard Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Customer Order (DRAFT)"
          subtitle="Select customer, add style variants and define unit prices."
          maxWidth="xl"
        >
          <form onSubmit={handleOrderSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer / Shop *
                </label>
                <select
                  {...regOrder('customerId', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  {...regOrder('deliveryDate')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Order Items:
                </label>
                <button
                  type="button"
                  onClick={() => append({ variantId: '', quantity: 10, unitPrice: 1500 })}
                  className="text-xs text-teal-400 hover:underline font-medium"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg items-center"
                  >
                    <div className="col-span-6">
                      <select
                        {...regOrder(`items.${idx}.variantId` as const, { required: true })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:border-teal-500"
                      >
                        <option value="">Select SKU...</option>
                        {allVariants.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.sku} - {v.productName} ({v.size})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Qty"
                        {...regOrder(`items.${idx}.quantity` as const, { required: true, min: 1 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Price"
                        {...regOrder(`items.${idx}.unitPrice` as const, { required: true })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Internal Remarks / Shipping Notes
              </label>
              <textarea
                {...regOrder('notes')}
                rows={2}
                placeholder="e.g. Bilty via Faisal Movers / Khurshid Goods"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Save Draft Order'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Record Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Customer Payment"
          subtitle={`For order ${activeOrder?.orderNo}`}
          maxWidth="sm"
        >
          <form onSubmit={handlePaymentSubmit(onPaymentSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount Received (PKR) *
              </label>
              <input
                type="number"
                {...regPayment('amount', { required: true, min: 1 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Channel *
              </label>
              <select
                {...regPayment('method')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="CASH">CASH</option>
                <option value="BANK">BANK (Online Transfer / Raast)</option>
                <option value="JAZZCASH">JAZZCASH</option>
                <option value="EASYPAISA">EASYPAISA</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Receipt Note / Bank Reference
              </label>
              <input
                type="text"
                {...regPayment('note')}
                placeholder="e.g. Meezan Bank Ref # 882910"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition disabled:opacity-50"
              >
                {isPaying ? 'Saving...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isCancelConfirmOpen}
          onClose={() => setIsCancelConfirmOpen(false)}
          onConfirm={handleCancelOrder}
          title="Cancel Customer Order"
          message="Are you sure you want to cancel this order? Any inventory deducted upon confirmation will be automatically restored to warehouse stock."
          confirmText="Yes, Cancel Order"
          isDestructive
          isLoading={isCancelling}
        />
      </div>
    </AppLayout>
  );
}
