export const metadata = {
    title: "Ayarlar",
};

export default function DashboardSettings({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
