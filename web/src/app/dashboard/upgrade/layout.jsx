export const metadata = {
    title: "Yükselt",
};

export default function DashboardUpgrade({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
