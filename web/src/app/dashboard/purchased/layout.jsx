export const metadata = {
    title: "Satın Aldıklarım",
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
