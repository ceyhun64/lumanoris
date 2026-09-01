export const metadata = {
    title: "Bakiyem",
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
