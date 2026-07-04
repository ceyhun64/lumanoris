<?php
// PDO Abstraction class version 1.2.0 (MySQL/MariaDB için uyarlanmış)
class Database {
    private static $instance = null;
    private $conn;
    private $driver = 'mysql';

    private $host;
    private $username;
    private $password;
    private $database;

    // Geliştirme (Dev) Ayarları
    private $host_dev = 'localhost:3307';
    private $username_dev = 'root';
    private $password_dev = '';
    private $database_dev = 'lumanoris';

    // Üretim (Prod) Ayarları
    private $host_prod = '';
    private $username_prod = '';
    private $password_prod = '';
    private $database_prod = '';
    
    private function __construct() {
        $this->host = !empty($this->host_prod) ? $this->host_prod : $this->host_dev;
        $this->username = !empty($this->username_prod) ? $this->username_prod : $this->username_dev;
        $this->password = !empty($this->password_prod) ? $this->password_prod : $this->password_dev;
        $this->database = !empty($this->database_prod) ? $this->database_prod : $this->database_dev;

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

    /**
     * @deprecated Use BaseRepository::exists() in new code.
     * Kept for legacy admin scripts only.
     * WARNING: $where must be a trusted internal string — never use user input here.
     */
    public function recordExists($table, $where, $params = []) {
        $query = "SELECT COUNT(*) as record_count FROM `$table` WHERE $where";
        $stmt  = $this->executePreparedStatement($query, $params);
        $result = $stmt->fetch();
        return (int) $result['record_count'] !== 0;
    }

    public function getGlobalVars(...$var_keys) {
        if (empty($var_keys)) {
            return [];
        }

        // Parameterized IN clause — no string interpolation of key names.
        $placeholders = implode(', ', array_fill(0, count($var_keys), '?'));
        $global_vars  = $this->selectMulti("var_key, var_value FROM global_vars WHERE var_key IN ($placeholders)", array_values($var_keys));

        $seo_data = [];
        foreach ($global_vars as $row) {
            $seo_data[$row['var_key']] = $row['var_value'];
        }

        return $seo_data;
    }

    public function updateGlobalVars(array $data) {
        try {
            foreach ($data as $var_key => $var_value) {
                $affected = $this->update("global_vars", ['var_value' => $var_value], 'var_key = ?', [$var_key]);
                if ($affected === 0 && $this->count("global_vars", "var_key = ?", [$var_key]) > 0) {
                    continue;
                }
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
        $sql = "DELETE FROM `$table` WHERE " . str_replace('?', '?', $where);
    
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
        $backupDir = realpath(__DIR__ . '/../admin/db_backup');
        $backupFile = $backupDir . '/backup-' . date("Y-m-d-H-i-s") . '.sql';

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