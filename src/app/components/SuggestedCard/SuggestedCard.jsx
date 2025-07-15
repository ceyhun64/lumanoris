import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import ShareModal from '../ShareModal/ShareModal';
import ReportModal from '../ReportModal/ReportModal';
import AddToListModal from '../AddToListModal/AddToListModal';

export default function SuggestedCard({ bot }) {
    const { image, title, author, dialogues, time, badge, avatar } = bot;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);


    const toggleMenu = () => setMenuOpen(prev => !prev);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <div className="bot-card">
            <div className="card-top">
                <div className="shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="161" viewBox="0 0 200 161" fill="none">
                        <g filter="url(#filter0_f_7772_2752)">
                            <ellipse cx="101.044" cy="-4.51165" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_2752)" />
                        </g>
                        <defs>
                            <filter id="filter0_f_7772_2752" x="-92.0304" y="-169.125" width="386.149" height="329.226" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_2752" />
                            </filter>
                            <linearGradient id="paint0_linear_7772_2752" x1="31.7156" y1="-4.51165" x2="170.372" y2="-4.51165" gradientUnits="userSpaceOnUse">
                                <stop offset="0.211538" stopColor="#4699FF" />
                                <stop offset="0.793269" stopColor="#FF66C4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
            <div className="image-wrapper">
                {badge && <span className={`badge ${badge.type}`}>{badge.label}</span>}
                <Image src={image} alt={title} width={300} height={200} />
            </div>
            <div className="info">
                <div className="top">
                    <div className="title-row">
                        <div className="icc">
                            <Image src={avatar} alt="Avatar" width={32} height={32} />
                        </div>
                        <div className="title">
                            <span className="name">{title}</span>
                            <div className="author">{author}</div>
                        </div>
                    </div>
                    <div className="menu-wrapper" ref={menuRef}>
                        <div className="menu-icon" onClick={toggleMenu}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.02286 12.367C9.39152 12.367 9.74508 12.5135 10.0058 12.7742C10.2664 13.0348 10.4129 13.3884 10.4129 13.7571C10.4129 14.1257 10.2664 14.4793 10.0058 14.74C9.74508 15.0007 9.39152 15.1471 9.02286 15.1471C8.65419 15.1471 8.30063 15.0007 8.03995 14.74C7.77926 14.4793 7.63281 14.1257 7.63281 13.7571C7.63281 13.3884 7.77926 13.0348 8.03995 12.7742C8.30063 12.5135 8.65419 12.367 9.02286 12.367ZM9.02286 7.50187C9.39152 7.50187 9.74508 7.64832 10.0058 7.909C10.2664 8.16969 10.4129 8.52325 10.4129 8.89191C10.4129 9.26057 10.2664 9.61413 10.0058 9.87482C9.74508 10.1355 9.39152 10.282 9.02286 10.282C8.65419 10.282 8.30063 10.1355 8.03995 9.87482C7.77926 9.61413 7.63281 9.26057 7.63281 8.89191C7.63281 8.52325 7.77926 8.16969 8.03995 7.909C8.30063 7.64832 8.65419 7.50187 9.02286 7.50187ZM9.02286 2.63672C9.39152 2.63672 9.74508 2.78317 10.0058 3.04385C10.2664 3.30454 10.4129 3.6581 10.4129 4.02676C10.4129 4.39542 10.2664 4.74899 10.0058 5.00967C9.74508 5.27035 9.39152 5.4168 9.02286 5.4168C8.65419 5.4168 8.30063 5.27035 8.03995 5.00967C7.77926 4.74899 7.63281 4.39542 7.63281 4.02676C7.63281 3.6581 7.77926 3.30454 8.03995 3.04385C8.30063 2.78317 8.65419 2.63672 9.02286 2.63672Z" fill="#8C8C8C" />
                            </svg>
                        </div>
                        {menuOpen && (
                            <div className="popup-menu">
                                <ul>
                                    <li onClick={() => setModalVisible(true)}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 3.5H8C7.46957 3.5 6.96086 3.71071 6.58579 4.08579C6.21071 4.46086 6 4.96957 6 5.5V21.5L12 18.5L18 21.5V5.5C18 4.96957 17.7893 4.46086 17.4142 4.08579C17.0391 3.71071 16.5304 3.5 16 3.5Z" stroke="#FF99D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    </span> Listeye Kaydet</li>
                                    <li onClick={() => setShareOpen(true)}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" />
                                        <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#FF99D6" />
                                        <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#FF99D6" />
                                        <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58ZM18 4.5C18.55 4.5 19 4.95 19 5.5C19 6.05 18.55 6.5 18 6.5C17.45 6.5 17 6.05 17 5.5C17 4.95 17.45 4.5 18 4.5ZM6 13.5C5.45 13.5 5 13.05 5 12.5C5 11.95 5.45 11.5 6 11.5C6.55 11.5 7 11.95 7 12.5C7 13.05 6.55 13.5 6 13.5ZM18 20.52C17.45 20.52 17 20.07 17 19.52C17 18.97 17.45 18.52 18 18.52C18.55 18.52 19 18.97 19 19.52C19 20.07 18.55 20.52 18 20.52Z" fill="#FF99D6" />
                                    </svg>
                                    </span> Paylaş</li>
                                    <hr />
                                    <li><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20.27 8.985L20.975 13.065C21.0164 13.3041 21.005 13.5494 20.9417 13.7837C20.8783 14.018 20.7646 14.2356 20.6084 14.4213C20.4522 14.6071 20.2573 14.7564 20.0373 14.859C19.8174 14.9615 19.5777 15.0148 19.335 15.015H14.153C14.0322 15.0151 13.9128 15.0415 13.8032 15.0924C13.6936 15.1432 13.5964 15.2173 13.5183 15.3095C13.4401 15.4017 13.383 15.5098 13.3509 15.6263C13.3187 15.7427 13.3123 15.8648 13.332 15.984L13.995 20.029C14.1022 20.6861 14.0716 21.3584 13.905 22.003C13.765 22.536 13.354 22.965 12.812 23.139L12.667 23.186C12.3394 23.2906 11.9842 23.2663 11.674 23.118C11.5078 23.0395 11.3609 22.9256 11.2434 22.7843C11.126 22.643 11.0408 22.4777 10.994 22.3L10.518 20.466C10.3667 19.8823 10.1465 19.3187 9.86198 18.787C9.44598 18.01 8.80398 17.387 8.13698 16.812L6.69698 15.572C6.49735 15.3995 6.34143 15.1821 6.24201 14.9377C6.14258 14.6934 6.10248 14.4289 6.12498 14.166L6.93798 4.773C6.97375 4.35776 7.16387 3.97101 7.4708 3.68907C7.77774 3.40712 8.1792 3.25046 8.59598 3.25H13.245C16.726 3.25 19.697 5.676 20.269 8.985" fill="#FF99D6" />
                                        <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M2.96808 15.7652C3.16134 15.7737 3.35039 15.7071 3.49574 15.5795C3.64109 15.4518 3.7315 15.273 3.74808 15.0802L4.71808 3.84422C4.73451 3.6769 4.71666 3.50799 4.66562 3.3478C4.61458 3.18761 4.53142 3.0395 4.42122 2.91253C4.31102 2.78555 4.17609 2.68237 4.02468 2.6093C3.87327 2.53622 3.70855 2.49477 3.54058 2.48749C3.37261 2.48021 3.20492 2.50724 3.04775 2.56694C2.89058 2.62664 2.74723 2.71775 2.62646 2.83471C2.50568 2.95167 2.41002 3.09203 2.3453 3.2472C2.28059 3.40237 2.24819 3.56911 2.25008 3.73722V15.0162C2.2499 15.2097 2.32451 15.3958 2.45832 15.5356C2.59212 15.6753 2.77476 15.757 2.96808 15.7652Z" fill="#FF99D6" />
                                    </svg>
                                    </span> İlgilenmiyorum</li>
                                    <li><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.2" d="M20.25 5.75V19.25C20.25 19.6478 20.092 20.0294 19.8107 20.3107C19.5294 20.592 19.1478 20.75 18.75 20.75H5.25C4.85218 20.75 4.47064 20.592 4.18934 20.3107C3.90804 20.0294 3.75 19.6478 3.75 19.25V5.75C3.75 5.35218 3.90804 4.97064 4.18934 4.68934C4.47064 4.40804 4.85218 4.25 5.25 4.25H18.75C19.1478 4.25 19.5294 4.40804 19.8107 4.68934C20.092 4.97064 20.25 5.35218 20.25 5.75Z" fill="#FF99D6" />
                                        <path d="M21 12.5C21 12.6989 20.921 12.8897 20.7803 13.0303C20.6397 13.171 20.4489 13.25 20.25 13.25H3.75C3.55109 13.25 3.36032 13.171 3.21967 13.0303C3.07902 12.8897 3 12.6989 3 12.5C3 12.3011 3.07902 12.1103 3.21967 11.9697C3.36032 11.829 3.55109 11.75 3.75 11.75H20.25C20.4489 11.75 20.6397 11.829 20.7803 11.9697C20.921 12.1103 21 12.3011 21 12.5Z" fill="#FF99D6" />
                                    </svg>
                                    </span> Bu Profili Önermeyin</li>
                                    <li onClick={() => setReportOpen(true)} ><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.3" d="M9.1 5.5L5 9.6V15.4L9.1 19.5H14.9L19 15.4V9.6L14.9 5.5H9.1ZM12 17.5C11.45 17.5 11 17.05 11 16.5C11 15.95 11.45 15.5 12 15.5C12.55 15.5 13 15.95 13 16.5C13 17.05 12.55 17.5 12 17.5ZM13 14.5H11V7.5H13V14.5Z" fill="#FF99D6" />
                                        <path d="M15.73 3.5H8.27L3 8.77V16.23L8.27 21.5H15.73L21 16.23V8.77L15.73 3.5ZM19 15.4L14.9 19.5H9.1L5 15.4V9.6L9.1 5.5H14.9L19 9.6V15.4Z" fill="#FF99D6" />
                                        <path d="M12 17.5C12.5523 17.5 13 17.0523 13 16.5C13 15.9477 12.5523 15.5 12 15.5C11.4477 15.5 11 15.9477 11 16.5C11 17.0523 11.4477 17.5 12 17.5Z" fill="#FF99D6" />
                                        <path d="M11 7.5H13V14.5H11V7.5Z" fill="#FF99D6" />
                                    </svg>
                                    </span> Bildir</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="meta"> <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.44234 8.5032V5.25977H2.22605C1.90347 5.25977 1.59411 5.38791 1.36601 5.61601C1.13791 5.84411 1.00977 6.15347 1.00977 6.47605V13.7738C1.01037 13.8491 1.03193 13.9227 1.07203 13.9864C1.11213 14.0502 1.16919 14.1015 1.23681 14.1346C1.30195 14.1642 1.37377 14.1761 1.44498 14.169C1.51619 14.1618 1.58425 14.136 1.64224 14.0941L3.7302 12.5575H9.17916C9.33282 12.562 9.48578 12.535 9.62856 12.478C9.77134 12.421 9.90091 12.3353 10.0092 12.2263C10.1175 12.1172 10.2023 11.987 10.2583 11.8439C10.3143 11.7007 10.3403 11.5475 10.3346 11.3939V10.9358H5.87492C5.22976 10.9358 4.61102 10.6795 4.15483 10.2233C3.69863 9.76709 3.44234 9.14836 3.44234 8.5032Z" fill="url(#paint0_linear_7772_12916)" />
                    <path d="M12.7668 2.42188H5.87449C5.55191 2.42188 5.24254 2.55002 5.01445 2.77812C4.78635 3.00622 4.6582 3.31558 4.6582 3.63816V8.50331C4.6582 8.82589 4.78635 9.13526 5.01445 9.36335C5.24254 9.59145 5.55191 9.7196 5.87449 9.7196H11.3681L13.306 11.2237C13.3636 11.2663 13.4315 11.2929 13.5027 11.3007C13.5739 11.3086 13.6459 11.2974 13.7114 11.2683C13.7804 11.2355 13.8387 11.1838 13.8796 11.1192C13.9205 11.0547 13.9423 10.9799 13.9425 10.9034V3.63816C13.9427 3.32249 13.8201 3.01911 13.6007 2.79214C13.3813 2.56517 13.0823 2.4324 12.7668 2.42188Z" fill="url(#paint1_linear_7772_12916)" />
                    <defs>
                        <linearGradient id="paint0_linear_7772_12916" x1="11.133" y1="16.2602" x2="1.69975" y2="3.38987" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#1B1A22" />
                            <stop offset="1" stop-color="#993D76" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_7772_12916" x1="14.7366" y1="13.3854" x2="5.33201" y2="0.567897" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#1B1A22" />
                            <stop offset="1" stop-color="#993D76" />
                        </linearGradient>
                    </defs>
                </svg>
                    {dialogues} Diyalog</div>


            </div>

            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={["Favorilerim listesi", "Ai liste"]}
            />

        </div>
    );
}
