"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Store,
  Building2,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Layers,
  Terminal,
  FileText,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

export default function EaseMeLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if user has active session cookie or localStorage role
      const storedRole = localStorage.getItem("ease_me_role") || localStorage.getItem("ease_me_active_role");
      if (storedRole) {
        setUserRole(storedRole);
      }
    }
  }, []);

  const getWorkspaceHref = (role: string | null) => {
    switch (role) {
      case "super_admin":
      case "platform_owner":
      case "admin":
        return "/superadmin";
      case "owner":
      case "business_owner":
        return "/owner";
      case "manager":
        return "/manager";
      case "cashier":
        return "/pos";
      case "customer":
        return "/portal";
      default:
        return "/owner";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#18181B] font-sans antialiased selection:bg-[#EA580C] selection:text-white">
      {/* Logged-in Quick Return Banner */}
      {userRole && (
        <div className="bg-[#18181B] text-white text-xs py-2 px-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>You have an active session as <strong>{userRole.replace("_", " ")}</strong>.</span>
            </span>
            <Link
              href={getWorkspaceHref(userRole)}
              className="text-[#EA580C] hover:text-orange-400 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              Go to Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE6E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#EA580C]" />
            <span className="font-extrabold text-xl tracking-tight text-[#18181B]">Ease Me</span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52525B]">
            <Link href="#services" className="hover:text-[#18181B] transition-colors">Services</Link>
            <Link href="#pricing" className="hover:text-[#18181B] transition-colors">Pricing</Link>
            <Link href="#solutions" className="hover:text-[#18181B] transition-colors">Solutions</Link>
            <Link href="#resources" className="hover:text-[#18181B] transition-colors">Resources</Link>
            <Link href="#contact" className="hover:text-[#18181B] transition-colors">Contact</Link>
          </nav>

          {/* Action CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="bg-[#EA580C] hover:bg-[#D94E07] text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors shadow-xs"
            >
              Console
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#52525B] hover:text-[#18181B]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#EAE6E1] bg-white px-4 pt-3 pb-6 space-y-3">
            <Link
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Services
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Pricing
            </Link>
            <Link
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Solutions
            </Link>
            <Link
              href="#resources"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Resources
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Contact
            </Link>
            <div className="pt-2">
              <Link
                href="/login"
                className="block text-center w-full bg-[#EA580C] hover:bg-[#D94E07] text-white text-sm font-semibold py-2.5 rounded-md"
              >
                Console
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#18181B] text-white pt-24 pb-32 md:pt-32 md:pb-44 overflow-hidden">
        {/* Background Visual Layer with Contrast Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181B]/80 via-[#18181B]/90 to-[#18181B]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            Smart Business Management System For Growing Businesses.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            The complete business management stack for modern enterprises. From lightning-fast POS sales and automated
            inventory to cloud-synced accounting and multi-store operations, Ease Me gives you total control over your
            business—even without an internet connection.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-[#EA580C] hover:bg-[#D94E07] text-white font-medium px-8 py-3.5 rounded-md text-sm sm:text-base transition-colors shadow-sm"
            >
              Get started
            </Link>
            <Link
              href="#services"
              className="w-full sm:w-auto border border-white/25 hover:border-white/50 text-white font-medium px-8 py-3.5 rounded-md text-sm sm:text-base transition-colors backdrop-blur-xs"
            >
              Explore services
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Overlapping Floating Hero Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-7 md:p-8 rounded-xl border border-[#EAE6E1] shadow-xs flex flex-col justify-between hover:border-[#EA580C]/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#EA580C] mb-5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Real-time reports</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                See sales, VAT, margins, and low stock as shifts close—synced when you enable cloud.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="#services"
                className="text-sm font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1.5"
              >
                Read more <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 md:p-8 rounded-xl border border-[#EAE6E1] shadow-xs flex flex-col justify-between hover:border-[#EA580C]/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#EA580C] mb-5">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Hybrid retail stack</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Blazing-fast desktop, laptop, tablet and smartphone POS, plus optional dashboards for owners who need visibility
                from anywhere.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="#services"
                className="text-sm font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1.5"
              >
                Read more <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 md:p-8 rounded-xl border border-[#EAE6E1] shadow-xs flex flex-col justify-between hover:border-[#EA580C]/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#EA580C] mb-5">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Manage your outlets</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                License-governed tenancy keeps each franchise&apos;s receipts, inventory, and ledgers cleanly separated.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="#services"
                className="text-sm font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1.5"
              >
                Read more <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlight: 2-Column Split */}
      <section id="services" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Photo Column */}
            <div className="relative rounded-2xl overflow-hidden border border-[#EAE6E1] bg-white shadow-xs aspect-4/3 lg:aspect-auto lg:h-[480px]">
              <img
                src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=1200&q=80"
                alt="Retail operator using POS management software"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Right Copy Column */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#EA580C] mb-3">
                Why Ease Me
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#18181B] leading-tight">
                Accounting & retail pos built for modern African stores.
              </h2>
              <p className="mt-5 text-base text-[#52525B] leading-relaxed">
                From pharmacies to quick-service kitchens, operators need tools that tolerate bad networks yet still reconcile
                cleanly each night. Ease Me unifies POS receipts, ledger entries, taxes, and stock movement in one disciplined package.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-3" />
                  </div>
                  <span className="text-sm font-medium text-[#27272A]">
                    Works on Desktop, laptop, Tablet &amp; smartphones
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-3" />
                  </div>
                  <span className="text-sm font-medium text-[#27272A]">
                    Inventory, adjustments, and low-stock cues
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-3" />
                  </div>
                  <span className="text-sm font-medium text-[#27272A]">
                    Expenses &amp; profit views with VAT compliance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-3" />
                  </div>
                  <span className="text-sm font-medium text-[#27272A]">
                    Licensed cloud sync optional per outlet
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/signup"
                  className="bg-[#EA580C] hover:bg-[#D94E07] text-white text-sm font-semibold px-6 py-3 rounded-md transition-colors inline-block"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Complete commerce services—from lane to ledger */}
      <section className="py-20 bg-[#FAF8F5] border-t border-[#EAE6E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Complete commerce services—<br className="hidden sm:inline" />from lane to ledger.
              </h2>
            </div>
            <div>
              <Link
                href="/signup"
                className="text-sm font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1.5"
              >
                Learn more <span>&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Card 1 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Professional</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Operator-grade tooling for SMEs that outgrow spreadsheets.
              </p>
            </div>

            {/* Service Card 2 */}
            <div id="pricing" className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Scalable tiers</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Starter, Growth, Business, and Enterprise plans tailored for your business volume.
              </p>
            </div>

            {/* Service Card 3 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Secure data</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Tenant-isolated Postgres with audited access boundaries.
              </p>
            </div>

            {/* Service Card 4 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Real-time insights</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Dashboard summaries when connectivity and license are active.
              </p>
            </div>

            {/* Service Card 5 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Customer support</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Dedicated channels tied to active subscriptions.
              </p>
            </div>

            {/* Service Card 6 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] hover:border-[#EA580C]/40 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-[#18181B] mb-2">Account manager</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Growth &amp; Enterprise tiers with expanded guidance envelopes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Strip: Trusted by ambitious operators nationwide */}
      <section className="relative bg-[#18181B] text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden text-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[#18181B]/80" />

        <div className="relative max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Trusted by ambitious operators nationwide.
          </h2>

          <div
            id="solutions"
            className="my-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-mono tracking-widest text-zinc-300"
          >
            <span>RETAIL</span>
            <span className="text-zinc-600">&bull;</span>
            <span>PHARMACY</span>
            <span className="text-zinc-600">&bull;</span>
            <span>FMCG</span>
            <span className="text-zinc-600">&bull;</span>
            <span>HORECA</span>
            <span className="text-zinc-600">&bull;</span>
            <span>WHOLESALE</span>
            <span className="text-zinc-600">&bull;</span>
            <span>ENTERPRISE</span>
          </div>

          <div>
            <Link
              href="/signup"
              className="bg-[#EA580C] hover:bg-[#D94E07] text-white font-medium px-8 py-3.5 rounded-md text-sm sm:text-base transition-colors shadow-sm inline-block"
            >
              Get started now
            </Link>
          </div>
        </div>
      </section>

      {/* 2-Column: Powerful software built to grow your retail business */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Metrics Column */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#18181B] leading-tight">
                Powerful software built to grow your retail business.
              </h2>

              <div className="grid grid-cols-2 gap-8 mt-10">
                {/* Metric 1 */}
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#EA580C] font-mono tracking-tight">
                    99%+
                  </div>
                  <div className="text-xs sm:text-sm text-[#52525B] mt-2 font-medium">
                    Keep selling even without internet
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#EA580C] font-mono tracking-tight">
                    VAT
                  </div>
                  <div className="text-xs sm:text-sm text-[#52525B] mt-2 font-medium">
                    Compliant tax and payment tracking
                  </div>
                </div>

                {/* Metric 3 */}
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#EA580C] font-mono tracking-tight">
                    24/7
                  </div>
                  <div className="text-xs sm:text-sm text-[#52525B] mt-2 font-medium">
                    Fast and reliable desktop app
                  </div>
                </div>

                {/* Metric 4 */}
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#EA580C] font-mono tracking-tight">
                    TLS
                  </div>
                  <div className="text-xs sm:text-sm text-[#52525B] mt-2 font-medium">
                    Your data is safe and secure
                  </div>
                </div>
              </div>
            </div>

            {/* Right Photo Column */}
            <div className="relative rounded-2xl overflow-hidden border border-[#EAE6E1] bg-white shadow-xs aspect-4/3 lg:aspect-auto lg:h-[480px]">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                alt="Business colleagues collaborating in store operations"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Real Experiences from Business Owners */}
      <section className="py-20 bg-[#FAF8F5] border-t border-[#EAE6E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Real experiences from business owners.
              </h2>
            </div>
            <div>
              <Link
                href="/login"
                className="text-sm font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1.5"
              >
                Talk to sales <span>&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;We traded spotty SaaS uptime for Ease Me on the lane and never looked back—the counter flies.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Amaka O.</div>
                  <div className="text-[11px] text-[#71717A]">Store owner, Lagos</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;Remote dashboards let me review yesterday&apos;s sales before I opened the depot.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  I
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Ibrahim Y.</div>
                  <div className="text-[11px] text-[#71717A]">Regional Manager</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;Licensing is painless. Payment cleared and we pasted the key onto new tills.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Chioma E.</div>
                  <div className="text-[11px] text-[#71717A]">Franchise lead</div>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;Inventory integrity improved once staff stopped juggling three tools.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  T
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Tunde K.</div>
                  <div className="text-[11px] text-[#71717A]">Pharmacy operations</div>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;The hybrid model respects how unreliable uplink still is outside the city.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  N
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Ngozi A.</div>
                  <div className="text-[11px] text-[#71717A]">CFO Advisory</div>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-white p-7 rounded-xl border border-[#EAE6E1] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1 text-[#EA580C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3F3F46] leading-relaxed">
                  &ldquo;Support responses align with Nigerian business hours—we&apos;re not ticketing overseas.&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                  F
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18181B]">Femi J.</div>
                  <div className="text-[11px] text-[#71717A]">QSR proprietor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Resources for Managing Your Storefront */}
      <section id="resources" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Explore resources for managing<br className="hidden sm:inline" /> your storefront.
              </h2>
            </div>
            <div>
              <Link
                href="/login"
                className="bg-[#EA580C] hover:bg-[#D94E07] text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors inline-block"
              >
                More insights
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Resource Card 1 */}
            <div className="bg-white rounded-xl border border-[#EAE6E1] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#EA580C]/40 transition-colors">
              <div>
                <div className="h-48 overflow-hidden bg-zinc-100">
                  <img
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80"
                    alt="5 Accounting Mistakes Retailers Make"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">
                    Accounting
                  </div>
                  <h3 className="text-base font-bold text-[#18181B] leading-snug">
                    5 Accounting Mistakes Retailers Make and How to Avoid Them
                  </h3>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0 flex items-center justify-between text-xs text-[#71717A]">
                <span className="font-mono">OCT 2026</span>
                <span className="text-[#EA580C] font-semibold hover:underline inline-flex items-center gap-1">
                  Read more <span>&rarr;</span>
                </span>
              </div>
            </div>

            {/* Resource Card 2 */}
            <div className="bg-white rounded-xl border border-[#EAE6E1] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#EA580C]/40 transition-colors">
              <div>
                <div className="h-48 overflow-hidden bg-zinc-100">
                  <img
                    src="https://images.unsplash.com/photo-1556742208-999815fca738?auto=format&fit=crop&w=600&q=80"
                    alt="How to Choose the Right POS System"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">
                    Business
                  </div>
                  <h3 className="text-base font-bold text-[#18181B] leading-snug">
                    How to Choose the Right POS System for Your Nigerian Business
                  </h3>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0 flex items-center justify-between text-xs text-[#71717A]">
                <span className="font-mono">OCT 2026</span>
                <span className="text-[#EA580C] font-semibold hover:underline inline-flex items-center gap-1">
                  Read more <span>&rarr;</span>
                </span>
              </div>
            </div>

            {/* Resource Card 3 */}
            <div className="bg-white rounded-xl border border-[#EAE6E1] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#EA580C]/40 transition-colors">
              <div>
                <div className="h-48 overflow-hidden bg-zinc-100">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
                    alt="The Ultimate Guide to Inventory Management"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">
                    Inventory
                  </div>
                  <h3 className="text-base font-bold text-[#18181B] leading-snug">
                    The Ultimate Guide to Inventory Management for Small Retailers
                  </h3>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0 flex items-center justify-between text-xs text-[#71717A]">
                <span className="font-mono">OCT 2026</span>
                <span className="text-[#EA580C] font-semibold hover:underline inline-flex items-center gap-1">
                  Read more <span>&rarr;</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box: Let's take care of your operations stack */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-[#F7F4EF] rounded-2xl border border-[#EAE6E1] p-8 sm:p-12 md:p-16 text-left shadow-xs">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#18181B] leading-tight">
            Let&apos;s take care of your operations<br className="hidden sm:inline" /> stack.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#52525B] leading-relaxed max-w-2xl">
            Tell us how many lanes, regions, or compliance constraints you navigate—we&apos;ll tailor the rollout path and clarify licensing tiers.
          </p>

          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-[#EA580C] stroke-3" />
              <span className="text-sm font-medium text-[#27272A]">
                Priority responses for Growth &amp; Enterprise
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-[#EA580C] stroke-3" />
              <span className="text-sm font-medium text-[#27272A]">
                Security &amp; tenancy walkthrough included
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-[#EA580C] stroke-3" />
              <span className="text-sm font-medium text-[#27272A]">
                Portal access unlocked after verified checkout
              </span>
            </div>
          </div>

          <div className="mt-10 text-xs sm:text-sm text-[#71717A]">
            Already subscribed?{" "}
            <Link href="/login" className="text-[#EA580C] font-semibold hover:underline">
              Portal sign-in
            </Link>
          </div>
        </div>
      </section>

      {/* Deep Espresso Black Footer */}
      <footer id="contact" className="bg-[#1A1715] text-[#A1A1AA] pt-16 pb-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-16 border-b border-zinc-800">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#EA580C]" />
                <span className="font-extrabold text-lg tracking-tight text-white">Ease Me</span>
              </Link>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                The complete daily business control and multi-role operations system for African enterprises.
              </p>
              <div className="flex items-center gap-4 text-zinc-400">
                <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  <span className="sr-only">X (formerly Twitter)</span>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Product
              </div>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="#services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/portal" className="hover:text-white transition-colors">Customer portal</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Legal hub</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Resources
              </div>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="#resources" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Help center</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Contact sales</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Company
              </div>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/login" className="hover:text-white transition-colors">About us</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Become a partner</Link></li>
              </ul>
            </div>

            {/* Get In Touch Column */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Get in touch
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a href="mailto:support@easeme.ng" className="text-white hover:text-[#EA580C] transition-colors">
                    support@easeme.ng
                  </a>
                </li>
                <li>24/7 Online Support</li>
                <li>Mon - Fri: 8:00 AM - 5:00 PM</li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} Ease Me. Powered by Bigtink Digital Creations.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
              <Link href="/login" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
