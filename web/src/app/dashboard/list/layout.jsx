export const metadata = {
    title: "Liste",
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
