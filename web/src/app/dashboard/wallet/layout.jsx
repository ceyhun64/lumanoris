export const metadata = {
    title: "Wallet | Lumanoris",
};

export default function DashboardWallet({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
