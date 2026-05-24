"use client";
import {React, useEffect, useState} from 'react';
import logo from '../images/header-logo-icon.png';
import bgPattern from '../images/arkaplandesen.png';
import iyzicoFooter from '../images/iyzico_footer.png';
import AboutPopup from './components/AboutPopup';
import PrivacyPopup from './components/GizlilikPopup';
import UsagePopup from './components/UsagePopup';
import TermsOfSalePopup from './components/MesafeliSatisPopup';
import DeliveryAndReturnPopup from './components/TeslimatIadePopup';
import './css/landing.css';
import blokAll from "../images/blokAll.png";

export default function Home() {
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isUsageOpen, setIsUsageOpen] = useState(false);
    const [isMesafeOpen, setIsMesafeOpen] = useState(false);
    const [isTeslimatOpen, setIsTeslimatOpen] = useState(false);
    const [landingPhotos, setLandingPhotos] = useState([]);
    const [about, setAbout] = useState('');
    const [contactInfo, setContactInfo] = useState([]);
    const [socialsList, setSocialsList] = useState([]);

    useEffect(() => {
        async function fetchPhotos() {
              try {
                const res = await fetch("/api/getlandingimages.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setLandingPhotos(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchAbout() {
              try {
                const res = await fetch("/api/getabout.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setAbout(result.hakkinda);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchContact() {
              try {
                const res = await fetch("/api/getcontactinfo.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setContactInfo(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchSocials() {
              try {
                const res = await fetch("/api/getsocials.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setSocialsList(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        fetchPhotos();
        fetchAbout();
        fetchContact();
        fetchSocials();
    },[]);
    return (
  <>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 0,
        paddingTop: "506.8814%",
        paddingBottom: 0,
        boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
        marginTop: "1.6em",
        marginBottom: "0.9em",
        overflow: "hidden",
        borderRadius: "8px",
        willChange: "transform",
      }}
    >
      <iframe
        loading="lazy"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          border: "none",
          padding: 0,
          margin: 0,
        }}
        src="https://www.canva.com/design/DAHFIDGvuNk/xWqf-9PtUpAkwXjWbWhEcQ/view?embed"
        allowFullScreen={true}
        allow="fullscreen"
      ></iframe>
    </div>
    <a
      href="https://www.canva.com/design/DAHFIDGvuNk/xWqf-9PtUpAkwXjWbWhEcQ/view?utm_content=DAHFIDGvuNk&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
      target="_blank"
      rel="noopener noreferrer"
    >
      lumanoris landing page
    </a>{" "}
    - Adnan Yusuf KOÇAK
  </>
);
}