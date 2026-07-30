export const metadata = {
    title: "Liste | Lumanoris",
};

export default function DashboardList({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
