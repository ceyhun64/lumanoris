<?php
class LoginUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * @param string $identifier  username or email
     * @param string $password    raw password
     * @param bool   $rememberMe
     * @return array{user_id:int, email:string, selector?:string, validator?:string, expiry?:string}
     * @throws ValidationException
     * @throws NotFoundException
     * @throws AuthException
     */
    public function execute(string $identifier, string $password, bool $rememberMe): array {
        if ($identifier === '' || $password === '') {
            throw new ValidationException('Kullanıcı adı/e-posta ve şifre zorunludur.');
        }

        $user = $this->users->findByUsernameOrEmail($identifier);
        if (!$user) {
            throw new NotFoundException('Kullanıcı bulunamadı!');
        }

        if (!password_verify($password, $user['sifre'])) {
            throw new AuthException('Şifre hatalı!');
        }

        $result = ['user_id' => (int) $user['id'], 'email' => $user['eposta']];

        if ($rememberMe) {
            $selector        = InputSanitizer::randomToken(6);
            $validator       = InputSanitizer::randomToken(32);
            $hashedValidator = hash('sha256', $validator);
            $expiry          = date('Y-m-d H:i:s', time() + 86400 * AppConfig::REMEMBER_ME_DAYS);

            $this->users->setRememberToken((int) $user['id'], $selector, $hashedValidator, $expiry);

            $result['remember_selector'] = $selector;
            $result['remember_validator'] = $validator;
            $result['remember_expiry']   = time() + 86400 * AppConfig::REMEMBER_ME_DAYS;
        }

        return $result;
    }
}
