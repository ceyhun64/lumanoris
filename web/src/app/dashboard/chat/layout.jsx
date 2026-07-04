export const metadata = {
    title: "Chat | Lumanoris",
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
