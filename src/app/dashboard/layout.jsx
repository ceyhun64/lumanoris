'use client';
import { React, useEffect, useState, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from "../components/DashboardHeader/DashboardHeader";
import NavbarMobile from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import '../../font/stylesheet.css';

export const UserContext = createContext(null);

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [userId, setUserId] = useState(null); 
    const [authReady, setAuthReady] = useState(false); // Kontrol bitti mi?

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                if (!result.authenticated) {
                    router.push("/login");
                } else {
                    setUserId(result.user_id);
                    setAuthReady(true); // Giriş başarılı
                }
            } catch (err) {
                router.push("/login");
            }
        }
        checkSession();
    }, [router]);

    // Kontrol bitene kadar boş dön veya loading koy, böylece alt sayfalar (children) erkenden çalışmaz
    if (!authReady && !userId) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%'}}>Oturum kontrol ediliyor...</div>;

    return (
        <UserContext.Provider value={userId}>
            <div className="dashboard-layout">
                <div className="sidebar-mobile"><Sidebar /></div>
                <div className="main-content">
                    <NavbarMobile />
                    <main>
                        {/* Header'ı da userId gelince render et */}
                        <Header userId={userId} />
                        {children}
                    </main>
                </div>
            </div>
        </UserContext.Provider>
    );
}