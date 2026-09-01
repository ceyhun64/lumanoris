export const metadata = {
    title: "Sohbet",
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
