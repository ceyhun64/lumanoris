<?php
/**
 * Param POS Marketplace API client stub.
 * Production server has the real SOAP/REST client implementation.
 * This stub allows all seller/payment endpoints to load without fatal errors in dev.
 *
 * Methods mirror the real class so SellerController/MarketplaceController code runs.
 *
 * DEP-002 🟠 — `addSubMerchant` çağrısını `json_encode($params)` ile olduğu
 * gibi logluyordu; yani TC_VN (TC kimlik no), IBAN_No, Kisi_DogumTarihi,
 * GSM_No ve Adres alanları düz metin olarak error_log'a düşüyordu. SEC-001 o
 * dosyanın HTTP üzerinden indirilebildiğini gösterdi. Log artık redakte
 * ediliyor; hangi alanların geldiğini görmek için anahtar adları yeterli.
 *
 * DEP-001 🔴 — bu sınıfın yazma metotları HER ZAMAN `success:false` dönüyor.
 * Bu doğru stub davranışı (fail-closed) ama sonucu şu: temiz bir kurulumda
 * kimse satıcı olamıyor → hiçbir bot yayınlanamıyor → pazaryeri boş kalıyor.
 * Gerçek entegrasyon gelene kadar bu kilit kod düzeyinde açılamaz; açmak,
 * KYC'siz satıcı yaratmak demek olurdu. SellerController artık bu durumu
 * kullanıcıya açıkça anlatıyor.
 */
class ParamPosMarketplace {
    /**
     * Kişisel veri taşıyan alanların log'a düz yazılmaması için maskeleme.
     * Anahtar adları korunuyor (hata ayıklama için gerekli), değerler değil.
     */
    private static function redact(array $params): array {
        $sensitive = [
            'TC_VN', 'IBAN_No', 'Kisi_DogumTarihi', 'GSM_No', 'Adres',
            'Eposta', 'Kisi_Ad', 'Kisi_Soyad', 'VergiNo', 'Yetkili_TCKN',
        ];

        $out = [];
        foreach ($params as $key => $value) {
            if (is_array($value)) {
                $out[$key] = self::redact($value);
                continue;
            }
            if (in_array($key, $sensitive, true)) {
                $text = (string) $value;
                $out[$key] = $text === ''
                    ? '(boş)'
                    : '***(' . strlen($text) . ' karakter)';
                continue;
            }
            $out[$key] = $value;
        }
        return $out;
    }

    public function addSubMerchant(array $params): array {
        error_log('[ParamPosMarketplace-stub] addSubMerchant: ' . json_encode(self::redact($params), JSON_UNESCAPED_UNICODE));
        return ['success' => false, 'message' => 'Param POS sub-merchant kaydı bu ortamda desteklenmiyor (dev stub).'];
    }
    public function listSubMerchants(): array {
        error_log('[ParamPosMarketplace-stub] listSubMerchants');
        return ['success' => true, 'items' => []];
    }

    public function updateSubMerchant(array $data): array {
        error_log('[ParamPosMarketplace-stub] updateSubMerchant');
        return ['success' => false, 'message' => 'Güncelleme bu ortamda desteklenmiyor (dev stub).'];
    }

    public function deleteSubMerchant(array $data): array {
        error_log('[ParamPosMarketplace-stub] deleteSubMerchant');
        return ['success' => false, 'message' => 'Silme işlemi bu ortamda desteklenmiyor (dev stub).'];
    }

    public function listIller(): array {
        error_log('[ParamPosMarketplace-stub] listIller');
        return ['success' => false, 'message' => 'İl listesi bu ortamda alınamıyor (dev stub).', 'items' => []];
    }

    public function listIlceler(int $ilKodu): array {
        error_log('[ParamPosMarketplace-stub] listIlceler: ' . $ilKodu);
        return ['success' => false, 'message' => 'İlçe listesi bu ortamda alınamıyor (dev stub).', 'items' => []];
    }
}
