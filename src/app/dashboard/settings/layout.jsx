export const metadata = {
    title: "Settings | Lumanoris",
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
