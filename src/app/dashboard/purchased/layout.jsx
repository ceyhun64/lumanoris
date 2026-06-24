export const metadata = {
    title: "Satın Aldıklarım | Lumanoris",
};

export default function DashboardPurchased({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
