<?php
interface SubscriptionRepositoryInterface {
    public function getActive(int $userId, int $chatbotId): ?array;
    public function getByUser(int $userId): array;
    public function create(array $data): int;
    public function cancel(int $id): bool;
    public function renew(int $id, string $newExpiry): bool;
    public function isSubscribed(int $userId, int $chatbotId): bool;
    public function getExpiring(int $withinDays): array;
}
