export const metadata = {
    title: "Geçmiş | Lumanoris",
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
