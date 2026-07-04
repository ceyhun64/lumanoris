"use client";
import headerLogo from '@/images/header-logo-icon.png';
import homeIcon from '@/images/anasayfa-icon.svg';
import chatIcon from '@/images/chatbotlarim-icon.svg';
import storeIcon from '@/images/satilik-icon.svg';
import followIcon from '@/images/takip-edilenler-icon.svg';
import listIcon from '@/images/liste-icon.svg';
import historyIcon from '@/images/gecmisim-icon.svg';
import walletIcon from '@/images/bakiyom-icon.svg';
import noteIcon from '@/images/diyalog-defteri-icon.svg';
import settingsIcon from '@/images/ayarlar-icon.svg';
import logoIcon from '@/images/header-dashboard-left.png';
import Link from 'next/link';
import QuitModal from '@/features/auth/QuitModal';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Plus, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';

const navItems = [
  { href: '/dashboard',           icon: homeIcon,    label: 'Anasayfa',        exact: true },
  { href: '/dashboard/chatbots',  icon: chatIcon,    label: 'Chatbotlarım' },
  { href: '/dashboard/purchased', icon: storeIcon,   label: 'Satın Aldıklarım' },
  { href: '/dashboard/following', icon: followIcon,  label: 'Takip Edilenler' },
  { href: '/dashboard/list',      icon: listIcon,    label: 'Liste' },
  { href: '/dashboard/history',   icon: historyIcon, label: 'Geçmişim' },
  { href: '/dashboard/wallet',    icon: walletIcon,  label: 'Bakiyem' },
  { href: '/dashboard/notes',     icon: noteIcon,    label: 'Diyalog Defteri' },
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
        'flex flex-col justify-between h-screen sticky top-0 z-10',
        'bg-[#07071A] border-r border-indigo-400/7',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[90px]' : 'w-[280px]',
        isMobileOpen ? 'translate-x-0' : '',
        'max-md:fixed max-md:left-0 max-md:top-0 max-md:z-[1000]',
        isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={handleCollapseToggle}
        className={cn(
          'absolute top-[42px] -right-4 z-10',
          'w-8 h-8 flex items-center justify-center',
          'bg-[#0F0F24] border border-indigo-400/14 rounded-full',
          'text-white/60 hover:text-white hover:bg-indigo-500/15 hover:border-indigo-400/35',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
          collapsed ? 'rotate-180' : '',
          'max-md:hidden',
        )}
        aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü küçült'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div className="flex flex-col gap-1 overflow-hidden px-4 pt-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-5 no-underline">
          <div className="flex items-center justify-center shrink-0">
            <img src={headerLogo.src} alt="Lumanoris" className="w-10 h-auto drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-[17px] tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
              LUMANORIS
            </span>
          )}
        </Link>

        {/* Create button */}
        <button
          onClick={() => router.push('/dashboard/chatbots/create')}
          className={cn(
            'w-full flex items-center justify-between mb-1',
            'border border-indigo-400/20 bg-indigo-500/7 rounded-[10px]',
            'hover:bg-indigo-500/14 hover:border-indigo-400/40 hover:shadow-glow hover:-translate-y-0.5',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
            collapsed ? 'p-3 justify-center' : 'px-4 py-3',
          )}
        >
          {!collapsed && (
            <span className="text-[13px] font-display font-semibold text-indigo-300 uppercase tracking-[0.08em]">
              Oluştur
            </span>
          )}
          <span className={cn(
            'flex items-center justify-center bg-gradient-btn rounded-[6px]',
            collapsed ? 'w-7 h-7' : 'w-6 h-6',
          )}>
            <Plus className="w-3.5 h-3.5 text-white" />
          </span>
        </button>

        {/* Separator */}
        <div className="h-px my-3 bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />

        {/* Nav items */}
        <ul className="flex flex-col gap-0.5 m-0 p-0 list-none">
          {navItems.map(({ href, icon, label, exact }) => {
            const active = isActive(href, exact);
            const link = (
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3.5 w-full rounded-[10px] no-underline',
                  'text-[15px] font-sans leading-snug',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                  collapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5',
                  active
                    ? 'font-semibold border-l-2 border-indigo-500 bg-gradient-to-r from-indigo-500/14 to-cyan-500/6 text-indigo-300'
                    : 'text-white/72 border-l-2 border-transparent hover:bg-indigo-500/7 hover:text-white hover:translate-x-0.5',
                )}
              >
                <img
                  src={icon.src}
                  alt={label}
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    collapsed ? 'w-6 h-6' : 'w-[22px] h-[22px]',
                    active ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.65)] opacity-100' : 'opacity-70',
                  )}
                />
                {!collapsed && <span>{label}</span>}
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
      <div className="flex flex-col gap-2.5 px-4 pb-5">
        <div className={cn(
          'rounded-[14px] border border-indigo-400/10 bg-indigo-500/4 overflow-hidden relative',
        )}>
          <div className="absolute -top-5 -left-5 opacity-30 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 134 96" fill="none">
              <g filter="url(#sb_blur)">
                <circle cx="21" cy="8" r="28" fill="url(#sb_grad)" />
              </g>
              <defs>
                <filter id="sb_blur" x="-91.784" y="-104.784" width="225.568" height="225.568" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="42" result="blur" />
                </filter>
                <linearGradient id="sb_grad" x1="53" y1="49" x2="-6" y2="-29" gradientUnits="userSpaceOnUse">
                  <stop offset="0.21" stopColor="#818CF8" />
                  <stop offset="1" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {(() => {
            const settingsLink = (
              <Link
                href="/dashboard/settings/"
                className={cn(
                  'relative z-[1] flex items-center gap-3.5 no-underline',
                  'text-[15px] font-sans transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                  collapsed ? 'justify-center p-3' : 'px-3.5 py-3',
                  pathname.startsWith('/dashboard/settings')
                    ? 'border-l-2 border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold'
                    : 'text-white/65 hover:bg-indigo-500/8 hover:text-white/90 border-l-2 border-transparent',
                )}
              >
                <img
                  src={settingsIcon.src}
                  alt="Ayarlar"
                  className={cn(
                    'w-[22px] h-[22px] shrink-0 transition-opacity duration-200',
                    pathname.startsWith('/dashboard/settings') ? 'opacity-100 drop-shadow-[0_0_6px_rgba(99,102,241,0.65)]' : 'opacity-70',
                  )}
                />
                {!collapsed && <span>Ayarlar</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                <TooltipContent side="right">Ayarlar</TooltipContent>
              </Tooltip>
            ) : settingsLink;
          })()}
        </div>

        {(() => {
          const upgradeLink = (
            <Link
              href="/dashboard/upgrade"
              className={cn(
                'flex items-center justify-center no-underline rounded-xl',
                'bg-gradient-btn text-white font-display font-semibold text-[14px] tracking-wide',
                'shadow-[0_4px_16px_rgba(79,70,229,0.35)]',
                'hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(79,70,229,0.5)]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                collapsed ? 'w-10 h-10 mx-auto p-0' : 'py-3.5 px-4 gap-2',
              )}
            >
              <TrendingUp className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span>Hesabınızı Yükseltin</span>}
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
        onConfirm={() => router.push('/auth')}
      />
    </aside>
  );
}
