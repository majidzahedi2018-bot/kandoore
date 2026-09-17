<?php
// test_spoofing.php - تست خودکار امنیت توکن و جلوگیری از جعل user_id
header('Content-Type: text/html; charset=utf-8');
echo "<h1>🔍 گزارش تشخیص امنیت توکن و جعل user_id</h1>";
echo "<style>body{font-family:Tahoma, sans-serif;direction:rtl;background:#f8f5ee;color:#23201c;padding:20px;} .box{background:white;padding:15px;border-radius:15px;margin-bottom:15px;border:1px solid #eadfc7;} .ok{color:#059669;font-weight:bold;} .fail{color:#dc2626;font-weight:bold;} .warn{color:#d97706;font-weight:bold;} code{background:#f3f4f6;padding:2px 6px;border-radius:4px;direction:ltr;display:inline-block;}</style>";

echo "<div class='box'>";
echo "<h3>۱. بررسی متغیر اجبار توکن (ENFORCE_TOKEN)</h3>";
$dbPath = __DIR__ . '/config/db.php';
if (file_exists($dbPath)) {
    $dbContent = file_get_contents($dbPath);
    if (strpos($dbContent, "define('ENFORCE_TOKEN', true)") !== false) {
        echo "<p class='ok'>✅ متغیر ENFORCE_TOKEN روی true تنظیم شده است (حالت سخت‌گیر فعال است).</p>";
    } else {
        echo "<p class='fail'>❌ متغیر ENFORCE_TOKEN هنوز false است (اجبار توکن فعال نیست و سرور به JSON اعتماد می‌کند).</p>";
    }
} else {
    echo "<p class='fail'>❌ فایل config/db.php یافت نشد.</p>";
}
echo "</div>";

echo "<div class='box'>";
echo "<h3>۲. اسکن فایل‌های API برای حفره جعل user_id (IDOR)</h3>";
$filesToCheck = ['orders.php', 'chat.php', 'support.php', 'addresses.php', 'measurements.php', 'reviews.php'];
$vulnerableFiles = [];

foreach ($filesToCheck as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        $content = file_get_contents($path);
        // بررسی اینکه آیا user_id مستقیماً از data خوانده شده و از resolveUserId استفاده نشده است
        $hasDirectCast = preg_match('/\$userId\s*=\s*\(int\)\s*\(\s*\$data\s*\[\s*[\'"]user_id[\'"]\s*\]/', $content);
        $hasResolver = strpos($content, 'resolveUserId') !== false;
        
        if ($hasDirectCast && !$hasResolver) {
            $vulnerableFiles[] = $file;
        }
    }
}

if (empty($vulnerableFiles)) {
    echo "<p class='ok'>✅ تمام فایل‌های API اسکن‌شده، هویت کاربر را از توکن می‌خوانند و حفره جعل user_id بسته شده است.</p>";
} else {
    echo "<p class='fail'>❌ فایل‌های زیر هنوز <b>user_id</b> را مستقیماً از JSON می‌خوانند و در برابر جعل هویت آسیب‌پذیرند:</p>";
    echo "<ul>";
    foreach ($vulnerableFiles as $f) {
        echo "<li class='fail'>⚠️ <code>$f</code></li>";
    }
    echo "</ul>";
    echo "<p class='warn'>💡 <b>راه‌حل:</b> در این فایل‌ها به جای <code>\$userId = (int)(\$data['user_id'] ?? 0);</code> باید بنویسید: <code>\$userId = resolveUserId(\$pdo, \$data['user_id'] ?? 0);</code></p>";
}
echo "</div>";

echo "<div class='box'>";
echo "<h3>۳. تست زیرساخت دیتابیس (جدول user_tokens)</h3>";
try {
    require_once __DIR__ . '/config/db.php';
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_tokens'");
    if ($stmt->rowCount() > 0) {
        echo "<p class='ok'>✅ جدول <code>user_tokens</code> در دیتابیس وجود دارد.</p>";
        $count = $pdo->query("SELECT COUNT(*) FROM user_tokens")->fetchColumn();
        echo "<p>تعداد توکن‌های فعال فعلی در دیتابیس: <b>" . $count . "</b> عدد</p>";
    } else {
        echo "<p class='fail'>❌ جدول <code>user_tokens</code> ساخته نشده است.</p>";
    }
} catch (Exception $e) {
    echo "<p class='fail'>❌ خطا در اتصال به دیتابیس: " . $e->getMessage() . "</p>";
}
echo "</div>";

echo "<div class='box'>";
echo "<h3>📌 نتیجه‌گیری و قدم بعدی</h3>";
if (empty($vulnerableFiles) && strpos(file_get_contents($dbPath), "define('ENFORCE_TOKEN', true)") !== false) {
    echo "<p class='ok'>🎉 تبریک! مرحله امنیت توکن و جلوگیری از جعل هویت با موفقیت به پایان رسیده است. می‌توانید این فایل تست را از هاست حذف کنید.</p>";
} else {
    echo "<p class='warn'>⏳ این مرحله هنوز تمام نشده است. پس از مشاهده این گزارش، موارد قرمز رنگ را به من اطلاع دهید تا کدهای اصلاح‌شده و نهایی آن فایل‌ها را برایتان ارسال کنم تا حفره کاملاً بسته شود.</p>";
}
echo "</div>";