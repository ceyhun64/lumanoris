<?php
/**
 * Abstract base for all Infrastructure repository implementations.
 * Provides typed PDO wrappers — no raw SQL strings in controllers/use-cases.
 *
 * All user-supplied values MUST be passed as $params (parameterized queries).
 * Table names come only from AppConfig constants, never from user input.
 */
abstract class BaseRepository {
    protected static function db(): Database {
        return Database::getInstance();
    }

    protected static function pdo(): PDO {
        return self::db()->getConnection();
    }

    /** Returns first matching row or null. */
    protected static function one(string $sql, array $params = []): ?array {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row !== false ? $row : null;
    }

    /** Returns all matching rows. */
    protected static function all(string $sql, array $params = []): array {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Returns a single scalar value (first column of first row). */
    protected static function scalar(string $sql, array $params = []): mixed {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn();
    }

    /** Inserts a row and returns the new auto-increment ID. */
    protected static function insert(string $table, array $data): int {
        $cols        = array_keys($data);
        $placeholders = implode(', ', array_map(fn($c) => ":$c", $cols));
        $colList     = implode(', ', $cols);
        $sql         = "INSERT INTO `$table` ($colList) VALUES ($placeholders)";
        $stmt        = self::pdo()->prepare($sql);
        $stmt->execute($data);
        return (int) self::pdo()->lastInsertId();
    }

    /**
     * Updates rows and returns the number of affected rows.
     * $where is a raw SQL fragment (e.g. "id = :id AND user_id = :uid").
     * Merge $data + $whereParams when calling:
     *   self::update('table', ['name' => 'x'], 'id = :id', ['id' => 5])
     */
    protected static function update(string $table, array $data, string $where, array $whereParams = []): int {
        $setParts = implode(', ', array_map(fn($c) => "`$c` = :$c", array_keys($data)));
        $sql      = "UPDATE `$table` SET $setParts WHERE $where";
        $stmt     = self::pdo()->prepare($sql);
        $stmt->execute(array_merge($data, $whereParams));
        return $stmt->rowCount();
    }

    /** Deletes rows matching $where. $where is a parameterized SQL fragment. */
    protected static function delete(string $table, string $where, array $params = []): int {
        $stmt = self::pdo()->prepare("DELETE FROM `$table` WHERE $where");
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /** Counts rows, optionally with a WHERE clause. */
    protected static function count(string $table, string $where = '', array $params = []): int {
        $sql = "SELECT COUNT(*) FROM `$table`" . ($where !== '' ? " WHERE $where" : '');
        return (int) self::scalar($sql, $params);
    }

    /** Checks existence. */
    protected static function exists(string $table, string $where, array $params = []): bool {
        return self::count($table, $where, $params) > 0;
    }

    /**
     * Safe IN-clause builder.
     * Returns ['placeholders' => '?,?,?', 'params' => [...]] for use in queries.
     * Never interpolate user arrays directly into SQL.
     */
    protected static function inClause(array $values): array {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));
        return ['placeholders' => $placeholders, 'params' => array_values($values)];
    }
}
