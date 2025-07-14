export const metadata = {
    title: "Wallet | Lumanoris",
};

export default function DashboardNotes({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
