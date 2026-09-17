<?php
// مسیر فایل در هاست: api/tailor.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

/* =========================================================================
   ۱. دریافت اطلاعات پروفایل و آمار زنده خیاط (GET)
   ========================================================================= */
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // ۱. دریافت ۳ خیاط برتر بر اساس بیشترین سفارشات واقعی در دیتابیس
    if ($action === 'top_tailors') {
        $stmt = $pdo->query("
            SELECT u.id as user_id, u.name as user_name, u.city as user_city,
                   p.shop_name, p.tailor_in_charge, p.city as profile_city,
                   p.rating, p.reviews_count, p.avatar_url,
                   COUNT(o.id) as real_orders_count
            FROM users u
            LEFT JOIN tailor_profiles p ON p.user_id = u.id
            LEFT JOIN orders o ON o.tailor_user_id = u.id
            WHERE u.role = 'tailor'
            GROUP BY u.id
            ORDER BY real_orders_count DESC, p.rating DESC, u.id ASC
            LIMIT 3
        ");
        $topTailors = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'tailors' => array_map(function($t) {
                return [
                    'id'             => (int)$t['user_id'],
                    'userId'         => (int)$t['user_id'],
                    'name'           => !empty($t['shop_name']) ? $t['shop_name'] : $t['user_name'],
                    'tailorInCharge' => !empty($t['tailor_in_charge']) ? $t['tailor_in_charge'] : 'مدیر کارگاه',
                    'city'           => !empty($t['profile_city']) ? $t['profile_city'] : (!empty($t['user_city']) ? $t['user_city'] : 'بندرعباس'),
                    'rating'         => (string)($t['rating'] ?? '4.9'),
                    'reviews'        => (int)($t['reviews_count'] ?? 0),
                    'completedOrders'=> (int)($t['real_orders_count'] ?? 0),
                    'avatar'         => $t['avatar_url'] ?? null
                ];
            }, $topTailors)
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // دریافت لیست تمامی خیاطان فعال برای انتخاب توسط مشتری
    if ($action === 'list' || isset($_GET['all'])) {
        $stmt = $pdo->query("SELECT u.id as user_id, u.name as user_name, u.username as user_phone, u.city as user_city,
                                    p.shop_name, p.tailor_in_charge, p.phone as profile_phone, p.city as profile_city,
                                    p.rating, p.reviews_count, p.is_accepting_orders, p.avatar_url, p.specialties
                             FROM users u
                             JOIN tailor_profiles p ON p.user_id = u.id 
                             WHERE u.role = 'tailor'
                             ORDER BY p.rating DESC, p.reviews_count DESC");
        $tailors = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'tailors' => array_map(function($t) {
                return [
                    'id'             => (int)$t['user_id'],
                    'userId'         => (int)$t['user_id'],
                    'name'           => !empty($t['shop_name']) ? $t['shop_name'] : $t['user_name'],
                    'tailorInCharge' => !empty($t['tailor_in_charge']) ? $t['tailor_in_charge'] : 'مدیر کارگاه',
                    'city'           => !empty($t['profile_city']) ? $t['profile_city'] : $t['user_city'],
                    'phone'          => !empty($t['profile_phone']) ? $t['profile_phone'] : $t['user_phone'],
                    'rating'         => (string)($t['rating'] ?? '4.9'),
                    'reviews'        => (string)($t['reviews_count'] ?? '0'),
                    'deliveryDays'   => '۳ تا ۵ روز',
                    'avatar'         => $t['avatar_url'] ?? null,
                    'isAccepting'    => (bool)$t['is_accepting_orders']
                ];
            }, $tailors)
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ─────────────────────────────────────────────────────────────
// دریافت خلاصه تسویه و کیف پول (موجودی قابل تسویه واقعی + تاریخچه)
// ─────────────────────────────────────────────────────────────
if ($action === 'payout_summary') {
    $sumUserId = (int)($_GET['user_id'] ?? 0);
    if ($sumUserId <= 0) {
        echo json_encode(['success' => false, 'message' => 'شناسه کاربر الزامی است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    // ۱) مجموع درآمد تسویه‌شده (فقط سفارش‌های تحویل‌شده = step 5)
$stmtSettled = $pdo->prepare("SELECT COALESCE(SUM(amount),0) AS settled FROM orders WHERE tailor_user_id = ? AND step = 5");
    $stmtSettled->execute([$sumUserId]);
    $settledTotal = (int)$stmtSettled->fetch()['settled'];
    // ۲) مجموع رزروشده در درخواست‌های تسویه (در انتظار + تایید شده)
    $stmtReserved = $pdo->prepare("SELECT COALESCE(SUM(amount),0) AS reserved FROM payout_requests WHERE tailor_user_id = ? AND status IN ('pending','approved')");
    $stmtReserved->execute([$sumUserId]);
    $reservedTotal = (int)$stmtReserved->fetch()['reserved'];
    $available = max(0, $settledTotal - $reservedTotal);
    // ۳) ساخت لیست تراکنش‌های واقعی
    $transactions = [];
    $stmtDelivered = $pdo->prepare("SELECT id, design_title, amount, created_at FROM orders WHERE tailor_user_id = ? AND step = 5 ORDER BY created_at DESC");
    $stmtDelivered->execute([$sumUserId]);
    foreach ($stmtDelivered->fetchAll() as $o) {
        $transactions[] = [
            'id'     => 'INC-' . $o['id'],
            'title'  => 'تسویه نهایی سفارش #' . $o['id'] . ' (' . $o['design_title'] . ')',
            'amount' => (int)$o['amount'],
            'type'   => 'income',
            'date'   => date('Y/m/d', strtotime($o['created_at'])),
            'ts'     => strtotime($o['created_at']),
        ];
    }
    $stmtPayouts = $pdo->prepare("SELECT * FROM payout_requests WHERE tailor_user_id = ? ORDER BY created_at DESC");
    $stmtPayouts->execute([$sumUserId]);
    foreach ($stmtPayouts->fetchAll() as $p) {
        $transactions[] = [
            'id'     => 'PAY-' . $p['id'],
            'title'  => $p['status'] === 'approved'
                ? 'واریز به حساب بانکی (تسویه‌شده)'
                : ($p['status'] === 'pending' ? 'درخواست تسویه (در انتظار واریز)' : 'درخواست تسویه (رد شده)'),
            'amount' => (int)$p['amount'],
            'type'   => $p['status'] === 'approved' ? 'payout' : ($p['status'] === 'pending' ? 'payout_pending' : 'payout_rejected'),
            'date'   => date('Y/m/d', strtotime($p['created_at'])),
            'ts'     => strtotime($p['created_at']),
        ];
    }
    usort($transactions, fn($a, $b) => $b['ts'] - $a['ts']);
    echo json_encode([
        'success' => true,
        'summary' => [
            'settledTotal'  => $settledTotal,
            'reservedTotal' => $reservedTotal,
            'available'     => $available,
        ],
        'transactions' => $transactions,
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$userId = (int)($_GET['user_id'] ?? 2);
// دریافت اطلاعات کاربر و پروفایل با LEFT JOIN (تا خیاط جدید هم بدون خطا لود شود)
    $stmt = $pdo->prepare("SELECT u.id as user_id, u.name as user_name, u.username as user_phone, u.city as user_city,
                                  p.shop_name, p.tailor_in_charge, p.phone as profile_phone, p.city as profile_city,
                                  p.address, p.specialties, p.bio, p.is_accepting_orders, p.bank_name, p.shaba_number, p.card_number, p.onboarding_done, p.avatar_url,
                                  p.rating, p.reviews_count
                           FROM users u
                           LEFT JOIN tailor_profiles p ON p.user_id = u.id 
                           WHERE u.id = ? 
                           ORDER BY p.id DESC LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    $phone = $row['user_phone'] ?? '';
    $fallbackName = !empty($phone) ? ('کاربر ' . substr($phone, -4)) : 'کاربر کارگاه';

    $profile = [
        'shopName'          => !empty($row['shop_name']) ? $row['shop_name'] : (!empty($row['user_name']) ? $row['user_name'] : $fallbackName),
        'tailorInCharge'    => !empty($row['tailor_in_charge']) ? $row['tailor_in_charge'] : 'مدیر کارگاه',
        'phone'             => !empty($row['profile_phone']) ? $row['profile_phone'] : $phone,
        'city'              => !empty($row['profile_city']) ? $row['profile_city'] : (!empty($row['user_city']) ? $row['user_city'] : 'بندرعباس'),
        'address'           => $row['address'] ?? '',
        'specialties'       => !empty($row['specialties']) ? explode(',', $row['specialties']) : [],
        'bio'               => $row['bio'] ?? '',
        'isAcceptingOrders' => isset($row['is_accepting_orders']) ? (bool)$row['is_accepting_orders'] : true,
'bankName'          => !empty($row['bank_name']) ? $row['bank_name'] : 'بانک ملی ایران',
'shabaNumber'       => $row['shaba_number'] ?? '',
'cardNumber'        => $row['card_number'] ?? '',
'onboardingDone'    => (bool)($row['onboarding_done'] ?? 0),
'avatarUrl'         => $row['avatar_url'] ?? null,
'rating'            => (string)($row['rating'] ?? '4.9'),
'reviewsCount'      => (int)($row['reviews_count'] ?? 0)
];

    // محاسبه آمار زنده داشبورد واقعی از جدول orders
    $stmtStats = $pdo->prepare("SELECT
COALESCE(SUM(CASE WHEN step = 5 THEN amount ELSE 0 END), 0) as total_earnings,
COUNT(CASE WHEN step IN (3, 4) THEN 1 END) as in_progress_count,
COUNT(CASE WHEN step = 1 THEN 1 END) as pending_count,
COUNT(CASE WHEN step = 5 THEN 1 END) as completed_count
FROM orders WHERE tailor_user_id = ?");
    $stmtStats->execute([$userId]);
$stats = $stmtStats->fetch();
// شمارنده‌های اونبردینگ: تعداد کل نمونه‌کارها و استوری‌های ثبت‌شده این خیاط
$stmtDesigns = $pdo->prepare("SELECT COUNT(*) FROM designs WHERE user_id = ?");
$stmtDesigns->execute([$userId]);
$designsCount = (int)$stmtDesigns->fetchColumn();
$stmtStories = $pdo->prepare("SELECT COUNT(*) FROM stories WHERE user_id = ?");
$stmtStories->execute([$userId]);
$storiesCount = (int)$stmtStories->fetchColumn();
echo json_encode([
'success' => true,
'profile' => $profile,
'stats'   => [
'totalEarnings'   => (int)($stats['total_earnings'] ?? 0),
'inProgressCount' => (int)($stats['in_progress_count'] ?? 0),
'pendingCount'    => (int)($stats['pending_count'] ?? 0),
'completedCount'  => (int)($stats['completed_count'] ?? 0),
'designsCount'    => $designsCount,
'storiesCount'    => $storiesCount
]
], JSON_UNESCAPED_UNICODE);
exit();

/* =========================================================================
   ۲. عملیات‌های ذخیره و به‌روزرسانی خیاط (POST)
   ========================================================================= */
} elseif ($method === 'POST') {
    $data = getJsonInput();
    $userId = (int)($data['user_id'] ?? 2);
    $action = $data['action'] ?? 'update_profile';

    // ۱. تغییر وضعیت آماده پذیرش سفارش (آنلاین/آفلاین)
    if ($action === 'toggle_accepting') {
        $isAccepting = (int)($data['is_accepting'] ?? 1);
        
        $stmt = $pdo->prepare("INSERT INTO tailor_profiles (user_id, is_accepting_orders) 
                               VALUES (?, ?) 
                               ON DUPLICATE KEY UPDATE is_accepting_orders = ?");
        $stmt->execute([$userId, $isAccepting, $isAccepting]);

        echo json_encode(['success' => true, 'is_accepting' => (bool)$isAccepting], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۲. ویرایش و ذخیره سریع شماره شبا و حساب بانکی (از تب حسابداری)
    if ($action === 'update_bank') {
        $shaba = trim($data['shaba_number'] ?? '');
        $bank  = trim($data['bank_name'] ?? 'بانک ملی ایران');

        $stmt = $pdo->prepare("INSERT INTO tailor_profiles (user_id, shaba_number, bank_name) 
                               VALUES (?, ?, ?) 
                               ON DUPLICATE KEY UPDATE shaba_number = ?, bank_name = ?");
        $stmt->execute([$userId, $shaba, $bank, $shaba, $bank]);
echo json_encode(['success' => true, 'message' => 'اطلاعات حساب بانکی با موفقیت ذخیره شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۲٫۵. ثبت ماندگار تکمیل اونبردینگ (پس از این، کارت راه‌اندازی هرگز نمایش داده نمی‌شود)
if ($action === 'mark_onboarding_done') {
$stmt = $pdo->prepare("INSERT INTO tailor_profiles (user_id, onboarding_done) VALUES (?, 1)
ON DUPLICATE KEY UPDATE onboarding_done = 1");
$stmt->execute([$userId]);
echo json_encode(['success' => true, 'message' => 'اونبردینگ به‌صورت ماندگار ثبت شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ─────────────────────────────────────────────────────────────
// ۳. ثبت درخواست تسویه جدید در جدول payout_requests
// ─────────────────────────────────────────────────────────────
if ($action === 'request_payout') {
    $payUserId = (int)($data['user_id'] ?? 0);
    $amount    = (int)($data['amount'] ?? 0);
    if ($payUserId <= 0 || $amount <= 0) {
        echo json_encode(['success' => false, 'message' => 'مبلغ تسویه معتبر نیست.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    // خواندن شبا و بانک از پروفایل
    $stmtProfile = $pdo->prepare("SELECT shaba_number, bank_name FROM tailor_profiles WHERE user_id = ? LIMIT 1");
    $stmtProfile->execute([$payUserId]);
    $profile = $stmtProfile->fetch();
    $shaba = $profile['shaba_number'] ?? '';
    if (empty($shaba) || strlen($shaba) < 10) {
        echo json_encode(['success' => false, 'message' => 'ابتدا شماره شبای خود را در بخش مالی ثبت کنید.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    // جلوگیری از درخواست تکراری در انتظار
    $stmtPending = $pdo->prepare("SELECT COUNT(*) AS c FROM payout_requests WHERE tailor_user_id = ? AND status = 'pending'");
    $stmtPending->execute([$payUserId]);
    if ((int)$stmtPending->fetch()['c'] > 0) {
        echo json_encode(['success' => false, 'message' => 'یک درخواست تسویه در انتظار واریز دارید؛ تا تعیین تکلیف آن صبر کنید.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    // بررسی موجودی واقعی قابل تسویه
$stmtSettled = $pdo->prepare("SELECT COALESCE(SUM(amount),0) AS settled FROM orders WHERE tailor_user_id = ? AND step = 5");
    $stmtSettled->execute([$payUserId]);
    $settledTotal = (int)$stmtSettled->fetch()['settled'];
    $stmtReserved = $pdo->prepare("SELECT COALESCE(SUM(amount),0) AS reserved FROM payout_requests WHERE tailor_user_id = ? AND status IN ('pending','approved')");
    $stmtReserved->execute([$payUserId]);
    $reservedTotal = (int)$stmtReserved->fetch()['reserved'];
    $available = max(0, $settledTotal - $reservedTotal);
    if ($amount > $available) {
        echo json_encode(['success' => false, 'message' => 'مبلغ درخواستی بیشتر از موجودی قابل تسویه (' . number_format($available) . ' تومان) است.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $stmtInsert = $pdo->prepare("INSERT INTO payout_requests (tailor_user_id, amount, shaba_number, bank_name, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmtInsert->execute([$payUserId, $amount, $shaba, $profile['bank_name'] ?? 'بانک ملی ایران']);
    $newPayoutId = (int)$pdo->lastInsertId();
    // اعلان به خیاط
    $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'درخواست تسویه ثبت شد', ?, 'مالی و بیعانه', '💳', ?)")
        ->execute([$payUserId, 'درخواست تسویه شما به مبلغ ' . number_format($amount) . ' تومان ثبت شد و در انتظار تایید مدیریت است.', (string)$newPayoutId]);
    echo json_encode(['success' => true, 'message' => 'درخواست تسویه ثبت شد و پس از تایید مدیریت واریز خواهد شد.'], JSON_UNESCAPED_UNICODE);
    exit();
}
// ۴. ذخیره کامل فرم تنظیمات کارگاه و پروفایل (از مودال تنظیمات)
    if ($action === 'update_profile') {
        $shopName       = trim($data['shop_name'] ?? '');
        $tailorInCharge = trim($data['tailor_in_charge'] ?? '');
        $phone          = trim($data['phone'] ?? '');
        $city           = trim($data['city'] ?? 'بندرعباس');
        $address        = trim($data['address'] ?? '');
        $specialties    = is_array($data['specialties'] ?? null) ? implode(',', $data['specialties']) : ($data['specialties'] ?? '');
        $bio            = trim($data['bio'] ?? '');
$bankName       = trim($data['bank_name'] ?? 'بانک ملی ایران');
$shabaNumber    = trim($data['shaba_number'] ?? '');
$cardNumber     = trim($data['card_number'] ?? '');
$avatarUrl      = !empty($data['avatar_url']) ? $data['avatar_url'] : null;
$isAccepting    = isset($data['is_accepting_orders']) ? (int)$data['is_accepting_orders'] : 1;
// ذخیره یا به‌روزرسانی امن در دیتابیس (با ستون card_number)
$stmt = $pdo->prepare("INSERT INTO tailor_profiles (user_id, shop_name, tailor_in_charge, phone, city, address, specialties, bio, bank_name, shaba_number, card_number, is_accepting_orders, avatar_url)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
shop_name = VALUES(shop_name),
tailor_in_charge = VALUES(tailor_in_charge),
phone = VALUES(phone),
city = VALUES(city),
address = VALUES(address),
specialties = VALUES(specialties),
bio = VALUES(bio),
bank_name = VALUES(bank_name),
shaba_number = VALUES(shaba_number),
card_number = VALUES(card_number),
is_accepting_orders = VALUES(is_accepting_orders),
avatar_url = COALESCE(VALUES(avatar_url), avatar_url)");
$stmt->execute([$userId, $shopName, $tailorInCharge, $phone, $city, $address, $specialties, $bio, $bankName, $shabaNumber, $cardNumber, $isAccepting, $avatarUrl]);
// هماهنگ‌سازی نام در جدول اصلی users
        if (!empty($shopName)) {
            $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$shopName, $userId]);
        }

        echo json_encode(['success' => true, 'message' => 'اطلاعات کارگاه با موفقیت در دیتابیس ذخیره شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

echo json_encode(['success' => false, 'message' => 'درخواست نامعتبر است.'], JSON_UNESCAPED_UNICODE);