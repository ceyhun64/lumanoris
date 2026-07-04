<?php
interface UserRepositoryInterface {
    public function findById(int $id): ?array;
    public function findByEmail(string $email): ?array;
    public function findByUsername(string $username): ?array;
    public function findByRememberToken(string $token): ?array;
    public function create(array $data): int;
    public function updateById(int $id, array $data): bool;
    public function setRememberToken(int $id, string $selector, string $hashedValidator, string $expiry): void;
    public function clearRememberToken(int $id): void;
    public function existsByEmail(string $email): bool;
    public function existsByUsername(string $username): bool;
    public function getProfilePhoto(int $id): ?string;
    public function updateProfilePhoto(int $id, string $path): void;
    public function findByGoogleId(string $googleId): ?array;
    public function linkGoogleId(int $id, string $googleId): void;
}
