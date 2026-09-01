export const metadata = {
    title: "Keşfet",
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
