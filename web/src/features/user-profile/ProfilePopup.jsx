import React from "react";
import { cn } from "@/lib/utils";

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

    // DB, gerçek kaynak: yukarıdaki localStorage değeri sadece hızlı-önizlemedir.
    React.useEffect(() => {
        if (!user?.id) return;
        async function fetchDbPhoto() {
            try {
                const res = await fetch(`/api/user/user_getphoto.php?id=${user.id}`);
                const result = await res.json();
                if (result.success) setProfileImage(result.avatar || null);
            } catch (err) {
                console.error("Profil fotoğrafı alınamadı:", err);
            }
        }
        fetchDbPhoto();
    }, [user?.id]);

    return (
        <div className="flex min-w-[230px] max-w-[calc(100vw-24px)] flex-col gap-3 rounded-xl border border-white/10 bg-luma-panel p-3 shadow-card transition-shadow duration-200 hover:shadow-modal">
            <div className="mb-0.5 flex w-full items-center gap-2">
                <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-luma">
                    {profileImage ? (
                        <img src={profileImage} alt="avatar" className="h-full w-full object-cover" />
                    ) : null}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{user.username}</div>
                    <div className="truncate text-[10px] font-medium text-white/50">{user.fullname}</div>
                </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] font-medium text-white">
                {/* <span>{user.followerCount} Takipçi</span>
                <span className="dot">•</span>
                <span>{user.followingCount} Takip Edilen</span> */}
            </div>
            <div className="border-b border-white/10 pb-3 text-[11px] font-medium text-white">
                {user.chatbotCount} Üretilen chatbot
            </div>
            <div className="border-b border-white/10 pb-3 text-[11px] font-medium text-white">
                0 Satın Alınan chatbot
            </div>
            <div className="pb-3 text-[11px] font-medium text-white">
                0 Paylaşılan diyalog
            </div>
            <button
                className={cn(
                    "flex items-center justify-center gap-4 rounded-xl border border-white/10 bg-transparent p-3 text-white/70 transition-all duration-200",
                    "hover:border-rose-400/25 hover:bg-rose-500/10 hover:text-rose-400 hover:shadow-[0_4px_18px_rgba(244,63,94,0.15)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                onClick={onLogout}
            >
                <span className="flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4771 21.2451H8.3401C7.04824 21.3042 5.78507 20.8522 4.82389 19.9871C3.86272 19.1219 3.28082 17.9131 3.2041 16.6221V7.37814C3.28082 6.0872 3.86272 4.87838 4.82389 4.01321C5.78507 3.14804 7.04824 2.69608 8.3401 2.75514H13.4761" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.7954 12H7.44238" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
                        <path d="M16.083 17.1353L20.487 12.7313C20.68 12.5365 20.7882 12.2734 20.7882 11.9993C20.7882 11.7251 20.68 11.462 20.487 11.2673L16.083 6.86328" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <div className="text-sm font-normal">
                    Çıkış yap
                </div>
            </button>
        </div>
    );
}
