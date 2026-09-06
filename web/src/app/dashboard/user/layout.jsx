export const metadata = {
    title: "Kullanıcı Profili",
};

export default function DashboardUserProfile({ children }) {
    return (
        <>
            <div className="dashboard-inner-layout">
                {children}
            </div>
        </>
    );
}
