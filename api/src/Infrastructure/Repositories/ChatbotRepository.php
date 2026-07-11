<?php
class ChatbotRepository extends BaseRepository implements ChatbotRepositoryInterface {
    private const T = AppConfig::TABLE_CHATBOTS;

    public function findById(int $id): ?array {
        return self::one('SELECT * FROM `' . self::T . '` WHERE id = ?', [$id]);
    }

    public function findByIdAndOwner(int $id, int $ownerId): ?array {
        return self::one(
            'SELECT * FROM `' . self::T . '` WHERE id = ? AND author_user_id = ?',
            [$id, $ownerId]
        );
    }

    public function findBySlug(string $slug): ?array {
        return self::one('SELECT * FROM `' . self::T . '` WHERE slug = ?', [$slug]);
    }

    public function create(array $data): int {
        return self::insert(self::T, $data);
    }

    /**
     * Named updateById/deleteById (not update/delete) to avoid shadowing
     * BaseRepository's static update()/delete() with an incompatible
     * non-static signature — PHP forbids changing staticness when a method
     * name collides with the parent's, which previously made this whole
     * class fatal to even autoload.
     */
    public function updateById(int $id, array $data): bool {
        return self::update(self::T, $data, 'id = :_id', ['_id' => $id]) > 0;
    }

    public function deleteById(int $id): bool {
        return self::delete(self::T, 'id = ?', [$id]) > 0;
    }

    public function publish(int $id): bool {
        return self::update(self::T, ['is_independent' => 0], 'id = :_id', ['_id' => $id]) > 0;
    }

    public function unpublish(int $id): bool {
        return self::update(self::T, ['is_independent' => 1], 'id = :_id', ['_id' => $id]) > 0;
    }

    public function updatePrice(int $id, float $weekly, float $monthly): bool {
        return self::update(self::T, ['ucret_haftalik' => $weekly, 'ucret_aylik' => $monthly], 'id = :_id', ['_id' => $id]) > 0;
    }

    public function getByOwner(int $ownerId): array {
        return self::all(
            'SELECT * FROM `' . self::T . '` WHERE author_user_id = ? ORDER BY id DESC',
            [$ownerId]
        );
    }

    public function countByOwner(int $ownerId): array {
        $row = self::one(
            'SELECT
                SUM(is_independent = 1) AS independent_count,
                SUM(is_independent = 0) AS public_count
             FROM `' . self::T . '` WHERE author_user_id = ?',
            [$ownerId]
        );
        return [
            'independent' => (int) ($row['independent_count'] ?? 0),
            'public'      => (int) ($row['public_count'] ?? 0),
        ];
    }

    public function getSellerStatus(int $userId): ?string {
        $row = self::one(
            'SELECT status FROM param_marketplace_sellers WHERE user_id = ?',
            [$userId]
        );
        return $row ? $row['status'] : null;
    }

    public function getPublished(array $filters = []): array {
        $params = [];
        $where  = ' WHERE c.id > 0 AND c.is_independent = 0';

        if (!empty($filters['search'])) {
            $where   .= ' AND c.isim LIKE ?';
            $params[] = '%' . $filters['search'] . '%';
        }

        return self::all(
            "SELECT c.id, c.kapak_fotografi, c.profil_fotografi, c.kategori_id, c.isim, c.aciklama,
                    c.ucret_haftalik, c.yayimlanma_tarih, 1 AS durum, u.kullanici_adi AS owner_name,
                    COUNT(DISTINCT cc.id) AS toplam_chats, COUNT(DISTINCT cf.id) AS toplam_follows,
                    COUNT(DISTINCT cl.id) AS toplam_lists, COUNT(DISTINCT cli.id) AS toplam_likes,
                    COUNT(DISTINCT cdi.id) AS toplam_dislikes, COUNT(DISTINCT cm.id) AS toplam_comments
             FROM `" . self::T . "` c
             INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
             LEFT JOIN chatbot_follows cf ON cf.chatbot_id = c.id
             LEFT JOIN chatbot_in_list cl ON cl.chatbot_id = c.id
             LEFT JOIN chatbot_likes cli ON cli.chatbot_id = c.id
             LEFT JOIN chatbot_dislikes cdi ON cdi.chatbot_id = c.id
             LEFT JOIN chatbot_comments cm ON cm.chatbot_id = c.id
             LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
             $where GROUP BY c.id ORDER BY c.id DESC",
            $params
        );
    }

    public function getPublishedV2(int $userId, array $filters = []): array {
        $params = [];
        $where  = ' WHERE c.id > 0 AND c.is_independent = 0';

        if ($userId > 0) {
            $where   .= ' AND c.kategori_id NOT IN (SELECT category_id FROM chatbot_uninterested WHERE user_id = ?)';
            $params[] = $userId;
        }
        if (!empty($filters['search'])) {
            $where   .= ' AND c.isim LIKE ?';
            $params[] = '%' . $filters['search'] . '%';
        }

        return self::all(
            "SELECT c.id, c.kapak_fotografi, c.profil_fotografi, c.kategori_id, c.isim, c.aciklama,
                    c.ucret_haftalik, c.yayimlanma_tarih, 1 AS durum, u.kullanici_adi AS owner_name,
                    COUNT(DISTINCT cc.id) AS toplam_chats, COUNT(DISTINCT cf.id) AS toplam_follows,
                    COUNT(DISTINCT cl.id) AS toplam_lists, COUNT(DISTINCT cli.id) AS toplam_likes,
                    COUNT(DISTINCT cdi.id) AS toplam_dislikes
             FROM `" . self::T . "` c
             INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
             LEFT JOIN chatbot_follows cf ON cf.chatbot_id = c.id
             LEFT JOIN chatbot_in_list cl ON cl.chatbot_id = c.id
             LEFT JOIN chatbot_likes cli ON cli.chatbot_id = c.id
             LEFT JOIN chatbot_dislikes cdi ON cdi.chatbot_id = c.id
             LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
             $where GROUP BY c.id ORDER BY c.id DESC",
            $params
        );
    }

    /** Returns bots the user owns or has active subscriptions for. */
    public function getMenuItems(int $userId): array {
        return self::all(
            "SELECT c.id, c.author_user_id, c.owner_user_id, c.is_independent, c.isim,
                    c.kapak_fotografi, c.profil_fotografi, c.kategori_id, c.ucret_haftalik, c.ucret_aylik,
                    COALESCE(pms.status, 'not_started') AS seller_status,
                    (SELECT COUNT(*) FROM chatbot_likes WHERE chatbot_id = c.id) AS likes,
                    (SELECT COUNT(*) FROM chatbot_dislikes WHERE chatbot_id = c.id) AS dislikes,
                    (SELECT COUNT(*) FROM chatbot_follows WHERE chatbot_id = c.id) AS follows
             FROM `" . self::T . "` c
             LEFT JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id
             WHERE c.author_user_id = ?
                OR (c.owner_user_id = ? AND c.author_user_id != ?
                    AND EXISTS (
                        SELECT 1 FROM user_subscriptions us
                        WHERE us.user_id = ? AND us.chatbot_id = c.id
                          AND us.status = 1 AND us.expiry_date > NOW()
                    ))",
            [$userId, $userId, $userId, $userId]
        );
    }

    /**
     * Returns suggested bots in the same categories as the user's cart items.
     * All values are parameterized — fixes the SQL injection in the legacy controller.
     */
    public function getSuggested(int $userId, array $categoryIds, array $excludeIds, int $limit): array {
        if (empty($categoryIds)) return [];

        $catIn  = self::inClause(array_values($categoryIds));
        $exIn   = self::inClause(array_values($excludeIds));
        $safeLimit = max(1, min(50, $limit));

        $sql = "SELECT c.id, c.kapak_fotografi, c.profil_fotografi, c.isim, c.aciklama,
                       c.owner_user_id, u.kullanici_adi AS owner_name, c.ucret_haftalik,
                       COUNT(cc.id) AS toplam_chats
                FROM `" . self::T . "` c
                INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
                LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
                LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
                WHERE c.kategori_id IN ({$catIn['placeholders']})
                  AND c.is_independent = 0";

        $params = $catIn['params'];

        if (!empty($exIn['params'])) {
            $sql   .= " AND c.id NOT IN ({$exIn['placeholders']})";
            $params = array_merge($params, $exIn['params']);
        }

        $sql .= " GROUP BY c.id ORDER BY RAND() LIMIT $safeLimit";

        return self::all($sql, $params);
    }

    public function getDetail(int $id, int $userId): ?array {
        return self::one(
            "SELECT c.id, c.isim, c.is_independent,
                    (SELECT kullanici_adi FROM kullanicilar WHERE id = c.author_user_id) AS author_username,
                    (SELECT kullanici_adi FROM kullanicilar WHERE id = c.owner_user_id)  AS owner_username,
                    c.owner_user_id, c.aciklama, c.kategori_id,
                    c.kapak_fotografi, c.profil_fotografi, c.style_prompt, c.sohbet_basi_mesaj,
                    c.ucret_haftalik, c.ucret_aylik,
                    (SELECT COUNT(*) FROM chatbot_likes   WHERE chatbot_id = c.id) AS likes,
                    (SELECT COUNT(*) FROM chatbot_dislikes WHERE chatbot_id = c.id) AS dislikes,
                    (SELECT COUNT(*) FROM chatbot_follows  WHERE chatbot_id = c.id) AS follows
             FROM `" . self::T . "` c
             LEFT JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             WHERE c.id = ?
               AND ((c.is_independent = 0 AND pms.user_id IS NOT NULL)
                 OR (c.is_independent = 1 AND c.author_user_id = ?))",
            [$id, $userId]
        );
    }

    public function getComments(int $chatbotId): array {
        return self::all(
            "SELECT cc.id, cc.chatbot_id, cc.user_id, cc.comment, cc.commented_at, u.kullanici_adi
             FROM chatbot_comments cc
             JOIN kullanicilar u ON u.id = cc.user_id
             WHERE cc.chatbot_id = ?
             ORDER BY cc.id DESC",
            [$chatbotId]
        );
    }

    public function getCartCategoryIds(int $userId): array {
        return self::all(
            'SELECT uc.chatbot_id, c.kategori_id FROM user_cart uc JOIN `' . self::T . '` c ON uc.chatbot_id = c.id WHERE uc.user_id = ?',
            [$userId]
        );
    }
}
