<?php
/**
 * YOL HARİTASI — bu arayüzün bugün BİR implementasyonu ve BİR referansı yok.
 *
 * H-05: sekiz Domain arayüzünden yalnızca ikisi (Chatbot, User) gerçekten
 * uygulanıyor; kalan altısı — bu dosya dahil — repository katmanının nasıl
 * bölünmesi planlandığını anlatan bir sözleşme taslağı. Karşılık gelen
 * sorgular şu an ilgili controller içinde duruyor. Bir repository'ye
 * taşınırsa bu arayüz onun sözleşmesi olacak; taşınmayacaksa dosya
 * silinebilir — bugün hiçbir şeyi kırmaz.
 */
interface WalletRepositoryInterface {
    public function getBalance(int $userId): array;
    public function getBankInfo(int $userId): ?array;
    public function saveBankInfo(int $userId, array $data): void;
    public function getPayments(int $userId): array;
    public function getSubscriptions(int $userId): array;
    public function requestWithdrawal(int $userId, float $amount): int;
    public function getWithdrawals(int $userId): array;
    public function getPricing(): array;
    public function getSubscriptionPlan(int $userId): ?array;
}
