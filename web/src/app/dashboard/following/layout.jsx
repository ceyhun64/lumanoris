export const metadata = {
    title: "Takip Edilenler",
};

export default function DashboardFollowing({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
