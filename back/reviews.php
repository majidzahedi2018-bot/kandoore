<?php
// مسیر فایل در هاست: api/reviews.php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// مهاجرت خودکار: اطمینان از وجود ستون design_id در جدول‌های قدیمی (برای جدا کردن نظرات هر طرح)
try {
    $colsRev = $pdo->query("SHOW COLUMNS FROM reviews LIKE 'design_id'");
    if (!$colsRev->fetch()) $pdo->exec("ALTER TABLE reviews ADD COLUMN design_id INT NULL DEFAULT NULL AFTER order_id");
} catch (Exception $e) {}
try {
    $colsOrd = $pdo->query("SHOW COLUMNS FROM orders LIKE 'design_id'");
    if (!$colsOrd->fetch()) $pdo->exec("ALTER TABLE orders ADD COLUMN design_id INT NULL DEFAULT NULL AFTER design_title");
} catch (Exception $e) {}

// بازپردازش: پیوند دادن سفارش‌ها و نظرات قدیمی به طرحِ درستشان (بدون اثر روی رکوردِ تکراری)
function backfillDesignIds($pdo) {
    try {
        $orders = $pdo->query("SELECT o.id, o.design_title, o.design_image, o.tailor_user_id FROM orders o WHERE o.design_id IS NULL OR o.design_id = 0")->fetchAll();
if ($orders) {
$findByImage = $pdo->prepare("SELECT id FROM designs WHERE color_preview = ? AND color_preview <> '' LIMIT 1");
$findByTitle = $pdo->prepare("SELECT id FROM designs WHERE user_id = ? AND TRIM(title) = TRIM(?) LIMIT 1");
$updOrd  = $pdo->prepare("UPDATE orders SET design_id = ? WHERE id = ?");
foreach ($orders as $o) {
$did = 0;
// اولویت ۱: تطبیق دقیق تصویر طرح (یکتا per طرح؛ حتی با عنوان تکراری)
if (!empty($o['design_image'])) {
$findByImage->execute([$o['design_image']]);
$rowImg = $findByImage->fetch();
if ($rowImg) $did = (int)$rowImg['id'];
}
// اولویت ۲: تطبیق عنوان (فقط وقتی تصویر پیدا نشد)
if ($did <= 0 && trim((string)($o['design_title'] ?? '')) !== '') {
$findByTitle->execute([$o['tailor_user_id'], $o['design_title']]);
$rowT = $findByTitle->fetch();
if ($rowT) $did = (int)$rowT['id'];
}
if ($did > 0) $updOrd->execute([$did, $o['id']]);
}
}

        $reviews = $pdo->query("SELECT r.id, r.order_id, r.tailor_user_id FROM reviews r WHERE r.design_id IS NULL OR r.design_id = 0")->fetchAll();
        if ($reviews) {
            $getOrdDes = $pdo->prepare("SELECT design_id, design_title FROM orders WHERE id = ? LIMIT 1");
            $findDes2  = $pdo->prepare("SELECT id FROM designs WHERE user_id = ? AND TRIM(title) = TRIM(?) LIMIT 1");
            $updRev    = $pdo->prepare("UPDATE reviews SET design_id = ? WHERE id = ?");
            foreach ($reviews as $r) {
                $did = 0;
                $ot  = '';
                if (!empty($r['order_id'])) {
                    $getOrdDes->execute([$r['order_id']]);
                    $od  = $getOrdDes->fetch();
                    $did = (int)($od['design_id'] ?? 0);
                    $ot  = (string)($od['design_title'] ?? '');
                }
                if ($did <= 0 && trim($ot) !== '') {
                    $findDes2->execute([$r['tailor_user_id'], $ot]);
                    $d = $findDes2->fetch();
                    if ($d) $did = (int)$d['id'];
                }
                if ($did > 0) $updRev->execute([$did, $r['id']]);
            }
        }
    } catch (Exception $e) {}
}
backfillDesignIds($pdo);

if ($method === 'GET') {
    $tailorUserId = (int)($_GET['tailor_user_id'] ?? 2);
    $designId     = (int)($_GET['design_id'] ?? 0);
    $designTitle  = trim($_GET['design_title'] ?? '');

    // حل سلسله‌مراتبی طرحِ نظر: design_id خودِ نظر ← design_id سفارش ← عنوانِ سفارش
    $reviewJoin = "FROM reviews r
                   JOIN users u ON r.user_id = u.id
                   LEFT JOIN orders o ON o.id = r.order_id
                   LEFT JOIN designs d ON d.id = COALESCE(NULLIF(r.design_id, 0), NULLIF(o.design_id, 0))";
    $designCols = "COALESCE(NULLIF(d.title, ''), NULLIF(o.design_title, '')) as design_title,
                   COALESCE(d.color_preview, o.design_image) as design_color_preview";

    if ($designId > 0) {
// وقتی design_id موجود است، فیلتر خیاط لازم نیست (شناسه طرح صاحب را تعیین می‌کند).
// قبلاً مقدار پیش‌فرض tailor_user_id=2 باعث می‌شد نظرات همه خیاط‌ها خالی برگردند.
$stmt = $pdo->prepare(
"SELECT r.*, u.name as customer_name, u.avatar_url as customer_avatar,
o.design_id as order_design_id, {$designCols}
{$reviewJoin}
WHERE (COALESCE(NULLIF(r.design_id, 0), NULLIF(o.design_id, 0)) = ?
OR (COALESCE(NULLIF(r.design_id, 0), NULLIF(o.design_id, 0)) = 0
AND TRIM(COALESCE(o.design_title, '')) <> ''
AND TRIM(COALESCE(o.design_title, '')) = TRIM(?)))
ORDER BY r.id DESC"
);
$stmt->execute([$designId, $designTitle]);

    } else {
        $stmt = $pdo->prepare(
            "SELECT r.*, u.name as customer_name, u.avatar_url as customer_avatar,
                    o.design_id as order_design_id, {$designCols}
             {$reviewJoin}
             WHERE r.tailor_user_id = ?
             ORDER BY r.id DESC"
        );
        $stmt->execute([$tailorUserId]);
    }
    $rows = $stmt->fetchAll();

    // تبدیل آدرس تصویر طرحِ ذخیره‌شده به آدرس کامل قابل نمایش
    $reviewDesignImage = function($stored) {
        if (empty($stored)) return null;
        if (str_starts_with($stored, 'http')) return $stored;
        if (str_starts_with($stored, '/')) return 'https://kandoore.ir' . $stored;
        if (str_starts_with($stored, 'uploads/')) return 'https://kandoore.ir/api/' . $stored;
        return null;
    };

    $reviews = array_map(function($r) use ($reviewDesignImage) {
        $resolvedDesignId = (int)((int)($r['design_id'] ?? 0) ?: (int)($r['order_design_id'] ?? 0));
        return [
            'id'                 => (int)$r['id'],
            'orderId'            => $r['order_id'],
            'userId'             => (int)$r['user_id'],
            'tailorUserId'       => (int)$r['tailor_user_id'],
            'designId'           => $resolvedDesignId,
            'qualityScore'       => (int)$r['quality_score'],
            'accuracyScore'      => (int)$r['accuracy_score'],
            'punctualityScore'   => (int)$r['punctuality_score'],
            'behaviorScore'      => (int)$r['behavior_score'],
            'avg_rating'         => (float)$r['avg_rating'],
            'comment'            => $r['comment'],
            'image_url'          => $r['image_url'],
            'recommend'          => $r['recommend'],
            'created_at'         => $r['created_at'],
            'customer_name'      => $r['customer_name'],
            'customer_avatar'    => $r['customer_avatar'],
            'design_title'       => $r['design_title'] ?? '',
            'designColorPreview' => $r['design_color_preview'] ?? '',
            'designImage'        => $reviewDesignImage($r['design_color_preview'] ?? null),
        ];
    }, $rows);

    echo json_encode(['success' => true, 'reviews' => $reviews], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
$data = getJsonInput();
$orderId      = trim($data['order_id'] ?? '');
$userId       = (int)resolveUserId($pdo, $data['user_id'] ?? 0);
$tailorUserId = (int)($data['tailor_user_id'] ?? 2);
// بررسی مالکیت: فقط صاحب سفارش می‌تواند برای آن نظر ثبت کند
$stmtOwn = $pdo->prepare("SELECT user_id FROM orders WHERE id = ? LIMIT 1");
$stmtOwn->execute([$orderId]);
$ownRow = $stmtOwn->fetch();
if (!$ownRow || (int)$ownRow['user_id'] !== $userId) {
echo json_encode(['success' => false, 'message' => 'فقط صاحب سفارش می‌تواند برای آن نظر ثبت کند.'], JSON_UNESCAPED_UNICODE);
exit();
}
    $designId     = (int)($data['design_id'] ?? 0);
    $designTitle  = trim($data['design_title'] ?? '');
    $quality      = (int)($data['quality'] ?? 5);

    // اگر شناسه طرح داده نشده بود، خودش از روی سفارش پیدا کند و اگر نبود از روی عنوانِ طرحِ همان خیاط
    if ($designId <= 0 && !empty($orderId)) {
        $sOrd = $pdo->prepare("SELECT design_id FROM orders WHERE id = ? LIMIT 1");
        $sOrd->execute([$orderId]);
        $rowOrd = $sOrd->fetch();
        if ($rowOrd && (int)$rowOrd['design_id'] > 0) $designId = (int)$rowOrd['design_id'];
    }
    if ($designId <= 0 && $designTitle !== '') {
        $sDes = $pdo->prepare("SELECT id FROM designs WHERE user_id = ? AND TRIM(title) = TRIM(?) LIMIT 1");
        $sDes->execute([$tailorUserId, $designTitle]);
        $rowDes = $sDes->fetch();
        if ($rowDes) $designId = (int)$rowDes['id'];
    }
    $accuracy     = (int)($data['accuracy'] ?? 5);
    $punctuality  = (int)($data['punctuality'] ?? 5);
    $behavior     = (int)($data['behavior'] ?? 5);
    $comment      = trim($data['comment'] ?? '');
    $imageUrl     = $data['image_url'] ?? null;
    $recommend    = ($data['recommend'] === 'no') ? 'no' : 'yes';

    $avgRating = round(($quality + $accuracy + $punctuality + $behavior) / 4, 1);

    // ثبت نظر در جدول reviews
    $stmt = $pdo->prepare("INSERT INTO reviews (order_id, user_id, tailor_user_id, design_id, quality_score, accuracy_score, punctuality_score, behavior_score, avg_rating, comment, image_url, recommend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$orderId, $userId, $tailorUserId, $designId > 0 ? $designId : null, $quality, $accuracy, $punctuality, $behavior, $avgRating, $comment, $imageUrl, $recommend]);

    // محاسبه مجدد میانگین امتیاز خیاط و تعداد نظرات
    $stmtCalc = $pdo->prepare("SELECT AVG(avg_rating) as new_rating, COUNT(*) as total_reviews FROM reviews WHERE tailor_user_id = ?");
    $stmtCalc->execute([$tailorUserId]);
    $calc = $stmtCalc->fetch();
    $newRating = round($calc['new_rating'] ?? 5.0, 1);
    $totalReviews = (int)($calc['total_reviews'] ?? 1);

    $pdo->prepare("UPDATE tailor_profiles SET rating = ?, reviews_count = ? WHERE user_id = ?")->execute([$newRating, $totalReviews, $tailorUserId]);

    // اهدای ۵۰ امتیاز باشگاه به مشتری
    $pdo->prepare("UPDATE users SET club_points = club_points + 50 WHERE id = ?")->execute([$userId]);
    // اعلان به خیاط: نظر جدید برای کارگاه
    $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'نظر جدید برای کارگاه شما', ?, 'نظرات و امتیازها', '⭐', ?)")
    ->execute([$tailorUserId, "مشتری برای سفارش #{$orderId} نظر و امتیاز ثبت کرد؛ میانگین امتیاز کارگاه به‌روزرسانی شد.", $orderId]);
    // اعلان به مشتری: امتیاز باشگاه
    $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, '۵۰ امتیاز باشگاه دریافت شد 🎁', ?, 'باشگاه مشتریان', '🎁', ?)")
    ->execute([$userId, 'بابت ثبت نظر، ۵۰ امتیاز به باشگاه شما اضافه شد.', $orderId]);

    echo json_encode([
        'success'      => true,
        'new_rating'   => $newRating,
        'earned_points'=> 50,
        'message'      => 'نظر شما با موفقیت ثبت شد و ۵۰ امتیاز به باشگاه شما افزوده گردید.'
    ], JSON_UNESCAPED_UNICODE);
}