<?php
class GoogleLoginUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * Finds or creates a user by Google account.
     * @return int  user ID
     * @throws AuthException
     */
    public function execute(string $googleId, string $email, string $name): int {
        $user = $this->users->findByGoogleId($googleId, $email);

        if (!$user || (int) ($user['id'] ?? 0) === 0) {
            // COMP-002 AÇIK KALAN YARIM — yaş kapısı bu yolda YOK.
            //
            // `RegisterUseCase` artık AppConfig::MIN_REGISTRATION_AGE'i
            // uyguluyor, ama Google ile ilk girişte hesap burada açılıyor ve
            // `dogum_tarihi` NULL kalıyor: Google ID token'ı doğum tarihi
            // taşımıyor (`birthday` yalnızca People API'den, ayrı bir izinle
            // gelir). Yani parola ile kayıt 18 yaş kapısından geçiyor, Google
            // ile kayıt geçmiyor — kapı yarım.
            //
            // Burada varsayılan bir tarih UYDURULMADI: uydurulan her değer
            // kapıyı anlamsızlaştırır ve "yaş doğrulaması yapılıyor" beyanını
            // yanlış hale getirir. Doğru çözüm, `dogum_tarihi` NULL olan
            // kullanıcıyı ilk girişte tarih soran bir adıma zorlamak; bu
            // oturum akışını değiştirdiği için ayrı bir iş olarak
            // AUDIT.md COMP-002'de duruyor.
            // H-03 — bu yolda `kullanici_adi` HİÇ yazılmıyordu ve hiçbir yerde
            // sonradan da doldurulmuyordu. Sonuç: Google ile açılan hesap
            // profilinde, yorumlarda, "Paylaştıklarım" akışında ve satıcı
            // sayfasında adsız görünüyordu (`kullanici_adi` NULL), üstelik
            // `findByUsernameOrEmail()` üzerinden kullanıcı adıyla giriş de
            // hiç mümkün olmuyordu. E-postanın yerel kısmından türetiliyor,
            // çakışmada sayaçla ayrılıyor.
            $userId = $this->createGoogleUser($googleId, $email, $name);

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

    /**
     * H-02 — klasik check-then-create yarışı.
     *
     * `findByGoogleId()` ile bakılıp sonra `create()` çağrılıyordu; ikisi ayrı
     * gidiş-dönüş ve arada duplicate yakalaması yoktu. Google'ın "Continue"
     * düğmesine çift tıklamak ya da iki sekmede aynı anda giriş yapmak iki
     * eşzamanlı isteğe dönüşüyor, ikisi de "kullanıcı yok" görüyor ve ikincisi
     * `eposta` UNIQUE kısıtına çarparak yakalanmamış bir PDOException, yani
     * boş gövdeli 500 üretiyordu — kullanıcı için "Google ile giriş çalışmıyor".
     *
     * `RegisterUseCase:86-93`'teki desenin aynısı: duplicate yakalanınca satır
     * yeniden okunup o kullanıcıyla devam ediliyor.
     */
    private function createGoogleUser(string $googleId, string $email, string $name): int {
        try {
            $userId = $this->users->create([
                'google_id'     => $googleId,
                'eposta'        => $email,
                'ad_soyad'      => $name,
                'kullanici_adi' => $this->deriveUsername($email),
            ]);
        } catch (Exception $e) {
            if (!str_contains($e->getMessage(), 'Duplicate entry')) {
                throw $e;
            }
            // Yarışı kaybettik: satır bu arada başka bir istek tarafından
            // yazıldı. Onu okuyup aynı hesapla devam ediyoruz.
            $existing = $this->users->findByGoogleId($googleId, $email);
            if (!$existing || (int) ($existing['id'] ?? 0) === 0) {
                throw new AuthException('Google ile giriş tamamlanamadı, lütfen tekrar deneyin.');
            }
            return (int) $existing['id'];
        }

        // İki yolu eşitliyoruz: parola ile kayıt `user_emails`'a da yazıyor
        // (RegisterUseCase:94), Google yolu yazmıyordu.
        try {
            $this->users->addEmailRecord($userId, $email);
        } catch (Exception $e) {
            // İkincil kayıt; hesabın açılmasını engellememeli.
            error_log('[googlelogin] user_emails yazılamadı: ' . $e->getMessage());
        }

        return $userId;
    }

    /**
     * H-03: e-postanın yerel kısmından bir `kullanici_adi` türetir.
     * Çakışırsa sayaç ekler; makul bir denemeden sonra rastgele son ek.
     */
    private function deriveUsername(string $email): string {
        // Sütun varchar(30); taban 20'ye kırpılıyor ki sayaç/rastgele son ek
        // her durumda sığsın.
        $base = strtolower((string) strstr($email, '@', true));
        $base = preg_replace('/[^a-z0-9_]+/', '', $base) ?? '';
        $base = substr($base, 0, 20);
        if ($base === '' || ctype_digit($base)) {
            $base = substr('kullanici' . $base, 0, 20);
        }

        if (!$this->users->existsByUsername($base)) {
            return $base;
        }
        for ($i = 1; $i <= 20; $i++) {
            $candidate = $base . $i;
            if (!$this->users->existsByUsername($candidate)) {
                return $candidate;
            }
        }
        return $base . '_' . bin2hex(random_bytes(3));
    }
}
