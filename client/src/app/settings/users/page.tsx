'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/formatters';
import { FiPlus, FiUserCheck, FiTrash2, FiShield } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function UsersSettingsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: response, isLoading } = useGetUsersQuery(undefined, {
    skip: user?.role !== 'OWNER',
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = response?.data || [];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'SALES',
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      await createUser(formData).unwrap();
      toast.success(`User '${formData.name}' created with role ${formData.role}!`);
      setIsAddModalOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (targetUser: any) => {
    try {
      await updateUser({ id: targetUser.id, isActive: !targetUser.isActive }).unwrap();
      toast.success(
        `User ${targetUser.name} has been ${targetUser.isActive ? 'deactivated' : 'activated'}`
      );
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId).unwrap();
      toast.success('User deleted');
      setDeleteUserId(null);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Could not delete user');
    }
  };

  if (user?.role !== 'OWNER') {
    return (
      <AppLayout>
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <FiShield className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Owner Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-1">
            Staff user management and role assignment is restricted to Organization Owners.
          </p>
        </div>
      </AppLayout>
    );
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-100">{item.name}</span>
          <p className="text-[11px] text-slate-400">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role Guard',
      sortable: true,
      render: (item) => <StatusBadge status={item.role} size="sm" />,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
            item.isActive
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {item.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.id !== user.id && (
            <>
              <button
                onClick={() => handleToggleActive(item)}
                className="text-xs text-slate-400 hover:text-teal-300 font-medium px-2 py-1 bg-slate-800 rounded border border-slate-700 transition"
              >
                {item.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setDeleteUserId(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                title="Delete User"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Staff Accounts & Roles</h1>
            <p className="text-xs text-slate-400 mt-1">
              Role-based access control for OWNER, STOREKEEPER, PRODUCTION, and SALES personnel.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Staff User</span>
          </button>
        </div>

        {/* Users Table */}
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Search staff by name or email..."
        />

        {/* Add User Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create Factory Staff User"
          subtitle="Assign roles and generate login credentials for team members."
          maxWidth="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Rashid Mahmood"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                {...register('email', { required: true })}
                placeholder="e.g. rashid@garmentflow.pk"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Temporary Password (min 8 chars) *
              </label>
              <input
                type="password"
                {...register('password', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Role Guard *
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="STOREKEEPER">STOREKEEPER (Manage fabric & warehouse stock)</option>
                <option value="SALES">SALES (Orders, customers & payments)</option>
                <option value="PRODUCTION">PRODUCTION (Supervisor - read-only in Phase 1)</option>
                <option value="OWNER">OWNER (Full administrative access)</option>
              </select>
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
                {isCreating ? 'Creating...' : 'Create Staff Account'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={!!deleteUserId}
          onClose={() => setDeleteUserId(null)}
          onConfirm={handleDelete}
          title="Delete Staff Member"
          message="Are you sure you want to revoke and delete this staff account?"
          confirmText="Delete Account"
          isDestructive
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
