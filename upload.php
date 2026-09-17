<?php
// مسیر فایل در هاست: api/upload.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$siteUrl = 'https://kandoore.ir/api'; // دامنه اصلی API شما

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'درخواست نامعتبر است.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// نوع آپلود: designs | stories | avatars | orders | reviews
$type = $_POST['type'] ?? 'designs';
$userId = (int)($_POST['user_id'] ?? 1);

$allowedTypes = ['designs', 'stories', 'avatars', 'orders', 'reviews', 'tickets'];
if (!in_array($type, $allowedTypes)) {
    $type = 'designs';
}

// دریافت فایل (چه از طریق Multipart FormData و چه به صورت Base64)
$imageUploaded = false;
$tempFilePath = null;
$extension = 'jpg';

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $tempFilePath = $_FILES['image']['tmp_name'];
    $originalName = $_FILES['image']['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $imageUploaded = true;
} elseif (!empty($_POST['image_base64'])) {
    // اگر به صورت Base64 ارسال شد
    $base64Data = $_POST['image_base64'];
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $typeMatch)) {
        $extension = strtolower($typeMatch[1]);
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
    }
    $decodedData = base64_decode($base64Data);
    if ($decodedData !== false) {
        $tempFilePath = tempnam(sys_get_temp_dir(), 'knd_');
        file_put_contents($tempFilePath, $decodedData);
        $imageUploaded = true;
    }
}

if (!$imageUploaded || !$tempFilePath) {
    echo json_encode(['success' => false, 'message' => 'هیچ تصویری ارسال نشده است.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// پسوندهای مجاز
$validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
if (!in_array($extension, $validExtensions)) {
    $extension = 'jpg';
}

// ساخت نام یکتا و مسیر ذخیره‌سازی
$filename = "{$type}_user{$userId}_" . time() . "_" . bin2hex(random_bytes(3)) . ".{$extension}";
$uploadDir = __DIR__ . "/uploads/{$type}/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$targetPath = $uploadDir . $filename;

// انتقال و ذخیره فایل
if (isset($_FILES['image'])) {
    move_uploaded_file($tempFilePath, $targetPath);
} else {
    rename($tempFilePath, $targetPath);
}

// لینک نهایی عکس
$fileUrl = "{$siteUrl}/uploads/{$type}/{$filename}";

echo json_encode([
    'success'  => true,
    'url'      => $fileUrl,
    'filename' => $filename,
    'message'  => 'تصویر با موفقیت در هاست ذخیره شد.'
], JSON_UNESCAPED_UNICODE);