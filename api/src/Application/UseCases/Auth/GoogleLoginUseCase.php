<?php
class GoogleLoginUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * Finds or creates a user by Google account.
     * @return int  user ID
     * @throws AuthException
     */
    public function execute(string $googleId, string $email, string $name): int {
        $user = $this->users->findByGoogleId($googleId);

        if (!$user || (int) ($user['id'] ?? 0) === 0) {
            $userId = $this->users->create([
                'google_id' => $googleId,
                'eposta'    => $email,
                'ad_soyad'  => $name,
            ]);

            $defaultBotId = $this->users->getDefaultFollowBotId();
            if ($defaultBotId) {
                $this->users->addDefaultFollow($userId, $defaultBotId);
            }

            return $userId;
        }

        $userId = (int) $user['id'];

        if (empty($user['google_id'])) {
            $this->users->linkGoogleId($userId, $googleId);
        }

        return $userId;
    }
}
