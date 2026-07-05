'use client';
import avatarBot from "@/images/avatar-bot.jpg";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ShareModal from "@/features/sharing/ShareModal";
import ReportModal from "@/features/moderation/ReportModal";
import AddToListModal from "@/features/lists/AddToListModal";
import CommentModal from "@/features/comments/CommentModal";
import { useRouter } from 'next/navigation';


export default function DialogueModal({ isOpen, onClose, selectedHistory }) {
    const inputRef = useRef(null);
    const outputRef = useRef(null);
    const router = useRouter();
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likeCount, setLikeCount] = useState(1500);
    const [dislikeCount, setDislikeCount] = useState(20);
    const [comments, setComments] = useState([]);
    const [userId, setUserId] = useState();
    const [commentCount, setCommentCount] = useState(0);

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include", // cookie'yi gönder
        });
        const resultText = await res.text();
        //console.log(resultText);
        const result = JSON.parse(resultText);

        if (result.authenticated) {
          setUserId(result.user_id);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/login");
      }
    }

    // Both endpoints read $_GET (session provides identity) — previously
    // sent as a POST body, so $_GET was always empty and the "did I already
    // react" check never resolved.
    const checkUserLike = async () => {
      try {
        const res = await fetch(`/api/note/diduserlike2.php?dialog_id=${selectedHistory.id}`);
        const result = await res.json();

        if (result.success) {
          setLiked(result.didLike);
        }
      } catch (err) {
        console.error("diduserlike API error:", err);
      }
    };

    const checkUserDisLike = async () => {
      try {
        const res = await fetch(`/api/note/diduserdislike2.php?dialog_id=${selectedHistory.id}`);
        const result = await res.json();

        if (result.success) {
          setDisliked(result.didDisLike);
        }
      } catch (err) {
        console.error("diduserdislike API error:", err);
      }
    };

    useEffect(() => {
        checkSession();
    }, []);

    useEffect(() => {
        const dialogId = selectedHistory.id;
        if (dialogId) {
            fetch(`/api/note/getdialoginteracts.php?id=${dialogId}`)
                .then((response) => response.json())
                .then((data) => {
                    setLikeCount(data.dialog.likes);
                    setDislikeCount(data.dialog.dislikes);
                    setComments(data.comments);
                    setCommentCount(data.comments.length);
                })
                .catch((error) => {
                    console.error("Hata:", error);
                });
        }

        // userId sessioncheck'ten asenkron gelir; gelmeden bu kontrolleri
        // çalıştırmak her zaman "beğenilmemiş/beğenilmemiş" göstermeye
        // neden oluyordu ve userId geldiğinde effect tekrar çalışmıyordu.
        if (!userId) return;
        checkUserLike();
        checkUserDisLike();

    },[selectedHistory, userId]);

    useEffect(() => {
        const closeOnEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', closeOnEsc);
        return () => document.removeEventListener('keydown', closeOnEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;


    const handleCopy = (ref) => {
        if (!ref.current) return;
        const text = ref.current.innerText;
        navigator.clipboard.writeText(text)
            .then(() => {
                //console.log('Kopyalandı:', text);
            })
            .catch((err) => {
                console.error('Kopyalama başarısız:', err);
            });
    };


    return (
        <div className="dialogue-overlay" onClick={onClose}>
            <div className="dialogue-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        Deftere Kaydedilmiş Diyalog
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="dialogue-block">
                        <div className="block-header">
                            <span className="block-title">
                                Girdi
                            </span>
                            <button className="copy-button" onClick={() => handleCopy(inputRef)}>
                                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_7960_14766)">
                                        <path d="M14.1667 6.375H7.79167C7.00926 6.375 6.375 7.00926 6.375 7.79167V14.1667C6.375 14.9491 7.00926 15.5833 7.79167 15.5833H14.1667C14.9491 15.5833 15.5833 14.9491 15.5833 14.1667V7.79167C15.5833 7.00926 14.9491 6.375 14.1667 6.375Z" stroke="url(#paint0_linear_7960_14766)" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M3.54102 10.6243H2.83268C2.45696 10.6243 2.09662 10.4751 1.83095 10.2094C1.56527 9.94374 1.41602 9.58341 1.41602 9.20768V2.83268C1.41602 2.45696 1.56527 2.09662 1.83095 1.83095C2.09662 1.56527 2.45696 1.41602 2.83268 1.41602H9.20768C9.58341 1.41602 9.94374 1.56527 10.2094 1.83095C10.4751 2.09662 10.6243 2.45696 10.6243 2.83268V3.54102" stroke="#FFE6F2" strokeLinecap="round" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                        <linearGradient id="paint0_linear_7960_14766" x1="16.3709" y1="17.7422" x2="6.4982" y2="4.87085" gradientUnits="userSpaceOnUse">
                                            <stop offset="0.211538" stop-color="#FF66C4" />
                                            <stop offset="1" stop-color="#4699FF" />
                                        </linearGradient>
                                        <clipPath id="clip0_7960_14766">
                                            <rect width="17" height="17" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>

                            </button>
                        </div>
                        <div className="block-content" ref={inputRef}>
                            <p>
                                {selectedHistory.input_message}
                            </p>
                        </div>
                    </div>

                    <div className="dialogue-block">
                        <div className="block-header">
                            <span className="block-title">
                                Çıktı
                            </span>
                            <button className="copy-button" onClick={() => handleCopy(outputRef)}>
                                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_7960_14766)">
                                        <path d="M14.1667 6.375H7.79167C7.00926 6.375 6.375 7.00926 6.375 7.79167V14.1667C6.375 14.9491 7.00926 15.5833 7.79167 15.5833H14.1667C14.9491 15.5833 15.5833 14.9491 15.5833 14.1667V7.79167C15.5833 7.00926 14.9491 6.375 14.1667 6.375Z" stroke="url(#paint0_linear_7960_14766)" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M3.54102 10.6243H2.83268C2.45696 10.6243 2.09662 10.4751 1.83095 10.2094C1.56527 9.94374 1.41602 9.58341 1.41602 9.20768V2.83268C1.41602 2.45696 1.56527 2.09662 1.83095 1.83095C2.09662 1.56527 2.45696 1.41602 2.83268 1.41602H9.20768C9.58341 1.41602 9.94374 1.56527 10.2094 1.83095C10.4751 2.09662 10.6243 2.45696 10.6243 2.83268V3.54102" stroke="#FFE6F2" strokeLinecap="round" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                        <linearGradient id="paint0_linear_7960_14766" x1="16.3709" y1="17.7422" x2="6.4982" y2="4.87085" gradientUnits="userSpaceOnUse">
                                            <stop offset="0.211538" stop-color="#FF66C4" />
                                            <stop offset="1" stop-color="#4699FF" />
                                        </linearGradient>
                                        <clipPath id="clip0_7960_14766">
                                            <rect width="17" height="17" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>

                            </button>
                        </div>
                        <div className="block-content" ref={outputRef}>
                            <p>
                                {selectedHistory.output_message}
                            </p>
                        </div>
                    </div>

                    <div className="interaction-bar">
                        <div className="interaction-button">
                            <svg className={`like ${liked ? "active" : ""}`}
                                onClick={async () => {
                                    try {
                                    const res = await fetch("/api/note/likedialog.php", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                        body: new URLSearchParams({
                                        data: JSON.stringify({
                                            user_id: userId,
                                            dialog_id: selectedHistory.id,
                                        }),
                                        }),
                                    });
                                    const result = await res.json();

                                    if (result.success) {
                                        if (result.action === "liked") {
                                        setLiked(true);
                                        setLikeCount((prev) => prev + 1);
                                        if (disliked) {
                                            setDisliked(false);
                                            setDislikeCount((prev) => prev - 1);
                                        }
                                        } else if (result.action === "unliked") {
                                        setLiked(false);
                                        setLikeCount((prev) => prev - 1);
                                        }
                                    }
                                    } catch (err) {
                                    console.error("Like API error:", err);
                                    }
                                }}
                                /*onClick={(e) => {
                                    e.stopPropagation();
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
                                }}*/ width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.3698 16.265L21.0748 12.185C21.1162 11.9459 21.1048 11.7006 21.0415 11.4663C20.9782 11.232 20.8644 11.0144 20.7082 10.8287C20.552 10.643 20.3571 10.4936 20.1372 10.391C19.9172 10.2885 19.6775 10.2352 19.4348 10.235H14.2528C14.132 10.2349 14.0127 10.2085 13.903 10.1576C13.7934 10.1068 13.6962 10.0327 13.6181 9.94049C13.54 9.8483 13.4829 9.74023 13.4507 9.62376C13.4185 9.50729 13.4121 9.38522 13.4318 9.26601L14.0948 5.22101C14.2019 4.56422 14.1713 3.89233 14.0048 3.24801C13.9329 2.9819 13.795 2.73823 13.604 2.5395C13.4129 2.34077 13.1749 2.1934 12.9118 2.11101L12.7668 2.06401C12.4393 1.95938 12.0841 1.9837 11.7738 2.13201C11.4338 2.29601 11.1858 2.59501 11.0938 2.95001L10.6178 4.78401C10.4665 5.36772 10.2463 5.93135 9.96184 6.46301C9.54584 7.24001 8.90383 7.86301 8.23683 8.43801L6.79683 9.67801C6.5972 9.85052 6.44129 10.0679 6.34186 10.3123C6.24244 10.5567 6.20233 10.8211 6.22483 11.084L7.03784 20.477C7.07361 20.8922 7.26372 21.279 7.57066 21.5609C7.87759 21.8429 8.27906 21.9995 8.69583 22H13.3448C16.8258 22 19.7968 19.574 20.3688 16.265" fill="#FFE6F2" />
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M3.06769 9.48509C3.26095 9.47664 3.45 9.54319 3.59535 9.67084C3.7407 9.79849 3.83111 9.97736 3.84769 10.1701L4.81769 21.4061C4.83412 21.5734 4.81627 21.7423 4.76523 21.9025C4.71419 22.0627 4.63103 22.2108 4.52083 22.3378C4.41063 22.4648 4.2757 22.5679 4.12429 22.641C3.97288 22.7141 3.80816 22.7555 3.64019 22.7628C3.47222 22.7701 3.30453 22.7431 3.14736 22.6834C2.99019 22.6237 2.84684 22.5326 2.72607 22.4156C2.60529 22.2986 2.50963 22.1583 2.44491 22.0031C2.3802 21.8479 2.3478 21.6812 2.34969 21.5131V10.2341C2.34977 10.0408 2.42449 9.85495 2.55827 9.7154C2.69205 9.57585 2.87455 9.49334 3.06769 9.48509Z" fill="#FFE6F2" />
                            </svg>


                            <span>{likeCount}</span>
                            <div className="divider" />
                            <svg className={`dislike ${disliked ? "active" : ""}`}
                                onClick={async () => {
                                    try {
                                    const res = await fetch("/api/note/dislikedialog.php", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                        body: new URLSearchParams({
                                        data: JSON.stringify({
                                            user_id: userId,
                                            dialog_id: selectedHistory.id,
                                        }),
                                        }),
                                    });
                                    const result = await res.json();

                                    if (result.success) {
                                        if (result.action === "disliked") {
                                        setDisliked(true);
                                        setDislikeCount((prev) => prev + 1);
                                        if (disliked) {
                                            setLiked(false);
                                            setLikeCount((prev) => prev - 1);
                                        }
                                        } else if (result.action === "undisliked") {
                                        setDisliked(false);
                                        setDislikeCount((prev) => prev - 1);
                                        }
                                    }
                                    } catch (err) {
                                    console.error("Like API error:", err);
                                    }
                                }}
                                /*onClick={(e) => {
                                    e.stopPropagation();
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
                                }}*/ width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.3698 8.485L21.0748 12.565C21.1162 12.8041 21.1048 13.0494 21.0415 13.2837C20.9782 13.518 20.8644 13.7356 20.7082 13.9213C20.552 14.1071 20.3571 14.2564 20.1372 14.359C19.9172 14.4615 19.6775 14.5148 19.4348 14.515H14.2528C14.132 14.5151 14.0127 14.5415 13.903 14.5924C13.7934 14.6432 13.6962 14.7173 13.6181 14.8095C13.54 14.9017 13.4829 15.0098 13.4507 15.1263C13.4185 15.2427 13.4121 15.3648 13.4318 15.484L14.0948 19.529C14.2021 20.1861 14.1714 20.8584 14.0048 21.503C13.8648 22.036 13.4538 22.465 12.9118 22.639L12.7668 22.686C12.4393 22.7906 12.0841 22.7663 11.7738 22.618C11.6077 22.5395 11.4607 22.4256 11.3433 22.2843C11.2258 22.143 11.1407 21.9777 11.0938 21.8L10.6178 19.966C10.4665 19.3823 10.2463 18.8187 9.96184 18.287C9.54584 17.51 8.90383 16.887 8.23683 16.312L6.79683 15.072C6.5972 14.8995 6.44129 14.6821 6.34186 14.4377C6.24244 14.1934 6.20233 13.9289 6.22483 13.666L7.03784 4.273C7.07361 3.85776 7.26372 3.47101 7.57066 3.18907C7.87759 2.90712 8.27906 2.75046 8.69583 2.75H13.3448C16.8258 2.75 19.7968 5.176 20.3688 8.485" fill="#FFE6F2" />
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M3.06769 15.2652C3.26095 15.2737 3.45 15.2071 3.59535 15.0795C3.7407 14.9518 3.83111 14.773 3.84769 14.5802L4.81769 3.34422C4.83412 3.1769 4.81627 3.00799 4.76523 2.8478C4.71419 2.68761 4.63103 2.5395 4.52083 2.41253C4.41063 2.28555 4.2757 2.18237 4.12429 2.1093C3.97288 2.03622 3.80816 1.99477 3.64019 1.98749C3.47222 1.98021 3.30453 2.00724 3.14736 2.06694C2.99019 2.12664 2.84684 2.21775 2.72607 2.33471C2.60529 2.45167 2.50963 2.59203 2.44491 2.7472C2.3802 2.90237 2.3478 3.06911 2.34969 3.23722V14.5162C2.34951 14.7097 2.42412 14.8958 2.55793 15.0356C2.69173 15.1753 2.87437 15.257 3.06769 15.2652Z" fill="#FFE6F2" />
                            </svg>
                            {dislikeCount}
                        </div>

                        <div className="interaction-button" onClick={(e) => { e.stopPropagation(); setShareOpen(true) }}>
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" d="M19.7988 6C19.7988 5.46957 19.5881 4.96086 19.213 4.58579C18.838 4.21071 18.3293 4 17.7988 4C17.2684 4 16.7597 4.21071 16.3846 4.58579C16.0095 4.96086 15.7988 5.46957 15.7988 6C15.7988 6.53043 16.0095 7.03914 16.3846 7.41421C16.7597 7.78929 17.2684 8 17.7988 8C18.3293 8 18.838 7.78929 19.213 7.41421C19.5881 7.03914 19.7988 6.53043 19.7988 6ZM8.79883 12C8.79883 11.4696 8.58811 10.9609 8.21304 10.5858C7.83797 10.2107 7.32926 10 6.79883 10C6.2684 10 5.75969 10.2107 5.38461 10.5858C5.00954 10.9609 4.79883 11.4696 4.79883 12C4.79883 12.5304 5.00954 13.0391 5.38461 13.4142C5.75969 13.7893 6.2684 14 6.79883 14C7.32926 14 7.83797 13.7893 8.21304 13.4142C8.58811 13.0391 8.79883 12.5304 8.79883 12ZM17.7988 16C18.3293 16 18.838 16.2107 19.213 16.5858C19.5881 16.9609 19.7988 17.4696 19.7988 18C19.7988 18.5304 19.5881 19.0391 19.213 19.4142C18.838 19.7893 18.3293 20 17.7988 20C17.2684 20 16.7597 19.7893 16.3846 19.4142C16.0095 19.0391 15.7988 18.5304 15.7988 18C15.7988 17.4696 16.0095 16.9609 16.3846 16.5858C16.7597 16.2107 17.2684 16 17.7988 16Z" fill="white" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.7997 3.25C18.2253 3.24999 18.645 3.34875 19.026 3.5385C19.4069 3.72825 19.7386 4.00381 19.9949 4.34351C20.2512 4.6832 20.4252 5.07775 20.5032 5.49611C20.5812 5.91447 20.561 6.34522 20.4443 6.75445C20.3275 7.16369 20.1174 7.54024 19.8304 7.85448C19.5434 8.16872 19.1874 8.41207 18.7904 8.56537C18.3934 8.71867 17.9663 8.77775 17.5426 8.73795C17.1189 8.69815 16.7102 8.56055 16.3487 8.336C16.32 8.35485 16.2903 8.37221 16.2597 8.388L9.54671 11.868C9.55058 11.956 9.55058 12.044 9.54671 12.132L9.55971 12.14L15.9757 15.942C16.4553 15.5168 17.0683 15.2725 17.7089 15.2512C18.3494 15.23 18.9773 15.4331 19.484 15.8256C19.9907 16.218 20.3444 16.7751 20.484 17.4007C20.6236 18.0262 20.5404 18.6808 20.2486 19.2515C19.9569 19.8221 19.475 20.273 18.8862 20.5261C18.2974 20.7793 17.6387 20.8188 17.0239 20.6379C16.409 20.457 15.8767 20.0671 15.5188 19.5354C15.1609 19.0037 14.9999 18.3637 15.0637 17.726L8.71971 13.968C8.33218 14.3463 7.84159 14.6017 7.30946 14.7023C6.77734 14.8028 6.22737 14.744 5.72852 14.5332C5.22968 14.3225 4.80417 13.9691 4.50536 13.5175C4.20654 13.0658 4.04773 12.536 4.04883 11.9945C4.04994 11.4529 4.21091 10.9238 4.51156 10.4734C4.81221 10.0229 5.23915 9.67131 5.73885 9.46257C6.23855 9.25384 6.78875 9.19728 7.32046 9.30001C7.85218 9.40273 8.34172 9.66016 8.72771 10.04L15.1427 6.714C15.0331 6.30635 15.0188 5.87895 15.101 5.46489C15.1831 5.05084 15.3595 4.66125 15.6164 4.32631C15.8733 3.99137 16.2038 3.72007 16.5825 3.53342C16.9611 3.34678 17.3776 3.2498 17.7997 3.25ZM16.7437 17.331C16.7157 17.4105 16.6777 17.4861 16.6307 17.556C16.5164 17.8555 16.5216 18.1876 16.6451 18.4834C16.7687 18.7792 17.0012 19.0163 17.2946 19.1456C17.588 19.2748 17.9198 19.2864 18.2215 19.1779C18.5232 19.0694 18.7717 18.8492 18.9156 18.5627C19.0595 18.2761 19.0878 17.9453 18.9947 17.6385C18.9015 17.3317 18.6941 17.0725 18.4152 16.9143C18.1363 16.7562 17.8073 16.7112 17.4962 16.7888C17.1851 16.8663 16.9157 17.0604 16.7437 17.331ZM19.0497 6C19.0497 5.66848 18.918 5.35054 18.6836 5.11612C18.4492 4.8817 18.1312 4.75 17.7997 4.75C17.4682 4.75 17.1502 4.8817 16.9158 5.11612C16.6814 5.35054 16.5497 5.66848 16.5497 6C16.5497 6.33152 16.6814 6.64946 16.9158 6.88388C17.1502 7.1183 17.4682 7.25 17.7997 7.25C18.1312 7.25 18.4492 7.1183 18.6836 6.88388C18.918 6.64946 19.0497 6.33152 19.0497 6ZM8.04971 12C8.04971 11.6685 7.91801 11.3505 7.68359 11.1161C7.44917 10.8817 7.13123 10.75 6.79971 10.75C6.46819 10.75 6.15025 10.8817 5.91583 11.1161C5.68141 11.3505 5.54971 11.6685 5.54971 12C5.54971 12.3315 5.68141 12.6495 5.91583 12.8839C6.15025 13.1183 6.46819 13.25 6.79971 13.25C7.13123 13.25 7.44917 13.1183 7.68359 12.8839C7.91801 12.6495 8.04971 12.3315 8.04971 12Z" fill="#FFE6F2" />
                            </svg>

                            <span>Paylaş</span>
                        </div>

                        <div className="interaction-button" onClick={(e) => { e.stopPropagation(); setCommentOpen(true) }}>
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.2" d="M21.5 6V18C21.5 18.1989 21.421 18.3897 21.2803 18.5303C21.1397 18.671 20.9489 18.75 20.75 18.75H8L4.73281 21.5728C4.62357 21.6647 4.49038 21.7235 4.34887 21.7423C4.20737 21.7612 4.06343 21.7392 3.93397 21.6791C3.80451 21.6189 3.6949 21.523 3.61803 21.4028C3.54116 21.2825 3.50021 21.1428 3.5 21V6C3.5 5.80109 3.57902 5.61032 3.71967 5.46967C3.86032 5.32902 4.05109 5.25 4.25 5.25H20.75C20.9489 5.25 21.1397 5.32902 21.2803 5.46967C21.421 5.61032 21.5 5.80109 21.5 6Z" fill="#FFE6F2" />
                                <path d="M20.75 4.5H4.25003C3.8522 4.5 3.47067 4.65804 3.18937 4.93934C2.90806 5.22064 2.75003 5.60218 2.75003 6V21C2.7483 21.286 2.82921 21.5665 2.98305 21.8076C3.13689 22.0488 3.3571 22.2404 3.61721 22.3594C3.81543 22.4517 4.03138 22.4997 4.25003 22.5C4.60214 22.4991 4.94256 22.3735 5.21096 22.1456L5.2194 22.1391L8.28128 19.5H20.75C21.1479 19.5 21.5294 19.342 21.8107 19.0607C22.092 18.7794 22.25 18.3978 22.25 18V6C22.25 5.60218 22.092 5.22064 21.8107 4.93934C21.5294 4.65804 21.1479 4.5 20.75 4.5ZM20.75 18H8.00003C7.81994 18.0001 7.6459 18.065 7.50971 18.1828L4.25003 21V6H20.75V18Z" fill="#FFE6F2" />
                            </svg>

                            <span>{comments.length} Yorum</span>
                        </div>

                       {/*  <div className="interaction-button" onClick={(e) => { e.stopPropagation(); setModalVisible(true) }}>
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.6992 21C17.6698 21 21.6992 16.9706 21.6992 12C21.6992 7.02944 17.6698 3 12.6992 3C7.72866 3 3.69922 7.02944 3.69922 12C3.69922 16.9706 7.72866 21 12.6992 21Z" fill="white" fill-opacity="0.25" />
                                <path d="M12.6992 8V16M16.6992 12H8.69922" stroke="#FFE6F2" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                            </svg>

                            <span>Listeye Ekle</span>
                        </div> */}

                        <div className="interaction-button" onClick={(e) => { e.stopPropagation(); setReportOpen(true) }}>
                            <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_7960_14816)">
                                    <path opacity="0.3" d="M6.50234 2L2.40234 6.1V11.9L6.50234 16H12.3023L16.4023 11.9V6.1L12.3023 2H6.50234ZM9.40234 14C8.85234 14 8.40234 13.55 8.40234 13C8.40234 12.45 8.85234 12 9.40234 12C9.95234 12 10.4023 12.45 10.4023 13C10.4023 13.55 9.95234 14 9.40234 14ZM10.4023 11H8.40234V4H10.4023V11Z" fill="#FFE6F2" />
                                    <path d="M13.1304 0H5.67039L0.400391 5.27V12.73L5.67039 18H13.1304L18.4004 12.73V5.27L13.1304 0ZM16.4004 11.9L12.3004 16H6.50039L2.40039 11.9V6.1L6.50039 2H12.3004L16.4004 6.1V11.9Z" fill="#FFE6F2" />
                                    <path d="M9.40234 14C9.95463 14 10.4023 13.5523 10.4023 13C10.4023 12.4477 9.95463 12 9.40234 12C8.85006 12 8.40234 12.4477 8.40234 13C8.40234 13.5523 8.85006 14 9.40234 14Z" fill="#FFE6F2" />
                                    <path d="M8.40234 4H10.4023V11H8.40234V4Z" fill="#FFE6F2" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_7960_14816">
                                        <rect width="18" height="18" fill="white" transform="translate(0.400391)" />
                                    </clipPath>
                                </defs>
                            </svg>
                            <span>Bildir</span>
                        </div>
                    </div>

                    <div
                        className="profile-info"
                        onClick={() => {
                            const username = selectedHistory.owner_kullanici_adi;
                            const role = selectedHistory.chatbot_isim;
                            const avatarUrl = selectedHistory.chatbot_profil_fotografi;

                            const params = new URLSearchParams({
                                username,
                                role,
                                avatar: avatarUrl,
                            });

                            router.push(`/dashboard/chat?${params.toString()}`);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="avatar">
                            <Image src={selectedHistory.chatbot_profil_fotografi} alt="avatar" width={48} height={48} />
                        </div>
                        <div className="info">
                            <p className="name">{selectedHistory.chatbot_isim}</p>
                            <p className="username">{selectedHistory.owner_kullanici_adi}</p>
                        </div>
                    </div>
                </div>
            </div>
            <ShareModal isOpen={shareOpen} urlId={selectedHistory.conversation_chatbot_id} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={[]}
            />
            <CommentModal
                isOpen={commentOpen}
                onClose={() => setCommentOpen(false)}
                comments={comments}
                onSend={async (commentText) => {
                    const payload = {
                        user_id: userId,
                        dialog_id: selectedHistory.id,
                        comment: commentText
                    };

                    try
                    {
                        const formData = new FormData();
                        formData.append("data", JSON.stringify(payload));

                        const res = await fetch("/api/note/addcomment2.php", {
                            method: "POST",
                            body: formData
                        });
                        const resultText = await res.text();
                        //console.log(resultText);
                        const result = JSON.parse(resultText);
                        if (result.success)
                        {
                            setCommentCount(prev => prev + 1);
                        }
                        else
                        {
                            alert(result.message);
                        }
                    }
                    catch (err)
                    {
                        alert("Yorum eklenemedi: " + err.message);
                    }
                }}
                /*onSend={(comment) => console.log("Yeni yorum:", comment)}*/
            />
        </div>
    );
}
