<?php
/**
 * Param POS Marketplace API client stub.
 * Production server has the real SOAP/REST client implementation.
 * This stub allows all seller/payment endpoints to load without fatal errors in dev.
 *
 * Methods mirror the real class so SellerController/MarketplaceController code runs.
 */
class ParamPosMarketplace {
    public function addSubMerchant(array $params): array {
        error_log('[ParamPosMarketplace-stub] addSubMerchant: ' . json_encode($params));
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
