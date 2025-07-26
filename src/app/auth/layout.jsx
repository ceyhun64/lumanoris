import Header from "../components/DashboardHeader/DashboardHeader";
import '../../font/stylesheet.css';
import logo from '../../images/header-logo-icon.png';

export const metadata = {
    title: "Auth | Lumanoris",
};

export default function AuthLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}
