'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiLayers,
  FiBox,
  FiCheckCircle,
  FiZap,
  FiLoader,
  FiAlertCircle,
  FiHeart,
} from 'react-icons/fi';
import ThemeToggle from '@/components/ui/ThemeToggle';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Owner', email: 'owner@garmentflow.pk', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/5', border: 'border-amber-300 dark:border-amber-500/20 hover:border-amber-400' },
  { role: 'Storekeeper', email: 'storekeeper@garmentflow.pk', color: 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/5', border: 'border-brand-300 dark:border-brand-500/20 hover:border-brand-400' },
  { role: 'Sales', email: 'sales@garmentflow.pk', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5', border: 'border-emerald-300 dark:border-emerald-500/20 hover:border-emerald-400' },
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'owner@garmentflow.pk', password: 'Password@123' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await loginApi(data).unwrap();
      if (res.success && res.data) {
        dispatch(setCredentials({ user: res.data.user }));
        toast.success(`Welcome back, ${res.data.user.name}!`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Login failed. Check your credentials.');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password@123');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-white">
      {/* ─── Left Branded Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 text-white">
        {/* Decorative grid */}
        <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-600/20 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-display font-bold text-xl text-white backdrop-blur-sm shadow-sm">
              G
            </div>
            <span className="font-display font-bold text-xl text-white">
              Garment<span className="text-brand-300">Flow</span>
            </span>
          </Link>
          <ThemeToggle variant="pill" />
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display font-bold text-4xl text-white leading-tight mb-3">
              From fabric roll<br />to final payment
            </h2>
            <p className="text-brand-200 text-base leading-relaxed max-w-sm">
              Pakistan's only garment factory OS that traces every SKU from raw material to customer delivery.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: FiLayers, text: 'Real-time fabric & finished goods inventory' },
              { icon: FiBox, text: 'SKU traceability from batch to bin to buyer' },
              { icon: FiCheckCircle, text: 'Orders, payments and receivables — one screen' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-300" />
                </div>
                <p className="text-sm text-brand-100 font-medium">{text}</p>
              </div>
            ))}
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {[
              { value: '500+', label: 'Factories' },
              { value: '98%', label: 'Uptime' },
              { value: '₨ 0', label: 'Setup fee' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display font-bold text-xl text-white">{value}</div>
                <div className="text-xs text-brand-200/80">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-brand-300/70 flex items-center gap-1">
          © {new Date().getFullYear()} GarmentFlow. Made with <FiHeart className="w-3 h-3 text-rose-400 fill-rose-400" /> in Pakistan.
        </p>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-10 lg:px-16 bg-white dark:bg-surface-950">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between gap-2.5 mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-display font-bold text-lg text-white shadow-sm">
                G
              </div>
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Garment<span className="text-brand-600 dark:text-brand-400">Flow</span>
              </span>
            </Link>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Sign in to your factory dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  {...register('email')}
                  autoFocus
                  className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-sm ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20'
                  }`}
                  placeholder="name@yourfactory.pk"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-sm ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md shadow-brand-900/20 hover:shadow-brand-glow mt-2"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quick Demo Access</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ role, email, color, border }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(email)}
                  className={`py-2 px-3 border ${border} ${color} rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Register factory free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
