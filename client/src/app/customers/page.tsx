'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useGetCustomerQuery,
} from '@/store/api/apiSlice';
import { formatPKR, formatDate } from '@/utils/formatters';
import {
  FiUsers,
  FiPlus,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiFileText,
  FiArrowRight,
} from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: response, isLoading } = useGetCustomersQuery({});
  const { data: detailResponse, isLoading: isLoadingDetail } = useGetCustomerQuery(
    selectedCustomerId as string,
    { skip: !selectedCustomerId }
  );

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();

  const customers = response?.data?.customers || [];
  const customerDetail = detailResponse?.data;

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      type: 'SHOP',
      phone: '',
      city: 'Faisalabad',
      address: '',
      creditLimit: 200000,
      notes: '',
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      await createCustomer({
        ...formData,
        creditLimit: Number(formData.creditLimit),
      }).unwrap();
      toast.success(`Customer '${formData.name}' added`);
      setIsAddModalOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not add customer');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-100">{item.name}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item) => <StatusBadge status={item.type} size="sm" />,
    },
    {
      key: 'city',
      header: 'City / Region',
      sortable: true,
      render: (item) => (
        <span className="text-slate-300 font-medium">{item.city}</span>
      ),
    },
    {
      key: 'orderCount',
      header: 'Orders',
      sortable: true,
      render: (item) => (
        <span className="text-slate-300 font-medium">{item.orderCount || 0}</span>
      ),
    },
    {
      key: 'totalBilled',
      header: 'Total Billed',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-200">{formatPKR(item.totalBilled)}</span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding Balance',
      sortable: true,
      render: (item) =>
        item.outstanding > 0 ? (
          <span className="font-bold text-amber-400">{formatPKR(item.outstanding)}</span>
        ) : (
          <span className="text-emerald-400 text-xs">Settled</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item) => (
        <button
          onClick={() => setSelectedCustomerId(item.id)}
          className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center space-x-1"
        >
          <span>Ledger</span>
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Customers & Client Ledger</h1>
            <p className="text-xs text-slate-400 mt-1">
              Shops and wholesale distributors across Pakistan, credit limits, order balances & payment ledger.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          searchPlaceholder="Search customers by shop name, city, phone..."
          onRowClick={(item) => setSelectedCustomerId(item.id)}
        />

        {/* Customer Ledger Drawer / Modal */}
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          title={customerDetail?.name || 'Customer Ledger'}
          subtitle={`${customerDetail?.type || ''} • ${customerDetail?.city || ''}`}
          maxWidth="xl"
        >
          {isLoadingDetail ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading ledger data...</div>
          ) : (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Invoiced</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {formatPKR(customerDetail?.totalBilled)}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400">Payments Collected</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {formatPKR(customerDetail?.totalPaid)}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400">Due Receivable</span>
                  <p className="text-base font-bold text-amber-400 mt-0.5">
                    {formatPKR(customerDetail?.outstanding)}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs space-y-1 text-slate-300">
                <p>
                  <strong>Phone:</strong> {customerDetail?.phone}
                </p>
                {customerDetail?.address && (
                  <p>
                    <strong>Address:</strong> {customerDetail?.address}
                  </p>
                )}
                <p>
                  <strong>Credit Limit:</strong> {formatPKR(customerDetail?.creditLimit)}
                </p>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Order & Payment History ({customerDetail?.orders?.length || 0})
                </h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {customerDetail?.orders?.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-teal-400">{order.orderNo}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={order.status} size="sm" />
                          <StatusBadge status={order.paymentStatus} size="sm" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                        <span className="text-slate-400">
                          {order.items?.length || 0} style items
                        </span>
                        <div>
                          <span className="text-slate-300 font-medium mr-2">
                            Total: {formatPKR(order.totalAmount)}
                          </span>
                          <span className="text-emerald-400 font-medium">
                            Paid: {formatPKR(order.paidAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Customer Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Customer Account"
          subtitle="Register a new retail shop or wholesale buyer."
          maxWidth="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Shop / Buyer Name *
              </label>
              <input
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Al-Madina Garments"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                >
                  <option value="SHOP">SHOP (Retailer)</option>
                  <option value="WHOLESALER">WHOLESALER (Distributor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  {...register('city', { required: true })}
                  placeholder="e.g. Faisalabad, Lahore, Karachi"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  {...register('phone', { required: true })}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credit Limit (PKR)
                </label>
                <input
                  type="number"
                  {...register('creditLimit')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Shop Address
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="Market / Plaza details"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : 'Create Customer'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
