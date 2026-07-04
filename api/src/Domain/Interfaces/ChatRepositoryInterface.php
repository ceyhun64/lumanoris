<?php
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
