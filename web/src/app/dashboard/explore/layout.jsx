export const metadata = {
    title: "Explore | Lumanoris",
};

export default function DashboardExplore({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
