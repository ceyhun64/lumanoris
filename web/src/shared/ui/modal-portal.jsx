"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Elle yazılmış modallar için portal sarmalayıcı.
 *
 * Sorun: `position: fixed` göründüğü kadar mutlak değil. Üstteki herhangi bir
 * ata `transform` / `filter` / `backdrop-filter` / `contain` taşıyorsa fixed
 * artık viewport'a değil o ataya göre konumlanır; overlay de sayfanın tamamını
 * kaplamaz. Ayrıca bir scroll kutusunun içinde kaldığında o kutunun kaydırma
 * çubuğu şeridi dışarıda kalır. Dashboard yerleşimi hem backdrop-blur'lu
 * katmanlar hem de kendi scroll kutusunu içerdiği için buradaki modallar tam
 * olarak bu duruma düşüyordu.
 *
 * İçeriği `document.body`'ye taşımak bütün bu ata zincirini atlar.
 *
 * Radix Dialog'a (`DialogContentBare`) geçmek daha kapsamlı çözüm; bu
 * sarmalayıcı markup'ı hiç değiştirmeden aynı üç kazanımı verir:
 * tam kaplama, Esc ile kapanma ve arka plan kaydırma kilidi.
 */
export function ModalPortal({ children, onClose, lockScroll = true }) {
  const [mounted, setMounted] = useState(false);

  // Prerender sırasında `document` yok; portal ancak istemcide kurulabilir.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !onClose) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mounted, onClose]);

  useEffect(() => {
    if (!mounted || !lockScroll) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted, lockScroll]);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default ModalPortal;
