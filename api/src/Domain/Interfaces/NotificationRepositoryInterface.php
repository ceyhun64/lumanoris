<?php
interface NotificationRepositoryInterface {
    public function create(array $data): int;
    public function getByUser(int $userId, int $limit): array;
    public function markRead(int $id, int $userId): bool;
    public function markAllRead(int $userId): void;
    public function countUnread(int $userId): int;
}
