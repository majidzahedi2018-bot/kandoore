<?php
// تنظیم هدرهای CORS برای دسترسی بدون محدودیت اپلیکیشن موبایل و وب
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Tehran');
// جلوگیری از چاپ Warningهای PHP به‌صورت HTML که JSON را خراب می‌کند
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
// پاسخ سریع به درخواست‌های OPTIONS مرورگر و موبایل

// پاسخ سریع به درخواست‌های OPTIONS مرورگر و موبایل
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host     = 'localhost';
$db_name  = 'arka36_kandooreh_db';
$db_user  = 'arka36_kandooreh_db';
$db_pass  = 'Majidzahedi1@';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
]);
// همگام‌سازی ساعت MySQL با زمان تهران تا همه timestampها تهران باشند
$pdo->exec("SET time_zone = '+03:30'");
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'خطا در اتصال به دیتابیس: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// تابع کمکی برای دریافت داده‌های JSON ارسالی از سمت اپلیکیشن
function getJsonInput() {
$input = file_get_contents('php://input');
return json_decode($input, true) ?? [];
}
// ─── امنیت مرحله ۳: زیرساخت توکن جلسه ───
try {
$pdo->exec("CREATE TABLE IF NOT EXISTS user_tokens (
id INT NOT NULL AUTO_INCREMENT,
user_id INT NOT NULL,
token VARCHAR(64) NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
expires_at TIMESTAMP NULL DEFAULT NULL,
PRIMARY KEY (id),
UNIQUE KEY uniq_token (token),
KEY idx_token_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {}
// حالت سخت‌گیر: true یعنی بدون توکن = بدون هویت؛ فعلاً false (جابجایی نرم)
define('ENFORCE_TOKEN', true);
function issueUserToken($pdo, $userId) {
$token = bin2hex(random_bytes(32));
$stmt = $pdo->prepare("INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))");
$stmt->execute([(int)$userId, $token]);
return $token;
}
function bearerToken() {
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($header === '' && function_exists('getallheaders')) {
foreach (getallheaders() as $k => $v) { if (strtolower($k) === 'authorization') { $header = $v; break; } }
}
if ($header && preg_match('/^Bearer\s+([A-Za-z0-9]+)$/', $header, $m)) return $m[1];
return null;
}
function authUserId($pdo) {
$token = bearerToken();
if ($token === null) return null;
$stmt = $pdo->prepare("SELECT user_id FROM user_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1");
$stmt->execute([$token]);
$row = $stmt->fetch();
return $row ? (int)$row['user_id'] : null;
}
// شناسه نهایی کاربر: توکن معتبر بر ادعای کلاینت اولویت دارد
function resolveUserId($pdo, $clientUserId) {
$tid = authUserId($pdo);
if ($tid !== null) return $tid;
if (ENFORCE_TOKEN) return null;
return (int)$clientUserId;
}