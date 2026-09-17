<?php
// مسیر فایل در هاست: api/notifications.php
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

if ($method === 'GET') {
$userId = (int)($_GET['user_id'] ?? 0);
if ($userId <= 0) {
echo json_encode(['success' => false, 'message' => 'شناسه کاربر الزامی است.'], JSON_UNESCAPED_UNICODE);
exit;
}
$map = function($n) {
return [
'id'          => (int)$n['id'],
'userId'      => (int)$n['user_id'],
'title'       => $n['title'],
'subtext'     => $n['message'],
'category'    => $n['category'] ?? 'وضعیت سفارش‌ها',
'iconEmoji'   => $n['icon_emoji'] ?? '🔔',
'actionType'  => $n['action_type'] ?? 'order',
'referenceId' => $n['reference_id'],
'isUnread'    => !(bool)$n['is_read'],
'time'        => date('Y/m/d H:i', strtotime($n['created_at']))
];
};
// ۱) شمارش سبک نخوانده‌ها برای بج
if (($_GET['action'] ?? '') === 'unread_count') {
$stmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
$stmt->execute([$userId]);
echo json_encode(['success' => true, 'unread' => (int)$stmt->fetchColumn()], JSON_UNESCAPED_UNICODE);
exit;
}
// ۲) دریافت افزایشی اعلان‌های جدید (polling موتور اعلان)
$afterId = (int)($_GET['after_id'] ?? 0);
if ($afterId > 0) {
$stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT 20");
$stmt->execute([$userId, $afterId]);
echo json_encode(['success' => true, 'notifications' => array_map($map, $stmt->fetchAll())], JSON_UNESCAPED_UNICODE);
exit;
}
// ۳) لیست کامل (۵۰ تای آخر)
$stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50");
$stmt->execute([$userId]);
echo json_encode(['success' => true, 'notifications' => array_map($map, $stmt->fetchAll())], JSON_UNESCAPED_UNICODE);
exit();
} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'mark_all_read';
    $userId = (int)($data['user_id'] ?? 0);

    if ($action === 'mark_all_read') {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$userId]);

        echo json_encode(['success' => true, 'message' => 'تمام اعلانات خوانده شدند.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'mark_read') {
        $notifId = (int)($data['id'] ?? 0);
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$notifId, $userId]);

        echo json_encode(['success' => true, 'message' => 'اعلان خوانده شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

echo json_encode(['success' => false, 'message' => 'درخواست نامعتبر است.'], JSON_UNESCAPED_UNICODE);