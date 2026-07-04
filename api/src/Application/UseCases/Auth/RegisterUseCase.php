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

        if ($this->users->existsByUsernameOrEmail($username, $email)) {
            throw new DuplicateException('Bu kullanıcı adı veya e-posta zaten kayıtlı!');
        }

        // Hash before insert — never store plain text
        $data['sifre']        = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $data['kullanici_adi'] = $username;
        $data['eposta']       = $email;

        $userId = $this->users->create($data);
        $this->users->addEmailRecord($userId, $email);

        // Auto-follow the platform assistant on new account creation
        $defaultBotId = $this->users->getDefaultFollowBotId();
        if ($defaultBotId) {
            $this->users->addDefaultFollow($userId, $defaultBotId);
        }

        return $userId;
    }
}
