<?php
// مسیر فایل در هاست: api/test_verify.php
header('Content-Type: text/html; charset=utf-8');
date_default_timezone_set('Asia/Tehran');
require_once __DIR__ . '/config/db.php';

$phone = $_GET['phone'] ?? '09914603057';
$code  = $_GET['code'] ?? '';

echo "<h2>تست اعتبارسنجی کد در دیتابیس</h2>";
echo "<b>ساعت فعلی سرور (تهران):</b> " . date('Y-m-d H:i:s') . "<br><br>";

$stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$phone]);
$record = $stmt->fetch();

if ($record) {
    echo "<b>آخرین رکورد در دیتابیس برای {$phone}:</b><br>";
    echo "کد ثبت‌شده در دیتابیس: <b>" . $record['code'] . "</b><br>";
    echo "زمان انقضا: <b>" . $record['expires_at'] . "</b><br>";
    
    $expireTime = strtotime($record['expires_at']);
    $remainingSeconds = $expireTime - time();
    
    if ($remainingSeconds > 0) {
        echo "<span style='color:green;font-weight:bold;'>وضعیت زمان: کد دارای " . $remainingSeconds . " ثانیه اعتبار است.</span><br>";
    } else {
        echo "<span style='color:red;font-weight:bold;'>وضعیت زمان: کد منقضی شده است.</span><br>";
    }

    if (!empty($code)) {
        if ((string)$record['code'] === (string)$code) {
            echo "<h3 style='color:green;'>نتیجه: کد کاملاً درست است ✓</h3>";
        } else {
            echo "<h3 style='color:red;'>نتیجه: کد وارد شده (" . htmlspecialchars($code) . ") با دیتابیس همخوانی ندارد.</h3>";
        }
    }
} else {
    echo "<span style='color:red;'>هیچ کدی برای این شماره در جدول otp_codes وجود ندارد.</span>";
}