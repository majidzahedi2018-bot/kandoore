<?php
// api/download.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
http_response_code(200);
exit();
}
$url = $_GET['url'] ?? '';
if (empty($url)) {
http_response_code(400);
exit('آدرس ارسال نشده است.');
}
// ─── امنیت مرحله ۳: جلوگیری از Path Traversal و SSRF ───
// ۱) فقط دامنهٔ خودمان مجاز است
$allowedHosts = ['kandoore.ir', 'www.kandoore.ir'];
$parsed = parse_url($url);
$path = $parsed['path'] ?? '';
if (isset($parsed['host']) && !in_array(strtolower($parsed['host']), $allowedHosts, true)) {
http_response_code(403);
exit('دسترسی غیرمجاز.');
}
// ۲) مسیر فقط باید از پوشهٔ uploads شروع شود
if (strpos($path, '/api/uploads/') === 0) {
$relPath = substr($path, 4); // می‌شود: /uploads/...
} elseif (strpos($path, '/uploads/') === 0) {
$relPath = $path;
} else {
http_response_code(403);
exit('دسترسی غیرمجاز.');
}
// ۳) فقط پسوند تصویر مجاز است (بدون تبدیل بی‌صدا به jpg)
$filename = basename($path);
$extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
if (!in_array($extension, $allowedExts, true)) {
http_response_code(403);
exit('نوع فایل مجاز نیست.');
}
// ۴) سپر نهایی: مسیر واقعی باید داخل پوشهٔ uploads باشد
$uploadsRoot = realpath(__DIR__ . '/uploads');
$filePath = realpath(__DIR__ . $relPath);
if ($uploadsRoot === false || $filePath === false || strpos($filePath, $uploadsRoot . DIRECTORY_SEPARATOR) !== 0) {
http_response_code(404);
exit('فایل پیدا نشد.');
}
header('Content-Type: image/' . ($extension === 'jpg' ? 'jpeg' : $extension));
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
exit();