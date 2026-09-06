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
interface SubscriptionRepositoryInterface {
    public function getActive(int $userId, int $chatbotId): ?array;
    public function getByUser(int $userId): array;
    public function create(array $data): int;
    public function cancel(int $id): bool;
    public function renew(int $id, string $newExpiry): bool;
    public function isSubscribed(int $userId, int $chatbotId): bool;
    public function getExpiring(int $withinDays): array;
}
