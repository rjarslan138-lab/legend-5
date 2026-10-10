'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FiBriefcase,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiLoader,
  FiStar,
  FiAlertCircle,
  FiLayers,
  FiBox,
  FiTruck,
  FiShoppingCart,
} from 'react-icons/fi';
import ThemeToggle from '@/components/ui/ThemeToggle';

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Factory name must be at least 2 characters'),
  name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type RegisterFormData = z.infer<typeof registerSchema>;

function FormField({
  label,
  hint,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  hint?: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
        {children}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-sm ${
    hasError
      ? 'border-red-500 focus:border-red-500'
      : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20'
  }`;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await registerApi(data).unwrap();
      if (res.success && res.data) {
        dispatch(setCredentials({ user: res.data.user }));
        toast.success(`Factory registered! Welcome ${res.data.user.name}.`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-white">
      {/* ─── Left Branded Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 text-white">
        <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-600/10 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-display font-bold text-xl text-white shadow-brand-glow">
              G
            </div>
            <span className="font-display font-bold text-xl text-white">
              Garment<span className="text-brand-400">Flow</span>
            </span>
          </Link>
          <ThemeToggle variant="pill" />
        </div>

        {/* Setup steps */}
        <div className="relative z-10">
          <h2 className="font-display font-bold text-3xl text-white mb-2 leading-tight">
            Set up your factory<br />
            <span className="gradient-text">in under 10 minutes</span>
          </h2>
          <p className="text-slate-300 text-sm mb-10">
            Join 500+ Pakistani garment factories already using GarmentFlow.
          </p>

          <div className="space-y-4">
            {[
              { step: '1', title: 'Register your organization', desc: 'Takes 60 seconds', icon: FiBriefcase },
              { step: '2', title: 'Add your first warehouse', desc: 'Set up rack locations', icon: FiTruck },
              { step: '3', title: 'Receive fabric inventory', desc: 'Log your first batch', icon: FiLayers },
              { step: '4', title: 'Create products & SKUs', desc: 'Build your catalog', icon: FiBox },
              { step: '5', title: 'Start taking orders', desc: "You're live!", icon: FiShoppingCart },
            ].map(({ step, title, desc, icon: StepIcon }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full border border-brand-500/40 bg-brand-500/15 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0 mt-0.5">
                  <StepIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 rounded-xl border border-slate-800/80 bg-slate-850/60 p-4 backdrop-blur-sm shadow-sm">
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-xs text-slate-200 italic mb-2">
            "Setup was done in one morning. By afternoon we had our whole inventory loaded."
          </p>
          <p className="text-xs text-slate-400 font-medium">— Owner, Al-Rahman Garments, Lahore</p>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-10 lg:px-16 bg-white dark:bg-surface-950">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between gap-2.5 mb-8 lg:hidden">
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
              Register your factory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Create your free GarmentFlow account — no credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              label="Factory / Organization Name"
              hint='e.g. "Crescent Apparel" or "Star Knitwear"'
              icon={FiBriefcase}
              error={errors.organizationName?.message}
            >
              <input
                type="text"
                {...register('organizationName')}
                autoFocus
                className={inputClass(!!errors.organizationName)}
                placeholder="e.g. Crescent Apparel, Faisalabad"
              />
            </FormField>

            <FormField
              label="Owner / Managing Director Name"
              icon={FiUser}
              error={errors.name?.message}
            >
              <input
                type="text"
                {...register('name')}
                className={inputClass(!!errors.name)}
                placeholder="e.g. Mian Tariq Ahmed"
              />
            </FormField>

            <FormField
              label="Work Email"
              hint="You'll use this to sign in"
              icon={FiMail}
              error={errors.email?.message}
            >
              <input
                type="email"
                {...register('email')}
                className={inputClass(!!errors.email)}
                placeholder="owner@yourfactory.pk"
              />
            </FormField>

            <FormField
              label="Password"
              hint="Minimum 8 characters"
              icon={FiLock}
              error={errors.password?.message}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`${inputClass(!!errors.password)} pr-11`}
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
            </FormField>

            {/* Terms */}
            <p className="text-xs text-slate-500 text-center pt-1">
              By registering, you agree to our{' '}
              <span className="text-slate-700 dark:text-slate-300 font-medium">Terms of Service</span> and{' '}
              <span className="text-slate-700 dark:text-slate-300 font-medium">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md shadow-brand-900/20 hover:shadow-brand-glow mt-2"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Creating Account…
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
