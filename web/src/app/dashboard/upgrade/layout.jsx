export const metadata = {
    title: "Yükselt | Lumanoris",
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
