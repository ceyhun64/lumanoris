import React from "react";

export default function ProfilePopup({ user, onLogout }) {
    const [profileImage, setProfileImage] = React.useState(null);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const savedImage = localStorage.getItem('userProfileImage');
            setProfileImage(savedImage);
            
            const handleProfileImageUpdated = () => {
                const updatedImage = localStorage.getItem('userProfileImage');
                setProfileImage(updatedImage);
            };
            
            window.addEventListener('profileImageUpdated', handleProfileImageUpdated);
            return () => {
                window.removeEventListener('profileImageUpdated', handleProfileImageUpdated);
            };
        }
    }, []);

    return (
        <div className="profile-popup">
            <div className="profile-popup__top">
                <div className="profile-popup__avatar">
                    {profileImage ? (
                        <img src={profileImage} alt="avatar" />
                    ) : null}
                </div>
                <div>
                    <div className="profile-popup__username">{user.username}</div>
                    <div className="profile-popup__fullname">{user.fullname}</div>
                </div>
            </div>
            <div className="profile-popup__row">
                {/* <span>{user.followerCount} Takipçi</span>
                <span className="dot">•</span>
                <span>{user.followingCount} Takip Edilen</span> */}
            </div>
            <div className="profile-popup__stat">{user.chatbotCount} Üretilen chatbot</div>
            <div className="profile-popup__stat">0 Satın Alınan chatbot</div>
            <div className="profile-popup__stat">0 Paylaşılan diyalog</div>
            <button className="profile-popup__logout-btn" onClick={onLogout}>
                <span className="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4771 21.2451H8.3401C7.04824 21.3042 5.78507 20.8522 4.82389 19.9871C3.86272 19.1219 3.28082 17.9131 3.2041 16.6221V7.37814C3.28082 6.0872 3.86272 4.87838 4.82389 4.01321C5.78507 3.14804 7.04824 2.69608 8.3401 2.75514H13.4761" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.7954 12H7.44238" stroke="white" strokeWidth="1.5" stroke-miterlimit="10" strokeLinecap="round" />
                        <path d="M16.083 17.1353L20.487 12.7313C20.68 12.5365 20.7882 12.2734 20.7882 11.9993C20.7882 11.7251 20.68 11.462 20.487 11.2673L16.083 6.86328" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <div className="text">
                    Çıkış yap
                </div>
            </button>
        </div>
    );
}
