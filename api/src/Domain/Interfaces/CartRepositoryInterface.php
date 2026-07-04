<?php
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
