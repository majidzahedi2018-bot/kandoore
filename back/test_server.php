<?php
header("Content-Type: text/plain; charset=utf-8");
header("Access-Control-Allow-Origin: *");

echo "=== تست کامل سرور بک‌اند کندوره ===\n";
echo "تاریخ و ساعت: " . date('Y-m-d H:i:s') . "\n";
echo "تایم‌استمپ Unix: " . time() . "\n";
echo "زون‌کان فعال PHP: " . date_default_timezone_get() . "\n\n";

// ─── ۱. تست PHP Version ───
echo "--- ۱. نسخه PHP ---\n";
echo "نسخه PHP: " . phpversion() . "\n";
echo "cURL فعال: " . (function_exists('curl_init') ? 'بله ✅' : 'خیر ❌') . "\n";
echo "JSON فعال: " . (function_exists('json_encode') ? 'بله ✅' : 'خیر ❌') . "\n\n";

// ─── ۲. تست اتصال دیتابیس ───
echo "--- ۲. اتصال دیتابیس ---\n";
$host     = 'localhost';
$db_name  = 'arka36_kandooreh_db';
$db_user  = 'arka36_kandooreh_db';
$db_pass  = 'Majidzahedi1@';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "اتصال دیتابیس: موفق ✅\n";
    
    // زون‌کان MySQL
    $tz = $pdo->query("SELECT @@global.time_zone, @@session.time_zone")->fetch();
    echo "زون‌کان MySQL (global): " . ($tz[0] ?: 'SYSTEM') . "\n";
    echo "زون‌کان MySQL (session): " . ($tz[1] ?: 'SYSTEM') . "\n";
    echo "ساعت MySQL: " . $pdo->query("SELECT NOW()")->fetchColumn() . "\n\n";
    
} catch (PDOException $e) {
    echo "اتصال دیتابیس: خطا ❌\n";
    echo "پیام خطا: " . $e->getMessage() . "\n\n";
    die("ادامه ممکن نیست.\n");
}

// ─── ۳. تست جدول otp_codes ───
echo "--- ۳. جدول otp_codes ---\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'otp_codes'");
    if ($stmt->rowCount() > 0) {
        echo "جدول otp_codes: موجود ✅\n";
        
        $cols = $pdo->query("DESCRIBE otp_codes")->fetchAll(PDO::FETCH_COLUMN);
        echo "ستون‌ها: " . implode(', ', $cols) . "\n";
        
        $count = $pdo->query("SELECT COUNT(*) FROM otp_codes")->fetchColumn();
        echo "تعداد رکوردها: " . $count . "\n";
        
        // تست INSERT و DELETE
        $testCode = (string)rand(1000, 9999);
        $testPhone = '09000000000';
        $expiresAt = date('Y-m-d H:i:s', time() + 300);
        
        $pdo->prepare("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)")->execute([$testPhone, $testCode, $expiresAt]);
        $newId = $pdo->lastInsertId();
        echo "تست INSERT: موفق ✅ (id=$newId, code=$testCode, expires_at=$expiresAt)\n";
        
        // برگرداندن مقدار ذخیره شده
        $row = $pdo->prepare("SELECT * FROM otp_codes WHERE id = ?");
        $row->execute([$newId]);
        $saved = $row->fetch();
        echo "برگشت از دیتابیس: phone={$saved['phone']}, code={$saved['code']}, expires_at={$saved['expires_at']}\n";
        
        // بررسی انقضا
        $expireTs = strtotime($saved['expires_at']);
        $nowTs = time();
        echo "زمان انقضا (unix): $expireTs\n";
        echo "زمان فعلی (unix): $nowTs\n";
        echo "تفاوت: " . ($expireTs - $nowTs) . " ثانیه " . (($expireTs > $nowTs) ? '(معتبر ✅)' : '(منقضی ❌)') . "\n";
        
        // حذف تستی
        $pdo->prepare("DELETE FROM otp_codes WHERE id = ?")->execute([$newId]);
        echo "تست DELETE: موفق ✅\n";
        
    } else {
        echo "جدول otp_codes: موجود نیست ❌\n";
        echo "باید جدول رو بسازید!\n";
    }
} catch (PDOException $e) {
    echo "خطا: " . $e->getMessage() . "\n";
}
echo "\n";

// ─── ۴. تست فایل sms_helper.php ───
echo "--- ۴. فایل sms_helper.php ---\n";
$smsFile = __DIR__ . '/sms_helper.php';
if (file_exists($smsFile)) {
    echo "فایل sms_helper.php: موجود ✅\n";
    require_once $smsFile;
    
    if (function_exists('sendOtpSms')) {
        echo "تابع sendOtpSms: موجود ✅\n";
        
        // تست واقعی ارسال پیامک
        echo "\n--- ۵. تست ارسال پیامک ---\n";
        $testPhone = '09055167823'; // شماره‌ای که قبلاً تست شده
        $testCode = '9999';
        echo "شماره تست: $testPhone\n";
        echo "کد تست: $testCode\n";
        
        $result = sendOtpSms($testPhone, $testCode);
        echo "نتیجه ارسال: " . ($result ? 'موفق ✅' : 'ناموفق ❌') . "\n";
        
        // بررسی فایل لاگ
        $logFile = __DIR__ . '/sms_log.txt';
        if (file_exists($logFile)) {
            echo "\nآخرین ۳ خط لاگ:\n";
            $lines = file($logFile);
            $last3 = array_slice($lines, -3);
            foreach ($last3 as $line) {
                echo "  " . trim($line) . "\n";
            }
        } else {
            echo "فایل sms_log.txt: موجود نیست\n";
        }
        
    } else {
        echo "تابع sendOtpSms: موجود نیست ❌\n";
        echo "محتوای فایل:\n";
        echo file_get_contents($smsFile) . "\n";
    }
} else {
    echo "فایل sms_helper.php: موجود نیست ❌\n";
    echo "فایل‌های موجود در این پوشه:\n";
    foreach (scandir(__DIR__) as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "  - $file\n";
        }
    }
}
echo "\n";

// ─── ۶. تست کامل ساختار API ───
echo "--- ۶. ساختار فایل‌ها ---\n";
$requiredFiles = ['auth.php', 'sms_helper.php', 'config/db.php', 'stories.php', 'designs.php', 'upload.php'];
foreach ($requiredFiles as $file) {
    $path = __DIR__ . '/' . $file;
    echo str_pad($file, 25) . ": " . (file_exists($path) ? 'موجود ✅' : 'موجود نیست ❌') . "\n";
}
echo "\n";

// ─── ۷. تست send_otp مثل درخواست واقعی ───
echo "--- ۷. شبیه‌سازی درخواست send_otp ---\n";
$fakeRequest = [
    'action' => 'send_otp',
    'phone' => '09055167823'
];

echo "درخواست ورودی: " . json_encode($fakeRequest) . "\n";
$phone = $fakeRequest['phone'];

if (empty($phone) || strlen($phone) !== 11 || !str_starts_with($phone, '09')) {
    echo "اعتبارسنجی شماره: نامعتبر ❌\n";
} else {
    echo "اعتبارسنجی شماره: معتبر ✅\n";
    
    $code = (string)rand(1000, 9999);
    $expiresAt = date('Y-m-d H:i:s', time() + (5 * 60));
    
    echo "کد تولید شده: $code\n";
    echo "زمان انقضا: $expiresAt\n";
    
    try {
        $pdo->prepare("DELETE FROM otp_codes WHERE phone = ?")->execute([$phone]);
        $pdo->prepare("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)")->execute([$phone, $code, $expiresAt]);
        echo "ذخیره در دیتابیس: موفق ✅\n";
        
        $smsResult = sendOtpSms($phone, $code);
        echo "ارسال پیامک: " . ($smsResult ? 'موفق ✅' : 'ناموفق ❌') . "\n";
        
        echo "\nپاسخ نهایی JSON:\n";
        echo json_encode([
            'success' => true,
            'message' => 'کد تأیید به شماره شما پیامک شد.',
            'debug_code' => $code
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
        
    } catch (PDOException $e) {
        echo "خطای دیتابیس: " . $e->getMessage() . "\n";
    }
}

echo "\n=== پایان تست ===\n";
echo "نتیجه: اگه همه ✅ هست مشکل از فرانت‌اند هست.\n";
echo "اگه ❌ هست همون قسمت مشکل داره.\n";