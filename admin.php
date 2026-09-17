<?php
// مسیر فایل در هاست: api/admin.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
http_response_code(200);
exit;
}
// ─── امنیت مرحله ۲: نشست سروری پنل مدیریت ───
session_start();
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
$data = getJsonInput();
$action = $data['action'] ?? '';
// ─── امنیت مرحله ۲: هر اکشنی جز login نیازمند نشست معتبر ادمین ───
if ($action !== 'login' && empty($_SESSION['kandooreh_admin'])) {
echo json_encode(['success' => false, 'message' => 'نشست مدیریت منقضی شده است؛ مجدداً وارد شوید.'], JSON_UNESCAPED_UNICODE);
exit;
}
// خروج از نشست مدیریت
if ($action === 'logout') {
unset($_SESSION['kandooreh_admin']);
echo json_encode(['success' => true, 'message' => 'از نشست مدیریت خارج شدید.'], JSON_UNESCAPED_UNICODE);
exit;
}
// ۱. ورود ادمین با نام کاربری و پسورد (بدون نیاز به پیامک)
    if ($action === 'login') {
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'نام کاربری و رمز عبور الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin' LIMIT 1");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        // بررسی تطابق پسورد فقط با هش ذخیره‌شده در دیتابیس
$isPasswordValid = false;
if ($admin && !empty($admin['password']) && password_verify($password, $admin['password'])) {
$isPasswordValid = true;
}
if ($isPasswordValid) {
// ثبت نشست ادمین در سشن سرور
$_SESSION['kandooreh_admin'] = [
'id'       => (int)$admin['id'],
'username' => $admin['username'],
'login_at' => time()
];
unset($admin['password']);
            $token = bin2hex(random_bytes(24));
            echo json_encode([
                'success' => true,
                'admin'   => $admin,
                'token'   => $token,
                'message' => 'خوش آمدید، ورود مدیریت با موفقیت انجام شد.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['success' => false, 'message' => 'نام کاربری یا رمز عبور اشتباه است.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۲. تایید یا رد درخواست تسویه حساب خیاط
    if ($action === 'update_payout_status') {
        $payoutId     = (int)($data['payout_id'] ?? 0);
        $status       = in_array($data['status'] ?? '', ['approved', 'rejected']) ? $data['status'] : 'pending';
        $trackingCode = trim($data['tracking_code'] ?? '');

        $stmt = $pdo->prepare("UPDATE payout_requests SET status = ?, tracking_code = ? WHERE id = ?");
$stmt->execute([$status, $trackingCode, $payoutId]);
// اعلان به خیاط: نتیجه درخواست تسویه
$req = $pdo->prepare("SELECT tailor_user_id, amount FROM payout_requests WHERE id = ?");
$req->execute([$payoutId]);
$prow = $req->fetch();
if ($prow) {
if ($status === 'approved') {
$nTitle = 'تسویه حساب تایید شد 💰';
$nMsg = "درخواست تسویه شما به مبلغ " . number_format((int)$prow['amount']) . " تومان تایید شد" . ($trackingCode ? "؛ کد پیگیری: {$trackingCode}" : '') . ".";
$nIcon = '💰';
} else {
$nTitle = 'درخواست تسویه رد شد ⚠️';
$nMsg = 'درخواست تسویه شما رد شد؛ برای جزئیات با پشتیبانی در تماس باشید.';
$nIcon = '⚠️';
}
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, ?, ?, 'مالی و بیعانه', ?, ?)")
->execute([(int)$prow['tailor_user_id'], $nTitle, $nMsg, $nIcon, (string)$payoutId]);
}
echo json_encode(['success' => true, 'message' => 'وضعیت تسویه حساب به‌روزرسانی شد.'], JSON_UNESCAPED_UNICODE);
exit;
    }

    // ۳. تغییر وضعیت تایید هویت خیاط توسط ادمین
    if ($action === 'toggle_tailor_verification') {
        $tailorUserId = (int)($data['user_id'] ?? 0);
        $isVerified   = (int)($data['is_verified'] ?? 1);

        $stmt = $pdo->prepare("UPDATE tailor_profiles SET is_verified = ? WHERE user_id = ?");
        $stmt->execute([$isVerified, $tailorUserId]);

        echo json_encode(['success' => true, 'message' => 'وضعیت تایید خیاط تغییر یافت.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

   // ۴. تغییر مرحله سفارش توسط مدیریت
    if ($action === 'update_order_step') {
        $orderId = trim($data['order_id'] ?? '');
        $step    = (int)($data['step'] ?? 1);

        $statusMap = [
1 => 'در انتظار تایید خیاط',
2 => 'تایید خیاط — در انتظار واریز بیعانه',
3 => 'در حال دوخت و گلابتون‌دوزی',
4 => 'آماده تحویل به مشتری',
5 => 'تحویل داده شده و تسویه شد',
6 => 'لغو شده توسط مدیریت'
];
        $statusText = $statusMap[$step] ?? 'در حال انجام';

        $stmt = $pdo->prepare("UPDATE orders SET step = ?, status_text = ? WHERE id = ?");
        $stmt->execute([$step, $statusText, $orderId]);

        echo json_encode(['success' => true, 'message' => 'وضعیت سفارش با موفقیت به‌روزرسانی شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۵. ویرایش مشخصات طرح یا تغییر وضعیت فعال/غیرفعال توسط ادمین
    if ($action === 'update_design') {
        $designId     = (int)($data['id'] ?? 0);
        $title        = trim($data['title'] ?? '');
        $price        = (int)($data['price'] ?? 0);
        $deliveryDays = trim($data['delivery_days'] ?? '۳ تا ۵ روز');
        $materialsBom = trim($data['materials_bom'] ?? '');

        $stmt = $pdo->prepare("UPDATE designs SET title = ?, price = ?, delivery_days = ?, materials_bom = ? WHERE id = ?");
        $stmt->execute([$title, $price, $deliveryDays, $materialsBom, $designId]);

        echo json_encode(['success' => true, 'message' => 'مشخصات طرح با موفقیت ذخیره شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۶. ثبت طرح جدید شاخص توسط مدیریت
    if ($action === 'create_admin_design') {
        $title        = trim($data['title'] ?? 'طرح فاخر کَندوره');
        $category     = trim($data['category'] ?? 'کندوره');
        $tailorName   = trim($data['tailor_name'] ?? 'مزون مرکزی کَندوره');
        $city         = trim($data['city'] ?? 'بندرعباس');
        $price        = (int)($data['price'] ?? 520000);
        $deliveryDays = trim($data['delivery_days'] ?? '۳ تا ۵ روز');
        $imageUrl     = trim($data['image_url'] ?? 'bg-[#0E8388]');
        $materialsBom = trim($data['materials_bom'] ?? '۲٫۵ متر پارچه کرپ • ۶ متر شک • ۲ عدد نخ گلابتون');
        $tags         = is_array($data['tags'] ?? null) ? implode(',', $data['tags']) : 'گلابتون‌دوزی اعلا,شک ۶ سانت,طرح فاخر';

        $stmt = $pdo->prepare("INSERT INTO designs (user_id, title, category, tailor_name, city, price, delivery_days, color_preview, materials_bom, tags) VALUES (2, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $category, $tailorName, $city, $price, $deliveryDays, $imageUrl, $materialsBom, $tags]);
        $newId = $pdo->lastInsertId();

        echo json_encode(['success' => true, 'id' => (int)$newId, 'message' => 'طرح شاخص با موفقیت در کاتالوگ منتشر شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۷. ارسال پاسخ ادمین به تیکت یا تغییر وضعیت به بسته شده
    if ($action === 'reply_ticket') {
        $ticketId   = (int)($data['ticket_id'] ?? 0);
        $adminReply = trim($data['admin_reply'] ?? '');
        $status     = in_array($data['status'] ?? '', ['answered', 'closed', 'open']) ? $data['status'] : 'answered';
        $adminName  = trim($data['admin_name'] ?? 'مدیریت کَندوره');

        if ($ticketId > 0) {
            $stmt = $pdo->prepare("UPDATE support_tickets SET admin_reply = ?, admin_name = ?, status = ?, replied_at = NOW() WHERE id = ?");
            $stmt->execute([$adminReply, $adminName, $status, $ticketId]);

            // ثبت اعلان برای کاربر
            $ticket = $pdo->query("SELECT user_id, subject FROM support_tickets WHERE id = $ticketId")->fetch();
            if ($ticket) {
                $notifMsg = "پاسخ جدید برای تیکت «{$ticket['subject']}» ارسال شد.";
                $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'پاسخ پشتیبانی', ?, 'پیام‌های سیستمی', '🎧', ?)")
                    ->execute([$ticket['user_id'], $notifMsg, (string)$ticketId]);
            }

            echo json_encode(['success' => true, 'message' => 'پاسخ تیکت با موفقیت ثبت و ارسال شد.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
}

if ($method === 'GET') {
$action = $_GET['action'] ?? 'stats';
// ─── امنیت مرحله ۲: گزارش‌های ادمین نیازمند نشست معتبر ───
if (empty($_SESSION['kandooreh_admin'])) {
echo json_encode(['success' => false, 'message' => 'نشست مدیریت منقضی شده است؛ مجدداً وارد شوید.'], JSON_UNESCAPED_UNICODE);
exit;
}
// ۰-۱. نقشه وضعیت آنلاین + لیست کامل کاربران برای تب «کاربران آنلاین»
if ($action === 'presence_map') {
$rows = $pdo->query("SELECT user_id, last_seen, typing_at FROM user_presence")->fetchAll();
$map = [];
foreach ($rows as $r) {
$map[(int)$r['user_id']] = [
'online'   => (time() - strtotime($r['last_seen'])) <= 90,
'lastSeen' => $r['last_seen'],
'typing'   => $r['typing_at'] ? (time() - strtotime($r['typing_at'])) <= 6 : false,
];
}
$users = $pdo->query("
SELECT u.id, u.name, u.username, u.role, u.city, u.avatar_url, tp.shop_name,
(SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS customer_orders,
(SELECT COUNT(*) FROM orders o WHERE o.tailor_user_id = u.id) AS tailor_orders
FROM users u
LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
WHERE u.role IN ('customer','tailor') AND u.deleted_at IS NULL
ORDER BY u.id DESC
")->fetchAll();
$outUsers = [];
$stats = ['total'=>0,'online'=>0,'offline'=>0,'typing'=>0,'tailorOnline'=>0,'customerOnline'=>0];
foreach ($users as $u) {
$id = (int)$u['id'];
$p = $map[$id] ?? ['online'=>false,'lastSeen'=>null,'typing'=>false];
$outUsers[] = [
'id'=>$id, 'name'=>$u['name'], 'username'=>$u['username'], 'role'=>$u['role'],
'city'=>$u['city'], 'avatarUrl'=>$u['avatar_url'], 'shopName'=>$u['shop_name'],
'online'=>(bool)$p['online'], 'lastSeen'=>$p['lastSeen'], 'typing'=>(bool)$p['typing'],
'customerOrders'=>(int)$u['customer_orders'], 'tailorOrders'=>(int)$u['tailor_orders'],
];
$stats['total']++;
if ($p['online']) { $stats['online']++; if ($u['role']==='tailor') $stats['tailorOnline']++; if ($u['role']==='customer') $stats['customerOnline']++; }
else { $stats['offline']++; }
if ($p['typing']) $stats['typing']++;
}
echo json_encode(['success'=>true,'presence'=>$map,'users'=>$outUsers,'stats'=>$stats], JSON_UNESCAPED_UNICODE);
exit;
}
// ۰-۲. گزارش فعالیت ورود/خروج یک کاربر (تحلیل ادمین)
if ($action === 'user_activity') {
$userId = (int)($_GET['user_id'] ?? 0);
$stmt = $pdo->prepare("SELECT id, role, event_type, ip, created_at FROM user_activity_log WHERE user_id = ? ORDER BY id DESC LIMIT 60");
$stmt->execute([$userId]);
echo json_encode(['success' => true, 'activities' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
exit;
}

// ۱. دریافت آمار جامع و شاخص‌های کلیدی پلتفرم
if ($action === 'stats') {
        // کل درآمد و مبالغ امانی
        $stmtFinance = $pdo->query("
SELECT
COALESCE(SUM(amount), 0) as total_volume,
COALESCE(SUM(CASE WHEN step IN (3,4) AND deposit_status = 'paid' THEN deposit_amount ELSE 0 END), 0) as total_escrow,
COALESCE(SUM(CASE WHEN step = 5 THEN amount ELSE 0 END), 0) as total_released
FROM orders
");
        $finance = $stmtFinance->fetch();

        // شمارش تعداد کاربران و سفارشات
        $totalOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $activeOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE step < 5 AND step != 6")->fetchColumn();
        $totalCustomers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'customer'")->fetchColumn();
        $totalTailors = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'tailor'")->fetchColumn();
        $totalDesigns = (int)$pdo->query("SELECT COUNT(*) FROM designs")->fetchColumn();

        echo json_encode([
            'success' => true,
            'stats' => [
                'totalVolume'    => (int)$finance['total_volume'],
                'totalEscrow'    => (int)$finance['total_escrow'],
                'totalReleased'  => (int)$finance['total_released'],
                'totalOrders'    => $totalOrders,
                'activeOrders'   => $activeOrders,
                'totalCustomers' => $totalCustomers,
                'totalTailors'   => $totalTailors,
                'totalDesigns'   => $totalDesigns
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۲. دریافت لیست کامل سفارشات پلتفرم برای ادمین
    if ($action === 'all_orders') {
        $stmt = $pdo->query("
            SELECT o.*, u.name as customer_name, u.username as customer_phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'orders' => array_map(function($o) {
                return [
                    'id'               => $o['id'],
                    'userId'           => (int)$o['user_id'],
                    'customerName'     => $o['customer_name'] ?? 'مشتری کندوره',
                    'customerPhone'    => $o['customer_phone'] ?? '',
                    'tailorUserId'     => (int)$o['tailor_user_id'],
                    'tailorName'       => $o['tailor_name'],
                    'designTitle'      => $o['design_title'],
                    'amount'           => (int)$o['amount'],
                    'depositAmount'    => (int)$o['deposit_amount'],
                    'remainingAmount'  => (int)$o['remaining_amount'],
                    'step'             => (int)$o['step'],
                    'statusText'       => $o['status_text'],
                    'deliveryCode'     => (string)($o['delivery_code'] ?? '8429'),
                    'selectedColor'    => $o['selected_color'],
                    'selectedMaterial' => $o['selected_material'],
                    'selectedThread'   => $o['selected_thread'],
                    'date'             => date('Y/m/d H:i', strtotime($o['created_at']))
                ];
            }, $orders)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۳. دریافت لیست خیاطان برای مدیریت، تایید یا بررسی حساب
if ($action === 'all_tailors') {
    $stmt = $pdo->query("
        SELECT 
            u.id as user_id, 
            MAX(u.name) as user_name, 
            MAX(u.username) as user_phone, 
            MAX(u.city) as user_city,
            MAX(u.created_at) as user_created_at,
            MAX(p.shop_name) as shop_name, 
            MAX(p.tailor_in_charge) as tailor_in_charge,
            MAX(p.phone) as profile_phone, 
            MAX(p.city) as profile_city,
            MAX(p.rating) as rating, 
            MAX(p.reviews_count) as reviews_count,
            MAX(p.is_verified) as is_verified, 
            MAX(p.is_accepting_orders) as is_accepting_orders,
            MAX(p.shaba_number) as shaba_number, 
            MAX(p.bank_name) as bank_name, 
            MAX(p.avatar_url) as avatar_url,
            COUNT(o.id) as orders_count
        FROM users u
        LEFT JOIN tailor_profiles p ON p.user_id = u.id
        LEFT JOIN orders o ON o.tailor_user_id = u.id
        WHERE u.role = 'tailor'
        GROUP BY u.id
        ORDER BY u.id DESC
    ");
    $tailors = $stmt->fetchAll();
    echo json_encode([
        'success' => true,
        'tailors' => array_map(function($t) use ($pdo) {
            return [
                'userId'         => (int)$t['user_id'],
                'name'           => !empty($t['shop_name']) ? $t['shop_name'] : $t['user_name'],
                'tailorInCharge' => !empty($t['tailor_in_charge']) ? $t['tailor_in_charge'] : 'مدیر کارگاه',
                'phone'          => !empty($t['profile_phone']) ? $t['profile_phone'] : $t['user_phone'],
                'city'           => !empty($t['profile_city']) ? $t['profile_city'] : $t['user_city'],
                'rating'         => (string)($t['rating'] ?? '5.0'),
                'reviews'        => (int)($t['reviews_count'] ?? 0),
                'ordersCount'    => (int)($t['orders_count'] ?? 0),
                'isVerified'     => (bool)($t['is_verified'] ?? true),
                'isAccepting'    => (bool)($t['is_accepting_orders'] ?? true),
                'shabaNumber'    => $t['shaba_number'] ?? '',
                'bankName'       => $t['bank_name'] ?? 'بانک ملی ایران',
                'avatar'         => $t['avatar_url'] ?? null,
                'createdAt'      => $t['user_created_at'] ?? null, // ✅ اضافه شدن تاریخ ثبت‌نام
                'lastActivityId' => (int)($pdo->query("SELECT COALESCE(MAX(id),0) AS m FROM user_activity_log WHERE user_id = " . (int)$t['user_id'])->fetch()['m'] ?? 0),
            ];
        }, $tailors)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

   // ۴. دریافت لیست درخواست‌های تسویه‌حساب خیاطان همراه با شاخص‌های مالی
    if ($action === 'payouts' || $action === 'payout_requests') {
        $stmt = $pdo->query("
            SELECT pr.*, u.name as tailor_name, u.username as tailor_phone, u.city as tailor_city,
                   tp.shop_name
            FROM payout_requests pr
            JOIN users u ON pr.tailor_user_id = u.id
            LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
            ORDER BY pr.id DESC
        ");
        $payouts = $stmt->fetchAll();

        // محاسبه آمار مالی بالای صفحه
        $totalPaid = (int)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'approved'")->fetchColumn();
        $totalPending = (int)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'pending'")->fetchColumn();
        $totalEscrow = (int)$pdo->query("SELECT COALESCE(SUM(deposit_amount), 0) FROM orders WHERE step IN (3,4) AND deposit_status = 'paid'")->fetchColumn();
        $paidCount = (int)$pdo->query("SELECT COUNT(*) FROM payout_requests WHERE status = 'approved'")->fetchColumn();
        $pendingCount = (int)$pdo->query("SELECT COUNT(*) FROM payout_requests WHERE status = 'pending'")->fetchColumn();
        $escrowCount = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE step IN (3,4) AND deposit_status = 'paid'")->fetchColumn();

        echo json_encode([
            'success' => true,
            'stats' => [
                'totalPaid'     => $totalPaid,
                'totalPending'  => $totalPending,
                'totalEscrow'   => $totalEscrow,
                'paidCount'     => $paidCount,
                'pendingCount'  => $pendingCount,
                'escrowCount'   => $escrowCount
            ],
            'payouts' => array_map(function($p) {
                return [
                    'id'           => (int)$p['id'],
                    'tailorUserId' => (int)$p['tailor_user_id'],
                    'tailorName'   => !empty($p['shop_name']) ? $p['shop_name'] : $p['tailor_name'],
                    'tailorPhone'  => $p['tailor_phone'],
                    'tailorCity'   => $p['tailor_city'] ?? 'بندرعباس',
                    'amount'       => (int)$p['amount'],
                    'shabaNumber'  => $p['shaba_number'],
                    'bankName'     => $p['bank_name'] ?? 'بانک ملی ایران',
                    'status'       => $p['status'],
                    'trackingCode' => $p['tracking_code'],
                    'date'         => date('Y/m/d H:i', strtotime($p['created_at']))
                ];
            }, $payouts)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۵. دریافت لیست کامل مشتریان با آمار واقعی خریدها و اندازه‌ها
    if ($action === 'all_customers') {
        $stmt = $pdo->query("
            SELECT u.id, u.name, u.username as phone, u.city, u.club_points, u.created_at,
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.id DESC
        ");
        $customers = $stmt->fetchAll();

        echo json_encode([
            'success'   => true,
            'customers' => array_map(function($c) use ($pdo) {
                // دریافت پروفایل‌های اندازه همین مشتری
                $stmtM = $pdo->prepare("SELECT * FROM measurement_profiles WHERE user_id = ? ORDER BY is_default DESC");
                $stmtM->execute([(int)$c['id']]);
                $profiles = $stmtM->fetchAll();

                return [
                    'id'           => (int)$c['id'],
                    'name'         => $c['name'],
                    'phone'        => $c['phone'],
                    'city'         => $c['city'] ?? 'بندرعباس',
                    'clubPoints'   => (int)($c['club_points'] ?? 0),
                    'totalOrders'  => (int)($c['total_orders'] ?? 0),
                    'totalSpent'   => (int)($c['total_spent'] ?? 0),
                    'isVip'        => (int)($c['club_points'] ?? 0) >= 300 || (int)($c['total_orders'] ?? 0) >= 5,
'createdAt'    => $c['created_at'],
'lastActivityId' => (int)($pdo->prepare("SELECT COALESCE(MAX(id),0) FROM user_activity_log WHERE user_id = ?")->execute([(int)$c['id']]) ? $pdo->query("SELECT COALESCE(MAX(id),0) AS m FROM user_activity_log WHERE user_id = " . (int)$c['id'])->fetch()['m'] : 0),
'profiles'     => array_map(function($p) {
return [
'id'          => (int)$p['id'],
'name'        => $p['name'],
'ankleCuff'   => $p['ankle_cuff'],
'cuffHeight'  => $p['cuff_height'],
'pantLength'  => $p['pant_length'],
'hip'         => $p['hip'],
'dressLength' => $p['dress_length'],
'shoulder'    => $p['shoulder'],
'chest'       => $p['chest'],
'sleeve'      => $p['sleeve'],
'isDefault'   => (bool)$p['is_default']
];
}, $profiles),
'createdAt'    => $c['created_at'], // 🔥 اضافه شد: ارسال timestamp خام برای پردازش تاریخ شمسی و تشخیص کاربر جدید در فرانت‌اند
'date'         => date('Y/m/d', strtotime($c['created_at']))
];
            }, $customers)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۶. دریافت دفتر کل تراکنش‌های مالی و گزارش شاخص‌های حسابداری
    if ($action === 'transactions') {
        $transactions = [];

        // ۱. استخراج تراکنش‌های واریز بیعانه و سفارش‌ها
        $stmtOrders = $pdo->query("
            SELECT o.*, u.name as customer_name, u.username as customer_phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $ordersList = $stmtOrders->fetchAll();

        foreach ($ordersList as $ord) {
            $isRefund = ($ord['step'] == 6);
            $txType = $isRefund ? 'refund' : 'customer_deposit';
            $txAmount = (int)($isRefund ? $ord['deposit_amount'] : $ord['deposit_amount']);
            
            $transactions[] = [
                'id'           => 'TXN-' . abs(crc32($ord['id'] . $ord['created_at'])) % 90000 + 10000,
                'orderId'      => $ord['id'],
                'type'         => $txType,
                'amount'       => $txAmount,
                'isCredit'     => !$isRefund, // مثبت برای ورودی، منفی برای برگشتی
                'title'        => $isRefund 
                                    ? "استرداد وجه بیعانه سفارش #{$ord['id']} به مشتری (لغو سفارش)"
                                    : "پرداخت بیعانه ۳۰٪ برای سفارش #{$ord['id']} ({$ord['design_title']})",
                'fromParty'    => $isRefund ? "کَندوره (صندوق امانی)" : ($ord['customer_name'] ?? 'مشتری'),
                'toParty'      => $isRefund ? ($ord['customer_name'] ?? 'مشتری') : ($ord['tailor_name'] ?? 'خیاطی'),
                'referenceNum' => '8947210' . substr(abs(crc32($ord['id'])), 0, 5),
                'status'       => 'موفق',
                'date'         => date('Y/m/d - H:i', strtotime($ord['created_at'])),
                'timestamp'    => strtotime($ord['created_at'])
            ];
        }

        // ۲. استخراج تراکنش‌های تسویه به خیاطان
        $stmtPayouts = $pdo->query("
            SELECT pr.*, u.name as tailor_name, u.username as tailor_phone, tp.shop_name
            FROM payout_requests pr
            JOIN users u ON pr.tailor_user_id = u.id
            LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
            WHERE pr.status = 'approved'
            ORDER BY pr.updated_at DESC, pr.created_at DESC
        ");
        $payoutsList = $stmtPayouts->fetchAll();

        foreach ($payoutsList as $pay) {
            $tailorTitle = !empty($pay['shop_name']) ? $pay['shop_name'] : $pay['tailor_name'];
            $transactions[] = [
                'id'           => 'TXN-' . (90000 + (int)$pay['id']),
                'orderId'      => 'PAY-' . $pay['id'],
                'type'         => 'tailor_payout',
                'amount'       => (int)$pay['amount'],
                'isCredit'     => false, // خروجی از سیستم
                'title'        => "تسویه هزینه سفارشات و دستمزد به {$tailorTitle}",
                'fromParty'    => 'کَندوره',
                'toParty'      => $tailorTitle,
                'referenceNum' => $pay['tracking_code'] ?: ('88492051' . (1000 + (int)$pay['id'])),
                'status'       => 'موفق',
                'date'         => date('Y/m/d - H:i', strtotime($pay['created_at'])),
                'timestamp'    => strtotime($pay['created_at'])
            ];
        }

        // مرتب‌سازی بر اساس تاریخ ثانیه‌ای
        usort($transactions, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        // محاسبه شاخص‌های مالی بالا
        $totalInflow = (int)$pdo->query("SELECT COALESCE(SUM(deposit_amount), 0) FROM orders WHERE deposit_status = 'paid' AND step != 6")->fetchColumn();
        $totalPayouts = (int)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'approved'")->fetchColumn();
        $totalCommission = (int)round($totalInflow * 0.10); // محاسبه کارمزد پلتفرم (۱۰٪)

        echo json_encode([
            'success' => true,
            'stats' => [
                'totalInflow'     => $totalInflow,
                'inflowCount'     => count(array_filter($transactions, fn($t) => $t['type'] === 'customer_deposit')),
                'totalPayouts'    => $totalPayouts,
                'payoutCount'     => count($payoutsList),
                'totalCommission' => $totalCommission,
            ],
            'transactions' => $transactions
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۷. دریافت لیست کامل تیکت‌های پشتیبانی کاربران و شاخص‌ها
    if ($action === 'support_tickets') {
        $stmt = $pdo->query("
            SELECT st.*, u.name as user_name, u.username as user_phone, u.role as user_role,
                   tp.shop_name
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
            ORDER BY st.id DESC
        ");
        $tickets = $stmt->fetchAll();

        $openCount = (int)$pdo->query("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'")->fetchColumn();
        $answeredCount = (int)$pdo->query("SELECT COUNT(*) FROM support_tickets WHERE status = 'answered'")->fetchColumn();
        $closedCount = (int)$pdo->query("SELECT COUNT(*) FROM support_tickets WHERE status = 'closed'")->fetchColumn();

        echo json_encode([
            'success' => true,
            'stats' => [
                'openCount'     => $openCount,
                'answeredCount' => $answeredCount,
                'closedCount'   => $closedCount,
                'avgResponse'   => '۱۲ دقیقه'
            ],
            'tickets' => array_map(function($t) {
                $displayName = (!empty($t['shop_name']) && $t['user_role'] === 'tailor') ? $t['shop_name'] : $t['user_name'];
                return [
                    'id'          => (int)$t['id'],
                    'userId'      => (int)$t['user_id'],
                    'userName'    => $displayName,
                    'userPhone'   => $t['user_phone'],
                    'userRole'    => $t['user_role'],
                    'orderId'     => $t['order_id'],
                    'subject'     => $t['subject'],
                    'message'     => $t['message'],
                    'adminReply'  => $t['admin_reply'],
                    'adminName'   => $t['admin_name'] ?? 'مدیریت کَندوره',
                    'status'      => $t['status'], // 'open' | 'answered' | 'closed'
                    'date'        => date('Y/m/d - H:i', strtotime($t['created_at'])),
                    'repliedDate' => $t['replied_at'] ? date('Y/m/d - H:i', strtotime($t['replied_at'])) : null
                ];
            }, $tickets)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'درخواست نامعتبر است.'], JSON_UNESCAPED_UNICODE);