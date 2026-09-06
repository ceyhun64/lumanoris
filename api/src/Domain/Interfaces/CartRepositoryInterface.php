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
interface CartRepositoryInterface {
    public function getByUser(int $userId): array;
    public function countByUser(int $userId): int;
    public function add(int $userId, int $chatbotId, string $type): int;
    public function remove(int $userId, int $chatbotId): bool;
    public function removeById(int $id): bool;
    public function update(int $id, array $data): bool;
    public function exists(int $userId, int $chatbotId): bool;
    public function clearByUser(int $userId): void;
}
