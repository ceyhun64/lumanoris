'use client';
import { React, useEffect, useState, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from "@/widgets/DashboardHeader";
import NavbarMobile from "@/widgets/Navbar";
import Sidebar from "@/widgets/Sidebar";

export const UserContext = createContext(null);

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [authReady, setAuthReady] = useState(false);

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
            <div className="flex h-screen overflow-hidden bg-[#09090F]">
                {/* Sidebar — hidden on mobile, shown md+ */}
                <div className="hidden md:flex shrink-0">
                    <Sidebar />
                </div>

                {/* Main area */}
                <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
                    {/* Mobile navbar */}
                    <div className="md:hidden">
                        <NavbarMobile />
                    </div>

                    <main className="flex flex-col flex-1 min-h-0">
                        <Header userId={userId} />
                        <div id="main-content" className="flex-1">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </UserContext.Provider>
    );
}
