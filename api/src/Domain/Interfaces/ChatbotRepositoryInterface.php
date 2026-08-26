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
    public function getDetail(int $id, int $userId): ?array;
    public function userHasAccess(int $chatbotId, int $userId, string $purpose = 'full'): bool;
    public function publish(int $id): bool;
    public function unpublish(int $id): bool;
    public function updatePrice(int $id, float $weekly, float $monthly): bool;
    public function countByOwner(int $ownerId): array;
    // findBySlug() was declared here and implemented against a `slug` column
    // that chatbotlar has never had (the table's 14 columns contain no slug of
    // any kind), so the first caller to trust this contract would have taken a
    // MySQL 1054. Nothing called it. Removed rather than left as a trap — the
    // schema has no slug concept to implement against.
}
