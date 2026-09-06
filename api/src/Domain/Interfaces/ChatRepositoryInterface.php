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
interface ChatRepositoryInterface {
    // Conversations (sessions)
    public function createConversation(int $userId, int $chatbotId, string $title): int;
    public function getConversation(int $id): ?array;
    public function getConversations(int $userId, int $chatbotId): array;
    public function updateConversation(int $id, array $data): bool;
    public function deleteConversation(int $id): bool;
    public function getHistory(int $userId): array;

    // Chat messages
    public function addMessage(array $data): int;
    public function getMessages(int $conversationId, int $limit, int $offset): array;
    public function getMessageCount(int $conversationId): int;
}
