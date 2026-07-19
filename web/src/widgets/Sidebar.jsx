"use client";
import headerLogo from '@/images/header-logo-icon.png';
import Link from 'next/link';
import QuitModal from '@/features/auth/QuitModal';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Plus, TrendingUp, ChevronLeft,
  Home, Bot, ShoppingBag, Users, ListChecks, History, Wallet, NotebookText, Settings,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';

const navItems = [
  { href: '/dashboard',           icon: Home,         label: 'Anasayfa',        exact: true },
  { href: '/dashboard/chatbots',  icon: Bot,          label: 'Chatbotlarım' },
  { href: '/dashboard/purchased', icon: ShoppingBag,  label: 'Satın Aldıklarım' },
  { href: '/dashboard/following', icon: Users,        label: 'Takip Edilenler' },
  { href: '/dashboard/list',      icon: ListChecks,   label: 'Liste' },
  { href: '/dashboard/history',   icon: History,      label: 'Geçmişim' },
  { href: '/dashboard/wallet',    icon: Wallet,       label: 'Bakiyem' },
  { href: '/dashboard/notes',     icon: NotebookText, label: 'Diyalog Defteri' },
];

export default function Sidebar({ isMobileOpen = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  const isActive = (href, exact = false) =>
    exact ? (pathname === href || pathname === href + '/')
          : pathname.startsWith(href);

  const handleCollapseToggle = () => {
    setCollapsed(prev => !prev);
    window.dispatchEvent(new CustomEvent('logoClicked', { detail: { clicked: !collapsed } }));
  };

  return (
    <aside
      className={cn(
        'flex flex-col justify-between h-screen sticky top-0 z-40 overflow-hidden',
        'bg-gradient-to-b from-[#0D0D22] via-[#0A0A18] to-[#050508]',
        'border-r border-white/[0.06]',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[84px]' : 'w-[264px]',
        isMobileOpen ? 'translate-x-0' : '',
        'max-md:fixed max-md:left-0 max-md:top-0 max-md:z-[1000]',
        isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      )}
    >
      {/* Ambient glow accent — gives the rail depth instead of a flat panel */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-fuchsia-600/[0.18] blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 -right-10 h-56 w-56 rounded-full bg-violet-600/[0.14] blur-[90px]" />
      {/* Hairline glow along the right edge */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-fuchsia-400/25 to-transparent" />
      {/* Collapse toggle */}
      <button
        onClick={handleCollapseToggle}
        className={cn(
          'group absolute top-9 -right-3 z-10',
          'w-6 h-6 flex items-center justify-center',
          'rounded-full border border-white/10 bg-[#15152f] shadow-[0_2px_10px_rgba(0,0,0,0.5)]',
          'text-white/55',
          'hover:text-white hover:border-fuchsia-400/50 hover:bg-gradient-to-br hover:from-fuchsia-500/25 hover:to-violet-500/25 hover:shadow-[0_2px_14px_rgba(217,70,239,0.35)] hover:scale-110',
          'active:scale-95',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
          collapsed ? 'rotate-180' : '',
          'max-md:hidden',
        )}
        aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü küçült'}
      >
        <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-200 group-active:-translate-x-0.5" strokeWidth={2.5} />
      </button>

      <div className="relative flex flex-col gap-1 overflow-hidden px-3 pt-7">
        {/* Logo */}
        <Link href="/dashboard" className={cn('relative flex items-center gap-2.5 mb-7 no-underline', collapsed ? 'justify-center px-0' : 'px-1.5')}>
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 -m-1.5 rounded-full bg-fuchsia-500/30 blur-md" />
            <img src={headerLogo.src} alt="Lumanoris" className="relative w-8 h-auto drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-[16px] tracking-[0.02em] text-white whitespace-nowrap">
              Lumanoris
            </span>
          )}
        </Link>

        {/* Create button — the primary CTA of the whole sidebar, now reads
            as one: full gradient pill matching the Upgrade button's weight
            instead of a quiet outlined box competing with nav items. */}
        <button
          onClick={() => router.push('/dashboard/chatbots/create')}
          className={cn(
            'group w-full flex items-center justify-between mb-5',
            'bg-gradient-btn rounded-xl shadow-[0_4px_20px_rgba(192,38,211,0.35)]',
            'hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(192,38,211,0.5)] hover:brightness-110',
            'active:translate-y-0',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
            collapsed ? 'p-2.5 justify-center' : 'pl-3.5 pr-2.5 py-2.5',
          )}
        >
          {!collapsed && (
            <span className="text-[13.5px] font-semibold text-white">
              Yeni Chatbot
            </span>
          )}
          <span className={cn(
            'flex items-center justify-center rounded-lg bg-white/15 shrink-0 transition-transform duration-200 group-hover:rotate-90',
            collapsed ? 'w-7 h-7' : 'w-6 h-6',
          )}>
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </span>
        </button>

        {/* Section label */}
        {!collapsed && (
          <span className="px-1.5 mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.09em] text-white/30">
            Menü
          </span>
        )}

        {/* Nav items */}
        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
          {navItems.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            const link = (
              <Link
                href={href}
                className={cn(
                  'relative flex items-center gap-3 w-full rounded-lg no-underline',
                  'text-[13.5px] font-sans leading-snug',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                  collapsed ? 'justify-center p-2' : 'pl-3 pr-2.5 py-2.5',
                  active
                    ? 'font-semibold bg-gradient-to-r from-fuchsia-500/[0.16] via-violet-500/[0.08] to-transparent text-white shadow-[0_0_0_1px_rgba(217,70,239,0.12)]'
                    : 'text-white/50 hover:bg-white/[0.045] hover:text-white/90 hover:translate-x-0.5',
                )}
              >
                {/* Active accent bar — the single clearest "you are here" signal */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                )}
                <span className={cn(
                  'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
                  collapsed ? 'w-[30px] h-[30px]' : 'w-8 h-8',
                  active
                    ? 'bg-gradient-to-br from-fuchsia-500/40 to-violet-500/25 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.35)]'
                    : 'bg-white/[0.03] text-white/45 group-hover:text-white/80',
                )}>
                  <Icon className={collapsed ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]'} strokeWidth={1.75} />
                </span>
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
            return (
              <li key={href} className="w-full">
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ) : link}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom: settings + upgrade */}
      <div className="flex flex-col gap-1 px-3 pb-5">
        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {(() => {
          const settingsActive = pathname.startsWith('/dashboard/settings');
          const settingsLink = (
            <Link
              href="/dashboard/settings/"
              className={cn(
                'relative flex items-center gap-3 no-underline rounded-lg',
                'text-[13.5px] font-sans transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                collapsed ? 'justify-center p-2' : 'pl-3 pr-2.5 py-2.5',
                settingsActive
                  ? 'font-semibold bg-gradient-to-r from-fuchsia-500/[0.16] via-violet-500/[0.08] to-transparent text-white'
                  : 'text-white/50 hover:bg-white/[0.045] hover:text-white/90 hover:translate-x-0.5',
              )}
            >
              {settingsActive && (
                <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
              )}
              <span className={cn(
                'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
                collapsed ? 'w-[30px] h-[30px]' : 'w-8 h-8',
                settingsActive
                  ? 'bg-gradient-to-br from-fuchsia-500/40 to-violet-500/25 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.35)]'
                  : 'bg-white/[0.03] text-white/45',
              )}>
                <Settings className={collapsed ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]'} strokeWidth={1.75} />
              </span>
              {!collapsed && <span className="truncate">Ayarlar</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
              <TooltipContent side="right">Ayarlar</TooltipContent>
            </Tooltip>
          ) : settingsLink;
        })()}

        {(() => {
          const upgradeLink = (
            <Link
              href="/dashboard/upgrade"
              className={cn(
                'flex items-center no-underline rounded-lg mt-1.5',
                'bg-gradient-btn text-white font-sans font-semibold text-[13.5px]',
                'shadow-[0_4px_18px_rgba(192,38,211,0.4)] ring-1 ring-white/10',
                'hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_24px_rgba(192,38,211,0.55)]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                collapsed ? 'w-10 h-10 mx-auto p-0 justify-center' : 'px-3 py-2.5 gap-2.5',
              )}
            >
              <TrendingUp className="w-[17px] h-[17px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">Hesabınızı Yükseltin</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{upgradeLink}</TooltipTrigger>
              <TooltipContent side="right">Hesabınızı Yükseltin</TooltipContent>
            </Tooltip>
          ) : upgradeLink;
        })()}
      </div>

      <QuitModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirm={async () => {
          setIsQuitModalOpen(false);
          try {
            await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'include' });
          } catch (err) {
            console.error('Logout error:', err);
          }
          window.location.href = '/login';
        }}
      />
    </aside>
  );
}
