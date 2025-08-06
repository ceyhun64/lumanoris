import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import avatarImg from "../../../images/avatar-bot.jpg";
import btnbell from "../../../images/btn-bell.svg";
import btnbellclosed from "../../../images/bell-closed.png";

import ShareModal from '../ShareModal/ShareModal';
import ReportModal from '../ReportModal/ReportModal';
import AddToListModal from '../AddToListModal/AddToListModal';
import BlockModal from '../BlockModal/BlockModal';
import CommentModal from '../CommentModal/CommentModal';
import { useRouter } from 'next/navigation';

export default function ProfileCard() {
    const [isFollowing, setIsFollowing] = useState(false);
    const [showNotificationMenu, setShowNotificationMenu] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // opsiyonel, isterseniz mantık da ekleyebiliriz
    const notificationRef = useRef(null);
    const menuRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(150);
    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(12); // varsayılan değer
    const router = useRouter();
    const [cartAdded, setCartAdded] = useState(false);
    const [isInCart, setIsInCart] = useState(false);

    const profile = {
        id: Math.random().toString(36).substr(2, 9),
        title: "Yazılım Geliştirici",
        author: "Leonardo.ai",
        image: avatarImg.src,
        // ... diğer bilgiler...
    };


    useEffect(() => {
        function handleClickOutside(e) {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(e.target)
            ) {
                setShowNotificationMenu(false);
            }
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {
                setShowMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleAddToCart = (e) => {
    e?.stopPropagation && e.stopPropagation();

    const profileItem = { ...profile, id: `${profile.id}-${profile.title}-${profile.author}` };

    let cart = [];
    if (typeof window !== "undefined") {
        const cartString = localStorage.getItem('cart');
        if (cartString) {
            try {
                cart = JSON.parse(cartString);
            } catch (e) {
                cart = [];
            }
        }

        if (!cart.find(item => item.id === profileItem.id)) {
            cart.push(profileItem);
            localStorage.setItem('cart', JSON.stringify(cart));
            setCartAdded(true);

            setTimeout(() => {
                setCartAdded(false);
                window.location.reload(); // istersen
            }, 2000);
        } else {
            setAlreadyInCart(true);
            setTimeout(() => setAlreadyInCart(false), 2000);
        }
    }
};

    useEffect(() => {
        if (typeof window !== "undefined") {
            const cartString = localStorage.getItem('cart');
            if (cartString) {
                try {
                    const cart = JSON.parse(cartString);
                    const found = cart.some(item => item.id === `${profile.id}-${profile.title}-${profile.author}`);
                    setIsInCart(found);
                } catch (e) {
                    setIsInCart(false);
                }
            }
        }
    }, [profile.id, profile.title, profile.author, cartAdded]);

    // Satın al fonksiyonu
    const handleBuy = (e) => {
        e?.stopPropagation && e.stopPropagation();
        router.push('/dashboard/checkout');
    };


    return (
        <div className="profile-card">
            {/* Üst Bilgi */}
            <div className="profile-top">
                <div className="profile-info">
                    <div className="profile-avatar">
                        <img src={avatarImg.src} alt="" />
                    </div>
                    <div className='profile-cont'>
                        <h2 className="profile-name">Yazılım Geliştirici</h2>
                        <p className="profile-followers">240 bin takipçi</p>
                        <p className="profile-subtext">Leonardo.ai</p>
                    </div>
                </div>
                <div className="profile-actions">
                    <button
                        className={`btn-follow ${isFollowing ? 'active' : ''}`}
                        onClick={() => setIsFollowing(!isFollowing)}
                    >
                        {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                    </button>

                    {/* Bildirim Butonu ve Menü Kapsayıcı */}
                    <div className="notification-wrapper" ref={notificationRef}>
                        <button
                            className={`btn-bell ${notificationsEnabled ? "active" : ""}`}
                            onClick={() => setShowNotificationMenu(prev => !prev)}
                        >
                            <img src={btnbell.src} alt="" className="acc" />
                            <img src={btnbellclosed.src} alt="" className="disabled" />
                        </button>

                        {showNotificationMenu && (
                            <div className="context-menu">
                                <button
                                    className="menu-item"
                                    onClick={() => {
                                        setNotificationsEnabled(true);
                                        setShowNotificationMenu(false);
                                    }}
                                >
                                    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 16H6C6 16.7956 6.31607 17.5587 6.87868 18.1213C7.44129 18.6839 8.20435 19 9 19C9.79565 19 10.5587 18.6839 11.1213 18.1213C11.6839 17.5587 12 16.7956 12 16Z" stroke="#FF66C4" stroke-width="0.96" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M16.3802 12.3798C16.7775 12.7779 17.0006 13.3174 17.0003 13.8798C17.0003 14.1583 16.9455 14.434 16.8389 14.6912C16.7324 14.9484 16.5762 15.1821 16.3793 15.379C16.1825 15.5759 15.9487 15.7321 15.6915 15.8386C15.4343 15.9452 15.1586 16 14.8802 16H3.12016C2.84172 16.0001 2.56599 15.9453 2.30874 15.8387C2.05148 15.7322 1.81773 15.576 1.62084 15.3792C1.42395 15.1823 1.26779 14.9485 1.16126 14.6913C1.05473 14.434 0.999937 14.1583 1 13.8798C0.999723 13.3174 1.22279 12.7779 1.62016 12.3798L3.00016 10.9998V7C3.00016 5.4087 3.6323 3.88258 4.75752 2.75736C5.88274 1.63214 7.40886 1 9.00016 1C10.5915 1 12.1176 1.63214 13.2428 2.75736C14.368 3.88258 15.0002 5.4087 15.0002 7V10.9998L16.3802 12.3798Z" stroke="white" stroke-width="0.96" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                    Tümünü Aç
                                </button>
                                <div className="seperator"></div>
                                <button
                                    className="menu-item"
                                    onClick={() => {
                                        setNotificationsEnabled(false);
                                        setShowNotificationMenu(false);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" viewBox="0 0 18 21" fill="none">
                                        <path d="M12.3359 16.6133H6.33594C6.33594 17.4089 6.65201 18.172 7.21462 18.7346C7.77723 19.2972 8.54029 19.6133 9.33594 19.6133C10.1316 19.6133 10.8946 19.2972 11.4573 18.7346C12.0199 18.172 12.3359 17.4089 12.3359 16.6133Z" stroke="#FF66C4" stroke-width="0.96" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M16.7161 12.9931C17.1135 13.3912 17.3365 13.9307 17.3363 14.4931C17.3363 14.7715 17.2814 15.0472 17.1749 15.3045C17.0683 15.5617 16.9122 15.7954 16.7153 15.9923C16.5184 16.1892 16.2847 16.3453 16.0274 16.4519C15.7702 16.5584 15.4945 16.6133 15.2161 16.6133H3.4561C3.17766 16.6133 2.90193 16.5585 2.64467 16.452C2.38741 16.3455 2.15367 16.1893 1.95678 15.9924C1.75989 15.7956 1.60372 15.5618 1.4972 15.3045C1.39067 15.0473 1.33587 14.7716 1.33594 14.4931C1.33566 13.9307 1.55872 13.3912 1.9561 12.9931L3.3361 11.6131V7.61328C3.3361 6.02198 3.96824 4.49586 5.09346 3.37064C6.21867 2.24542 7.7448 1.61328 9.3361 1.61328C10.9274 1.61328 12.4535 2.24542 13.5787 3.37064C14.704 4.49586 15.3361 6.02198 15.3361 7.61328V11.6131L16.7161 12.9931Z" stroke="white" stroke-width="0.96" stroke-linecap="round" stroke-linejoin="round" />
                                        <rect y="19.1992" width="25.3315" height="1.16141" rx="0.580705" transform="rotate(-49.2843 0 19.1992)" fill="white" />
                                    </svg>
                                    Tümünü Kapat
                                </button>
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* Orta Butonlar */}
            <div className="profile-buttons">
                <div className="button-ctr">
                    <button className={`like ${liked ? "active" : ""}`}
                        onClick={() => {
                            if (!liked) {
                                setLiked(true);
                                setLikeCount((prev) => prev + 1);

                                if (disliked) {
                                    setDisliked(false);
                                    setDislikeCount((prev) => prev - 1);
                                }
                            } else {
                                setLiked(false);
                                setLikeCount((prev) => prev - 1);
                            }
                        }}
                    >
                        <span>
                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.2702 16.8275L20.9752 12.7475C21.0166 12.5084 21.0052 12.2631 20.9419 12.0288C20.8786 11.7945 20.7648 11.5769 20.6086 11.3912C20.4524 11.2055 20.2575 11.0561 20.0376 10.9535C19.8176 10.851 19.5779 10.7977 19.3352 10.7975H14.1532C14.0324 10.7974 13.913 10.771 13.8034 10.7201C13.6938 10.6693 13.5966 10.5952 13.5185 10.503C13.4404 10.4108 13.3833 10.3027 13.3511 10.1863C13.3189 10.0698 13.3125 9.94772 13.3322 9.82851L13.9952 5.78351C14.1023 5.12672 14.0717 4.45483 13.9052 3.81051C13.8333 3.5444 13.6954 3.30073 13.5044 3.102C13.3133 2.90327 13.0753 2.7559 12.8122 2.67351L12.6672 2.62651C12.3396 2.52188 11.9845 2.5462 11.6742 2.69451C11.3342 2.85851 11.0862 3.15751 10.9942 3.51251L10.5182 5.34651C10.3669 5.93022 10.1467 6.49385 9.86223 7.02551C9.44623 7.80251 8.80423 8.42551 8.13723 9.00051L6.69723 10.2405C6.49759 10.413 6.34168 10.6304 6.24225 10.8748C6.14283 11.1192 6.10272 11.3836 6.12523 11.6465L6.93823 21.0395C6.974 21.4547 7.16411 21.8415 7.47105 22.1234C7.77798 22.4054 8.17945 22.562 8.59623 22.5625H13.2452C16.7262 22.5625 19.6972 20.1365 20.2692 16.8275" fill="#FFE6F2" />
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M2.96808 10.0476C3.16134 10.0391 3.35039 10.1057 3.49574 10.2333C3.64109 10.361 3.7315 10.5399 3.74808 10.7326L4.71808 21.9686C4.73451 22.1359 4.71666 22.3048 4.66562 22.465C4.61458 22.6252 4.53142 22.7733 4.42122 22.9003C4.31102 23.0273 4.17609 23.1304 4.02468 23.2035C3.87327 23.2766 3.70855 23.318 3.54058 23.3253C3.37261 23.3326 3.20492 23.3056 3.04775 23.2459C2.89058 23.1862 2.74723 23.0951 2.62646 22.9781C2.50568 22.8611 2.41002 22.7208 2.3453 22.5656C2.28059 22.4104 2.24819 22.2437 2.25008 22.0756V10.7966C2.25016 10.6033 2.32488 10.4175 2.45866 10.2779C2.59244 10.1383 2.77494 10.0558 2.96808 10.0476Z" fill="#FFE6F2" />
                            </svg>
                        </span>
                        {likeCount}
                    </button>
                    <button className={`dislike ${disliked ? "active" : ""}`}
                        onClick={() => {
                            if (!disliked) {
                                setDisliked(true);
                                setDislikeCount((prev) => prev + 1);

                                if (liked) {
                                    setLiked(false);
                                    setLikeCount((prev) => prev - 1);
                                }
                            } else {
                                setDisliked(false);
                                setDislikeCount((prev) => prev - 1);
                            }
                        }}
                    >
                        <span>
                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.2702 9.0475L20.9752 13.1275C21.0166 13.3666 21.0052 13.6119 20.9419 13.8462C20.8786 14.0805 20.7648 14.2981 20.6086 14.4838C20.4524 14.6696 20.2575 14.8189 20.0376 14.9215C19.8176 15.024 19.5779 15.0773 19.3352 15.0775H14.1532C14.0324 15.0776 13.913 15.104 13.8034 15.1549C13.6938 15.2057 13.5966 15.2798 13.5185 15.372C13.4404 15.4642 13.3833 15.5723 13.3511 15.6888C13.3189 15.8052 13.3125 15.9273 13.3322 16.0465L13.9952 20.0915C14.1025 20.7486 14.0718 21.4209 13.9052 22.0655C13.7652 22.5985 13.3542 23.0275 12.8122 23.2015L12.6672 23.2485C12.3396 23.3531 11.9845 23.3288 11.6742 23.1805C11.5081 23.102 11.3611 22.9881 11.2437 22.8468C11.1262 22.7055 11.0411 22.5402 10.9942 22.3625L10.5182 20.5285C10.3669 19.9448 10.1467 19.3812 9.86223 18.8495C9.44623 18.0725 8.80423 17.4495 8.13723 16.8745L6.69723 15.6345C6.49759 15.462 6.34168 15.2446 6.24225 15.0002C6.14283 14.7559 6.10272 14.4914 6.12523 14.2285L6.93823 4.8355C6.974 4.42026 7.16411 4.03351 7.47105 3.75157C7.77798 3.46962 8.17945 3.31296 8.59623 3.3125H13.2452C16.7262 3.3125 19.6972 5.7385 20.2692 9.0475" fill="#FFE6F2" />
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M2.96808 15.8277C3.16134 15.8362 3.35039 15.7696 3.49574 15.642C3.64109 15.5143 3.7315 15.3355 3.74808 15.1427L4.71808 3.90672C4.73451 3.7394 4.71666 3.57049 4.66562 3.4103C4.61458 3.25011 4.53142 3.102 4.42122 2.97503C4.31102 2.84805 4.17609 2.74487 4.02468 2.6718C3.87327 2.59872 3.70855 2.55727 3.54058 2.54999C3.37261 2.54271 3.20492 2.56974 3.04775 2.62944C2.89058 2.68914 2.74723 2.78025 2.62646 2.89721C2.50568 3.01417 2.41002 3.15453 2.3453 3.3097C2.28059 3.46487 2.24819 3.63161 2.25008 3.79972V15.0787C2.2499 15.2722 2.32451 15.4583 2.45832 15.5981C2.59212 15.7378 2.77476 15.8195 2.96808 15.8277Z" fill="#FFE6F2" />
                            </svg>
                        </span>
                        {dislikeCount}
                    </button>
                </div>
                <button className='button-ctr' onClick={() => setShareOpen(true)}>
                    <span>
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.5" d="M19.5 6.5625C19.5 6.03207 19.2893 5.52336 18.9142 5.14829C18.5391 4.77321 18.0304 4.5625 17.5 4.5625C16.9696 4.5625 16.4609 4.77321 16.0858 5.14829C15.7107 5.52336 15.5 6.03207 15.5 6.5625C15.5 7.09293 15.7107 7.60164 16.0858 7.97671C16.4609 8.35179 16.9696 8.5625 17.5 8.5625C18.0304 8.5625 18.5391 8.35179 18.9142 7.97671C19.2893 7.60164 19.5 7.09293 19.5 6.5625ZM8.5 12.5625C8.5 12.0321 8.28929 11.5234 7.91421 11.1483C7.53914 10.7732 7.03043 10.5625 6.5 10.5625C5.96957 10.5625 5.46086 10.7732 5.08579 11.1483C4.71071 11.5234 4.5 12.0321 4.5 12.5625C4.5 13.0929 4.71071 13.6016 5.08579 13.9767C5.46086 14.3518 5.96957 14.5625 6.5 14.5625C7.03043 14.5625 7.53914 14.3518 7.91421 13.9767C8.28929 13.6016 8.5 13.0929 8.5 12.5625ZM17.5 16.5625C18.0304 16.5625 18.5391 16.7732 18.9142 17.1483C19.2893 17.5234 19.5 18.0321 19.5 18.5625C19.5 19.0929 19.2893 19.6016 18.9142 19.9767C18.5391 20.3518 18.0304 20.5625 17.5 20.5625C16.9696 20.5625 16.4609 20.3518 16.0858 19.9767C15.7107 19.6016 15.5 19.0929 15.5 18.5625C15.5 18.0321 15.7107 17.5234 16.0858 17.1483C16.4609 16.7732 16.9696 16.5625 17.5 16.5625Z" fill="white" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5009 3.8125C17.9264 3.81249 18.3462 3.91125 18.7271 4.101C19.108 4.29075 19.4397 4.56631 19.6961 4.90601C19.9524 5.2457 20.1264 5.64025 20.2044 6.05861C20.2824 6.47697 20.2622 6.90772 20.1454 7.31695C20.0287 7.72619 19.8185 8.10274 19.5316 8.41698C19.2446 8.73122 18.8886 8.97457 18.4916 9.12787C18.0946 9.28117 17.6675 9.34025 17.2438 9.30045C16.8201 9.26065 16.4114 9.12305 16.0499 8.8985C16.0211 8.91735 15.9914 8.93471 15.9609 8.9505L9.24788 12.4305C9.25176 12.5185 9.25176 12.6065 9.24788 12.6945L9.26088 12.7025L15.6769 16.5045C16.1565 16.0793 16.7695 15.835 17.41 15.8137C18.0506 15.7925 18.6784 15.9956 19.1851 16.3881C19.6918 16.7805 20.0456 17.3376 20.1852 17.9632C20.3248 18.5887 20.2416 19.2433 19.9498 19.814C19.6581 20.3846 19.1762 20.8355 18.5874 21.0886C17.9986 21.3418 17.3399 21.3813 16.725 21.2004C16.1102 21.0195 15.5778 20.6296 15.2199 20.0979C14.862 19.5662 14.7011 18.9262 14.7649 18.2885L8.42088 14.5305C8.03335 14.9088 7.54276 15.1642 7.01063 15.2648C6.47851 15.3653 5.92854 15.3065 5.4297 15.0957C4.93085 14.885 4.50534 14.5316 4.20653 14.08C3.90772 13.6283 3.7489 13.0985 3.75001 12.557C3.75111 12.0154 3.91208 11.4863 4.21273 11.0359C4.51338 10.5854 4.94032 10.2338 5.44002 10.0251C5.93972 9.81634 6.48993 9.75978 7.02164 9.86251C7.55335 9.96523 8.04289 10.2227 8.42888 10.6025L14.8439 7.2765C14.7343 6.86885 14.72 6.44145 14.8021 6.02739C14.8843 5.61334 15.0606 5.22375 15.3175 4.88881C15.5745 4.55387 15.905 4.28257 16.2836 4.09592C16.6623 3.90928 17.0788 3.8123 17.5009 3.8125ZM16.4449 17.8935C16.4168 17.973 16.3789 18.0486 16.3319 18.1185C16.2176 18.418 16.2227 18.7501 16.3463 19.0459C16.4699 19.3417 16.7024 19.5788 16.9958 19.7081C17.2892 19.8373 17.621 19.8489 17.9227 19.7404C18.2244 19.6319 18.4729 19.4117 18.6168 19.1252C18.7607 18.8386 18.789 18.5078 18.6958 18.201C18.6027 17.8942 18.3952 17.635 18.1164 17.4768C17.8375 17.3187 17.5085 17.2737 17.1974 17.3513C16.8863 17.4288 16.6169 17.6229 16.4449 17.8935ZM18.7509 6.5625C18.7509 6.23098 18.6192 5.91304 18.3848 5.67862C18.1503 5.4442 17.8324 5.3125 17.5009 5.3125C17.1694 5.3125 16.8514 5.4442 16.617 5.67862C16.3826 5.91304 16.2509 6.23098 16.2509 6.5625C16.2509 6.89402 16.3826 7.21196 16.617 7.44638C16.8514 7.6808 17.1694 7.8125 17.5009 7.8125C17.8324 7.8125 18.1503 7.6808 18.3848 7.44638C18.6192 7.21196 18.7509 6.89402 18.7509 6.5625ZM7.75088 12.5625C7.75088 12.231 7.61919 11.913 7.38477 11.6786C7.15035 11.4442 6.8324 11.3125 6.50088 11.3125C6.16936 11.3125 5.85142 11.4442 5.617 11.6786C5.38258 11.913 5.25088 12.231 5.25088 12.5625C5.25088 12.894 5.38258 13.212 5.617 13.4464C5.85142 13.6808 6.16936 13.8125 6.50088 13.8125C6.8324 13.8125 7.15035 13.6808 7.38477 13.4464C7.61919 13.212 7.75088 12.894 7.75088 12.5625Z" fill="#FFE6F2" />
                        </svg>
                    </span>
                    Paylaş
                </button>
                <button onClick={() => setCommentOpen(true)} className='button-ctr'><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.2" d="M21 6.5625V18.5625C21 18.7614 20.921 18.9522 20.7803 19.0928C20.6397 19.2335 20.4489 19.3125 20.25 19.3125H7.5L4.23281 22.1353C4.12357 22.2272 3.99038 22.286 3.84887 22.3048C3.70737 22.3237 3.56343 22.3017 3.43397 22.2416C3.30451 22.1814 3.1949 22.0855 3.11803 21.9653C3.04116 21.845 3.00021 21.7053 3 21.5625V6.5625C3 6.36359 3.07902 6.17282 3.21967 6.03217C3.36032 5.89152 3.55109 5.8125 3.75 5.8125H20.25C20.4489 5.8125 20.6397 5.89152 20.7803 6.03217C20.921 6.17282 21 6.36359 21 6.5625Z" fill="#FFE6F2" />
                    <path d="M20.25 5.0625H3.75003C3.3522 5.0625 2.97067 5.22054 2.68937 5.50184C2.40806 5.78314 2.25003 6.16468 2.25003 6.5625V21.5625C2.2483 21.8485 2.32921 22.129 2.48305 22.3701C2.63689 22.6113 2.8571 22.8029 3.11721 22.9219C3.31543 23.0142 3.53138 23.0622 3.75003 23.0625C4.10214 23.0616 4.44256 22.936 4.71096 22.7081L4.7194 22.7016L7.78128 20.0625H20.25C20.6479 20.0625 21.0294 19.9045 21.3107 19.6232C21.592 19.3419 21.75 18.9603 21.75 18.5625V6.5625C21.75 6.16468 21.592 5.78314 21.3107 5.50184C21.0294 5.22054 20.6479 5.0625 20.25 5.0625ZM20.25 18.5625H7.50003C7.31994 18.5626 7.1459 18.6275 7.00971 18.7453L3.75003 21.5625V6.5625H20.25V18.5625Z" fill="#FFE6F2" />
                </svg>
                </span>12 Yorum</button>
                {/* <button className='button-ctr' onClick={() => setModalVisible(true)}>
                    <span>
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.5625C16.9706 21.5625 21 17.5331 21 12.5625C21 7.59194 16.9706 3.5625 12 3.5625C7.02944 3.5625 3 7.59194 3 12.5625C3 17.5331 7.02944 21.5625 12 21.5625Z" fill="white" fill-opacity="0.25" />
                            <path d="M12 8.5625V16.5625M16 12.5625H8" stroke="#FFE6F2" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round" />
                        </svg>
                    </span >
                    Listeye Ekle
                </button> */}

                <div className="dropdown-wrapper" ref={menuRef}>
                    <button className="button-ctr" onClick={() => setShowMenu(prev => !prev)}>
                        <span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.3" d="M12 2.56055C17.524 2.56055 22.002 7.03855 22.002 12.5625C22.002 18.0855 17.524 22.5635 12 22.5635C6.476 22.5635 2 18.0855 2 12.5625C1.999 7.03855 6.476 2.56055 12 2.56055Z" fill="white" />
                            <path d="M12.0012 7.06297C11.8339 7.05838 11.6673 7.08738 11.5114 7.14828C11.3555 7.20917 11.2134 7.30071 11.0934 7.41748C10.9735 7.53426 10.8782 7.6739 10.8132 7.82814C10.7481 7.98239 10.7147 8.14811 10.7148 8.3155C10.715 8.48289 10.7487 8.64856 10.8139 8.8027C10.8792 8.95684 10.9747 9.09633 11.0949 9.21291C11.215 9.3295 11.3573 9.42081 11.5133 9.48145C11.6693 9.54209 11.8359 9.57083 12.0032 9.56597C12.329 9.55638 12.6382 9.42012 12.8651 9.18615C13.092 8.95218 13.2188 8.63894 13.2184 8.31301C13.218 7.98708 13.0905 7.67415 12.863 7.44073C12.6356 7.2073 12.326 7.07178 12.0002 7.06297H12.0012ZM11.9962 10.812C11.7511 10.8123 11.5147 10.9026 11.3319 11.0658C11.149 11.2289 11.0324 11.4535 11.0042 11.697L10.9972 11.813L11.0012 17.315L11.0072 17.432C11.0354 17.6759 11.1523 17.9008 11.3357 18.0641C11.5191 18.2273 11.7561 18.3174 12.0016 18.3171C12.2471 18.3169 12.4839 18.2263 12.667 18.0627C12.85 17.8991 12.9665 17.6739 12.9942 17.43L13.0002 17.313L12.9962 11.812L12.9892 11.695C12.9603 11.4517 12.8431 11.2276 12.6599 11.065C12.4767 10.9024 12.2402 10.8127 11.9952 10.813L11.9962 10.812Z" fill="white" />
                        </svg>
                        </span>
                        Diğer
                    </button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            <button onClick={() => {/* setBlockOpen(true) */router.push("/dashboard") }}>
                                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.27 8.985L20.975 13.065C21.0164 13.3041 21.005 13.5494 20.9417 13.7837C20.8783 14.018 20.7646 14.2356 20.6084 14.4213C20.4522 14.6071 20.2573 14.7564 20.0373 14.859C19.8174 14.9615 19.5777 15.0148 19.335 15.015H14.153C14.0322 15.0151 13.9128 15.0415 13.8032 15.0924C13.6936 15.1432 13.5964 15.2173 13.5183 15.3095C13.4401 15.4017 13.383 15.5098 13.3509 15.6263C13.3187 15.7427 13.3123 15.8648 13.332 15.984L13.995 20.029C14.1022 20.6861 14.0716 21.3584 13.905 22.003C13.765 22.536 13.354 22.965 12.812 23.139L12.667 23.186C12.3394 23.2906 11.9842 23.2663 11.674 23.118C11.5078 23.0395 11.3609 22.9256 11.2434 22.7843C11.126 22.643 11.0408 22.4777 10.994 22.3L10.518 20.466C10.3667 19.8823 10.1465 19.3187 9.86198 18.787C9.44598 18.01 8.80398 17.387 8.13698 16.812L6.69698 15.572C6.49735 15.3995 6.34143 15.1821 6.24201 14.9377C6.14258 14.6934 6.10248 14.4289 6.12498 14.166L6.93798 4.773C6.97375 4.35776 7.16387 3.97101 7.4708 3.68907C7.77774 3.40712 8.1792 3.25046 8.59598 3.25H13.245C16.726 3.25 19.697 5.676 20.269 8.985" fill="#FF99D6" />
                                    <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M2.96808 15.7652C3.16134 15.7737 3.35039 15.7071 3.49574 15.5795C3.64109 15.4518 3.7315 15.273 3.74808 15.0802L4.71808 3.84422C4.73451 3.6769 4.71666 3.50799 4.66562 3.3478C4.61458 3.18761 4.53142 3.0395 4.42122 2.91253C4.31102 2.78555 4.17609 2.68237 4.02468 2.6093C3.87327 2.53622 3.70855 2.49477 3.54058 2.48749C3.37261 2.48021 3.20492 2.50724 3.04775 2.56694C2.89058 2.62664 2.74723 2.71775 2.62646 2.83471C2.50568 2.95167 2.41002 3.09203 2.3453 3.2472C2.28059 3.40237 2.24819 3.56911 2.25008 3.73722V15.0162C2.2499 15.2097 2.32451 15.3958 2.45832 15.5356C2.59212 15.6753 2.77476 15.757 2.96808 15.7652Z" fill="#FF99D6" />
                                </svg>
                                İlgilenmiyorum
                            </button>
                            <button onClick={() => setReportOpen(true)}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_7772_14234)">
                                        <path opacity="0.3" d="M6.1 2L2 6.1V11.9L6.1 16H11.9L16 11.9V6.1L11.9 2H6.1ZM9 14C8.45 14 8 13.55 8 13C8 12.45 8.45 12 9 12C9.55 12 10 12.45 10 13C10 13.55 9.55 14 9 14ZM10 11H8V4H10V11Z" fill="#D063CC" />
                                        <path d="M12.73 0H5.27L0 5.27V12.73L5.27 18H12.73L18 12.73V5.27L12.73 0ZM16 11.9L11.9 16H6.1L2 11.9V6.1L6.1 2H11.9L16 6.1V11.9Z" fill="#D063CC" />
                                        <path d="M9 14C9.55228 14 10 13.5523 10 13C10 12.4477 9.55228 12 9 12C8.44772 12 8 12.4477 8 13C8 13.5523 8.44772 14 9 14Z" fill="#D063CC" />
                                        <path d="M8 4H10V11H8V4Z" fill="#D063CC" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_7772_14234">
                                            <rect width="18" height="18" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                Bildir
                            </button>
                        </div>
                    )}
                </div>


                <div className="button-buy"
                    style={isInCart ? { opacity: 0.7, pointerEvents: "none" } : {}}
                    onClick={handleAddToCart}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.1667 17.082H14.2499M9.16675 17.082H9.24995" stroke="white" stroke-width="1.44" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2.5 2.50007H4.2832C4.48424 2.49744 4.67943 2.5677 4.83268 2.69786C4.98592 2.82801 5.08685 3.00926 5.1168 3.20807L5.5168 5.83327M5.5168 5.83327L6.6668 13.3333L15.8332 12.5001L17.5 5.83327H5.5168Z" stroke="white" stroke-width="0.96" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div className="button-cart"
                    onClick={handleBuy}>
                    Satın Al
                </div>

            </div>


            {/* Açıklama */}
            <p className="profile-description">
                Kısa Cevap Şu: Bu Metin, Gerçek Anlam İçermeyen, Rastgele Oluşturulmuş Placeholder’dır. Sadece Tasarım Yer Tutucusu Olarak Kullanılır.
            </p>

            <CommentModal
                isOpen={commentOpen}
                onClose={() => setCommentOpen(false)}
                comments={[
                    { text: "Harika bir model olmuş", author: "adnankocak", date: "2 gün önce" },
                    { text: "Gerçekten faydalı bir model", author: "ahmetyasin", date: "2 gün önce" },
                    { text: "Harika bir model olmuş", author: "adnankocak", date: "2 gün önce" },
                    { text: "Gerçekten faydalı bir model", author: "ahmetyasin", date: "2 gün önce" },
                    { text: "Harika bir model olmuş", author: "adnankocak", date: "2 gün önce" },
                ]}
                onSend={(comment) => console.log("Yeni yorum:", comment)}
            />
            <BlockModal isOpen={blockOpen} onClose={() => setBlockOpen(false)} />
            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={["Favorilerim", "Sık Kullanılanlar"]}
            />
            {cartAdded && (
                <div className="cart-feedback-badge">
                    Sepete eklendi!
                </div>
            )}
        </div>
    )
}
