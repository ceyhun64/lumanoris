export const metadata = {
    title: "Sohbet | Lumanoris",
};

export default function DashboardChat({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
