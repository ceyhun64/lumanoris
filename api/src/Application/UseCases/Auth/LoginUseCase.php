<?php
class LoginUseCase {
    public function __construct(private UserRepository $users) {}

    /**
     * @param string $identifier  username or email
     * @param string $password    raw password
     * @param bool   $rememberMe
     * @return array{user_id:int, email:string, selector?:string, validator?:string, expiry?:string}
     * @throws ValidationException
     * @throws AuthException
     */
    public function execute(string $identifier, string $password, bool $rememberMe): array {
        if ($identifier === '' || $password === '') {
            throw new ValidationException('Kullanıcı adı/e-posta ve şifre zorunludur.');
        }

        // Previously "Kullanıcı bulunamadı!" (unknown identifier) vs "Şifre
        // hatalı!" (wrong password) were distinguishable by message and
        // status code (404 vs 401) — that difference lets an attacker
        // enumerate which emails/usernames have accounts. Both cases now
        // return the same message and status so a login attempt can't
        // reveal whether the identifier itself exists.
        $user = $this->users->findByUsernameOrEmail($identifier);
        if (!$user || !password_verify($password, $user['sifre'])) {
            throw new AuthException('Kullanıcı adı/e-posta veya şifre hatalı!');
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
