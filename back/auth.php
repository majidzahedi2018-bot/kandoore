<?php
// مسیر فایل در هاست: api/auth.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Tehran');

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/sms_helper.php';

// یکسان‌سازی ارقام فارسی و عربی به انگلیسی
function sanitizeDigits($input) {
    $persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    $arabic  = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    $english = ['0','1','2','3','4','5','6','7','8','9'];
    
    $clean = str_replace($persian, $english, (string)$input);
    $clean = str_replace($arabic, $english, $clean);
    return preg_replace('/[^0-9]/', '', $clean);
}
// ─── جدول گزارش فعالیت ورود/خروج (تحلیل ادمین) ───
try {
$pdo->exec("CREATE TABLE IF NOT EXISTS user_activity_log (
id INT NOT NULL AUTO_INCREMENT,
user_id INT NOT NULL,
role VARCHAR(20) NOT NULL DEFAULT 'customer',
event_type VARCHAR(20) NOT NULL DEFAULT 'login',
ip VARCHAR(45) DEFAULT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY idx_activity_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {}
function logUserActivity($pdo, $userId, $role, $eventType) {
try {
$ip = $_SERVER['REMOTE_ADDR'] ?? null;
$stmt = $pdo->prepare("INSERT INTO user_activity_log (user_id, role, event_type, ip) VALUES (?, ?, ?, ?)");
$stmt->execute([(int)$userId, $role, $eventType, $ip]);
} catch (Exception $e) {}
}
$data = getJsonInput();
// ─── معماری توکن: ساخت خودکار جدول توکن‌های جلسه ───
try {
$pdo->exec("CREATE TABLE IF NOT EXISTS user_tokens (
id INT NOT NULL AUTO_INCREMENT,
user_id INT NOT NULL,
token VARCHAR(64) NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
last_used_at TIMESTAMP NULL DEFAULT NULL,
expires_at TIMESTAMP NULL DEFAULT NULL,
PRIMARY KEY (id),
UNIQUE KEY uniq_token (token),
KEY idx_token_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {}
// تابع issueUserToken فقط یک‌بار در config/db.php تعریف شده است (جلوگیری از خطای redeclare)
// تابع اعتبارسنجی توکن → شناسه کاربر یا null
function validateUserToken($pdo) {
$header = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
if ($header === '') return null;
$stmt = $pdo->prepare("SELECT user_id FROM user_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1");
$stmt->execute([$header]);
$row = $stmt->fetch();
if (!$row) return null;
$pdo->prepare("UPDATE user_tokens SET last_used_at = NOW() WHERE token = ?")->execute([$header]);
return (int)$row['user_id'];
}
$data = getJsonInput();
$action = $data['action'] ?? $_GET['action'] ?? '';

/* ─────────────────────────────────────────────────────────────
   ۱. ارسال کد تایید پیامکی (send_otp)
   ───────────────────────────────────────────────────────────── */
if ($action === 'send_otp') {
    $rawPhone = $data['phone'] ?? '';
    $phone = sanitizeDigits($rawPhone);

    if (empty($phone) || strlen($phone) !== 11 || !str_starts_with($phone, '09')) {
        echo json_encode(['success' => false, 'message' => 'شماره موبایل وارد شده معتبر نیست.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $code = (string)rand(1000, 9999);
    // ذخیره زمان انقضا دقیقاً بر اساس تایم‌استمپ فعلی PHP (۵ دقیقه اعتبار)
    $expiresAt = date('Y-m-d H:i:s', time() + (5 * 60));

    // حذف کدهای قبلی این شماره
    $stmt = $pdo->prepare("DELETE FROM otp_codes WHERE phone = ?");
    $stmt->execute([$phone]);

    // ثبت کد جدید
    $stmt = $pdo->prepare("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$phone, $code, $expiresAt]);

    // ارسال پیامک با وب‌سرویس SMS.ir
    sendOtpSms($phone, $code);

    echo json_encode([
'success' => true,
'message' => 'کد تأیید به شماره شما پیامک شد.'
], JSON_UNESCAPED_UNICODE);
    exit();
}

/* ─────────────────────────────────────────────────────────────
۱٫۵. بررسی ثبت‌نام‌بودن شماره (check_phone) — ویژه فرم ثبت‌نام
───────────────────────────────────────────────────────────── */
if ($action === 'check_phone') {
$phone = sanitizeDigits($data['phone'] ?? '');
if (empty($phone)) {
echo json_encode(['success' => false, 'message' => 'شماره موبایل الزامی است.'], JSON_UNESCAPED_UNICODE);
exit();
}
$stmt = $pdo->prepare("SELECT role, password FROM users WHERE username = ?");
$stmt->execute([$phone]);
$rows = $stmt->fetchAll();
$accounts = [];
foreach ($rows as $r) {
$accounts[] = ['role' => $r['role'], 'hasPassword' => !empty($r['password'])];
}
echo json_encode([
'success'    => true,
'registered' => count($accounts) > 0,
'accounts'   => $accounts,
], JSON_UNESCAPED_UNICODE);
exit();
}
/* ─────────────────────────────────────────────────────────────
۱٫۷. ورود با نام کاربری و رمز عبور (login) — جایگزین امن وقتی پیامک کار نمی‌کند
───────────────────────────────────────────────────────────── */
if ($action === 'login') {
$username = sanitizeDigits($data['username'] ?? '');
$password = (string)($data['password'] ?? '');
$roleIntent = $data['role_intent'] ?? 'customer';
if (empty($username) || empty($password)) {
echo json_encode(['success' => false, 'message' => 'نام کاربری و رمز عبور الزامی هستند.'], JSON_UNESCAPED_UNICODE);
exit();
}
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = ? LIMIT 1");
$stmt->execute([$username, $roleIntent]);
$user = $stmt->fetch();
if ($user && !empty($user['deleted_at'])) {
$pdo->prepare("UPDATE users SET deleted_at = NULL WHERE id = ?")->execute([$user['id']]);
$user['deleted_at'] = null;
}
if (!$user) {
$stmt2 = $pdo->prepare("SELECT role FROM users WHERE username = ? LIMIT 1");
$stmt2->execute([$username]);
$other = $stmt2->fetch();
if ($other) {
$otherFa = ($other['role'] === 'tailor') ? 'خیاط' : 'مشتری';
echo json_encode(['success' => false, 'message' => "حساب این شماره با نقش «{$otherFa}» ثبت شده است؛ نقش را از انتخاب‌گر پایین عوض کنید یا با رمز همان نقش وارد شوید."], JSON_UNESCAPED_UNICODE);
} else {
echo json_encode(['success' => false, 'message' => 'حسابی با این شماره یافت نشد؛ با «ورود با پیامک» حساب بسازید یا از «ثبت‌نام حساب جدید» اقدام کنید.'], JSON_UNESCAPED_UNICODE);
}
exit();
}
if (empty($user['password'])) {
echo json_encode(['success' => false, 'message' => 'برای حساب شما رمز عبور تنظیم نشده؛ از «ورود با پیامک» یا «رمز عبور را فراموش کرده‌اید؟» استفاده کنید.'], JSON_UNESCAPED_UNICODE);
exit();
}
if (!password_verify($password, $user['password'])) {
echo json_encode(['success' => false, 'message' => 'رمز عبور اشتباه است.'], JSON_UNESCAPED_UNICODE);
exit();
}
logUserActivity($pdo, (int)$user['id'], $user['role'], 'login');
$authToken = issueUserToken($pdo, (int)$user['id']);
unset($user['password']);
echo json_encode([
'success' => true,
'user'    => $user,
'token'   => $authToken,
'message' => 'ورود با موفقیت انجام شد.'
], JSON_UNESCAPED_UNICODE);
exit();
}
/* ─────────────────────────────────────────────────────────────
۱٫۷. بازیابی رمز عبور با OTP (reset_password) — استاندارد فراموشی رمز
───────────────────────────────────────────────────────────── */
if ($action === 'reset_password') {
$phone   = sanitizeDigits($data['phone'] ?? '');
$code    = sanitizeDigits($data['code'] ?? '');
$newPass = (string)($data['password'] ?? '');
if (empty($phone) || empty($code) || empty($newPass)) {
echo json_encode(['success' => false, 'message' => 'شماره، کد تأیید و رمز جدید الزامی هستند.'], JSON_UNESCAPED_UNICODE);
exit();
}
if (strlen($newPass) < 6) {
echo json_encode(['success' => false, 'message' => 'رمز عبور باید حداقل ۶ کاراکتر باشد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۱) آیا کاربر با این شماره وجود دارد؟
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
$stmt->execute([$phone]);
if (!$stmt->fetch()) {
echo json_encode(['success' => false, 'message' => 'کاربری با این شماره یافت نشد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۲) تطبیق کد OTP (احراز مالکیت خط)
$stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$phone]);
$otpRecord = $stmt->fetch();
if (!$otpRecord) {
echo json_encode(['success' => false, 'message' => 'کدی برای این شماره یافت نشد؛ ابتدا درخواست کد دهید.'], JSON_UNESCAPED_UNICODE);
exit();
}
$expireTimestamp = strtotime($otpRecord['expires_at']);
if ($expireTimestamp && time() > $expireTimestamp) {
echo json_encode(['success' => false, 'message' => 'کد منقضی شده است؛ مجدداً درخواست کد دهید.'], JSON_UNESCAPED_UNICODE);
exit();
}
$dbCode = trim((string)$otpRecord['code']);
$userCode = trim((string)$code);
if ($userCode !== $dbCode) {
echo json_encode(['success' => false, 'message' => 'کد وارد شده اشتباه است.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۳) حذف کد مصرف‌شده + هش و ذخیره رمز جدید
$pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$phone]);
$role = in_array($data['role'] ?? '', ['customer', 'tailor']) ? $data['role'] : 'customer';
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND role = ? LIMIT 1");
$stmt->execute([$phone, $role]);
$row = $stmt->fetch();
if (!$row) {
echo json_encode(['success' => false, 'message' => 'حسابی با این نقش برای شماره شما یافت نشد؛ نقش دیگر را انتخاب کنید.'], JSON_UNESCAPED_UNICODE);
exit();
}
$hashed = password_hash($newPass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
$stmt->execute([$hashed, $row['id']]);
echo json_encode(['success' => true, 'message' => 'رمز عبور با موفقیت تغییر کرد؛ حالا با رمز جدید وارد شوید.'], JSON_UNESCAPED_UNICODE);
exit();
}
/* ─────────────────────────────────────────────────────────────
۱٫۸. ثبت‌نام کامل و ورود مستقیم (register) — بدون پیامک
───────────────────────────────────────────────────────────── */
if ($action === 'register') {
$name     = trim((string)($data['name'] ?? ''));
$username = sanitizeDigits($data['username'] ?? ($data['phone'] ?? ''));
$password = (string)($data['password'] ?? '');
$role     = in_array($data['role'] ?? '', ['customer', 'tailor']) ? $data['role'] : 'customer';
$city     = trim((string)($data['city'] ?? ''));
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
echo json_encode(['success' => false, 'message' => 'لطفاً نام و نام خانوادگی معتبر وارد کنید (حداقل ۲ حرف).'], JSON_UNESCAPED_UNICODE);
exit();
}
if (strlen($username) !== 11 || !str_starts_with($username, '09')) {
echo json_encode(['success' => false, 'message' => 'شماره موبایل معتبر نیست؛ مثال: ۰۹۱۷۱۲۳۴۵۶۷'], JSON_UNESCAPED_UNICODE);
exit();
}
if (strlen($password) < 6) {
echo json_encode(['success' => false, 'message' => 'رمز عبور باید حداقل ۶ کاراکتر باشد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ─── تأیید مالکیت خط با کد پیامکی (استاندارد امنیتی ثبت‌نام) ───
$code = sanitizeDigits($data['code'] ?? '');
if (empty($code)) {
echo json_encode(['success' => false, 'message' => 'کد تأیید پیامکی الزامی است.'], JSON_UNESCAPED_UNICODE);
exit();
}
$stmtOtp = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
$stmtOtp->execute([$username]);
$otpRecord = $stmtOtp->fetch();
if (!$otpRecord) { echo json_encode(['success' => false, 'message' => 'کدی برای این شماره یافت نشد؛ ابتدا درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$expireTimestamp = strtotime($otpRecord['expires_at']);
if ($expireTimestamp && time() > $expireTimestamp) { echo json_encode(['success' => false, 'message' => 'کد منقضی شده است؛ مجدداً درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$dbCode = trim((string)$otpRecord['code']);
$userCode = trim((string)$code);
if ($userCode !== $dbCode) { echo json_encode(['success' => false, 'message' => 'کد وارد شده اشتباه است.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$username]);
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND role = ? LIMIT 1");
$stmt->execute([$username, $role]);
if ($stmt->fetch()) {
$roleFa = ($role === 'tailor') ? 'خیاط' : 'مشتری';
echo json_encode(['success' => false, 'message' => "این شماره قبلاً با نقش «{$roleFa}» ثبت شده است؛ وارد شوید یا نقش دیگر را انتخاب کنید."], JSON_UNESCAPED_UNICODE);
exit();
}
$finalCity = ($city !== '') ? mb_substr($city, 0, 50) : 'بندرعباس';
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, username, password, role, city) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$name, $username, $hashed, $role, $finalCity]);
$newUserId = (int)$pdo->lastInsertId();
if ($role === 'tailor') {
$stmtTailor = $pdo->prepare("INSERT INTO tailor_profiles (user_id, shop_name, tailor_in_charge, city, phone) VALUES (?, ?, ?, ?, ?)");
$stmtTailor->execute([$newUserId, $name, 'مدیر کارگاه', $finalCity, $username]);
}
$newUser = [
'id'       => $newUserId,
'name'     => $name,
'username' => $username,
'role'     => $role,
'city'     => $finalCity,
];
logUserActivity($pdo, $newUserId, $role, 'register');
logUserActivity($pdo, $newUserId, $role, 'login');
$regToken = issueUserToken($pdo, $newUserId);
echo json_encode([
'success' => true,
'user'    => $newUser,
'token'   => $regToken,
'message' => 'حساب شما با موفقیت ایجاد شد؛ خوش آمدید! ⚜️',
], JSON_UNESCAPED_UNICODE);
exit();
}

/* ─────────────────────────────────────────────────────────────
۱٫۹. غیرفعال‌سازی حساب (حفظ اطلاعات) — با تأیید OTP
───────────────────────────────────────────────────────────── */
if ($action === 'deactivate_account') {
$userId = (int)($data['user_id'] ?? 0);
$phone  = sanitizeDigits($data['phone'] ?? '');
$code   = sanitizeDigits($data['code'] ?? '');
if ($userId <= 0 || empty($phone) || empty($code)) {
echo json_encode(['success' => false, 'message' => 'اطلاعات نامعتبر است.'], JSON_UNESCAPED_UNICODE);
exit();
}
$stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$phone]);
$otpRecord = $stmt->fetch();
if (!$otpRecord) { echo json_encode(['success' => false, 'message' => 'کدی برای این شماره یافت نشد؛ ابتدا درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$expireTimestamp = strtotime($otpRecord['expires_at']);
if ($expireTimestamp && time() > $expireTimestamp) { echo json_encode(['success' => false, 'message' => 'کد منقضی شده است؛ مجدداً درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$dbCode = trim((string)$otpRecord['code']);
$userCode = trim((string)$code);
if ($userCode !== $dbCode) { echo json_encode(['success' => false, 'message' => 'کد وارد شده اشتباه است.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$phone]);
$pdo->prepare("UPDATE users SET deleted_at = NOW() WHERE id = ?")->execute([$userId]);
echo json_encode(['success' => true, 'message' => 'حساب شما غیرفعال شد؛ اطلاعات شما محفوظ است و با ورود مجدد فعال می‌شود.'], JSON_UNESCAPED_UNICODE);
exit();
}
/* ─────────────────────────────────────────────────────────────
۱٫۱۰. حذف کامل و دائمی حساب — با تأیید OTP + گارد سفارش فعال
───────────────────────────────────────────────────────────── */
if ($action === 'delete_account') {
$userId = (int)($data['user_id'] ?? 0);
$phone  = sanitizeDigits($data['phone'] ?? '');
$code   = sanitizeDigits($data['code'] ?? '');
if ($userId <= 0 || empty($phone) || empty($code)) {
echo json_encode(['success' => false, 'message' => 'اطلاعات نامعتبر است.'], JSON_UNESCAPED_UNICODE);
exit();
}
// تطبیق کد OTP
$stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$phone]);
$otpRecord = $stmt->fetch();
if (!$otpRecord) { echo json_encode(['success' => false, 'message' => 'کدی برای این شماره یافت نشد؛ ابتدا درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$expireTimestamp = strtotime($otpRecord['expires_at']);
if ($expireTimestamp && time() > $expireTimestamp) { echo json_encode(['success' => false, 'message' => 'کد منقضی شده است؛ مجدداً درخواست کد دهید.'], JSON_UNESCAPED_UNICODE); exit(); }
$dbCode = trim((string)$otpRecord['code']);
$dbCode = trim((string)$otpRecord['code']);
$userCode = trim((string)$code);

// مقایسه استاندارد و امن (حذف ترفند strrev)
if ($userCode !== $dbCode) { 
    echo json_encode(['success' => false, 'message' => 'کد وارد شده اشتباه است.'], JSON_UNESCAPED_UNICODE); 
    exit(); 
}

// گارد: سفارش فعال (مرحله ۱ تا ۴) به‌عنوان مشتری یا خیاط
$stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM orders WHERE (user_id = ? OR tailor_user_id = ?) AND step BETWEEN 1 AND 4");
$stmt->execute([$userId, $userId]);
$activeOrders = (int)($stmt->fetch()['c'] ?? 0);
if ($activeOrders > 0) {
echo json_encode(['success' => false, 'message' => 'حذف حساب امکان‌پذیر نیست؛ ' . $activeOrders . ' سفارش فعال دارید. ابتدا سفارش‌ها را به پایان برسانید یا لغو کنید.'], JSON_UNESCAPED_UNICODE);
exit();
}
// گارد: تسویه در انتظار
$stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM payout_requests WHERE tailor_user_id = ? AND status = 'pending'");
$stmt->execute([$userId]);
if ((int)($stmt->fetch()['c'] ?? 0) > 0) {
echo json_encode(['success' => false, 'message' => 'درخواست تسویه در انتظار دارید؛ ابتدا وضعیت آن را مشخص کنید.'], JSON_UNESCAPED_UNICODE);
exit();
}
$pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$phone]);
// حذف تراکنشی: محتوای بدون FK دستی + بقیه با CASCADE خود دیتابیس
try {
$pdo->beginTransaction();
$pdo->prepare("DELETE FROM stories WHERE user_id = ?")->execute([$userId]);
$pdo->prepare("DELETE FROM designs WHERE user_id = ?")->execute([$userId]);
$pdo->prepare("DELETE FROM support_tickets WHERE user_id = ?")->execute([$userId]);
$pdo->prepare("DELETE FROM reviews WHERE user_id = ? OR tailor_user_id = ?")->execute([$userId, $userId]);
$pdo->prepare("DELETE FROM payout_requests WHERE tailor_user_id = ?")->execute([$userId]);
$pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
$pdo->commit();
} catch (Exception $e) {
$pdo->rollBack();
echo json_encode(['success' => false, 'message' => 'خطا در حذف حساب؛ لطفاً دوباره تلاش کنید.'], JSON_UNESCAPED_UNICODE);
exit();
}
echo json_encode(['success' => true, 'message' => 'حساب شما و همه اطلاعات آن برای همیشه حذف شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
/* ─────────────────────────────────────────────────────────────
۲. تأیید کد پیامک و ورود (verify_otp)
───────────────────────────────────────────────────────────── */
if ($action === 'verify_otp') {
    $rawPhone   = $data['phone'] ?? '';
    $rawCode    = $data['code'] ?? '';
    $roleIntent = $data['role_intent'] ?? 'customer';

    $phone = sanitizeDigits($rawPhone);
    $code  = sanitizeDigits($rawCode);

    if (empty($phone) || empty($code)) {
        echo json_encode(['success' => false, 'message' => 'شماره موبایل و کد پیامک الزامی هستند.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // دریافت آخرین کد ارسال شده برای شماره
    $stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$phone]);
    $otpRecord = $stmt->fetch();

    if (!$otpRecord) {
        echo json_encode(['success' => false, 'message' => 'کدی برای این شماره یافت نشد؛ مجدداً درخواست ارسال کد دهید.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // بررسی زمان انقضا هماهنگ با PHP
    $expireTimestamp = strtotime($otpRecord['expires_at']);
    if ($expireTimestamp && time() > $expireTimestamp) {
        echo json_encode(['success' => false, 'message' => 'کد منقضی شده است؛ لطفاً مجدداً درخواست کد دهید.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // بررسی تطابق کد (پشتیبانی از ارقام ورودی)
    $dbCode = trim((string)$otpRecord['code']);
$userCode = trim((string)$code);
if ($userCode !== $dbCode) {
        echo json_encode([
            'success' => false, 
            'message' => 'کد وارد شده اشتباه است.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // حذف کد مصرف شده
    $pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$phone]);

    // ─── ورود با پیامک = ورود یا ثبت‌نام خودکار با همان نقش (تأیید مالکیت خط) ───
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = ? LIMIT 1");
$stmt->execute([$phone, $roleIntent]);
$user = $stmt->fetch();
if (!$user) {
$role = in_array($roleIntent, ['customer', 'tailor']) ? $roleIntent : 'customer';
$defaultName = ($role === 'tailor') ? ('خیاطی ' . substr($phone, -4)) : ('کاربر ' . substr($phone, -4));
$stmtIns = $pdo->prepare("INSERT INTO users (name, username, role, city) VALUES (?, ?, ?, 'بندرعباس')");
$stmtIns->execute([$defaultName, $phone, $role]);
$newUserId = (int)$pdo->lastInsertId();
if ($role === 'tailor') {
$stmtTailor = $pdo->prepare("INSERT INTO tailor_profiles (user_id, shop_name, tailor_in_charge, city, phone) VALUES (?, ?, ?, 'بندرعباس • گلشهر', ?)");
$stmtTailor->execute([$newUserId, $defaultName, 'مدیر کارگاه', $phone]);
}
$user = [
'id'       => $newUserId,
'name'     => $defaultName,
'username' => $phone,
'role'     => $role,
'city'     => 'بندرعباس',
];
logUserActivity($pdo, $newUserId, $role, 'register');
logUserActivity($pdo, $newUserId, $role, 'login');
$authToken = issueUserToken($pdo, $newUserId);
echo json_encode([
'success'     => true,
'is_new_user' => true,
'user'        => $user,
'token'       => $authToken,
'message'     => 'حساب شما ساخته شد و وارد شدید؛ خوش آمدید! ⚜️'
], JSON_UNESCAPED_UNICODE);
exit();
}
// فعال‌سازی خودکار حساب غیرفعال‌شده (اطلاعات محفوظ می‌ماند)
if (!empty($user['deleted_at'])) {
$pdo->prepare("UPDATE users SET deleted_at = NULL WHERE id = ?")->execute([$user['id']]);
$user['deleted_at'] = null;
}
logUserActivity($pdo, (int)$user['id'], $user['role'], 'login');
$authToken = issueUserToken($pdo, (int)$user['id']);
unset($user['password']);
echo json_encode([
'success'     => true,
'is_new_user' => false,
'user'        => $user,
'token'       => $authToken,
'message'     => 'ورود با موفقیت انجام شد.'
], JSON_UNESCAPED_UNICODE);
exit();
}

/* ─────────────────────────────────────────────────────────────
   ۳. به‌روزرسانی یا حذف آدرس عکس پروفایل کاربر (مشتری/خیاط)
   ───────────────────────────────────────────────────────────── */
if ($action === 'update_avatar') {
    $userId    = (int)($data['user_id'] ?? 0);
    $avatarUrl = !empty($data['avatar_url']) ? trim($data['avatar_url']) : null;

    if ($userId > 0) {
        $stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);

        echo json_encode([
            'success'    => true,
            'avatar_url' => $avatarUrl,
            'message'    => $avatarUrl ? 'عکس پروفایل با موفقیت به‌روزرسانی شد.' : 'عکس پروفایل حذف شد.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

/* ─────────────────────────────────────────────────────────────
ثبت خروج: ابطال توکن + ثبت رویداد خروج
───────────────────────────────────────────────────────────── */
if ($action === 'logout') {
$userId = (int)($data['user_id'] ?? 0);
$role   = in_array($data['role'] ?? '', ['customer', 'tailor']) ? $data['role'] : 'customer';
if ($userId > 0) {
logUserActivity($pdo, $userId, $role, 'logout');
}
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($header === '' && function_exists('getallheaders')) {
foreach (getallheaders() as $k => $v) { if (strtolower($k) === 'authorization') { $header = $v; break; } }
}
if ($header && preg_match('/^Bearer\s+([A-Za-z0-9]+)$/', $header, $m)) {
$pdo->prepare("DELETE FROM user_tokens WHERE token = ?")->execute([$m[1]]);
}
echo json_encode(['success' => true, 'message' => 'خروج ثبت شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
echo json_encode(['success' => false, 'message' => 'درخواست نامعتبر است.']);