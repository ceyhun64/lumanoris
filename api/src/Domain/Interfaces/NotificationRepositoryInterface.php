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
interface NotificationRepositoryInterface {
    public function create(array $data): int;
    public function getByUser(int $userId, int $limit): array;
    public function markRead(int $id, int $userId): bool;
    public function markAllRead(int $userId): void;
    public function countUnread(int $userId): int;
}
