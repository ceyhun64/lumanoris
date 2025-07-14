export const metadata = {
    title: "Following | Lumanoris",
};

export default function DashboardUpgrade({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
