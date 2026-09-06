<?php
class RegisterUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * @return int  new user ID
     * @throws ValidationException
     * @throws DuplicateException
     */
    public function execute(array $data): int {
        $username = InputSanitizer::string($data['kullanici_adi'] ?? '', 30);
        $email    = InputSanitizer::email($data['eposta'] ?? '');
        $password = $data['sifre'] ?? '';

        if ($username === '' || $email === '' || $password === '') {
            throw new ValidationException('Kullanıcı adı, e-posta ve şifre zorunludur.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('Geçerli bir e-posta adresi girin.');
        }
        // SEC-011 🟡 — politika tek yerde ve kayıt + sıfırlama yollarının
        // İKİSİNDE de uygulanıyor. Eskiden yalnızca burada, yalnızca 8
        // karakter olarak vardı; sıfırlama akışında hiç yoktu.
        $policyError = InputSanitizer::passwordPolicyError($password, [$email, $username]);
        if ($policyError !== null) {
            throw new ValidationException($policyError);
        }

        // COMP-002 — yaş kapısı.
        //
        // `dogum_tarihi` kayıt formunda toplanıyordu ama SUNUCUDA hiç
        // doğrulanmıyordu: zorunluluğu yalnızca `login/page.jsx` içindeki bir
        // `if` sağlıyordu, `register.php`ye doğrudan POST atan biri alanı hiç
        // göndermeden ya da "1900-01-01" göndererek geçebiliyordu. Gizlilik
        // politikası bu alanın "yaş doğrulaması için" toplandığını yazdığı
        // hâlde ortada doğrulama yoktu.
        //
        // ValidationException fırlatıyor; mesajı kullanıcıya doğrudan gidiyor.
        $birthDate = InputSanitizer::birthDate(
            $data['dogum_tarihi'] ?? '',
            AppConfig::MIN_REGISTRATION_AGE
        );

        if ($this->users->existsByUsernameOrEmail($username, $email)) {
            throw new DuplicateException('Bu kullanıcı adı veya e-posta zaten kayıtlı!');
        }

        // SEC-014 — kütle atama (mass assignment) kapatıldı.
        //
        // Buradan çıkan dizi doğrudan `UserRepository::create()` → `insert()`
        // içine giriyor, yani `$data`nın HER anahtarı `kullanicilar` tablosuna
        // yazılmaya çalışılıyordu. İstemci `google_id` göndererek hesabını bir
        // Google kimliğine bağlayabiliyor, `avatar` (longtext) alanına
        // sınırsız veri basabiliyordu — üstelik tabloya ileride bir yetki ya
        // da bakiye sütunu eklendiği gün bu doğrudan yetki yükseltmeye
        // dönüşürdü. Artık yalnızca kayıt akışının gerçekten yazması gereken
        // sütunlar geçiyor; gerisi sessizce düşüyor.
        $row = [
            'kullanici_adi' => $username,
            'eposta'        => $email,
            // Hash before insert — never store plain text
            'sifre'         => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            'dogum_tarihi'  => $birthDate,
        ];

        // Kayıt formunun gönderdiği tek isteğe bağlı alan telefon
        // (`login/page.jsx` → registerData). Sütun varchar(15); form
        // "0555 555 55 55" biçiminde boşluklu gönderiyor, bu da 15 karaktere
        // sığıyor ama sınırı aşan bir girdi INSERT'te sessiz kırpılmasın diye
        // burada da kesiliyor.
        $phone = InputSanitizer::string($data['telefon'] ?? '', 15);
        if ($phone !== '') {
            $row['telefon'] = $phone;
        }

        $data = $row;

        // The existsByUsernameOrEmail() check above and this insert are two
        // separate round-trips — two concurrent registrations with the same
        // email can both pass the check before either commits. The DB's
        // real UNIQUE constraint on eposta/kullanici_adi (verified via
        // information_schema) stops a duplicate row from ever being
        // created, but without this catch the second insert's constraint
        // violation surfaced as an uncaught PDOException (raw 500) instead
        // of the same friendly 409 the pre-check above already gives.
        try {
            $userId = $this->users->create($data);
        } catch (Exception $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                throw new DuplicateException('Bu kullanıcı adı veya e-posta zaten kayıtlı!');
            }
            throw $e;
        }
        $this->users->addEmailRecord($userId, $email);

        // Auto-follow the platform assistant on new account creation
        $defaultBotId = $this->users->getDefaultFollowBotId();
        if ($defaultBotId) {
            $this->users->addDefaultFollow($userId, $defaultBotId);
        }

        return $userId;
    }
}
