<?php
interface WalletRepositoryInterface {
    public function getBalance(int $userId): array;
    public function getBankInfo(int $userId): ?array;
    public function saveBankInfo(int $userId, array $data): void;
    public function getPayments(int $userId): array;
    public function getSubscriptions(int $userId): array;
    public function requestWithdrawal(int $userId, float $amount): int;
    public function getWithdrawals(int $userId): array;
    public function getPricing(): array;
    public function getSubscriptionPlan(int $userId): ?array;
}
