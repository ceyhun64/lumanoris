import Header from "../components/DashboardHeader/DashboardHeader";
import '../../font/stylesheet.css';
import logo from '../../images/header-logo-icon.png';

export const metadata = {
    title: "Register | Lumanoris",
};

export default function AuthLayout({ children }) {
    return (
        <>
            <div className="auth-layout">
                <div className="navbar-auth">
                    <div className="logo">
                        <div className="icon">
                            <img src={logo.src} alt="logo" />
                        </div>
                        <span>LUMANORIS</span>
                    </div>
                </div>

                {children}
            </div>
        </>
    );
}
