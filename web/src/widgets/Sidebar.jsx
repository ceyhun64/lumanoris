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

// İki ayrı dünya: Stüdyo (kendi botunu yönet/üret) ve Keşfet (pazaryerini
// tüket/takip et). Aynı tasarım dili içinde farklı bir vurgu rengiyle
// (violet vs fuchsia) ayrıştırılıyor ki kullanıcı hangi modda olduğunu
// sezgisel olarak anlasın — bkz. Chatbotlarım/Oluştur sayfalarındaki violet
// eyebrow ve bu bileşendeki accentClass.
const studioItems = [
  { href: '/dashboard/chatbots', icon: Bot, label: 'Chatbotlarım' },
];

const exploreItems = [
  { href: '/dashboard',           icon: Home,         label: 'Anasayfa',        exact: true },
  { href: '/dashboard/purchased', icon: ShoppingBag,  label: 'Satın Aldıklarım' },
  { href: '/dashboard/following', icon: Users,        label: 'Takip Edilenler' },
  { href: '/dashboard/list',      icon: ListChecks,   label: 'Liste' },
  { href: '/dashboard/history',   icon: History,      label: 'Geçmişim' },
  { href: '/dashboard/wallet',    icon: Wallet,       label: 'Bakiyem' },
  { href: '/dashboard/notes',     icon: NotebookText, label: 'Diyalog Defteri' },
];

const ACCENTS = {
  fuchsia: {
    bar: 'bg-gradient-to-b from-fuchsia-400 to-violet-400 shadow-[0_0_6px_rgba(217,70,239,0.4)]',
    icon: 'bg-fuchsia-500/[0.14] text-fuchsia-300 shadow-[0_0_0_1px_rgba(232,121,249,0.12)]',
  },
  violet: {
    bar: 'bg-gradient-to-b from-violet-400 to-fuchsia-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]',
    icon: 'bg-violet-500/[0.16] text-violet-300 shadow-[0_0_0_1px_rgba(167,139,250,0.14)]',
  },
};

function renderNavItem({ href, icon: Icon, label, exact }, isActive, collapsed, accent) {
  const active = isActive(href, exact);
  const { bar, icon } = ACCENTS[accent];
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
          ? 'font-semibold bg-white/[0.045] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'text-white/50 hover:bg-white/[0.045] hover:text-white/90 hover:translate-x-0.5',
      )}
    >
      {/* Active accent bar — the single clearest "you are here" signal */}
      {active && <span className={cn('absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-full', bar)} />}
      <span className={cn(
        'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
        collapsed ? 'w-[30px] h-[30px]' : 'w-8 h-8',
        active ? icon : 'bg-white/[0.03] text-white/45 group-hover:text-white/80',
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
}

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
      {/* Ambient glow accent — a quiet hint of depth, not a colored panel */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-fuchsia-600/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 -right-10 h-56 w-56 rounded-full bg-violet-600/[0.05] blur-[100px]" />
      {/* Hairline glow along the right edge */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-fuchsia-400/15 to-transparent" />
      {/* Collapse toggle */}
      <button
        onClick={handleCollapseToggle}
        className={cn(
          'group absolute top-9 -right-3.5 z-[60]',
          'w-8 h-8 flex items-center justify-center',
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
        <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-active:-translate-x-0.5" strokeWidth={2.5} />
      </button>

      <div className="relative flex flex-col gap-1 overflow-hidden px-3 pt-7">
        {/* Logo */}
        <Link href="/dashboard" className={cn('relative flex items-center gap-2.5 mb-7 no-underline', collapsed ? 'justify-center px-0' : 'px-1.5')}>
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 -m-1.5 rounded-full bg-fuchsia-500/15 blur-md" />
            <img src={headerLogo.src} alt="Lumanoris" className="relative w-8 h-auto drop-shadow-[0_0_8px_rgba(217,70,239,0.3)]" />
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

        {/* Stüdyo — botlarını ürettiğin/yönettiğin taraf (violet vurgu) */}
        {!collapsed && (
          <span className="px-1.5 mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.09em] text-white/30">
            Stüdyo
          </span>
        )}
        <ul className="flex flex-col gap-1 m-0 p-0 list-none mb-4">
          {studioItems.map((item) => renderNavItem(item, isActive, collapsed, 'violet'))}
        </ul>

        {/* Keşfet — pazaryerini tükettiğin/takip ettiğin taraf (fuchsia vurgu) */}
        {!collapsed && (
          <span className="px-1.5 mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.09em] text-white/30">
            Keşfet
          </span>
        )}
        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
          {exploreItems.map((item) => renderNavItem(item, isActive, collapsed, 'fuchsia'))}
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
                  ? 'font-semibold bg-white/[0.045] text-white'
                  : 'text-white/50 hover:bg-white/[0.045] hover:text-white/90 hover:translate-x-0.5',
              )}
            >
              {settingsActive && (
                <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-400 shadow-[0_0_6px_rgba(217,70,239,0.4)]" />
              )}
              <span className={cn(
                'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
                collapsed ? 'w-[30px] h-[30px]' : 'w-8 h-8',
                settingsActive
                  ? 'bg-fuchsia-500/[0.14] text-fuchsia-300 shadow-[0_0_0_1px_rgba(232,121,249,0.12)]'
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
                'flex items-center no-underline rounded-lg mt-1.5 border border-fuchsia-400/20',
                'text-fuchsia-300 font-sans font-semibold text-[13.5px]',
                'hover:border-fuchsia-400/40 hover:bg-fuchsia-500/[0.06] hover:text-fuchsia-200',
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
