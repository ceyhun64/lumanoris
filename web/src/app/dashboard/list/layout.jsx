export const metadata = {
    title: "Following | Lumanoris",
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
