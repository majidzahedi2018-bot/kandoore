<?php
// مسیر فایل در هاست: api/orders.php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// مهاجرت خودکار: اطمینان از وجود ستون design_id در جدول orders (برای پیوند سفارش به طرح)
try {
    $colsOrd = $pdo->query("SHOW COLUMNS FROM orders LIKE 'design_id'");
    if (!$colsOrd->fetch()) $pdo->exec("ALTER TABLE orders ADD COLUMN design_id INT NULL DEFAULT NULL AFTER design_title");
} catch (Exception $e) {}

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $userId = $_GET['user_id'] ?? null;
    $tailorUserId = $_GET['tailor_user_id'] ?? null;

    // واکشی اطلاعات واقعی کیف پول و بیعانه‌های امانی در جریان
    if ($action === 'wallet_summary' && $userId) {
        $stmtEscrow = $pdo->prepare("
SELECT COALESCE(SUM(deposit_amount), 0) as total_escrow,
COUNT(*) as active_escrow_orders
FROM orders
WHERE user_id = ? AND deposit_status = 'paid' AND step < 5
");
        $stmtEscrow->execute([(int)$userId]);
        $escrowSummary = $stmtEscrow->fetch();

        // دریافت لیست سفارشات فعال دارای امانت
        $stmtActiveOrders = $pdo->prepare("
SELECT id, design_title, tailor_name, deposit_amount, status_text
FROM orders
WHERE user_id = ? AND deposit_status = 'paid' AND step < 5
ORDER BY created_at DESC
");
        $stmtActiveOrders->execute([(int)$userId]);
        $activeOrders = $stmtActiveOrders->fetchAll();

        // دریافت امتیاز باشگاه از جدول users
        $stmtUser = $pdo->prepare("SELECT club_points FROM users WHERE id = ?");
        $stmtUser->execute([(int)$userId]);
        $userPoints = (int)($stmtUser->fetch()['club_points'] ?? 0);

        echo json_encode([
            'success'            => true,
            'totalEscrow'        => (int)($escrowSummary['total_escrow'] ?? 0),
            'activeEscrowCount'  => (int)($escrowSummary['active_escrow_orders'] ?? 0),
            'clubPoints'         => $userPoints,
            'activeEscrowOrders' => array_map(function($o) {
                return [
                    'orderId'       => $o['id'],
                    'designTitle'   => $o['design_title'],
                    'tailorName'    => $o['tailor_name'],
                    'depositAmount' => (int)$o['deposit_amount'],
                    'statusText'    => $o['status_text']
                ];
            }, $activeOrders)
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($tailorUserId) {
        $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name, u.username as customer_phone,
u.avatar_url as customer_avatar,
mp.name as measurement_profile_name, mp.ankle_cuff, mp.cuff_height,
mp.pant_length, mp.hip, mp.dress_length, mp.shoulder, mp.chest, mp.sleeve
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN measurement_profiles mp ON o.measurement_profile_id = mp.id
WHERE o.tailor_user_id = ?
ORDER BY o.created_at DESC");
// (تغییری در کوئری بالا نیست، فقط در خروجی آرایه زیر اضافه می‌شود)
        $stmt->execute([(int)$tailorUserId]);
    } elseif ($userId) {
        $stmt = $pdo->prepare("SELECT o.*, 
                                      tu.avatar_url as tailor_avatar,
                                      mp.name as measurement_profile_name, mp.ankle_cuff, mp.cuff_height,
                                      mp.pant_length, mp.hip, mp.dress_length, mp.shoulder, mp.chest, mp.sleeve
                               FROM orders o 
                               LEFT JOIN users tu ON o.tailor_user_id = tu.id
                               LEFT JOIN measurement_profiles mp ON o.measurement_profile_id = mp.id
                               WHERE o.user_id = ? 
                               ORDER BY o.created_at DESC");
        $stmt->execute([(int)$userId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
    }
    
    $orders = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'orders' => array_map(function($o) {
            return [
'id'                    => $o['id'],
'userId'                => (int)$o['user_id'],
'tailorUserId'          => (int)$o['tailor_user_id'],
'customerName'          => $o['customer_name'] ?? 'مشتری کندوره',
'customerPhone'         => $o['customer_phone'] ?? '',
'customerAvatar'        => $o['customer_avatar'] ?? null,
'tailorAvatar'          => $o['tailor_avatar'] ?? null,
'designTitle'           => $o['design_title'],
'designId'              => (int)($o['design_id'] ?? 0),
'designImage'           => $o['design_image'] ?? null,
'tailorName'            => $o['tailor_name'],
                'amount'                => (int)$o['amount'],
                'depositAmount'         => (int)$o['deposit_amount'],
                'remainingAmount'       => (int)$o['remaining_amount'],
                'step'                  => (int)$o['step'],
                'statusText'            => $o['status_text'],
                'deliveryCode'          => (string)($o['delivery_code'] ?? '8429'),
                'deliveryMethod'        => $o['delivery_method'] ?? 'courier',
'deliveryAddress'       => $o['delivery_address'] ?? '',
'depositStatus'         => $o['deposit_status'] ?? 'unpaid',
'fabricMode'            => $o['fabric_mode'] ?? 'tailor',
                'selectedColor'         => $o['selected_color'] ?? null,
                'selectedMaterial'      => $o['selected_material'] ?? null,
                'selectedThread'        => $o['selected_thread'] ?? null,
                'measurementProfileId'  => isset($o['measurement_profile_id']) ? (int)$o['measurement_profile_id'] : null,
                'measurements'          => [
                    'profileName' => $o['measurement_profile_name'] ?? 'سایز پیش‌فرض',
                    'ankleCuff'   => $o['ankle_cuff'] ?? '22',
                    'cuffHeight'  => $o['cuff_height'] ?? '18',
                    'pantLength'  => $o['pant_length'] ?? '95',
                    'hip'         => $o['hip'] ?? '98',
                    'dressLength' => $o['dress_length'] ?? '115',
                    'shoulder'    => $o['shoulder'] ?? '40',
                    'chest'       => $o['chest'] ?? '92',
                    'sleeve'      => $o['sleeve'] ?? '58'
                ],
                'date'                  => date('Y/m/d', strtotime($o['created_at']))
            ];
        }, $orders)
    ], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'create';

    // ۱. تغییر مرحله دوخت توسط خیاط (قدم ۱ تا ۴// ۱. تغییر مرحله دوخت توسط خیاط (قدم ۱ تا ۴)
    if ($action === 'update_step') {
$orderId = $data['order_id'] ?? '';
$newStep = (int)($data['step'] ?? 3);
$tailorUserId = resolveUserId($pdo, $data['tailor_user_id'] ?? 0);
if ($tailorUserId === null) { echo json_encode(['success' => false, 'message' => 'برای این عملیات باید وارد شوید.'], JSON_UNESCAPED_UNICODE); exit(); }
$statusTexts = [
3 => 'بیعانه دریافت شد — در حال دوخت و گلابتون‌دوزی',
4 => 'دوخت نهایی و کنترل کیفیت — آماده تحویل',
5 => 'تحویل داده شده و تسویه شد'
];
// قفل ایمنی: تا بیعانه واریز نشده، مرحله تولید تغییر نمی‌کند
$stmtCur = $pdo->prepare("SELECT deposit_status, tailor_user_id FROM orders WHERE id = ? LIMIT 1");
$stmtCur->execute([$orderId]);
$cur = $stmtCur->fetch();
if (!$cur) { echo json_encode(['success' => false, 'message' => 'سفارش یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
// بررسی مالکیت: فقط خیاط صاحب سفارش می‌تواند مرحله را تغییر دهد
if ($tailorUserId <= 0 || (int)$cur['tailor_user_id'] !== $tailorUserId) {
echo json_encode(['success' => false, 'message' => 'شما مجوز تغییر مرحله این سفارش را ندارید.'], JSON_UNESCAPED_UNICODE);
exit();
}
if ($newStep >= 3 && ($cur['deposit_status'] ?? 'unpaid') !== 'paid') {
echo json_encode(['success' => false, 'message' => 'تا واریز بیعانه توسط مشتری، امکان تغییر مرحله تولید وجود ندارد.'], JSON_UNESCAPED_UNICODE);
exit();
}
        $newStatus = $statusTexts[$newStep] ?? 'در حال دوخت';

        $stmt = $pdo->prepare("UPDATE orders SET step = ?, status_text = ? WHERE id = ?");
        $stmt->execute([$newStep, $newStatus, $orderId]);

        // ارسال خودکار اعلان به مشتری
        $stmtOrder = $pdo->prepare("SELECT user_id, design_title FROM orders WHERE id = ? LIMIT 1");
        $stmtOrder->execute([$orderId]);
        $orderInfo = $stmtOrder->fetch();
        if ($orderInfo) {
            $notifTitle = "سفارش #{$orderId} به‌روزرسانی شد";
            $notifMsg = "وضعیت سفارش «{$orderInfo['design_title']}» به «{$newStatus}» تغییر یافت.";
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'وضعیت سفارش‌ها', '👗', ?)")
                ->execute([$orderInfo['user_id'], $notifTitle, $notifMsg, $orderId]);
        }

        echo json_encode([
            'success'     => true,
            'step'        => $newStep,
            'status_text' => $newStatus,
            'message'     => 'وضعیت سفارش به‌روزرسانی شد.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۱٫۵. پذیرش سفارش توسط خیاط (مرحله ۱ → ۲)
if ($action === 'approve_order') {
$orderId = $data['order_id'] ?? '';
$tailorUserId = (int)($data['tailor_user_id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND tailor_user_id = ?");
$stmt->execute([$orderId, $tailorUserId]);
$order = $stmt->fetch();
if (!$order) { echo json_encode(['success' => false, 'message' => 'سفارش یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
if ((int)$order['step'] !== 1) { echo json_encode(['success' => false, 'message' => 'این سفارش قبلاً بررسی شده است.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("UPDATE orders SET step = 2, status_text = 'تایید خیاط — در انتظار واریز بیعانه' WHERE id = ?")->execute([$orderId]);
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'وضعیت سفارش‌ها', '✅', ?)")
->execute([(int)$order['user_id'], "سفارش #{$orderId} تایید شد", "خیاط سفارش شما را پذیرفت؛ لطفاً بیعانه ۳۰٪ را پرداخت کنید تا دوخت آغاز شود.", $orderId]);
echo json_encode(['success' => true, 'step' => 2, 'status_text' => 'تایید خیاط — در انتظار واریز بیعانه', 'message' => 'سفارش پذیرفته شد و مشتری برای پرداخت بیعانه مطلع شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۱٫۶. رد سفارش توسط خیاط (مرحله ۱ → ۶)
if ($action === 'reject_order') {
$orderId = $data['order_id'] ?? '';
$tailorUserId = (int)($data['tailor_user_id'] ?? 0);
$reason = trim($data['reason'] ?? 'ظرفیت کارگاه تکمیل است.');
$stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND tailor_user_id = ?");
$stmt->execute([$orderId, $tailorUserId]);
$order = $stmt->fetch();
if (!$order) { echo json_encode(['success' => false, 'message' => 'سفارش یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
if ((int)$order['step'] !== 1) { echo json_encode(['success' => false, 'message' => 'این سفارش قبلاً بررسی شده است.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("UPDATE orders SET step = 6, status_text = 'رد شده توسط خیاط' WHERE id = ?")->execute([$orderId]);
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'وضعیت سفارش‌ها', '❌', ?)")
->execute([(int)$order['user_id'], "سفارش #{$orderId} رد شد", "متاسفانه خیاط امکان پذیرش سفارش را نداشت؛ دلیل: {$reason}", $orderId]);
echo json_encode(['success' => true, 'step' => 6, 'status_text' => 'رد شده توسط خیاط', 'message' => 'سفارش رد شد و به مشتری اطلاع داده شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۱٫۷. پرداخت بیعانه توسط مشتری (مرحله ۲ → ۳)
if ($action === 'pay_deposit') {
$orderId = $data['order_id'] ?? '';
$userId = resolveUserId($pdo, $data['user_id'] ?? 0);
if ($userId === null) { echo json_encode(['success' => false, 'message' => 'برای این عملیات باید وارد شوید.'], JSON_UNESCAPED_UNICODE); exit(); }
$stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
$stmt->execute([$orderId, $userId]);
$order = $stmt->fetch();
if (!$order) { echo json_encode(['success' => false, 'message' => 'سفارش یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
if ((int)$order['step'] !== 2) { echo json_encode(['success' => false, 'message' => 'این سفارش در انتظار پرداخت بیعانه نیست.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("UPDATE orders SET step = 3, status_text = 'بیعانه دریافت شد — در حال تهیه پارچه و دوخت', deposit_status = 'paid' WHERE id = ?")->execute([$orderId]);
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'مالی و بیعانه', '🛡️', ?)")
->execute([(int)$order['tailor_user_id'], "بیعانه سفارش #{$orderId} واریز شد", "بیعانه ۳۰٪ به مبلغ " . number_format((int)$order['deposit_amount']) . " تومان در حساب امانی محفوظ شد؛ دوخت را آغاز کنید.", $orderId]);
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'مالی و بیعانه', '🛡️', ?)")
->execute([$userId, "پرداخت بیعانه #{$orderId} با موفقیت انجام شد", "مبلغ شما در حساب امانی کَندوره محفوظ است و پس از تحویل آزاد می‌شود.", $orderId]);
echo json_encode(['success' => true, 'step' => 3, 'status_text' => 'بیعانه دریافت شد — در حال تهیه پارچه و دوخت', 'message' => 'بیعانه با موفقیت پرداخت شد و سفارش وارد نوبت دوخت شد.'], JSON_UNESCAPED_UNICODE);
exit();
}
// ۲. تأیید کد محرمانه تحویل توسط خیاط و آزادسازی بیعانه
    if ($action === 'verify_delivery_code') {
$orderId = $data['order_id'] ?? '';
$code = trim($data['code'] ?? '');
$tailorUserId = (int)($data['tailor_user_id'] ?? 0);
if ($tailorUserId === null) { echo json_encode(['success' => false, 'message' => 'برای این عملیات باید وارد شوید.'], JSON_UNESCAPED_UNICODE); exit(); }

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND tailor_user_id = ?");
        $stmt->execute([$orderId, $tailorUserId]);
        $order = $stmt->fetch();

        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'سفارش یافت نشد.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        if ((string)$order['delivery_code'] !== (string)$code) {
            echo json_encode(['success' => false, 'message' => 'کد تحویل ۴ رقمی وارد شده اشتباه است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // تغییر مرحله به تحویل نهایی و تسویه
$stmt = $pdo->prepare("UPDATE orders SET step = 5, status_text = 'تحویل داده شده و تسویه شد', deposit_status = 'paid' WHERE id = ?");
$stmt->execute([$orderId]);
// اعلان به مشتری: تحویل کامل شد + دعوت به ثبت نظر
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'سفارش شما تحویل شد 🎉', ?, 'وضعیت سفارش‌ها', '✅', ?)")
->execute([(int)$order['user_id'], "سفارش #{$orderId} تحویل و تسویه شد؛ با ثبت نظر، ۵۰ امتیاز باشگاه بگیرید.", $orderId]);
echo json_encode([
            'success' => true,
            'message' => 'کد تحویل با موفقیت تأیید شد و مبلغ سفارش به حساب کارگاه منظور گردید.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۳. ثبت سفارش جدید توسط مشتری با تمام جزئیات شخصی‌سازی// ۳. ثبت سفارش جدید توسط مشتری با تمام جزئیات شخصی‌سازی و اتصال اندازه
    $orderId              = 'KD-' . rand(1000, 9999);
$userId               = (int)($data['user_id'] ?? 0);
$tailorUserId         = (int)($data['tailor_user_id'] ?? 0);
$tailorName           = trim($data['tailor_name'] ?? '');
if ($userId <= 0 || $tailorUserId <= 0) { echo json_encode(['success' => false, 'message' => 'اطلاعات مشتری یا کارگاه ناقص است.'], JSON_UNESCAPED_UNICODE); exit(); }
if ($tailorName === '') { $tailorName = 'کارگاه خیاطی'; }
    $designTitle          = trim($data['design_title'] ?? 'کندوره زری‌بافی');
$designId             = (int)($data['design_id'] ?? 0);
    $amount               = (int)($data['amount'] ?? 520000);
    $deposit              = (int)($data['deposit'] ?? round($amount * 0.3));
    $remaining            = $amount - $deposit;
    $deliveryMethod       = trim($data['delivery_method'] ?? 'courier');
$deliveryAddress      = trim($data['delivery_address'] ?? 'آدرس ثبت نشده توسط مشتری');
$fabricMode           = trim($data['fabric_mode'] ?? 'tailor');
$selectedColor        = !empty($data['selected_color']) ? trim($data['selected_color']) : null;
    $selectedMaterial     = !empty($data['selected_material']) ? trim($data['selected_material']) : null;
    $selectedThread       = !empty($data['selected_thread']) ? trim($data['selected_thread']) : null;
$measurementProfileId = !empty($data['measurement_profile_id']) ? (int)$data['measurement_profile_id'] : null;
$designImage          = !empty($data['design_image']) ? trim($data['design_image']) : null;
$deliveryCode         = (string)rand(1000, 9999);
$deliveryAddress      = trim($data['delivery_address'] ?? '');
$stmt = $pdo->prepare("INSERT INTO orders (id, user_id, tailor_user_id, tailor_name, design_title, design_id, design_image, amount, deposit_amount, remaining_amount, delivery_method, delivery_address, fabric_mode, selected_color, selected_material, selected_thread, measurement_profile_id, step, status_text, delivery_code, deposit_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'در انتظار تایید خیاط', ?, 'unpaid')");
$stmt->execute([$orderId, $userId, $tailorUserId, $tailorName, $designTitle, $designId > 0 ? $designId : null, $designImage, $amount, $deposit, $remaining, $deliveryMethod, $deliveryAddress, $fabricMode, $selectedColor, $selectedMaterial, $selectedThread, $measurementProfileId, $deliveryCode]);

    // ثبت اعلان دریافت سفارش جدید برای خیاط
    $notifTailor = "سفارش جدید #{$orderId} در انتظار تایید شما";
$notifTailorMsg = "سفارش دوخت «{$designTitle}» ثبت شده؛ لطفاً در کارتابل، پذیرش یا رد خود را اعلام کنید.";
    $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'وضعیت سفارش‌ها', '🧵', ?)")
        ->execute([$tailorUserId, $notifTailor, $notifTailorMsg, $orderId]);

    // ثبت اعلان تایید بیعانه برای مشتری
    $notifCustomer = "سفارش #{$orderId} ثبت شد";
$notifCustomerMsg = "سفارش شما در انتظار تایید خیاط است؛ پس از پذیرش، دکمه پرداخت بیعانه برای شما فعال می‌شود.";
    $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'مالی و بیعانه', '🛡️', ?)")
->execute([$userId, $notifCustomer, $notifCustomerMsg, $orderId]);
// اعلان به مدیریت: سفارش جدید ثبت شد
$admin = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")->fetch();
if ($admin) {
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'سفارش جدید ثبت شد 🛒', ?, 'وضعیت سفارش‌ها', '🛒', ?)")
->execute([(int)$admin['id'], "سفارش #{$orderId} («{$designTitle}») توسط مشتری ثبت شد.", $orderId]);
}
echo json_encode([
        'success'  => true,
        'order_id' => $orderId,
        'message'  => 'سفارش با موفقیت ثبت شد.'
    ], JSON_UNESCAPED_UNICODE);
}