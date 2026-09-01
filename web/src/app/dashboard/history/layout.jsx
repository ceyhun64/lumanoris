export const metadata = {
    title: "Geçmiş",
};

export default function DashboardHistory({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
