'use client';

import { useState } from 'react';
import { Sidebar } from '@/widgets/Sidebar';
import logo from '@/images/header-logo-icon.png';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function NavbarMobile() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <div className="flex h-16 items-center justify-between px-4 bg-gradient-to-b from-[rgba(11,11,30,0.9)] to-[#09090F] backdrop-blur-xl">
                <div
                    className="flex items-center gap-2.5 cursor-pointer select-none transition-opacity hover:opacity-80"
                    onClick={() => router.push('/dashboard')}
                >
                    {logo?.src && <img src={logo.src} alt="Lumanoris" className="w-7 h-7 object-contain" />}
                    <span className="text-white font-semibold text-body tracking-[0.02em] font-display">Lumanoris</span>
                </div>

                <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all duration-150 hover:bg-gradient-to-br hover:from-fuchsia-500/20 hover:to-violet-500/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? "Menüyü kapat" : "Menüyü aç"}
                >
                    {sidebarOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
                </button>
            </div>

            <Sidebar isMobileOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        </>
    );
}
