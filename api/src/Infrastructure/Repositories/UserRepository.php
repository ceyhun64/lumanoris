<?php
class UserRepository extends BaseRepository implements UserRepositoryInterface {
    private const T = AppConfig::TABLE_USERS;
    private const T_TOKENS = AppConfig::TABLE_USER_TOKENS;

    public function findById(int $id): ?array {
        return self::one('SELECT * FROM `' . self::T . '` WHERE id = ?', [$id]);
    }

    public function findByEmail(string $email): ?array {
        return self::one(
            'SELECT * FROM `' . self::T . '` WHERE eposta = ?',
            [$email]
        );
    }

    public function findByUsername(string $username): ?array {
        return self::one(
            'SELECT * FROM `' . self::T . '` WHERE kullanici_adi = ?',
            [$username]
        );
    }

    public function findByUsernameOrEmail(string $identifier): ?array {
        return self::one(
            'SELECT id, kullanici_adi, eposta, sifre FROM `' . self::T . '` WHERE kullanici_adi = ? OR eposta = ?',
            [$identifier, $identifier]
        );
    }

    public function findByRememberToken(string $selector): ?array {
        return self::one(
            'SELECT user_id, hashed_validator FROM `' . self::T_TOKENS . '` WHERE selector = ? AND expiry > NOW()',
            [$selector]
        );
    }

    public function findByGoogleId(string $googleId, string $email): ?array {
        // Matches by google_id (returning user) OR by email (a user who
        // originally registered the traditional way, signing in with Google
        // for the first time) — previously this compared `eposta` against
        // the Google sub-id itself, which never matches a real email, so an
        // existing traditional account was never found and the subsequent
        // insert crashed on the eposta UNIQUE constraint.
        return self::one(
            'SELECT id, google_id FROM `' . self::T . '` WHERE google_id = ? OR eposta = ?',
            [$googleId, $email]
        );
    }

    public function create(array $data): int {
        return self::insert(self::T, $data);
    }

    public function updateById(int $id, array $data): bool {
        return self::update(self::T, $data, 'id = :_id', ['_id' => $id]) > 0;
    }

    public function existsByEmail(string $email): bool {
        return self::exists(self::T, 'eposta = ?', [$email]);
    }

    public function existsByUsername(string $username): bool {
        return self::exists(self::T, 'kullanici_adi = ?', [$username]);
    }

    public function existsByUsernameOrEmail(string $username, string $email): bool {
        return self::count(self::T, 'kullanici_adi = ? OR eposta = ?', [$username, $email]) > 0;
    }

    public function setRememberToken(int $userId, string $selector, string $hashedValidator, string $expiry): void {
        self::insert(self::T_TOKENS, [
            'selector'         => $selector,
            'hashed_validator' => $hashedValidator,
            'user_id'          => $userId,
            'expiry'           => $expiry,
        ]);
    }

    public function clearRememberToken(int $userId): void {
        self::delete(self::T_TOKENS, 'user_id = ?', [$userId]);
    }

    public function getProfilePhoto(int $id): ?string {
        $row = self::one('SELECT profil_foto FROM `' . self::T . '` WHERE id = ?', [$id]);
        return $row ? $row['profil_foto'] : null;
    }

    public function updateProfilePhoto(int $id, string $path): void {
        self::update(self::T, ['profil_foto' => $path], 'id = :_id', ['_id' => $id]);
    }

    public function linkGoogleId(int $id, string $googleId): void {
        self::update(self::T, ['google_id' => $googleId], 'id = :_id', ['_id' => $id]);
    }

    public function addEmailRecord(int $userId, string $email): void {
        self::insert('user_emails', ['user_id' => $userId, 'email' => $email]);
    }

    public function getDefaultFollowBotId(): ?int {
        $row = self::one(
            'SELECT c.id FROM chatbotlar c JOIN `' . self::T . '` u ON u.id = c.author_user_id WHERE u.kullanici_adi = ? LIMIT 1',
            [AppConfig::LUMANORIS_USERNAME]
        );
        return $row ? (int) $row['id'] : null;
    }

    public function addDefaultFollow(int $userId, int $chatbotId): void {
        self::insert('chatbot_follows', [
            'user_id'     => $userId,
            'chatbot_id'  => $chatbotId,
            'followed_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
