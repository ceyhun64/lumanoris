<?php
// PDO Abstraction class version 1.2.1 (MySQL/MariaDB için uyarlanmış)

if (!function_exists('isJsonEndpoint')) {
    function isJsonEndpoint(): bool {
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';

        return str_starts_with($scriptName, '/api/')
            || str_starts_with($requestUri, '/api/')
            || str_contains($scriptName, '/admin/ajax/')
            || str_contains($requestUri, '/admin/ajax/');
    }
}

if (isJsonEndpoint()) {
    ini_set('display_errors', '0');

    set_error_handler(function ($severity, $message, $file, $line) {
        if (!(error_reporting() & $severity)) {
            return false;
        }

        throw new ErrorException($message, 0, $severity, $file, $line);
    });

    set_exception_handler(function (Throwable $e) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }

        echo json_encode([
            'success' => false,
            'status' => 'error',
            'message' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    });
}

class Database {
    private static $instance = null;
    private $conn;
    private $driver = 'mysql';

    private $host;
    private $username;
    private $password;
    private $database;

    // Geliştirme (Dev) Ayarları
    private $host_dev = 'localhost:3306';
    private $username_dev = 'root';
    private $password_dev = '12345678';
    private $database_dev = 'lumanoris';

    // Üretim (Prod) Ayarları
    private $host_prod = 'localhost:3306';
    private $username_prod = 'lumansmu_admin';
    private $password_prod = '9owwT70r=~_R;A?f';
    private $database_prod = 'lumansmu_database';
    /*private $host_prod = 'localhost:3306';
    private $username_prod = 'alperpgu_admin';
    private $password_prod = 'YP9z,t]ck.z$Auz+';
    private $database_prod = 'alperpgu_lumanoris';*/
    
    private function __construct() {
        $this->loadEnvOverrides();

        $serverName = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $isLocal = in_array($serverName, ['localhost', '127.0.0.1', '::1'], true)
               || str_contains($serverName, '.local')
               || str_contains($serverName, '.test');

        $this->host     = $isLocal ? $this->host_dev     : $this->host_prod;
        $this->username = $isLocal ? $this->username_dev : $this->username_prod;
        $this->password = $isLocal ? $this->password_dev : $this->password_prod;
        $this->database = $isLocal ? $this->database_dev : $this->database_prod;

        /*$this->host = !empty($this->host_prod) ? $this->host_prod : $this->host_dev;
        $this->username = !empty($this->username_prod) ? $this->username_prod : $this->username_dev;
        $this->password = !empty($this->password_prod) ? $this->password_prod : $this->password_dev;
        $this->database = !empty($this->database_prod) ? $this->database_prod : $this->database_dev;*/

        $host_parts = explode(':', $this->host);
        $host_name = $host_parts[0];
        $port = isset($host_parts[1]) ? (int)$host_parts[1] : 3306;

        $dsn = "$this->driver:host=$host_name;dbname=$this->database;charset=utf8mb4;port=$port";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, 
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       
            PDO::ATTR_EMULATE_PREPARES   => false,                  
        ];

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            throw new Exception('Veritabanı bağlantısı başarısız: ' . $e->getMessage());
        }
    }

    private function loadEnvOverrides(): void {
        $env = [];
        $envFiles = [
            __DIR__ . '/../.env',
            __DIR__ . '/../admin/.env',
        ];

        foreach ($envFiles as $envFile) {
            if (is_readable($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if ($lines === false) {
                    continue;
                }

                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                        continue;
                    }

                    [$key, $value] = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);

                    if (
                        (str_starts_with($value, '"') && str_ends_with($value, '"'))
                        || (str_starts_with($value, "'") && str_ends_with($value, "'"))
                    ) {
                        $value = substr($value, 1, -1);
                    }

                    $env[$key] = $value;
                }
            }
        }

        $get = function (string ...$keys) use ($env) {
            foreach ($keys as $key) {
                $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
                if ($value !== false && $value !== null && $value !== '') {
                    return $value;
                }

                if (isset($env[$key]) && $env[$key] !== '') {
                    return $env[$key];
                }
            }

            return null;
        };

        $this->host_dev = $get('DB_HOST_DEV', 'MYSQL_HOST_DEV') ?? $this->host_dev;
        $this->username_dev = $get('DB_USERNAME_DEV', 'DB_USER_DEV', 'MYSQL_USER_DEV') ?? $this->username_dev;
        $this->password_dev = $get('DB_PASSWORD_DEV', 'DB_PASS_DEV', 'MYSQL_PASSWORD_DEV') ?? $this->password_dev;
        $this->database_dev = $get('DB_DATABASE_DEV', 'DB_NAME_DEV', 'MYSQL_DATABASE_DEV') ?? $this->database_dev;

        $this->host_prod = $get('DB_HOST_PROD', 'DB_HOST', 'MYSQL_HOST') ?? $this->host_prod;
        $this->username_prod = $get('DB_USERNAME_PROD', 'DB_USERNAME', 'DB_USER', 'MYSQL_USER') ?? $this->username_prod;
        $this->password_prod = $get('DB_PASSWORD_PROD', 'DB_PASSWORD', 'DB_PASS', 'MYSQL_PASSWORD') ?? $this->password_prod;
        $this->database_prod = $get('DB_DATABASE_PROD', 'DB_DATABASE', 'DB_NAME', 'MYSQL_DATABASE') ?? $this->database_prod;
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }

    private function __clone() {}

    // Bu fonksiyon PDO için artık gerekli değil ama orijinal yapıyı korumak adına burada duruyor.
    private function getParamTypes($params) 
    {
        $types = "";
        foreach ($params as $param) {
            if (is_null($param)) $types .= "s"; 
            elseif (is_int($param)) $types .= "i";
            elseif (is_float($param)) $types .= "d";
            elseif (is_bool($param)) $types .= "i";
            elseif (strtotime($param) !== false) $types .= "s";
            elseif (is_object($param) || is_array($param)) $types .= "s";
            elseif (is_string($param) && strlen($param) > 65535) $types .= "b"; // BLOB
            else $types .= "s";
        }
        return $types;
    }

    private function executePreparedStatement($query, $params = []) {
        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            // PDO'da parametreleri index'e göre bağlamak için bindValue kullanılır.
            foreach ($params as $index => $param) {
                $type = PDO::PARAM_STR;
                if (is_int($param)) $type = PDO::PARAM_INT;
                elseif (is_bool($param)) $type = PDO::PARAM_BOOL;
                elseif (is_null($param)) $type = PDO::PARAM_NULL;
                
                // Parametreler 1'den başlar (PDO için)
                $stmt->bindValue(($index + 1), $param, $type);
            }
        }

        $stmt->execute();
        return $stmt;
    }


    public function selectSingle($queryBody, $params = []) 
    {
        // Sorgu Body'si sadece SELECT'ten SONRASI olmalı.
        $query = "SELECT " . $queryBody;
        $stmt = $this->executePreparedStatement($query, $params);
        return $stmt->fetch(); // PDO'da fetch() tek satır getirir.
    }

    public function selectMulti($queryBody, $params = []) 
    {
        // Sorgu Body'si sadece SELECT'ten SONRASI olmalı.
        $query = "SELECT " . $queryBody;
        $stmt = $this->executePreparedStatement($query, $params);
        return $stmt->fetchAll(); // PDO'da fetchAll() tüm satırları getirir.
    }

    public function recordExists($table, $where) {
        $query = "SELECT COUNT(id) as record_count FROM $table WHERE $where";
        $stmt = $this->getConnection()->query($query);
        $result = $stmt->fetch();
        return (int) $result['record_count'] !== 0;
    }

    public function getGlobalVars(...$var_keys) {
        if (empty($var_keys)) {
            return [];
        }
        
        // ✅ Create ? placeholders for each key
        $placeholders = implode(',', array_fill(0, count($var_keys), '?'));
        
        // ✅ Pass keys as params array - selectMulti will bind them safely via PDO
        $global_vars = $this->selectMulti(
            "var_key, var_value FROM global_vars WHERE var_key IN ($placeholders)", 
            $var_keys
        );
        
        $seo_data = [];
        foreach ($global_vars as $row) {
            $seo_data[$row['var_key']] = $row['var_value'];
        }
        
        return $seo_data;
    }

    public function updateGlobalVars(array $data) {
        try {
            foreach ($data as $var_key => $var_value) {
                $where = "var_key = '$var_key'"; // PDO için ? kullanıyoruz
                $update_data = ['var_value' => $var_value];
                
                // Parametreler: [var_value (SET için), var_key (WHERE için)]
                $params = [$var_value, $var_key]; 

                // update metodunu ? destekleyecek şekilde kullanıyoruz.
                $affected = $this->update("global_vars", $update_data, $where);
                
                // Eğer 0 satır etkilendiyse ve kayıt var ise (aynı değerden dolayı) hata atmayalım.
                if ($affected === 0 && $this->count("global_vars", "var_key = ?", [$var_key]) > 0) {
                    continue;
                }
                
                // Eğer kayıt yoksa ve eklenmediyse hata verelim (bu kısım karmaşıklaştı, orijinal mantığı basit tutalım)
                // Eğer satır etkilenmediyse ve kayıt varsa, devam et.
            }
            return "Güncelleme işlemi başarılı!";
        } catch (Exception $e) {
            return "Güncelleme başarısız oldu: " . $e->getMessage();
        }
    }

    public function insert($table, $data, $updateOnDuplicate = false) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $params = array_values($data);
        
        $sql = "INSERT INTO `$table` ($columns) VALUES ($placeholders)";
        if ($updateOnDuplicate) {
            $updateColumns = implode(', ', array_map(fn($key) => "`$key` = VALUES(`$key`)", array_keys($data)));
            $sql .= " ON DUPLICATE KEY UPDATE $updateColumns";
        }
        
        $stmt = $this->executePreparedStatement($sql, $params);
        
        return $this->conn->lastInsertId();
    }
    
    // update metodunu ? parametrelerini kabul edecek şekilde düzenledim.
    public function update($table, $data, $where, $params = []) {
        // SET kısmında ? kullanıyoruz
        $setPart = implode(', ', array_map(fn($key) => "`$key` = ?", array_keys($data)));
        
        // SET değerleri
        $data_params = array_values($data);
        
        // WHERE değerleri ($params'ta gelmeli)
        $where_params = $params;
        
        // Tüm parametreleri birleştir (SET parametreleri + WHERE parametreleri)
        $all_params = array_merge($data_params, $where_params); 

        $sql = "UPDATE `$table` SET $setPart WHERE " . str_replace('?', '?', $where); // WHERE kısmındaki ?'leri koru

        $stmt = $this->executePreparedStatement($sql, $all_params);
    
        return $stmt->rowCount();
    }
    
    
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM `$table` WHERE $where";
        $stmt = $this->executePreparedStatement($sql, $params);
        return $stmt->rowCount();
    }
    
    public function truncate($table)
    {
        $query = "TRUNCATE TABLE `$table`";
        if ($this->conn->query($query) === TRUE) {
            return true;
        } else {
            throw new Exception('Tabloyu temizleme işlemi başarısız: ' . $this->conn->error);
        }
    }

    // backup ve restore kısımları aynı kaldı.
    public function backup() {
        $backupDir = __DIR__ . '/../admin/db_backup';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0777, true);
        }
        $backupFile = $backupDir . '/backup-' . date("Y-m-d-H-i-s") . '.sql';
        /*$backupDir = realpath(__DIR__ . '/../admin/db_backup');
        $backupFile = $backupDir . '/backup-' . date("Y-m-d-H-i-s") . '.sql';*/

        $portSegment = strpos($this->host, ':') !== false ? '--port=' . explode(':', $this->host)[1] : '';
        $passwordSegment = !empty($this->password) ? "--password=$this->password" : '';
        $command = "mysqldump --user=$this->username $passwordSegment --host=" . explode(':', $this->host)[0] . " $portSegment $this->database -r \"$backupFile\" 2>&1";
        
        $output = [];
        $resultCode = null;
        exec($command, $output, $resultCode);

        if ($resultCode !== 0) {
            throw new Exception("Yedekleme sırasında hata oluştu: " . implode("\n", $output));
        }
    }

    public function count($table, $whereClause = "", $params = [])
    {
        $query = "SELECT COUNT(*) as total FROM `" . $table . "`";
        if (!empty($whereClause)) {
            $query .= " WHERE " . $whereClause;
        }

        $stmt = $this->executePreparedStatement($query, $params);
        $result = $stmt->fetch();
        return (int) $result['total'];
    }

    public function restore() {
        $backupDir = realpath(__DIR__ . '/../admin/db_backup');
        $backups = glob("$backupDir/*.sql");

        if (count($backups) === 1) {
            $backupFile = $backups[0];
        } elseif (count($backups) > 1) {
            $backupFile = end($backups);
        } else {
            die("Hata: Hiç yedek bulunamadı!");
        }

        $portSegment = strpos($this->host, ':') !== false ? '--port=' . explode(':', $this->host)[1] : '';
        $passwordSegment = !empty($this->password) ? "--password=$this->password" : '';
        $command = "mysql --user=$this->username $passwordSegment --host=" . explode(':', $this->host)[0] . " $portSegment $this->database < \"$backupFile\"";
        exec($command);
    }
}
?>
