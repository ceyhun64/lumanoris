<?php
interface ChatbotRepositoryInterface {
    public function findById(int $id): ?array;
    public function findByIdAndOwner(int $id, int $ownerId): ?array;
    public function create(array $data): int;
    public function updateById(int $id, array $data): bool;
    public function deleteById(int $id): bool;
    public function getByOwner(int $ownerId): array;
    public function getPublished(array $filters = []): array;
    public function getPublishedV2(int $userId, array $filters = []): array;
    public function getMenuItems(int $userId): array;
    public function getSuggested(int $userId, array $categoryIds, array $excludeIds, int $limit): array;
    public function publish(int $id): bool;
    public function unpublish(int $id): bool;
    public function updatePrice(int $id, float $weekly, float $monthly): bool;
    public function countByOwner(int $ownerId): array;
    public function findBySlug(string $slug): ?array;
}
