'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from "../components/DashboardHeader/DashboardHeader";
import NavbarMobile from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import '../../font/stylesheet.css';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            if (pathname === '/dashboard/notes') {
                mainElement.style.overflow = 'visible';
            } else {
                mainElement.style.overflow = '';
            }
        }
    }, [pathname]);

    return (
        <>
            <div className="dashboard-layout">
                <div className="sidebar-mobile">
                    <Sidebar />
                </div>

                <div className="main-content">
                    <NavbarMobile />
                    <main>
                        <Header />
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
