import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import { useRouter } from 'next/navigation';
import CommentModal from '@/features/comments/CommentModal';
import { cn } from '@/lib/utils';

const BADGE_CLASSES = {
    sold:     'bg-[#FFB1B1] text-[#FF3116]',
    produced: 'bg-[#C8FFD4] text-[#2ABC49]',
    rented:   'bg-[#FFF2C8] text-[#F59B00]',
};

export default function MarketCard({ bot, onRemove }) {
    const router = useRouter();
    const { image, title, author, dialogues, time, badge, avatar, likes, comments, price, priceType } = bot;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes || 0);
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [isInCart, setIsInCart] = useState(false);

    const toggleMenu = () => setMenuOpen(prev => !prev);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleHideBot = (e) => {
        e.stopPropagation();
        setShowFeedbackBadge(true);
        setMenuOpen(false);
        setTimeout(() => {
            setShowFeedbackBadge(false);
            onRemove?.();
        }, 2000);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        if (liked) { setLiked(false); setLikeCount(likeCount - 1); }
        else { setLiked(true); setLikeCount(likeCount + 1); }
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        const botItem = { ...bot, id: `${bot.id}-${bot.title}-${bot.author}` };
        let cart = [];
        if (typeof window !== "undefined") {
            const cartString = localStorage.getItem('cart');
            if (cartString) { try { cart = JSON.parse(cartString); } catch { cart = []; } }
            if (!cart.find(item => item.id === botItem.id)) {
                cart.push(botItem);
                localStorage.setItem('cart', JSON.stringify(cart));
                setCartAdded(true);
                window.dispatchEvent(new Event('cartUpdated'));
                setTimeout(() => setCartAdded(false), 2000);
            }
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const cartString = localStorage.getItem('cart');
            if (cartString) {
                try {
                    const cart = JSON.parse(cartString);
                    setIsInCart(cart.some(item => item.id === `${bot.id}-${bot.title}-${bot.author}`));
                } catch { setIsInCart(false); }
            }
        }
    }, [bot.id, bot.title, bot.author, cartAdded]);

    return (
        <div
            className={cn(
                'relative flex flex-col cursor-pointer p-3 rounded-lg border bg-[#0D0D1A] gap-3 justify-between transition-all duration-300 hover:shadow-[0_0_12px_rgba(217,70,239,0.25)]',
                isInCart ? 'border-fuchsia-400/50' : 'border-[rgba(255,241,250,0.2)]',
            )}
            onClick={() => router.push('/dashboard/chat')}
        >
            {/* Glow overlay */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none rounded-lg">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="161" viewBox="0 0 200 161" fill="none" className="w-full">
                        <g filter="url(#mc_blur)">
                            <ellipse cx="101.044" cy="-4.51165" rx="69.3284" ry="40.8673" fill="url(#mc_grad)" />
                        </g>
                        <defs>
                            <filter id="mc_blur" x="-92" y="-169" width="386" height="329" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur" />
                            </filter>
                            <linearGradient id="mc_grad" x1="31.7" y1="-4.5" x2="170.4" y2="-4.5" gradientUnits="userSpaceOnUse">
                                <stop offset="0.21" stopColor="#E879F9" />
                                <stop offset="0.79" stopColor="#A78BFA" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            {/* Image */}
            <div className="relative w-full z-[1]">
                {badge && (
                    <span className={cn(
                        'absolute top-[7px] right-[5px] font-display text-[8.34px] font-medium px-1 rounded z-[2]',
                        BADGE_CLASSES[badge.type] ?? 'bg-white/10 text-white',
                    )}>
                        {badge.label}
                    </span>
                )}
                <Image
                    src={image}
                    alt={title}
                    width={300}
                    height={300}
                    className="w-full aspect-square object-cover rounded-t-lg relative z-[1]"
                />
            </div>

            {/* Info */}
            <div className="flex flex-col items-start w-full z-[2]">

                {/* Title row + context menu */}
                <div className="flex flex-row justify-between items-center w-full mb-3">
                    <div className="flex items-center gap-1 min-w-0">
                        <Image
                            src={avatar}
                            alt="Avatar"
                            width={25}
                            height={25}
                            className="rounded-full border border-[rgba(255,230,242,0.12)] w-[25px] h-[25px] object-cover shrink-0"
                        />
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-white font-display text-[11.51px] truncate">{title}</span>
                            <div className="text-[#8C8C8C] font-display text-[8.34px] truncate">{author}</div>
                        </div>
                    </div>

                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            className="flex items-center justify-center cursor-pointer text-[#8C8C8C] hover:text-white/80 transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                                <path d="M9 12.4a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 12.4ZM9 7.5a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 7.5ZM9 2.6a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 2.6Z" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div
                                className="absolute bottom-20 left-1/2 -translate-x-1/2 py-3 px-6 w-[280px] z-[99999] rounded-xl bg-[#111120] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ul className="list-none flex flex-col gap-3">
                                    <li
                                        className="flex items-center gap-3 py-3 cursor-pointer transition-all text-white font-display text-base font-medium hover:translate-x-1 hover:text-fuchsia-400"
                                        onClick={(e) => { e.stopPropagation(); setModalVisible(true); }}
                                    >
                                        <span className="flex items-center justify-center">
                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                                                <path d="M16 3.5H8C7.46957 3.5 6.96086 3.71071 6.58579 4.08579C6.21071 4.46086 6 4.96957 6 5.5V21.5L12 18.5L18 21.5V5.5C18 4.96957 17.7893 4.46086 17.4142 4.08579C17.0391 3.71071 16.5304 3.5 16 3.5Z" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        Listeye Kaydet
                                    </li>
                                    <li
                                        className="flex items-center gap-3 py-3 cursor-pointer transition-all text-white font-display text-base font-medium hover:translate-x-1 hover:text-fuchsia-400"
                                        onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                                    >
                                        <span className="flex items-center justify-center">
                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                                                <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#E879F9" />
                                                <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#E879F9" />
                                                <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#E879F9" />
                                                <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58Z" fill="#E879F9" />
                                            </svg>
                                        </span>
                                        Paylaş
                                    </li>
                                    <li className="h-px bg-white/20 mx-0" />
                                    <li
                                        className="flex items-center gap-3 py-3 cursor-pointer transition-all text-white font-display text-base font-medium hover:translate-x-1 hover:text-fuchsia-400"
                                        onClick={handleHideBot}
                                    >
                                        <span className="flex items-center justify-center">
                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                                                <path d="M20.27 8.985L20.975 13.065C21.0164 13.3041 21.005 13.5494 20.9417 13.7837C20.8783 14.018 20.7646 14.2356 20.6084 14.4213C20.4522 14.6071 20.2573 14.7564 20.0373 14.859C19.8174 14.9615 19.5777 15.0148 19.335 15.015H14.153C14.0322 15.0151 13.9128 15.0415 13.8032 15.0924C13.6936 15.1432 13.5964 15.2173 13.5183 15.3095C13.4401 15.4017 13.383 15.5098 13.3509 15.6263C13.3187 15.7427 13.3123 15.8648 13.332 15.984L13.995 20.029C14.1022 20.6861 14.0716 21.3584 13.905 22.003C13.765 22.536 13.354 22.965 12.812 23.139L12.667 23.186C12.3394 23.2906 11.9842 23.2663 11.674 23.118C11.5078 23.0395 11.3609 22.9256 11.2434 22.7843C11.126 22.643 11.0408 22.4777 10.994 22.3L10.518 20.466C10.3667 19.8823 10.1465 19.3187 9.86198 18.787C9.44598 18.01 8.80398 17.387 8.13698 16.812L6.69698 15.572C6.49735 15.3995 6.34143 15.1821 6.24201 14.9377C6.14258 14.6934 6.10248 14.4289 6.12498 14.166L6.93798 4.773C6.97375 4.35776 7.16387 3.97101 7.4708 3.68907C7.77774 3.40712 8.1792 3.25046 8.59598 3.25H13.245C16.726 3.25 19.697 5.676 20.269 8.985" fill="#E879F9" />
                                                <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M2.96808 15.7652C3.16134 15.7737 3.35039 15.7071 3.49574 15.5795C3.64109 15.4518 3.7315 15.273 3.74808 15.0802L4.71808 3.84422C4.73451 3.6769 4.71666 3.50799 4.66562 3.3478C4.61458 3.18761 4.53142 3.0395 4.42122 2.91253C4.31102 2.78555 4.17609 2.68237 4.02468 2.6093C3.87327 2.53622 3.70855 2.49477 3.54058 2.48749C3.37261 2.48021 3.20492 2.50724 3.04775 2.56694C2.89058 2.62664 2.74723 2.71775 2.62646 2.83471C2.50568 2.95167 2.41002 3.09203 2.3453 3.2472C2.28059 3.40237 2.24819 3.56911 2.25008 3.73722V15.0162C2.2499 15.2097 2.32451 15.3958 2.45832 15.5356C2.59212 15.6753 2.77476 15.757 2.96808 15.7652Z" fill="#E879F9" />
                                            </svg>
                                        </span>
                                        İlgilenmiyorum
                                    </li>
                                    <li
                                        className="flex items-center gap-3 py-3 cursor-pointer transition-all text-white font-display text-base font-medium hover:translate-x-1 hover:text-fuchsia-400"
                                        onClick={handleHideBot}
                                    >
                                        <span className="flex items-center justify-center">
                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                                                <path opacity="0.2" d="M20.25 5.75V19.25C20.25 19.6478 20.092 20.0294 19.8107 20.3107C19.5294 20.592 19.1478 20.75 18.75 20.75H5.25C4.85218 20.75 4.47064 20.592 4.18934 20.3107C3.90804 20.0294 3.75 19.6478 3.75 19.25V5.75C3.75 5.35218 3.90804 4.97064 4.18934 4.68934C4.47064 4.40804 4.85218 4.25 5.25 4.25H18.75C19.1478 4.25 19.5294 4.40804 19.8107 4.68934C20.092 4.97064 20.25 5.35218 20.25 5.75Z" fill="#E879F9" />
                                                <path d="M21 12.5C21 12.6989 20.921 12.8897 20.7803 13.0303C20.6397 13.171 20.4489 13.25 20.25 13.25H3.75C3.55109 13.25 3.36032 13.171 3.21967 13.0303C3.07902 12.8897 3 12.6989 3 12.5C3 12.3011 3.07902 12.1103 3.21967 11.9697C3.36032 11.829 3.55109 11.75 3.75 11.75H20.25C20.4489 11.75 20.6397 11.829 20.7803 11.9697C20.921 12.1103 21 12.3011 21 12.5Z" fill="#E879F9" />
                                            </svg>
                                        </span>
                                        Bu Profili Önermeyin
                                    </li>
                                    <li
                                        className="flex items-center gap-3 py-3 cursor-pointer transition-all text-white font-display text-base font-medium hover:translate-x-1 hover:text-rose-400"
                                        onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}
                                    >
                                        <span className="flex items-center justify-center">
                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                                                <path opacity="0.3" d="M9.1 5.5L5 9.6V15.4L9.1 19.5H14.9L19 15.4V9.6L14.9 5.5H9.1ZM12 17.5C11.45 17.5 11 17.05 11 16.5C11 15.95 11.45 15.5 12 15.5C12.55 15.5 13 15.95 13 16.5C13 17.05 12.55 17.5 12 17.5ZM13 14.5H11V7.5H13V14.5Z" fill="#E879F9" />
                                                <path d="M15.73 3.5H8.27L3 8.77V16.23L8.27 21.5H15.73L21 16.23V8.77L15.73 3.5ZM19 15.4L14.9 19.5H9.1L5 15.4V9.6L9.1 5.5H14.9L19 9.6V15.4Z" fill="#E879F9" />
                                                <path d="M12 17.5C12.5523 17.5 13 17.0523 13 16.5C13 15.9477 12.5523 15.5 12 15.5C11.4477 15.5 11 15.9477 11 16.5C11 17.0523 11.4477 17.5 12 17.5Z" fill="#E879F9" />
                                                <path d="M11 7.5H13V14.5H11V7.5Z" fill="#E879F9" />
                                            </svg>
                                        </span>
                                        Bildir
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action row */}
                <div className="flex justify-between items-center gap-3 w-full">
                    {/* Like */}
                    <button
                        className={cn('flex items-center gap-1 transition-colors', liked ? 'text-fuchsia-400' : 'text-white/50 hover:text-white/80')}
                        onClick={handleLike}
                    >
                        <svg width="16" height="16" viewBox="0 0 17 17" fill="currentColor">
                            <path d="M13.5278 11.4416L13.9978 8.72165C14.0254 8.56222 14.0178 8.3987 13.9756 8.24251C13.9334 8.08633 13.8575 7.94125 13.7534 7.81743C13.6493 7.69361 13.5193 7.59403 13.3727 7.52567C13.2261 7.45731 13.0663 7.4218 12.9045 7.42165H9.4498C9.36925 7.42157 9.28968 7.40396 9.21661 7.37006C9.14354 7.33615 9.07872 7.28676 9.02665 7.2253C8.97458 7.16384 8.9365 7.09179 8.91506 7.01414C8.89362 6.9365 8.88932 6.85512 8.90247 6.77565L9.34447 4.07898C9.41587 3.64112 9.39543 3.19319 9.28447 2.76365C9.23651 2.58624 9.1446 2.42379 9.01724 2.2913C8.88988 2.15882 8.73118 2.06057 8.55581 2.00565L8.45914 1.97431C8.24075 1.90456 8.00398 1.92077 7.79714 2.01965C7.57047 2.12898 7.40514 2.32831 7.34381 2.56498L7.02647 3.78765C6.92562 4.17679 6.77881 4.55254 6.58914 4.90698C6.31181 5.42498 5.88381 5.84031 5.43914 6.22365L4.47914 7.05031C4.34605 7.16532 4.24211 7.31022 4.17583 7.47315C4.10954 7.63608 4.08281 7.81239 4.09781 7.98765L4.63981 14.2496C4.66366 14.5265 4.7904 14.7843 4.99502 14.9723C5.19964 15.1602 5.46729 15.2647 5.74514 15.265H8.84447C11.1651 15.265 13.1458 13.6476 13.5271 11.4416" />
                            <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M1.99239 6.9204C2.12123 6.91477 2.24726 6.95913 2.34416 7.04423C2.44106 7.12933 2.50134 7.24858 2.51239 7.37707L3.15906 14.8677C3.17001 14.9793 3.15811 15.0919 3.12409 15.1987C3.09006 15.3055 3.03462 15.4042 2.96115 15.4889C2.88769 15.5735 2.79773 15.6423 2.69679 15.691C2.59585 15.7397 2.48604 15.7674 2.37406 15.7722C2.26208 15.7771 2.15029 15.7591 2.04551 15.7193C1.94073 15.6795 1.84516 15.6187 1.76464 15.5407C1.68413 15.4628 1.62035 15.3692 1.57721 15.2658C1.53407 15.1623 1.51246 15.0511 1.51372 14.9391V7.41973C1.51378 7.29086 1.56359 7.16697 1.65278 7.07394C1.74196 6.9809 1.86363 6.9259 1.99239 6.9204Z" />
                        </svg>
                        <span className="text-[8px] font-display font-medium">{likeCount}</span>
                    </button>

                    {/* Comment */}
                    <button
                        className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}
                    >
                        <svg width="16" height="16" viewBox="0 0 17 17" fill="currentColor">
                            <path opacity="0.2" d="M14.0137 4.59766V12.5977C14.0137 12.7303 13.961 12.8574 13.8672 12.9512C13.7735 13.045 13.6463 13.0977 13.5137 13.0977H5.01367L2.83555 14.9795C2.76272 15.0408 2.67392 15.08 2.57959 15.0926C2.48525 15.1051 2.38929 15.0905 2.30298 15.0504C2.21668 15.0103 2.14361 14.9464 2.09236 14.8662C2.04111 14.786 2.01381 14.6928 2.01367 14.5977V4.59766C2.01367 4.46505 2.06635 4.33787 2.16012 4.2441C2.25389 4.15033 2.38106 4.09766 2.51367 4.09766H13.5137C13.6463 4.09766 13.7735 4.15033 13.8672 4.2441C13.961 4.33787 14.0137 4.46505 14.0137 4.59766Z" />
                            <path d="M13.5137 3.59766H2.51369C2.24847 3.59766 1.99412 3.70301 1.80658 3.89055C1.61905 4.07809 1.51369 4.33244 1.51369 4.59766V14.5977C1.51254 14.7883 1.56648 14.9753 1.66904 15.1361C1.7716 15.2968 1.91841 15.4246 2.09181 15.5039C2.22396 15.5654 2.36792 15.5974 2.51369 15.5977C2.74843 15.597 2.97538 15.5133 3.15431 15.3614L3.15994 15.357L5.20119 13.5977H13.5137C13.7789 13.5977 14.0333 13.4923 14.2208 13.3048C14.4083 13.1172 14.5137 12.8629 14.5137 12.5977V4.59766C14.5137 4.33244 14.4083 4.07809 14.2208 3.89055C14.0333 3.70301 13.7789 3.59766 13.5137 3.59766ZM13.5137 12.5977H5.01369C4.89363 12.5977 4.77761 12.641 4.68681 12.7195L2.51369 14.5977V4.59766H13.5137V12.5977Z" />
                        </svg>
                        <span className="text-[8px] font-display font-medium">{comments}</span>
                    </button>

                    {/* Add to cart */}
                    <button
                        className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
                        onClick={handleAddToCart}
                    >
                        <svg width="16" height="16" viewBox="0 0 17 17" fill="currentColor">
                            <path opacity="0.2" fillRule="evenodd" clipRule="evenodd" d="M4.18864 2.79766H3.37344C3.21431 2.79766 3.0617 2.73444 2.94917 2.62192C2.83665 2.5094 2.77344 2.35679 2.77344 2.19766C2.77344 2.03853 2.83665 1.88591 2.94917 1.77339C3.0617 1.66087 3.21431 1.59766 3.37344 1.59766H4.65584C4.78934 1.59767 4.91902 1.64221 5.02436 1.72422C5.1297 1.80623 5.20469 1.92103 5.23744 2.05046L6.43904 6.80006C6.67727 6.66728 6.9455 6.59761 7.21824 6.59766H13.6094C13.8515 6.59822 14.0903 6.65337 14.3081 6.75901C14.5259 6.86464 14.7171 7.01805 14.8674 7.2078C15.0177 7.39755 15.1233 7.61876 15.1763 7.85497C15.2293 8.09117 15.2283 8.33628 15.1734 8.57206L14.547 11.3409C14.4674 11.6969 14.269 12.0152 13.9845 12.2436C13.7 12.472 13.3463 12.5968 12.9814 12.5977H7.84544C7.48086 12.5967 7.12742 12.4719 6.8431 12.2437C6.55878 12.0155 6.36045 11.6974 6.28064 11.3417L5.65344 8.57126C5.64481 8.53287 5.63761 8.49417 5.63184 8.45526C5.61574 8.41897 5.60237 8.38153 5.59184 8.34326L4.18864 2.79766ZM7.41344 15.3977C7.78474 15.3977 8.14084 15.2502 8.40339 14.9876C8.66594 14.7251 8.81344 14.369 8.81344 13.9977C8.81344 13.6264 8.66594 13.2703 8.40339 13.0077C8.14084 12.7452 7.78474 12.5977 7.41344 12.5977C7.04213 12.5977 6.68604 12.7452 6.42349 13.0077C6.16094 13.2703 6.01344 13.6264 6.01344 13.9977C6.01344 14.369 6.16094 14.7251 6.42349 14.9876C6.68604 15.2502 7.04213 15.3977 7.41344 15.3977ZM13.0134 15.3977C13.3847 15.3977 13.7408 15.2502 14.0034 14.9876C14.2659 14.7251 14.4134 14.369 14.4134 13.9977C14.4134 13.6264 14.2659 13.2703 14.0034 13.0077C13.7408 12.7452 13.3847 12.5977 13.0134 12.5977C12.6421 12.5977 12.286 12.7452 12.0235 13.0077C11.7609 13.2703 11.6134 13.6264 11.6134 13.9977C11.6134 14.369 11.7609 14.7251 12.0235 14.9876C12.286 15.2502 12.6421 15.3977 13.0134 15.3977Z" />
                            <path d="M2.98288 2.59687H2.01328C1.90719 2.59687 1.80545 2.55473 1.73044 2.47972C1.65542 2.4047 1.61328 2.30296 1.61328 2.19687C1.61328 2.09079 1.65542 1.98905 1.73044 1.91403C1.80545 1.83902 1.90719 1.79688 2.01328 1.79688H3.29568C3.38491 1.7969 3.47156 1.82676 3.54187 1.88169C3.61217 1.93663 3.66209 2.0135 3.68368 2.10007L5.20128 8.18007C5.22422 8.28201 5.20636 8.38887 5.15153 8.47781C5.0967 8.56675 5.00924 8.6307 4.90787 8.65599C4.80649 8.68128 4.69924 8.66591 4.60906 8.61315C4.51887 8.56039 4.45291 8.47444 4.42528 8.37367L2.98288 2.59687Z" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M12.4091 6.59766H6.01714C5.8966 6.59766 5.7774 6.61099 5.65954 6.63766C5.24342 6.73513 4.88286 6.99348 4.65676 7.35616C4.43067 7.71884 4.35745 8.15632 4.45314 8.57286L5.07954 11.3417C5.15937 11.6975 5.35782 12.0157 5.64231 12.2439C5.92679 12.4721 6.28042 12.5969 6.64514 12.5977H11.7827C12.1473 12.5967 12.5008 12.4719 12.7851 12.2437C13.0694 12.0155 13.2677 11.6974 13.3475 11.3417L13.9739 8.57206C14.0006 8.45419 14.0139 8.33446 14.0139 8.21286C14.0149 8.00142 13.9741 7.79188 13.894 7.59621C13.8139 7.40055 13.6959 7.22261 13.5469 7.07259C13.3979 6.92256 13.2208 6.80339 13.0257 6.72189C12.8306 6.6404 12.6214 6.59818 12.4099 6.59766M5.83954 7.41766C5.89806 7.40432 5.95791 7.39761 6.01794 7.39766H12.4091C12.5311 7.39833 12.6513 7.42652 12.7609 7.48014C12.8704 7.53375 12.9665 7.6114 13.0418 7.70729C13.1172 7.80319 13.1699 7.91486 13.1961 8.03398C13.2223 8.1531 13.2213 8.27659 13.1931 8.39526L12.5659 11.1649C12.5263 11.3435 12.4271 11.5035 12.2846 11.6184C12.1422 11.7334 11.965 11.7966 11.7819 11.7977H6.64514C6.27074 11.7977 5.94514 11.5353 5.86114 11.1649L5.23474 8.39526C5.18619 8.18536 5.22261 7.96479 5.33606 7.78165C5.44951 7.59851 5.62999 7.46766 5.83954 7.41766Z" />
                            <path d="M13.6129 13.9977C13.6129 14.369 13.4654 14.7251 13.2028 14.9876C12.9403 15.2502 12.5842 15.3977 12.2129 15.3977C11.8416 15.3977 11.4855 15.2502 11.2229 14.9876C10.9604 14.7251 10.8129 14.369 10.8129 13.9977C10.8129 13.6264 10.9604 13.2703 11.2229 13.0077C11.4855 12.7452 11.8416 12.5977 12.2129 12.5977C12.5842 12.5977 12.9403 12.7452 13.2028 13.0077C13.4654 13.2703 13.6129 13.6264 13.6129 13.9977ZM8.01289 13.9977C8.01289 14.3690 7.97668 14.5511 7.90632 14.7209C7.83597 14.8908 7.73284 15.0451 7.60284 15.1751C7.47284 15.3051 7.3185 15.4082 7.14865 15.4786C6.97879 15.5489 6.79674 15.5851 6.61289 15.5851C6.42904 15.5851 6.24699 15.5489 6.07713 15.4786C5.90728 15.4082 5.75294 15.3051 5.62294 15.1751C5.49294 15.0451 5.38982 14.8908 5.31946 14.7209C5.2491 14.5511 5.21289 14.3690 5.21289 13.9977C5.21289 13.6264 5.36039 13.2703 5.62294 13.0077C5.88549 12.7452 6.24159 12.5977 6.61289 12.5977C6.98419 12.5977 7.34029 12.7452 7.60284 13.0077C7.86539 13.2703 8.01289 13.6264 8.01289 13.9977Z" />
                        </svg>
                    </button>

                    {/* Buy button */}
                    <button
                        className="flex px-3 py-0.5 cursor-pointer justify-center items-center rounded-xl text-white text-center font-display text-[7px] font-medium min-w-[50px] transition-all bg-gradient-to-br from-[#3730A3] to-[#8B5CF6]/20 hover:from-[#D946EF] hover:to-[#8B5CF6] border-none outline-none"
                        onClick={e => {
                            e.stopPropagation();
                            const botItem = { ...bot, id: `${bot.id}-${bot.title}-${bot.author}` };
                            let cart = [];
                            if (typeof window !== 'undefined') {
                                const cartString = localStorage.getItem('cart');
                                if (cartString) { try { cart = JSON.parse(cartString); } catch { cart = []; } }
                                if (!cart.find(item => item.id === botItem.id)) {
                                    cart.push(botItem);
                                    localStorage.setItem('cart', JSON.stringify(cart));
                                    window.dispatchEvent(new Event('cartUpdated'));
                                }
                                router.push('/dashboard/checkout');
                            }
                        }}
                    >
                        Satın Al
                    </button>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mt-3 text-[8px] font-medium w-full text-[#62647C]">
                    <div className="flex items-center gap-1.5 after:content-['•'] after:inline-block after:text-[#62647C]">
                        {dialogues} Diyalog
                    </div>
                    <div className="flex items-center gap-1.5">
                        {time}
                    </div>
                    <div className="ml-auto text-white rounded-xl font-display text-[7px] font-medium py-[1px] px-3 flex items-center justify-center shadow-[0_4px_14px_0_rgba(217,70,239,0.2)] border border-transparent min-w-[50px]">
                        {priceType === "USD" ? "$" : ""}{price}
                    </div>
                </div>
            </div>

            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={[]}
                onCreateList={(listName) => console.log(`"${bot.title}" botu "${listName}" listesine eklendi`)}
            />
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

            {cartAdded && (
                <div className="fixed bottom-6 right-6 bg-fuchsia-400 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium animate-[fadeInOut_2s_ease_forwards] pointer-events-none z-[999999]">
                    Sepete eklendi!
                </div>
            )}
            {showFeedbackBadge && (
                <div className="fixed bottom-6 right-6 bg-fuchsia-400 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium animate-[fadeInOut_2s_ease_forwards] pointer-events-none z-[999999]">
                    Uyarınız alındı
                </div>
            )}
        </div>
    );
}
