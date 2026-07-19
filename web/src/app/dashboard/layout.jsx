'use client';
import { React, useEffect, useState, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from "@/widgets/DashboardHeader";
import NavbarMobile from "@/widgets/Navbar";
import Sidebar from "@/widgets/Sidebar";

export const UserContext = createContext(null);

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [userId, setUserId] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    // Checkout is a focused, distraction-free flow (common e-commerce
    // pattern) — no main nav sidebar/mobile navbar while paying.
    const hideNav = pathname?.startsWith('/dashboard/checkout');

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                setUserId(result.authenticated ? result.user_id : null);
            } catch (err) {
                setUserId(null);
            } finally {
                setAuthReady(true);
            }
        }
        checkSession();
    }, [router]);

    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white/60 text-[14px]">
                <span className="animate-pulse">Oturum kontrol ediliyor...</span>
            </div>
        );
    }

    return (
        <UserContext.Provider value={userId}>
            <a
                href="#main-content"
                className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-[999] focus-visible:rounded-lg focus-visible:bg-luma-panel focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                İçeriğe geç
            </a>
            <div className="relative flex h-screen overflow-hidden bg-[#09090F]">
                {/* Ambient glow layer — gives the whole shell depth/atmosphere
                    instead of a flat black canvas. Fixed so it doesn't scroll
                    with page content; z-0 so it always sits behind the real
                    UI regardless of paint-order quirks between positioned and
                    non-positioned siblings. */}
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                    <div className="absolute -top-32 left-[30%] h-[900px] w-[900px] rounded-full bg-fuchsia-600/25 blur-[130px]" />
                    <div className="absolute top-[20%] right-[5%] h-[700px] w-[700px] rounded-full bg-violet-600/20 blur-[130px]" />
                    <div className="absolute bottom-[-25%] left-[15%] h-[750px] w-[750px] rounded-full bg-fuchsia-500/[0.16] blur-[140px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:28px_28px]" />
                </div>

                <div className="relative z-10 flex h-full w-full">
                    {/* Sidebar — hidden on mobile, shown md+ (and hidden entirely during checkout) */}
                    {!hideNav && (
                        <div className="hidden md:flex shrink-0">
                            <Sidebar />
                        </div>
                    )}

                    {/* Main area */}
                    <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
                        {/* Mobile navbar */}
                        {!hideNav && (
                            <div className="md:hidden">
                                <NavbarMobile />
                            </div>
                        )}

                        <main className="flex flex-col flex-1 min-h-0">
                            <Header userId={userId} />
                            <div id="main-content" className="flex-1">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </UserContext.Provider>
    );
}
