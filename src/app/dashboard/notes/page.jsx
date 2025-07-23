'use client';
import { useState } from 'react';
import Masonry from 'react-masonry-css';
import avatar from "../../../images/avatar-bot.jpg";
import CategoryFilter from '@/app/components/CategoryFilter/CategoryFilter';
import { useRouter } from 'next/navigation';
import DialogueModal from '@/app/components/DialogueModal';

const allCards = [
    {
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Resmi'
    },
    {
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy It has survived not only five centuries, but also the leap into electronic typesetting.',
        tag: 'Çeviri'
    },
    {
        title: 'Travel Planner AI',
        description: 'Contrary to popular belief, Lorem ILorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.psum is not simply random text.',
        tag: 'Öne Çıkanlar'
    },
    {
        title: 'Travel Planner AI',
        description: 'It was populariseLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply d in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.',
        tag: 'Resmi'
    },
    {
        title: 'Travel Planner AI',
        description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dMore recently with desktop puLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.blishing software like Aldus PageMaker including versions of Lorem Ipsum.',
        tag: 'Eğitim'
    },
    {
        title: 'Travel Planner AI',
        description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dhere are many variations of passages oLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.f Lorem Ipsum available, but the majority have suffered alteration.',
        tag: 'Çeviri'
    },
    {
        title: 'Travel Planner AI',
        description: 'All the Lorem Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Ipsum generators on the Internet tend to repeat predefined chunks as necessary.',
        tag: 'Öne Çıkanlar'
    },
    {
        title: 'Travel Planner AI',
        description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.d.',
        tag: 'Resmi'
    },
    {
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced.',
        tag: 'Eğitim'
    }
];


export default function DialoguePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtered, setFiltered] = useState('Tümü');
    const filteredCards = filtered === 'Tümü'
        ? allCards
        : allCards.filter(card => card.tag === filtered);
    const breakpoints = {
        default: 5,
        1200: 4,
        900: 3,
        600: 2,
        350: 1,
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="dialogue-wrapper">
            <div className="dialogue-header">
                <h2>Diyalog Defteri</h2>
            </div>

            <CategoryFilter
                onSelect={(cat) => setFiltered(cat)}
                selected={filtered}
            />

            <Masonry
                breakpointCols={breakpoints}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
            >
                {filteredCards.map((card, index) => (
                    <div
                        className="dialogue-card"
                        key={index}
                        onClick={() => setIsModalOpen(true)}
                        style={{ cursor: 'pointer' }}
                    >

                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="198" height="143" viewBox="0 0 198 143" fill="none">
                                <g filter="url(#filter0_f_7772_8789)">
                                    <ellipse cx="99.0993" cy="-4.46558" rx="61.8786" ry="36.4758" fill="url(#paint0_linear_7772_8789)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_8789" x="-73.2281" y="-151.39" width="344.654" height="293.849" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="55.2244" result="effect1_foregroundBlur_7772_8789" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_8789" x1="37.2207" y1="-4.46558" x2="160.978" y2="-4.46558" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="card-content">
                            <p>{card.description}</p>
                        </div>
                        <div className="card-footer">
                            <div className="left">
                                <div className="icon">
                                    <img src={avatar.src} alt="" />
                                </div>
                                <div className='left-item'>
                                    <span className="card-title">{card.title}</span>
                                    <span className="card-sub">WanderBot</span>
                                </div>
                            </div>
                            <button className="card-menu">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_7772_8798)">
                                        <path d="M8.36857 15.1996L8.36174 15.2008L8.3177 15.2225L8.30529 15.225L8.29661 15.2225L8.25256 15.2008C8.24595 15.1987 8.24098 15.1998 8.23767 15.2039L8.23519 15.2101L8.22465 15.4756L8.22775 15.488L8.23395 15.4961L8.29847 15.542L8.30777 15.5445L8.31522 15.542L8.37973 15.4961L8.38718 15.4862L8.38966 15.4756L8.37911 15.2107C8.37746 15.2041 8.37394 15.2004 8.36857 15.1996ZM8.53296 15.1295L8.52489 15.1307L8.41013 15.1884L8.40392 15.1946L8.40206 15.2014L8.41323 15.4682L8.41633 15.4756L8.42129 15.48L8.54598 15.5376C8.55384 15.5397 8.55984 15.5381 8.56397 15.5327L8.56645 15.524L8.54536 15.1431C8.54329 15.1357 8.53916 15.1311 8.53296 15.1295ZM8.08941 15.1307C8.08668 15.129 8.08341 15.1285 8.08029 15.1292C8.07717 15.1299 8.07444 15.1318 8.07267 15.1344L8.06894 15.1431L8.04785 15.524C8.04827 15.5314 8.05178 15.5364 8.0584 15.5389L8.0677 15.5376L8.19239 15.48L8.19859 15.475L8.20107 15.4682L8.21162 15.2014L8.20976 15.194L8.20356 15.1878L8.08941 15.1307Z" fill="#8C8C8C" />
                                        <path d="M8.00142 11.3175C8.33046 11.3175 8.64603 11.4482 8.87871 11.6809C9.11138 11.9136 9.24209 12.2292 9.24209 12.5582C9.24209 12.8873 9.11138 13.2028 8.87871 13.4355C8.64603 13.6682 8.33046 13.7989 8.00142 13.7989C7.67237 13.7989 7.3568 13.6682 7.12413 13.4355C6.89146 13.2028 6.76074 12.8873 6.76074 12.5582C6.76074 12.2292 6.89146 11.9136 7.12413 11.6809C7.3568 11.4482 7.67237 11.3175 8.00142 11.3175ZM8.00142 6.97517C8.33046 6.97517 8.64603 7.10589 8.87871 7.33856C9.11138 7.57123 9.24209 7.8868 9.24209 8.21585C9.24209 8.5449 9.11138 8.86047 8.87871 9.09314C8.64603 9.32581 8.33046 9.45652 8.00142 9.45652C7.67237 9.45652 7.3568 9.32581 7.12413 9.09314C6.89146 8.86047 6.76074 8.5449 6.76074 8.21585C6.76074 7.8868 6.89146 7.57123 7.12413 7.33856C7.3568 7.10589 7.67237 6.97517 8.00142 6.97517ZM8.00142 2.63281C8.33046 2.63281 8.64603 2.76353 8.87871 2.9962C9.11138 3.22887 9.24209 3.54444 9.24209 3.87349C9.24209 4.20253 9.11138 4.5181 8.87871 4.75078C8.64603 4.98345 8.33046 5.11416 8.00142 5.11416C7.67237 5.11416 7.3568 4.98345 7.12413 4.75078C6.89146 4.5181 6.76074 4.20253 6.76074 3.87349C6.76074 3.54444 6.89146 3.22887 7.12413 2.9962C7.3568 2.76353 7.67237 2.63281 8.00142 2.63281Z" fill="#8C8C8C" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_7772_8798">
                                            <rect width="14.8881" height="14.8881" fill="white" transform="translate(0.555664 0.771484)" />
                                        </clipPath>
                                    </defs>
                                </svg>

                            </button>
                        </div>
                    </div>
                ))}
            </Masonry>

            <DialogueModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

        </div>
    );
}
