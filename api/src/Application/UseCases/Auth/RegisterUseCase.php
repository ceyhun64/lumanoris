<?php
class RegisterUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * @return int  new user ID
     * @throws ValidationException
     * @throws DuplicateException
     */
    public function execute(array $data): int {
        $username = InputSanitizer::string($data['kullanici_adi'] ?? '', 60);
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

        if ($this->users->existsByUsernameOrEmail($username, $email)) {
            throw new DuplicateException('Bu kullanıcı adı veya e-posta zaten kayıtlı!');
        }

        // Hash before insert — never store plain text
        $data['sifre']        = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $data['kullanici_adi'] = $username;
        $data['eposta']       = $email;

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
