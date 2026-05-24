"use client";
import React, { useState, useEffect } from "react";
import aiIcon from "../../../images/avatar-bot.jpg";
import AddToListModal from "@/app/components/AddToListModal/AddToListModal";
import listBlankIcon from "../../../images/list-blank.svg";
import Image from "next/image";
import Link from "next/link";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";
import { useRouter } from "next/navigation";
import AddToListModalEmpty from "@/app/components/AddToListModalEmpty/AddToListModalEmpty";
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

/* 
const mockData = []; */
export default function List() {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisible2, setModalVisible2] = useState(false);

    const [listData, setListData] = useState([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
    const [splideInstances, setSplideInstances] = useState({});
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    const fetchUserLists = async (uid) => {
        try {
            const response = await fetch(`/api/getuserlists.php?id=${uid}`);
            const data = await response.json();

            if (Array.isArray(data)) {
            // Her liste için bot bilgilerini de çekiyoruz
            const formatted = await Promise.all(
                data.map(async (list) => {
                try {
                    const botRes = await fetch(`/api/getbotsoflist.php?list_id=${list.id}`);
                    const botData = await botRes.json();

                    return {
                    id: list.id,
                    title: list.name,
                    username: "@kullanıcı",
                    summary: `${botData.bot_count} Bot İçeriyor`,
                    dialog: `${botData.total_chats} Diyalog`,
                    bots: botData.bots, // profil fotoğrafları array
                    createdAt: new Date().toISOString(),
                    };
                } catch (err) {
                    console.error("Bot verisi alınamadı:", err);
                    return {
                    id: list.id,
                    title: list.name,
                    username: "@kullanıcı",
                    summary: "Bot bilgisi alınamadı",
                    dialog: "...",
                    bots: [],
                    createdAt: new Date().toISOString(),
                    };
                }
                })
            );

            setListData(formatted);
            }
        } catch (error) {
            console.error("Listeler yüklenirken hata oluştu:", error);
        }
    };

    useEffect(() => {
            async function checkSession() {
                try {
                    const res = await fetch("/api/sessioncheck.php", {
                    credentials: "include", // cookie'yi gönder
                    });
                    const resultText = await res.text();
                    console.log(resultText);
                    const result = JSON.parse(resultText);
    
                    if (result.authenticated) {
                    setUserId(result.user_id);
                    fetchUserLists(result.user_id); 
                    } else {
                    router.push("/login");
                    }
                } catch (err) {
                    console.error("Session check error:", err);
                    router.push("/login");
                }
            }
            checkSession();
        }, [router]);

    const handleCreateList = async (name) => {
        console.log("Yeni liste oluşturuluyor:", name);

        // 1. PHP'ye gönderilecek veriyi hazırla
        const payload = {
            user_id: userId,
            name: name,
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            // 2. PHP AJAX modülüne isteği at (Dosya yolunu kendine göre güncelle)
            const response = await fetch('/api/adduserlist.php', { 
                method: 'POST',
                body: formData
            });
            const resultText = await response.text();
            console.log(resultText);
            const result = JSON.parse(resultText);
            //const result = await response.json();

            if (result.success) {
                // PHP tarafında başarıyla kaydedildiyse arayüzü güncelle
                
                // Random diyalog sayısı oluştur
                //const randomDialogCount = Math.floor(Math.random() * 200) + 1;

                const formattedList = {
                    title: name,
                    username: "@kullanıcı",
                    summary: "0 bot içeriyor",
                    dialog: `0 Bot`,
                    bots: [],
                    createdAt: new Date().toISOString()
                };

                // State'i güncelle
                setListData(prev => [...prev, formattedList]);

                // Modalları kapat
                setModalVisible(false);
                setModalVisible2(false);

                // Explore sayfasına yönlendir
                //router.push(`/dashboard/explore?from=list&name=${encodeURIComponent(name)}`);
                
            } else {
                alert("Veritabanı hatası: " + result.message);
            }

        } catch (error) {
            console.error("İstek gönderilirken hata oluştu:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
        }
    };

    const handleDelete = async (indexToRemove) => {
        // Silinecek listenin veritabanı ID'sini alıyoruz
        const listToDelete = listData[indexToRemove];
        
        if (!listToDelete || !listToDelete.id) {
            alert("Liste ID'si bulunamadı!");
            return;
        }

        const formData = new FormData();
        formData.append('id', listToDelete.id); // PHP'deki $_POST['id'] buraya gidiyor

        try {
            const response = await fetch('/api/deleteuserlist.php', {
                method: 'POST',
                body: formData
            });

            const resultText = await response.text();
            console.log(resultText);
            const result = JSON.parse(resultText);
            //const result = await response.json();

            if (result.success) {
                // Veritabanından başarıyla silindiyse state'den de kaldır
                setListData(prev => prev.filter((_, index) => index !== indexToRemove));
                console.log("Silindi:", result.message);
            } else {
                alert("Silme hatası: " + result.message);
            }
        } catch (error) {
            console.error("Silme işlemi sırasında hata:", error);
            alert("Sunucuyla iletişim kurulamadı.");
        }
    };

    const isEmpty = listData.length === 0;

      console.log(listData);
    return (
        <div className="list-wrapper">
            <AddToListModal
                isOpen={modalVisible}
                header="Yeni Liste Oluştur"
                onClose={() => setModalVisible(false)}
                lists={[]}
                onCreateList={handleCreateList}
            />

            <AddToListModalEmpty
                isOpen={modalVisible2}
                onClose={() => setModalVisible2(false)}
                onCreate={handleCreateList}
            />

            <DeleteConfirmModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => {
                    handleDelete(deleteTargetIndex);
                    setDeleteModalVisible(false);
                    setDeleteTargetIndex(null);
                }}
            />


            <div className="list-header">
                <h2>Liste</h2>
                {!isEmpty && <button className="create-button" onClick={() => setModalVisible2(true)}>
                    <span>＋</span> Yeni liste oluştur
                </button>}
            </div>

            {isEmpty && <div className="chatbots-empty-state">
                <div className="mobile-header">
                    <span>
                        Home
                    </span>
                </div>
                <div className="logo">
                    <Image src={listBlankIcon} alt="Logo" />
                    <svg width="153" height="153" viewBox="0 0 153 153" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_f_7776_8385)">
                            <circle cx="76.2031" cy="76.7031" r="26.1386" fill="url(#paint0_linear_7776_8385)" />
                        </g>
                        <defs>
                            <filter id="filter0_f_7776_8385" x="0.28228" y="0.78228" width="151.842" height="151.842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="24.8911" result="effect1_foregroundBlur_7776_8385" />
                            </filter>
                            <linearGradient id="paint0_linear_7776_8385" x1="60.7575" y1="86.8021" x2="87.1932" y2="66.9011" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FF66C4" />
                                <stop offset="1" stopColor="#4699FF" />
                            </linearGradient>
                        </defs>
                    </svg>

                </div>

                <h2>
                    Henüz Listeniz bulunmamaktadır
                </h2>

                <button onClick={() => setModalVisible2(true)} className="create-button">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" viewBox="0 0 26 25" fill="none">
                        <path d="M13 5.20117V19.7842M5.7085 12.4927H20.2915" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg></span> İlk listenizi oluşturun
                </button>
            </div>}

            <div className="list-inner">
                {listData.map((item, index) => (
                    <div className="list-card" key={index}>
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="205" height="121" viewBox="0 0 205 121" fill="none">
                                <g filter="url(#filter0_f)">
                                    <ellipse cx="19.5" cy="24.2" rx="66.5" ry="39.2" fill="url(#gradient)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f" x="-165.698" y="-133.698" width="370.395" height="315.796">
                                        <feGaussianBlur stdDeviation="59.3488" />
                                    </filter>
                                    <linearGradient id="gradient" x1="-47" y1="24.2" x2="86" y2="24.2" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.21" stopColor="#4699FF" />
                                        <stop offset="0.79" stopColor="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="list-left"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push("/dashboard/chat/?botId=" + item.id);
                            }}
                            style={{ cursor: "pointer" }}>

                            {item.bots && item.bots.length >= 5 ? (
                                <div style={{ position: 'relative' }} className="splide-wrapper">
                                    <Splide
                                        options={{
                                            type: 'loop',
                                            perPage: 5,
                                            gap: '4px',
                                            arrows: false,
                                            pagination: false,
                                            autoplay: false,
                                            interval: 3000,
                                            pauseOnHover: true,
                                            resetProgress: false,
                                            height: '40px',
                                            width: '250px'
                                        }}
                                        aria-label="Bot avatars"
                                        onMounted={(splide) => {
                                            setSplideInstances(prev => ({
                                                ...prev,
                                                [`splide-${index}`]: splide
                                            }));
                                        }}
                                    >
                                        {item.bots.map((bot, botIndex) => (
                                            <SplideSlide key={botIndex}>
                                                <img src={bot.profil_fotografi} alt={`Bot ${botIndex + 1}`} />
                                            </SplideSlide>
                                        ))}
                                    </Splide>

                                    <div className="splide__arrows">
                                        <button
                                            className="splide__arrow splide__arrow--prev"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                splideInstances[`splide-${index}`]?.go('-1');
                                            }}
                                        >
                                            <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="32" y="32.5" width="32" height="32" rx="16" transform="rotate(-180 32 32.5)" fill="white" fill-opacity="0.24" />
                                                <path opacity="0.5" d="M21.3332 17C21.4658 17 21.593 16.9473 21.6867 16.8536C21.7805 16.7598 21.8332 16.6326 21.8332 16.5C21.8332 16.3674 21.7805 16.2402 21.6867 16.1464C21.593 16.0527 21.4658 16 21.3332 16V17ZM21.3332 16L10.6665 16V17L21.3332 17V16Z" fill="#FF66C4" />
                                                <path d="M14.6665 12.5L10.6665 16.5L14.6665 20.5" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" className="pathg" />
                                            </svg>
                                        </button>
                                        <button
                                            className="splide__arrow splide__arrow--next"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                splideInstances[`splide-${index}`]?.go('+1');
                                            }}
                                        >
                                            <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect y="0.5" width="32" height="32" rx="16" fill="white" fill-opacity="0.24" />
                                                <path opacity="0.5" d="M10.6668 16C10.5342 16 10.407 16.0527 10.3133 16.1464C10.2195 16.2402 10.1668 16.3674 10.1668 16.5C10.1668 16.6326 10.2195 16.7598 10.3133 16.8536C10.407 16.9473 10.5342 17 10.6668 17V16ZM10.6668 17H21.3335V16L10.6668 16V17Z" fill="#FF66C4" />
                                                <path d="M17.3335 20.5L21.3335 16.5L17.3335 12.5" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" className="pathg" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {item.bots && item.bots.length > 0 ? (
                                        item.bots.map((bot, botIndex) => (
                                            <img key={botIndex} src={bot.profil_fotografi} alt={`Bot ${botIndex + 1}`} />
                                        ))
                                    ) : (
                                        <>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="list-content">
                            <h4>{item.title}</h4>
                            <p className="username">{item.username}</p>
                            <p className="summary">{item.summary}</p>
                            <div className="dialog-info">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.66656 13.332H2.66656C2.579 13.332 2.4923 13.3148 2.4114 13.2813C2.33051 13.2477 2.25702 13.1986 2.19512 13.1367C2.13322 13.0748 2.08413 13.0012 2.05065 12.9203C2.01717 12.8394 1.99996 12.7527 2 12.6652V5.33203M7.33344 7.99859H11.3334M7.33344 5.33203H11.3334" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M13.3339 2.66602H5.33387C5.24628 2.66597 5.15955 2.68319 5.07862 2.71669C4.99769 2.75019 4.92416 2.79931 4.86222 2.86125C4.80029 2.92318 4.75117 2.99671 4.71767 3.07764C4.68417 3.15857 4.66695 3.24531 4.66699 3.3329V9.99946C4.66699 10.087 4.68424 10.1737 4.71776 10.2546C4.75128 10.3355 4.80041 10.409 4.86234 10.4709C4.92427 10.5328 4.99778 10.5819 5.07869 10.6154C5.1596 10.6488 5.24631 10.6661 5.33387 10.666H7.33387V12.666L10.667 10.666H13.3339C13.5107 10.666 13.6802 10.5958 13.8052 10.4708C13.9302 10.3458 14.0004 10.1762 14.0004 9.99946V3.3329C14.0005 3.24533 13.9833 3.15862 13.9498 3.07772C13.9163 2.99681 13.8672 2.92329 13.8053 2.86136C13.7434 2.79943 13.6699 2.7503 13.589 2.71679C13.5081 2.68327 13.4214 2.66602 13.3339 2.66602Z" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{item.dialog}</span>
                            </div>
                        </div>

                        <div
                            className="list-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetIndex(index);
                                setDeleteModalVisible(true);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 9.875C5 9.58 5 9.4325 5.09125 9.34125C5.1825 9.25 5.33 9.25 5.625 9.25H24.375C24.67 9.25 24.8175 9.25 24.9088 9.34125C25 9.4325 25 9.58 25 9.875V10.19C25 10.3025 25 10.36 24.9825 10.41C24.9674 10.4531 24.9431 10.4923 24.9113 10.525C24.8738 10.5625 24.8237 10.5875 24.7225 10.6388C23.9088 11.045 23.5025 11.2488 23.2063 11.5538C22.9532 11.8144 22.7599 12.1271 22.64 12.47C22.5 12.87 22.5 13.325 22.5 14.235V20.5C22.5 22.8575 22.5 24.035 21.7675 24.7675C21.035 25.5 19.8575 25.5 17.5 25.5H12.5C10.1425 25.5 8.965 25.5 8.2325 24.7675C7.5 24.035 7.5 22.8575 7.5 20.5V14.235C7.5 13.325 7.5 12.87 7.36 12.47C7.24007 12.1271 7.04683 11.8144 6.79375 11.5538C6.4975 11.2488 6.09125 11.045 5.2775 10.6388C5.20933 10.6103 5.14572 10.572 5.08875 10.525C5.05689 10.4923 5.03257 10.4531 5.0175 10.41C5 10.36 5 10.3025 5 10.19V9.875Z" fill="#FFE4E4" />
                                <path d="M12.585 5.9627C12.7275 5.8302 13.0412 5.7127 13.4787 5.62895C13.9808 5.5398 14.49 5.49671 15 5.5002C15.55 5.5002 16.085 5.5452 16.5212 5.62895C16.9575 5.7127 17.2712 5.8302 17.415 5.96395" stroke="#DB1F35" strokeLinecap="round" />
                                <path d="M18.75 14.875C18.75 14.5298 18.4702 14.25 18.125 14.25C17.7798 14.25 17.5 14.5298 17.5 14.875V21.125C17.5 21.4702 17.7798 21.75 18.125 21.75C18.4702 21.75 18.75 21.4702 18.75 21.125V14.875Z" fill="#DB1F35" />
                                <path d="M12.5 14.875C12.5 14.5298 12.2202 14.25 11.875 14.25C11.5298 14.25 11.25 14.5298 11.25 14.875V21.125C11.25 21.4702 11.5298 21.75 11.875 21.75C12.2202 21.75 12.5 21.4702 12.5 21.125V14.875Z" fill="#DB1F35" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
