export const metadata = {
    title: "Pazaryeri | Lumanoris",
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
