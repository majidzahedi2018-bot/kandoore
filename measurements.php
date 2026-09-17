<?php
// ─────────────────────────────────────────────────────────────
// مسیر فایل در هاست: api/measurements.php
// دفترچه اندازه مشتری: تب‌ها (پروفایل‌ها) با اندازه‌های دلخواه (fields_json)
// ─────────────────────────────────────────────────────────────
require_once __DIR__ . '/config/db.php';

// ─── خود-مایگریشن: ستون fields_json (فقط یک‌بار اجرا می‌شود؛ بدون SQL دستی) ───
try {
    $cols = $pdo->query("SHOW COLUMNS FROM measurement_profiles LIKE 'fields_json'");
    if (!$cols->fetch()) {
        $pdo->exec("ALTER TABLE measurement_profiles ADD COLUMN fields_json TEXT NULL AFTER sleeve");
    }
} catch (Exception $e) {}

// نگاشت برچسب‌های استاندارد → ستون‌های قدیمی (برای هماهنگی با orders.php)
function legacyLabelMap(): array {
    return [
        'دور دمپا (مچ پا)' => 'ankle_cuff',
        'قد دمپای دوزی'    => 'cuff_height',
        'قد کل شلوار'      => 'pant_length',
        'دور باسن'         => 'hip',
        'قد پیراهن'        => 'dress_length',
        'عرض سرشانه'       => 'shoulder',
        'دور سینه'         => 'chest',
        'قد آستین'         => 'sleeve',
    ];
}
// همگام‌سازی فیلدهای استاندارد با ستون‌های قدیمی
function syncLegacyColumns(array $fields): array {
    $map  = legacyLabelMap();
    $cols = [];
    foreach ($fields as $f) {
        $label = trim($f['label'] ?? '');
        $val   = trim($f['value'] ?? '');
        if (isset($map[$label])) $cols[$map[$label]] = $val;
    }
    return $cols;
}

$method = $_SERVER['REQUEST_METHOD'];

// ═══════════════ GET ═══════════════
if ($method === 'GET') {
    $userId    = (int)($_GET['user_id'] ?? 1);
    $actionGet = $_GET['action'] ?? 'profiles';

    // لیست تب‌های لباس سفارشی (قالب + مقادیر شخص)
    if ($actionGet === 'custom_garments') {
        $profileId = (int)($_GET['profile_id'] ?? 0);
        $stmtG = $pdo->prepare("SELECT * FROM measurement_garments WHERE user_id = ? AND profile_id = 0 ORDER BY sort_order, id");
        $stmtG->execute([$userId]);
        $out = [];
        foreach ($stmtG->fetchAll() as $g) {
            $fields = json_decode($g['fields_json'] ?? '[]', true) ?: [];
            $stmtV = $pdo->prepare("SELECT fields_json FROM measurement_garments WHERE user_id = ? AND profile_id = ? AND name = ? LIMIT 1");
            $stmtV->execute([$userId, $profileId, $g['name']]);
            $vRow   = $stmtV->fetch();
            $values = $vRow ? (json_decode($vRow['fields_json'] ?? '[]', true) ?: []) : [];
            $merged = array_map(function($f) use ($values) {
                foreach ($values as $v) { if (($v['label'] ?? '') === ($f['label'] ?? '')) { $f['value'] = $v['value'] ?? ''; break; } }
                return $f;
            }, $fields);
            $out[] = ['id' => (int)$g['id'], 'name' => $g['name'], 'iconEmoji' => $g['icon_emoji'], 'fields' => $merged];
        }
        echo json_encode(['success' => true, 'garments' => $out], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // لیست پروفایل‌ها (تب‌ها) + فیلدهای دلخواه
    $stmt = $pdo->prepare("SELECT * FROM measurement_profiles WHERE user_id = ? ORDER BY is_default DESC, id ASC");
    $stmt->execute([$userId]);
    $profiles = $stmt->fetchAll();
    echo json_encode([
        'success'  => true,
        'profiles' => array_map(function($p) {
            return [
                'id'          => (int)$p['id'],
                'userId'      => (int)$p['user_id'],
                'name'        => $p['name'],
                'ankleCuff'   => $p['ankle_cuff'],
                'cuffHeight'  => $p['cuff_height'],
                'pantLength'  => $p['pant_length'],
                'hip'         => $p['hip'],
                'dressLength' => $p['dress_length'],
                'shoulder'    => $p['shoulder'],
                'chest'       => $p['chest'],
                'sleeve'      => $p['sleeve'],
                'isDefault'   => (bool)$p['is_default'],
                'fields'      => !empty($p['fields_json']) ? (json_decode($p['fields_json'], true) ?: []) : []
            ];
        }, $profiles)
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ═══════════════ POST ═══════════════
$data   = getJsonInput();
$action = $data['action'] ?? 'save';
$userId = (int)resolveUserId($pdo, $data['user_id'] ?? 1);

// ۱) ایجاد پروفایل (تب) جدید با فیلدهای دلخواه
if ($action === 'create') {
    $name       = trim($data['name'] ?? 'پروفایل جدید');
    $fields     = is_array($data['fields'] ?? null) ? $data['fields'] : [];
    $fieldsJson = !empty($fields) ? json_encode($fields, JSON_UNESCAPED_UNICODE) : null;
    $legacy     = syncLegacyColumns($fields);
    $stmt = $pdo->prepare("INSERT INTO measurement_profiles (user_id, name, ankle_cuff, cuff_height, pant_length, hip, dress_length, shoulder, chest, sleeve, fields_json, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([
        $userId, $name,
        $legacy['ankle_cuff']   ?? '22',
        $legacy['cuff_height']  ?? '18',
        $legacy['pant_length']  ?? '95',
        $legacy['hip']          ?? '98',
        $legacy['dress_length'] ?? '115',
        $legacy['shoulder']     ?? '40',
        $legacy['chest']        ?? '92',
        $legacy['sleeve']       ?? '58',
        $fieldsJson
    ]);
    echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'پروفایل اندازه جدید ایجاد شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ۲) ذخیره و به‌روزرسانی ابری (فیلدهای دلخواه + همگام‌سازی ستون‌های استاندارد)
if ($action === 'save') {
    $profileId = (int)($data['id'] ?? 0);
    $fields    = is_array($data['fields'] ?? null) ? $data['fields'] : null;

    // سازگاری رو به عقب: اگر fields نیامد، مقادیر مستقیم قدیمی را بخوان
    if ($fields === null) {
        $fields = [
            ['label' => 'دور دمپا (مچ پا)', 'value' => trim($data['ankle_cuff'] ?? '22')],
            ['label' => 'قد دمپای دوزی',    'value' => trim($data['cuff_height'] ?? '18')],
            ['label' => 'قد کل شلوار',      'value' => trim($data['pant_length'] ?? '95')],
            ['label' => 'دور باسن',         'value' => trim($data['hip'] ?? '98')],
            ['label' => 'قد پیراهن',        'value' => trim($data['dress_length'] ?? '115')],
            ['label' => 'عرض سرشانه',       'value' => trim($data['shoulder'] ?? '40')],
            ['label' => 'دور سینه',         'value' => trim($data['chest'] ?? '92')],
            ['label' => 'قد آستین',         'value' => trim($data['sleeve'] ?? '58')],
        ];
    }
    $legacy     = syncLegacyColumns($fields);
    $fieldsJson = json_encode($fields, JSON_UNESCAPED_UNICODE);

    if ($profileId > 0) {
        $stmt = $pdo->prepare("UPDATE measurement_profiles SET ankle_cuff=?, cuff_height=?, pant_length=?, hip=?, dress_length=?, shoulder=?, chest=?, sleeve=?, fields_json=? WHERE id=? AND user_id=?");
        $stmt->execute([
            $legacy['ankle_cuff']   ?? '22',
            $legacy['cuff_height']  ?? '18',
            $legacy['pant_length']  ?? '95',
            $legacy['hip']          ?? '98',
            $legacy['dress_length'] ?? '115',
            $legacy['shoulder']     ?? '40',
            $legacy['chest']        ?? '92',
            $legacy['sleeve']       ?? '58',
            $fieldsJson,
            $profileId, $userId
        ]);
    } else {
        $stmt = $pdo->prepare("UPDATE measurement_profiles SET ankle_cuff=?, cuff_height=?, pant_length=?, hip=?, dress_length=?, shoulder=?, chest=?, sleeve=?, fields_json=? WHERE user_id=? AND is_default=1");
        $stmt->execute([
            $legacy['ankle_cuff']   ?? '22',
            $legacy['cuff_height']  ?? '18',
            $legacy['pant_length']  ?? '95',
            $legacy['hip']          ?? '98',
            $legacy['dress_length'] ?? '115',
            $legacy['shoulder']     ?? '40',
            $legacy['chest']        ?? '92',
            $legacy['sleeve']       ?? '58',
            $fieldsJson,
            $userId
        ]);
    }
    echo json_encode(['success' => true, 'message' => 'اندازه‌ها با موفقیت در فضای ابری ذخیره شدند.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ۳) حذف پروفایل سفارشی (پیش‌فرض قابل حذف نیست)
if ($action === 'delete') {
    $profileId = (int)($data['id'] ?? 0);
    if ($profileId > 0) {
        $pdo->prepare("DELETE FROM measurement_profiles WHERE id = ? AND user_id = ? AND is_default = 0")->execute([$profileId, $userId]);
    }
    echo json_encode(['success' => true, 'message' => 'پروفایل حذف شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ۴) ایجاد تب لباس سفارشی (قالب با فیلدهای دلخواه)
if ($action === 'create_garment') {
    $name   = trim($data['name'] ?? '');
    $fields = is_array($data['fields'] ?? null) ? $data['fields'] : [];
    if ($name === '' || count($fields) === 0) {
        echo json_encode(['success' => false, 'message' => 'نام لباس و حداقل یک فیلد اندازه الزامی است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $labels = array_map(function($f) {
        $label = is_array($f) ? ($f['label'] ?? '') : (string)$f;
        return ['label' => trim($label), 'value' => ''];
    }, $fields);
    $stmt = $pdo->prepare("INSERT INTO measurement_garments (user_id, profile_id, name, fields_json) VALUES (?, 0, ?, ?)");
    $stmt->execute([$userId, $name, json_encode($labels, JSON_UNESCAPED_UNICODE)]);
    echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'تب جدید ایجاد شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ۵) ذخیره مقادیر یک شخص برای تب سفارشی
if ($action === 'save_garment') {
    $garmentId = (int)($data['garment_id'] ?? 0);
    $profileId = (int)($data['profile_id'] ?? 0);
    $name      = trim($data['name'] ?? '');
    $fields    = is_array($data['fields'] ?? null) ? $data['fields'] : [];
    if ($garmentId <= 0 || $profileId <= 0 || $name === '') {
        echo json_encode(['success' => false, 'message' => 'اطلاعات نامعتبر است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $json = json_encode($fields, JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare("UPDATE measurement_garments SET fields_json = ? WHERE user_id = ? AND profile_id = ? AND name = ? AND id = ?");
    $stmt->execute([$json, $userId, $profileId, $name, $garmentId]);
    if ((int)$stmt->rowCount() === 0) {
        $stmt = $pdo->prepare("INSERT INTO measurement_garments (user_id, profile_id, name, fields_json) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $profileId, $name, $json]);
    }
    echo json_encode(['success' => true, 'message' => 'ذخیره شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ۶) حذف تب سفارشی (قالب + همه مقادیر اشخاص)
if ($action === 'delete_garment') {
    $garmentId = (int)($data['garment_id'] ?? 0);
    $stmt = $pdo->prepare("SELECT name FROM measurement_garments WHERE id = ? AND user_id = ? AND profile_id = 0 LIMIT 1");
    $stmt->execute([$garmentId, $userId]);
    $row = $stmt->fetch();
    if ($row) {
        $pdo->prepare("DELETE FROM measurement_garments WHERE user_id = ? AND (id = ? OR name = ?)")->execute([$userId, $garmentId, $row['name']]);
    }
    echo json_encode(['success' => true, 'message' => 'تب حذف شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}