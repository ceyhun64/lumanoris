import { Sparkles } from "lucide-react";
import AiBuilderPreview from "./previews/AiBuilderPreview";
import CommunicationPreview from "./previews/CommunicationPreview";
import DialoguePreview from "./previews/DialoguePreview";
import MarketPreview from "./previews/MarketPreview";
import SocialPreview from "./previews/SocialPreview";
import WalletPreview from "./previews/WalletPreview";

/**
 * Server component: yalnızca başlık + grid. Altı kartın her biri kendi
 * animasyon döngüsünü taşıdığı için client.
 */
export default function FeaturesSection() {
  return (
    <section className="max-w-7xl mr-auto ml-auto pt-16 pr-5 pb-16 pl-5 sm:pt-24 sm:pr-6 sm:pb-24 sm:pl-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-fuchsia-300 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20 rounded-full mb-6">
          <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          Detaylı Bilgi
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-6">
          <span className="text-fuchsia-400">Fikirden Sonuca:</span> İşinizi Kolaylaştıran Ekosistem
        </h2>
        <p className="text-lg sm:text-xl text-white/75 max-w-3xl mx-auto">
          LUMANORIS, fikrinizi bir ürüne dönüştürmek için gerekli birçok sistemle donatılmış kapsamlı bir
          ekosistemdir. İşte öne çıkan özelliklerimizden bazıları:
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <AiBuilderPreview />
        <MarketPreview />
        <SocialPreview />
        <DialoguePreview />
        <CommunicationPreview />
        <WalletPreview />
      </div>
    </section>
  );
}
