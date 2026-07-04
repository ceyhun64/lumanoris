<?php
interface SocialRepositoryInterface {
    // Likes / dislikes
    public function addLike(int $userId, int $chatbotId): void;
    public function removeLike(int $userId, int $chatbotId): void;
    public function hasLiked(int $userId, int $chatbotId): bool;
    public function addDislike(int $userId, int $chatbotId): void;
    public function removeDislike(int $userId, int $chatbotId): void;
    public function hasDisliked(int $userId, int $chatbotId): bool;

    // Follows
    public function follow(int $userId, int $chatbotId): void;
    public function unfollow(int $userId, int $chatbotId): void;
    public function hasFollowed(int $userId, int $chatbotId): bool;
    public function getFollowed(int $userId): array;

    // Comments
    public function addComment(int $userId, int $chatbotId, string $text): int;
    public function getComments(int $chatbotId, int $limit, int $offset): array;

    // Lists
    public function createList(int $userId, string $name): int;
    public function deleteList(int $listId): bool;
    public function getLists(int $userId): array;
    public function addToList(int $listId, int $chatbotId): void;
    public function removeFromList(int $listId, int $chatbotId): void;
    public function getListBots(int $listId): array;
    public function getBotLists(int $userId, int $chatbotId): array;
    public function isInList(int $listId, int $chatbotId): bool;

    // Hide / uninterest
    public function hide(int $userId, int $chatbotId): void;
    public function getHidden(int $userId): array;
    public function addUninterest(int $userId, int $chatbotId): void;
    public function getUninterested(int $userId): array;

    // Reports
    public function addReport(int $userId, int $chatbotId, string $reason): void;
}
