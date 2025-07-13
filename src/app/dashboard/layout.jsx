import Header from "../components/DashboardHeader/DashboardHeader";
import NavbarMobile from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

export const metadata = {
    title: "Dashboard | Lumanoris",
};

export default function DashboardLayout({ children }) {
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
