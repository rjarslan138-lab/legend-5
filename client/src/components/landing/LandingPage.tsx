'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiLayers,
  FiBox,
  FiTruck,
  FiShoppingCart,
  FiSearch,
  FiCheckCircle,
  FiZap,
  FiShield,
  FiBarChart2,
  FiGlobe,
  FiChevronDown,
  FiStar,
  FiUsers,
  FiActivity,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiFileText,
  FiSmartphone,
  FiScissors,
  FiArchive,
  FiHeart,
} from 'react-icons/fi';
import ThemeToggle from '../ui/ThemeToggle';

/* ─── Animated Counter ─── */
function CountUp({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref} className="stat-number">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-display font-semibold text-slate-900 dark:text-white text-lg mb-2 leading-snug">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600/0 to-brand-600/0 group-hover:from-brand-600/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ value, label, icon: Icon, suffix = '', prefix = '' }: {
  value: number; label: string; icon: React.ElementType; suffix?: string; prefix?: string;
}) {
  return (
    <div className="text-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-sm backdrop-blur-sm">
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
        <CountUp end={value} suffix={suffix} prefix={prefix} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

/* ─── Flow Step ─── */
function FlowStep({ icon: Icon, label, color, step }: {
  icon: React.ElementType; label: string; color: string; step: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg relative`}>
        <Icon className="w-7 h-7 text-white" />
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm">
          {step}
        </div>
      </div>
      <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold text-center leading-tight max-w-[70px]">{label}</span>
    </div>
  );
}

/* ─── Testimonial ─── */
function Testimonial({ quote, name, role, company }: {
  quote: string; name: string; role: string; company: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <FiStar key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-5 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white shadow-sm">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
          <p className="text-xs text-slate-500">{role} · {company}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── NavBar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 shadow-sm'
        : 'bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-display font-bold text-lg text-white shadow-brand-glow group-hover:shadow-brand-glow-lg transition-shadow">
            G
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Garment<span className="text-brand-600 dark:text-brand-400">Flow</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How it Works', href: '#how-it-works' },
            { label: 'Testimonials', href: '#testimonials' },
            { label: 'Pricing', href: '#pricing' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA & Theme */}
        <div className="flex items-center gap-3">
          <ThemeToggle variant="segmented" />
          <Link
            href="/login"
            className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-brand-900/20 hover:shadow-brand-glow"
          >
            Start Free
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  return (
    <div className="bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-white overflow-x-hidden min-h-screen">
      <Navbar />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-grid opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-700/5 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] rounded-full bg-amber-500/5 blur-[60px] pointer-events-none" />

        {/* Floating decorative elements */}
        <div className="absolute top-32 left-10 animate-float opacity-40 hidden lg:block">
          <div className="w-16 h-16 rounded-2xl border border-brand-500/30 bg-brand-500/10 flex items-center justify-center shadow-sm">
            <FiLayers className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
        <div className="absolute top-48 right-16 animate-float-delayed opacity-40 hidden lg:block">
          <div className="w-12 h-12 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <FiPackage className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float opacity-30 hidden lg:block" style={{ animationDelay: '1s' }}>
          <div className="w-14 h-14 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-sm">
            <FiBarChart2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="absolute bottom-52 right-12 animate-float-delayed opacity-30 hidden lg:block" style={{ animationDelay: '2s' }}>
          <div className="w-10 h-10 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center justify-center shadow-sm">
            <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-600/30 bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-8 animate-pulse-slow shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Pakistan's First Garment Factory OS
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6 text-slate-900 dark:text-white">
            From{' '}
            <span className="gradient-text">Fabric Roll</span>
            <br />
            to{' '}
            <span className="gradient-text-warm">Final Payment</span>
            <br />
            <span className="text-slate-700 dark:text-slate-200">— Fully Traced.</span>
          </h1>

          {/* Sub */}
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            GarmentFlow replaces Excel, WhatsApp and notebooks with one intelligent operating system.
            Track every fabric roll, batch, SKU, order and rupee — in real time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-brand-900/30 hover:shadow-brand-glow hover:-translate-y-0.5"
            >
              Start for Free
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-base rounded-2xl transition-all duration-200 bg-white dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 shadow-sm"
            >
              View Live Demo
              <FiZap className="w-4 h-4 text-amber-500" />
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
            {[
              { icon: FiCheckCircle, text: 'No credit card required' },
              { icon: FiShield, text: 'Your data is yours — GDPR aligned' },
              { icon: FiGlobe, text: 'PKR-native, Urdu-friendly' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 font-medium">
                <Icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#stats" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors animate-bounce">
          <FiChevronDown className="w-6 h-6" />
        </a>
      </section>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <section id="stats" className="py-16 border-y border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={500} suffix="+" label="Factories Onboarded" icon={FiTruck} />
            <StatCard value={2800000} suffix="+" label="Orders Processed" icon={FiShoppingCart} prefix="" />
            <StatCard value={98} suffix="%" label="On-time Delivery Rate" icon={FiClock} />
            <StatCard value={340000000} prefix="₨ " suffix="+" label="Tracked Monthly" icon={FiDollarSign} />
          </div>
        </div>
      </section>

      {/* ═══════════ THE PROBLEM & SOLUTION ═══════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: problem */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-500/8 text-red-600 dark:text-red-400 text-xs font-semibold mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              The Problem
            </div>
            <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-6 leading-tight">
              Factories run on<br />
              <span className="text-red-500">chaos</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: FiFileText, text: 'Stock tracked in 12 different Excel files no-one updates' },
                { icon: FiSmartphone, text: 'Orders received over WhatsApp — half get lost' },
                { icon: FiDollarSign, text: "No one knows what's been paid, what's overdue" },
                { icon: FiScissors, text: 'Fabric wastage is guessed, never measured' },
                { icon: FiArchive, text: "Warehouse is a black box — nobody knows what's inside" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 p-3.5 rounded-xl border border-red-200 dark:border-red-500/15 bg-red-50/70 dark:bg-red-500/5 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-snug font-medium pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: solution */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              GarmentFlow's Answer
            </div>
            <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-6 leading-tight">
              One system.<br />
              <span className="gradient-text">Full visibility.</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: FiLayers, text: 'Live fabric inventory — every roll, weight, colour, supplier' },
                { icon: FiBox, text: 'Product & SKU master with size matrix and reorder alerts' },
                { icon: FiTruck, text: 'Warehouse bin map with rack-level location tracking' },
                { icon: FiShoppingCart, text: 'Order lifecycle from Draft → Confirmed → Dispatched → Paid' },
                { icon: FiSearch, text: 'SKU traceability: scan any item, see its full journey' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-200 dark:border-brand-600/15 bg-brand-50/70 dark:bg-brand-600/5 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 dark:bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-snug font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 bg-white/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm">
              <FiActivity className="w-3 h-3" />
              Full Traceability Pipeline
            </div>
            <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-4">
              Every step, tracked
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base">
              Follow a garment from raw fabric delivery all the way to customer payment — every link connected, nothing lost.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="relative">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
              {[
                { icon: FiLayers, label: 'Fabric Received', color: 'bg-gradient-to-br from-purple-500 to-purple-700', step: 1 },
                { icon: FiBox, label: 'Batch Created', color: 'bg-gradient-to-br from-blue-500 to-blue-700', step: 2 },
                { icon: FiPackage, label: 'SKU Produced', color: 'bg-gradient-to-br from-brand-500 to-brand-700', step: 3 },
                { icon: FiTruck, label: 'Warehouse Stored', color: 'bg-gradient-to-br from-teal-600 to-teal-800', step: 4 },
                { icon: FiShoppingCart, label: 'Order Confirmed', color: 'bg-gradient-to-br from-amber-500 to-orange-600', step: 5 },
                { icon: FiDollarSign, label: 'Payment Received', color: 'bg-gradient-to-br from-green-500 to-emerald-700', step: 6 },
              ].map((item, idx, arr) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center">
                    <FlowStep {...item} />
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="hidden md:flex items-center justify-center w-12 flex-shrink-0 mt-[-8px]">
                      <div className="h-px w-full bg-gradient-to-r from-slate-300 dark:from-slate-700 to-slate-400 dark:to-slate-600" />
                      <FiArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0 -ml-1" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Sub-text */}
            <p className="text-center text-xs text-slate-500 mt-8 max-w-lg mx-auto font-medium">
              Each node links to the next. Scan any SKU to instantly see every step of its journey.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm">
            <FiZap className="w-3 h-3" />
            Everything you need
          </div>
          <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-4">
            Built for the factory floor
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base">
            Not a generic ERP. Every feature was designed specifically for Pakistani garment manufacturers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: FiLayers,
              title: 'Fabric Inventory',
              description: 'Log every roll by weight, colour, supplier and cost. Track wastage per batch. Never lose a kg of fabric again.',
              gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
              delay: 0,
            },
            {
              icon: FiBox,
              title: 'Products & SKU Matrix',
              description: 'Build size × colour grids. Auto-generate SKUs. See stock health badges (In Stock / Low / Out) per variant.',
              gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
              delay: 50,
            },
            {
              icon: FiTruck,
              title: 'Warehouse & Locations',
              description: 'Visual rack/bin map. Move stock between locations with a 3-step transfer wizard. Full movement ledger.',
              gradient: 'bg-gradient-to-br from-brand-500 to-brand-700',
              delay: 100,
            },
            {
              icon: FiUsers,
              title: 'Customer Ledger',
              description: 'Shop and wholesaler profiles. Outstanding balance, credit limit usage bar, complete order and payment history.',
              gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
              delay: 150,
            },
            {
              icon: FiShoppingCart,
              title: 'Order Wizard',
              description: 'Create orders in minutes with SKU search, live stock warnings and auto-totals. Status timeline from draft to delivery.',
              gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
              delay: 200,
            },
            {
              icon: FiSearch,
              title: 'SKU Traceability',
              description: 'Type any SKU and see the full journey: fabric → batch → production → warehouse → order → payment. One screen.',
              gradient: 'bg-gradient-to-br from-green-500 to-emerald-700',
              delay: 250,
            },
            {
              icon: FiBarChart2,
              title: 'Live Dashboard',
              description: 'KPI cards, sales trends, top products, overdue payments and low-stock alerts — at a glance, every morning.',
              gradient: 'bg-gradient-to-br from-rose-500 to-pink-700',
              delay: 300,
            },
            {
              icon: FiShield,
              title: 'Multi-tenant & Role-based',
              description: 'Owner, Storekeeper, Sales and Production roles with strict data isolation. Your data never touches another factory.',
              gradient: 'bg-gradient-to-br from-slate-600 to-slate-800',
              delay: 350,
            },
            {
              icon: FiTrendingUp,
              title: 'Payment Tracking',
              description: 'Cash, Bank, JazzCash, Easypaisa, Cheque. Partial payments, outstanding aging, and real-time receivable totals.',
              gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
              delay: 400,
            },
          ].map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-6 shadow-sm">
            <FiAward className="w-3 h-3" />
            Loved by factories across Pakistan
          </div>
          <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-4">
            Factory owners trust GarmentFlow
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Testimonial
            quote="Pehle har cheez WhatsApp pe thi. Ab ek hi jagah sab kuch — fabric se payment tak. Mera storekeeper khush hai, main khush hoon."
            name="Kashif Mehmood"
            role="Owner"
            company="Al-Fatah Garments, Faisalabad"
          />
          <Testimonial
            quote="The SKU traceability feature alone is worth it. When a customer complains about a batch, I can trace it to the exact fabric roll in seconds."
            name="Sadia Malik"
            role="Production Manager"
            company="Sitara Textiles, Lahore"
          />
          <Testimonial
            quote="We used to lose 8-10% of revenue every month due to untracked orders and missed payments. GarmentFlow cut that to near zero."
            name="Ahmed Raza"
            role="CEO"
            company="Crown Knitwear, Karachi"
          />
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24 bg-white/60 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Start free. Grow into the plan that fits your factory size.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Starter',
                price: 'Free',
                desc: 'Perfect for small factories just getting started',
                features: ['Up to 3 users', '1 warehouse', 'Fabric + Stock', 'Basic orders', 'Email support'],
                cta: 'Start Free',
                href: '/register',
                highlight: false,
              },
              {
                name: 'Professional',
                price: '₨ 4,999',
                period: '/month',
                desc: 'For growing factories with a dedicated team',
                features: ['Up to 15 users', 'Unlimited warehouses', 'Full traceability', 'Order wizard', 'Payment aging', 'Priority support'],
                cta: 'Get Started',
                href: '/register',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'For multi-location mills and large operations',
                features: ['Unlimited users', 'Custom integrations', 'SLA guarantee', 'Dedicated CSM', 'On-site training', 'Urdu UI'],
                cta: 'Contact Sales',
                href: '/register',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 shadow-sm transition-all ${
                  plan.highlight
                    ? 'border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-600/5 shadow-lg shadow-brand-900/10'
                    : 'border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-bold shadow-sm">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-1">{plan.name}</h3>
                  <p className="text-slate-500 text-xs mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-3xl text-slate-900 dark:text-white">{plan.price}</span>
                    {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <FiCheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-900/20 hover:shadow-brand-glow'
                      : 'border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA STRIP (High Contrast in White & Dark) ═══════════ */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl overflow-hidden border border-brand-600/40 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-12 text-white shadow-2xl">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-brand-400/25 blur-[70px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4 leading-tight">
              Ready to run your factory<br />
              <span className="text-brand-300">like a pro?</span>
            </h2>
            <p className="text-slate-200 text-lg mb-10 max-w-xl mx-auto font-medium">
              Join 500+ factories already using GarmentFlow. Setup takes under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 px-10 py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold text-base rounded-2xl transition-all duration-200 shadow-xl shadow-brand-950/40 hover:-translate-y-0.5"
              >
                Create Free Account
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-10 py-4 border border-white/25 hover:border-white/40 text-white font-semibold text-base rounded-2xl transition-all duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm shadow-sm"
              >
                Explore Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-display font-bold text-white shadow-sm">
                G
              </div>
              <div>
                <span className="font-display font-bold text-slate-900 dark:text-white">
                  Garment<span className="text-brand-600 dark:text-brand-400">Flow</span>
                </span>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider">PAKISTAN B2B OS</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { label: 'Sign In', href: '/login' },
                { label: 'Register', href: '/register' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Privacy', href: '#' },
                { label: 'Terms', href: '#' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs text-slate-500 flex items-center gap-1">
              © {new Date().getFullYear()} GarmentFlow. Made with <FiHeart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> in Pakistan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
