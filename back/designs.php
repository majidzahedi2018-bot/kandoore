<?php
require_once __DIR__ . '/config/db.php';
// ─── خود-مایگریشن: ستون‌های تاکسونومی پوشاک (اگر نبودند ساخته می‌شوند) ───
try {
$existingCols = $pdo->query("SHOW COLUMNS FROM designs")->fetchAll(PDO::FETCH_COLUMN);
$ensureCols = [
'garment_type' => "ALTER TABLE designs ADD COLUMN garment_type VARCHAR(50) NULL DEFAULT NULL AFTER category",
'garment_model' => "ALTER TABLE designs ADD COLUMN garment_model VARCHAR(100) NULL DEFAULT NULL AFTER garment_type",
'embellishments' => "ALTER TABLE designs ADD COLUMN embellishments VARCHAR(255) NULL DEFAULT NULL AFTER garment_model",
'fabrics' => "ALTER TABLE designs ADD COLUMN fabrics VARCHAR(255) NULL DEFAULT NULL AFTER embellishments",
'color_name' => "ALTER TABLE designs ADD COLUMN color_name VARCHAR(50) NULL DEFAULT NULL AFTER fabrics",
'color_hex' => "ALTER TABLE designs ADD COLUMN color_hex VARCHAR(20) NULL DEFAULT NULL AFTER color_name",
'occasions' => "ALTER TABLE designs ADD COLUMN occasions VARCHAR(255) NULL DEFAULT NULL AFTER color_hex",
'region' => "ALTER TABLE designs ADD COLUMN region VARCHAR(50) NULL DEFAULT NULL AFTER occasions",
'set_pieces' => "ALTER TABLE designs ADD COLUMN set_pieces VARCHAR(255) NULL DEFAULT NULL AFTER region",
'description' => "ALTER TABLE designs ADD COLUMN description TEXT NULL DEFAULT NULL AFTER set_pieces",
];
foreach ($ensureCols as $colName => $alterSql) {
if (!in_array($colName, $existingCols)) $pdo->exec($alterSql);
}
} catch (Exception $e) {}
$method = $_SERVER['REQUEST_METHOD'];

// سازگاری با PHP نسخه‌های قدیمی‌تر از ۸
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return $needle === '' || strpos($haystack, $needle) === 0;
    }
}

// ذخیره تصویر base64 (پسوند data:image یا خام) و برگرداندن آدرس کامل عمومی
function saveBase64Image($base64) {
    if (empty($base64)) return null;
    if (is_string($base64) && strpos($base64, 'data:image') === 0) {
        $base64 = substr($base64, strpos($base64, ',') + 1);
    }
    $imageData = base64_decode($base64);
    if ($imageData === false || empty($imageData)) return null;

    $dir = __DIR__ . '/uploads/designs';
    if (!is_dir($dir)) { @mkdir($dir, 0755, true); }

    $ext = 'jpg';
    if (class_exists('finfo')) {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->buffer($imageData);
        if ($mime === 'image/png') $ext = 'png';
        elseif ($mime === 'image/webp') $ext = 'webp';
    }

    $filename = 'design_' . time() . '_' . random_int(100, 999) . '.' . $ext;
    $savePath = 'uploads/designs/' . $filename;
    file_put_contents(__DIR__ . '/' . $savePath, $imageData);
    return 'https://kandoore.ir/api/' . $savePath;
}

// تبدیل آدرس تصویر ذخیره‌شده به آدرس کامل قابل نمایش
function buildImageUrl($stored) {
    if (empty($stored)) return null;
    if (str_starts_with($stored, 'http')) return $stored;
    if (str_starts_with($stored, '/')) return 'https://kandoore.ir' . $stored;
    if (str_starts_with($stored, 'uploads/')) return 'https://kandoore.ir/api/' . $stored;
    return null;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $category     = trim($_GET['category'] ?? '');
    $tailorUserId = $_GET['tailor_user_id'] ?? null;
    $searchQuery  = trim($_GET['search'] ?? $_GET['q'] ?? '');
    $city         = trim($_GET['city'] ?? '');
    $stitch       = trim($_GET['stitch'] ?? '');
    $showAll      = isset($_GET['show_all']) && $_GET['show_all'] == '1';

    $conditions = [];
    $params     = [];

    if ($tailorUserId) {
        $conditions[] = "user_id = ?";
        $params[] = (int)$tailorUserId;
    }
    // طرح‌های غیرفعال فقط برای خود خیاط یا ادمین (show_all) نمایش داده شوند
if (!$tailorUserId && !$showAll) {
$conditions[] = "(is_active = 1 OR is_active IS NULL)";
}

    if (!empty($category) && $category !== 'همه') {
        $conditions[] = "(category = ? OR title LIKE ?)";
        $params[] = $category;
        $params[] = "%{$category}%";
    }

    if (!empty($city)) {
        $conditions[] = "city LIKE ?";
        $params[] = "%{$city}%";
    }

    if (!empty($stitch)) {
$conditions[] = "(tags LIKE ? OR title LIKE ? OR materials_bom LIKE ?)";
$params[] = "%{$stitch}%";
$params[] = "%{$stitch}%";
$params[] = "%{$stitch}%";
}
// ─── فیلترهای جدید تاکسونومی برای کاتالوگ هوشمند ───
$garmentTypeFilter = trim($_GET['garment_type'] ?? '');
$regionFilter      = trim($_GET['region'] ?? '');
$embellishFilter   = trim($_GET['embellishment'] ?? '');
$occasionFilter    = trim($_GET['occasion'] ?? '');
$colorFilter       = trim($_GET['color'] ?? '');
$fabricFilter      = trim($_GET['fabric'] ?? '');
$gtLabels = [
'pirahan' => ['پیراهن', 'کندوره'],
'shalwar' => ['شلوار'],
'chador'  => ['چادر'],
'burqa'   => ['برقع'],
'set'     => ['ست'],
'head'    => ['روسری', 'اورنی'],
'moghnae' => ['مقنعه'],
'jalbil'  => ['جلبیل'],
];
if (!empty($garmentTypeFilter) && $garmentTypeFilter !== 'همه') {
$labels = $gtLabels[$garmentTypeFilter] ?? [$garmentTypeFilter];
$ors = ["garment_type = ?"];
$params[] = $garmentTypeFilter;
foreach ($labels as $lb) {
$ors[] = "garment_type LIKE ?"; $params[] = "%{$lb}%";
$ors[] = "category LIKE ?";     $params[] = "%{$lb}%";
}
$conditions[] = '(' . implode(' OR ', $ors) . ')';
}
if (!empty($regionFilter))    { $conditions[] = "region = ?";          $params[] = $regionFilter; }
if (!empty($embellishFilter)) { $conditions[] = "embellishments LIKE ?"; $params[] = "%{$embellishFilter}%"; }
if (!empty($occasionFilter))  { $conditions[] = "occasions LIKE ?";     $params[] = "%{$occasionFilter}%"; }
if (!empty($colorFilter))     { $conditions[] = "color_name = ?";       $params[] = $colorFilter; }
if (!empty($fabricFilter))    { $conditions[] = "fabrics LIKE ?";       $params[] = "%{$fabricFilter}%"; }

    if (!empty($searchQuery)) {
        $conditions[] = "(title LIKE ? OR tailor_name LIKE ? OR category LIKE ? OR tags LIKE ? OR materials_bom LIKE ?)";
        $params[] = "%{$searchQuery}%";
        $params[] = "%{$searchQuery}%";
        $params[] = "%{$searchQuery}%";
        $params[] = "%{$searchQuery}%";
        $params[] = "%{$searchQuery}%";
    }

    $isPopular = isset($_GET['popular']) && $_GET['popular'] == '1';
    if ($isPopular) {
        $sql = "SELECT d.*, COUNT(o.id) as order_count
                FROM designs d
                LEFT JOIN orders o ON o.design_title = d.title
                WHERE (d.is_active = 1 OR d.is_active IS NULL)
                GROUP BY d.id
                ORDER BY order_count DESC, d.id DESC
                LIMIT 10";
        $stmt = $pdo->query($sql);
        $designs = $stmt->fetchAll();
    } else {
        $sql = "SELECT * FROM designs";
        if (count($conditions) > 0) {
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        $sql .= " ORDER BY id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $designs = $stmt->fetchAll();
    }

    $imageUrl = function($cp) { return buildImageUrl($cp); };

    echo json_encode([
        'success' => true,
        'designs' => array_map(function($d) use ($imageUrl) {
            return [
                'id'           => (int)$d['id'],
                'userId'       => (int)($d['user_id'] ?? 2),
                'title'        => $d['title'],
                'category'     => $d['category'],
                'tailorName'   => $d['tailor_name'],
                'tailorCity'   => $d['city'],
                'price'        => (int)$d['price'],
                'tailorRating' => (float)($d['rating'] ?? 0),
                'reviewsCount' => (int)($d['reviews_count'] ?? 0),
                'deliveryDays' => $d['delivery_days'],
                'colorPreview' => $d['color_preview'],
                'iconEmoji'    => $d['icon_emoji'],
                'image'        => (!empty($d['color_preview']) && str_starts_with($d['color_preview'], 'http')) ? $d['color_preview'] : null,
'description'  => $d['description'] ?? $d['materials_bom'],
'materialsBom' => $d['materials_bom'],
'tags'         => !empty($d['tags']) ? explode(',', $d['tags']) : [],
'garmentType'  => $d['garment_type'] ?? null,
'garmentModel' => $d['garment_model'] ?? null,
'embellishments' => !empty($d['embellishments']) ? explode(',', $d['embellishments']) : [],
'fabrics'      => !empty($d['fabrics']) ? explode(',', $d['fabrics']) : [],
'colorName'    => $d['color_name'] ?? null,
'colorHex'     => $d['color_hex'] ?? null,
'occasions'    => !empty($d['occasions']) ? explode(',', $d['occasions']) : [],
'region'       => $d['region'] ?? null,
'setPieces'    => !empty($d['set_pieces']) ? explode(',', $d['set_pieces']) : [],
'extraImages'  => !empty($d['extra_images']) ? (json_decode($d['extra_images'], true) ?: []) : [],
'chadorWrap'   => $d['chador_wrap'] ?? null,
'burqaDecor'   => $d['burqa_decor'] ?? null,
'isActive'     => (bool)($d['is_active'] ?? 1)
];
        }, $designs)
    ], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'create';

    // ─── حذف نمونه‌کار توسط خیاط صاحب اثر ───
    if ($action === 'delete') {
        $designId = (int)($data['id'] ?? 0);
        $userId   = (int)($data['user_id'] ?? 0);
        if ($designId <= 0 || $userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'مشخصات طرح یا خیاط نامعتبر است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $stmt = $pdo->prepare("SELECT color_preview FROM designs WHERE id = ? AND user_id = ?");
        $stmt->execute([$designId, $userId]);
        $row = $stmt->fetch();
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'طرح یافت نشد یا متعلق به شما نیست.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $del = $pdo->prepare("DELETE FROM designs WHERE id = ? AND user_id = ?");
        $del->execute([$designId, $userId]);

        // حذف فایل تصویر از هاست (فقط اگر داخل پوشه uploads باشد)
        $stored = $row['color_preview'] ?? '';
        if (str_starts_with($stored, 'uploads/')) {
            $filePath = __DIR__ . '/' . $stored;
            if (is_file($filePath)) { @unlink($filePath); }
        }

        echo json_encode(['success' => true, 'message' => 'طرح با موفقیت حذف شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ─── ویرایش نمونه‌کار توسط خیاط صاحب اثر ───
    if ($action === 'update') {
$designId     = (int)($data['id'] ?? 0);
$userId       = (int)($data['user_id'] ?? 0);
$title        = trim($data['title'] ?? '');
$price        = (int)($data['price'] ?? 0);
$deliveryDays = trim($data['delivery_days'] ?? '۳ تا ۵ روز');
$category     = trim($data['category'] ?? '');
if ($designId <= 0 || $userId <= 0 || $title === '' || $price <= 0) {
echo json_encode(['success' => false, 'message' => 'اطلاعات ویرایش کامل نیست.'], JSON_UNESCAPED_UNICODE);
exit();
}
$stmt = $pdo->prepare("SELECT color_preview FROM designs WHERE id = ? AND user_id = ?");
$stmt->execute([$designId, $userId]);
$existing = $stmt->fetch();
if (!$existing) {
echo json_encode(['success' => false, 'message' => 'طرح یافت نشد یا متعلق به شما نیست.'], JSON_UNESCAPED_UNICODE);
exit();
}
// تصویر: image_url جدید یا نگه‌داشتن تصویر قبلی
$newImage = $existing['color_preview'] ?? null;
if (!empty($data['image_url'])) $newImage = trim($data['image_url']);
if ($newImage === null) $newImage = 'bg-[#0E8388]';
$tags = is_array($data['tags'] ?? null) ? implode(',', $data['tags']) : (string)($data['tags'] ?? '');
// فیلدهای تاکسونومی
$garmentType  = trim($data['garment_type'] ?? '');
$garmentModel = trim($data['garment_model'] ?? '');
$embellishments = is_array($data['embellishments'] ?? null) ? implode(',', $data['embellishments']) : (string)($data['embellishments'] ?? '');
$fabrics      = is_array($data['fabrics'] ?? null) ? implode(',', $data['fabrics']) : (string)($data['fabrics'] ?? '');
$colorName    = trim($data['color_name'] ?? '');
$colorHex     = trim($data['color_hex'] ?? '');
$occasions    = is_array($data['occasions'] ?? null) ? implode(',', $data['occasions']) : (string)($data['occasions'] ?? '');
$region       = trim($data['region'] ?? '');
$setPieces    = is_array($data['set_pieces'] ?? null) ? implode(',', $data['set_pieces']) : (string)($data['set_pieces'] ?? '');
$description  = trim($data['description'] ?? '');
$stmtChk = $pdo->prepare("SELECT color_preview FROM designs WHERE id = ? AND user_id = ?");
$stmtChk->execute([$designId, $userId]);
$existing = $stmtChk->fetch();
if (!$existing) {
echo json_encode(['success' => false, 'message' => 'طرح یافت نشد یا متعلق به شما نیست.'], JSON_UNESCAPED_UNICODE);
exit();
}
$newImage = $existing['color_preview'] ?? null;
if (!empty($data['image_url'])) $newImage = trim($data['image_url']);
$garmentType  = trim($data['garment_type'] ?? '');
$garmentModel = trim($data['garment_model'] ?? '');
$embellishments = is_array($data['embellishments'] ?? null) ? implode(',', $data['embellishments']) : (string)($data['embellishments'] ?? '');
$fabrics      = is_array($data['fabrics'] ?? null) ? implode(',', $data['fabrics']) : (string)($data['fabrics'] ?? '');
$colorName    = trim($data['color_name'] ?? '');
$colorHex     = trim($data['color_hex'] ?? '');
$occasions    = is_array($data['occasions'] ?? null) ? implode(',', $data['occasions']) : (string)($data['occasions'] ?? '');
$region       = trim($data['region'] ?? '');
$setPieces    = is_array($data['set_pieces'] ?? null) ? implode(',', $data['set_pieces']) : (string)($data['set_pieces'] ?? '');
$description  = trim($data['description'] ?? '');
$stmt = $pdo->prepare("UPDATE designs SET title = ?, price = ?, delivery_days = ?, category = ?, color_preview = ?, tags = ?, garment_type = ?, garment_model = ?, embellishments = ?, fabrics = ?, color_name = ?, color_hex = ?, occasions = ?, region = ?, set_pieces = ?, description = ? WHERE id = ? AND user_id = ?");
$stmt->execute([$title, $price, $deliveryDays, $category, $newImage, $tags, $garmentType, $garmentModel, $embellishments, $fabrics, $colorName, $colorHex, $occasions, $region, $setPieces, $description, $designId, $userId]);
echo json_encode(['success' => true, 'message' => 'تغییرات نمونه‌کار ذخیره شد.'], JSON_UNESCAPED_UNICODE);
exit();
}

    // ─── فعال/غیرفعال کردن نمونه‌کار در کاتالوگ عمومی ───
    if ($action === 'toggle_active') {
        $designId = (int)($data['id'] ?? 0);
        $userId   = (int)($data['user_id'] ?? 0);
        $newState = (int)($data['is_active'] ?? 1);
        if ($designId <= 0 || $userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'مشخصات طرح یا خیاط نامعتبر است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $chk = $pdo->prepare("SELECT id FROM designs WHERE id = ? AND user_id = ?");
        $chk->execute([$designId, $userId]);
        if (!$chk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'طرح یافت نشد یا متعلق به شما نیست.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $upd = $pdo->prepare("UPDATE designs SET is_active = ? WHERE id = ? AND user_id = ?");
        $upd->execute([$newState, $designId, $userId]);
        echo json_encode([
            'success'   => true,
            'is_active' => $newState == 1,
            'message'   => $newState ? 'طرح در کاتالوگ فعال شد.' : 'طرح از کاتالوگ عمومی پنهان شد.',
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ─── ثبت نمونه‌کار جدید توسط خیاط (پیش‌فرض) ───
    $userId       = (int)($data['user_id'] ?? 0);
    $title        = trim($data['title'] ?? '');
    $category     = trim($data['category'] ?? 'پوشاک سنتی');
    $tailorName   = trim($data['tailor_name'] ?? 'خیاطی ماهور');
    $city         = trim($data['city'] ?? 'بندرعباس');
    $price        = (int)($data['price'] ?? 0);
    $deliveryDays = trim($data['delivery_days'] ?? '۳ تا ۵ روز');
    $tags         = is_array($data['tags'] ?? null) ? implode(',', $data['tags']) : (string)($data['tags'] ?? '');
    $isActive     = (int)($data['is_active'] ?? 1);

    // جلوگیری از ثبت بی‌صاحب: نمونه‌کار باید به خیاط واقعی وصل شود
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'شناسه خیاط نامعتبر است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    if ($title === '') {
        echo json_encode(['success' => false, 'message' => 'عنوان الزامی است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // تصویر: image_url (از آپلود قبلی) یا image_base64 (الصاق مستقیم)
    $imageStored = 'bg-[#0E8388]';
    if (!empty($data['image_url'])) {
        $imageStored = trim($data['image_url']);
    } elseif (!empty($data['image_base64'])) {
        $saved = saveBase64Image($data['image_base64']);
        if ($saved) { $imageStored = $saved; }
    }

    $imageUrl     = $data['image_url'] ?? 'bg-[#0E8388]';
$tags         = is_array($data['tags'] ?? null) ? implode(',', $data['tags']) : ($data['tags'] ?? '');
// فیلدهای تاکسونومی
$garmentType  = trim($data['garment_type'] ?? '');
$garmentModel = trim($data['garment_model'] ?? '');
$embellishments = is_array($data['embellishments'] ?? null) ? implode(',', $data['embellishments']) : (string)($data['embellishments'] ?? '');
$fabrics      = is_array($data['fabrics'] ?? null) ? implode(',', $data['fabrics']) : (string)($data['fabrics'] ?? '');
$colorName    = trim($data['color_name'] ?? '');
$colorHex     = trim($data['color_hex'] ?? '');
$occasions    = is_array($data['occasions'] ?? null) ? implode(',', $data['occasions']) : (string)($data['occasions'] ?? '');
$region       = trim($data['region'] ?? '');
$setPieces    = is_array($data['set_pieces'] ?? null) ? implode(',', $data['set_pieces']) : (string)($data['set_pieces'] ?? '');
$description  = trim($data['description'] ?? '');
$stmt = $pdo->prepare("INSERT INTO designs (user_id, title, category, tailor_name, city, price, delivery_days, color_preview, tags, garment_type, garment_model, embellishments, fabrics, color_name, color_hex, occasions, region, set_pieces, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([$userId, $title, $category, $tailorName, $city, $price, $deliveryDays, $imageUrl, $tags, $garmentType, $garmentModel, $embellishments, $fabrics, $colorName, $colorHex, $occasions, $region, $setPieces, $description]);
$newId = $pdo->lastInsertId();
echo json_encode([
'success' => true,
'id'      => (int)$newId,
'message' => 'نمونه‌کار با موفقیت در کاتالوگ عمومی منتشر شد.'
], JSON_UNESCAPED_UNICODE);
} else {
echo json_encode(['success' => false, 'message' => 'متد پشتیبانی نمی‌شود.'], JSON_UNESCAPED_UNICODE);
}