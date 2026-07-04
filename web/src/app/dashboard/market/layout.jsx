export const metadata = {
    title: "Market | Lumanoris",
};

export default function DashboardMarket({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
