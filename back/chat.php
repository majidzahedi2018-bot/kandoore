<?php
// مسیر فایل در هاست: api/chat.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once __DIR__ . '/config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

// ─── کمکی: وضعیت حضور یک کاربر ───
function presenceOf($pdo, $userId) {
    if (!$userId) return ['online' => false, 'lastSeen' => null, 'typing' => false];
    $st = $pdo->prepare("SELECT last_seen, typing_at FROM user_presence WHERE user_id = ? LIMIT 1");
    $st->execute([(int)$userId]);
    $row = $st->fetch();
    if (!$row) return ['online' => false, 'lastSeen' => null, 'typing' => false];
    return [
        'online'   => (time() - strtotime($row['last_seen'])) <= 90,
        'lastSeen' => $row['last_seen'],
        'typing'   => $row['typing_at'] ? (time() - strtotime($row['typing_at'])) <= 6 : false,
    ];
}

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'messages';

    if ($action === 'presence') {
$info = presenceOf($pdo, (int)($_GET['user_id'] ?? 0));
echo json_encode(['success' => true, 'online' => $info['online'], 'lastSeen' => $info['lastSeen'], 'typing' => $info['typing']], JSON_UNESCAPED_UNICODE);
exit();
}
// تعداد پیام‌های نخوانده per سفارش (برای بج قرمز)
if ($action === 'unread_counts') {
$userId = (int)($_GET['user_id'] ?? 0);
$stmt = $pdo->prepare("SELECT order_id, COUNT(*) AS c FROM order_messages WHERE sender_id != ? AND read_at IS NULL GROUP BY order_id");
$stmt->execute([$userId]);
$counts = [];
foreach ($stmt->fetchAll() as $r) { $counts[$r['order_id']] = (int)$r['c']; }
echo json_encode(['success' => true, 'counts' => $counts], JSON_UNESCAPED_UNICODE);
exit();
}

    // گفتگوهای پیش از سفارش (تقلب‌های کلید: مشتری*1e9 + خیاط) — برای صندوق خیاط
if ($action === 'preorder_threads') {
$uid = (int)($_GET['user_id'] ?? 0);
$stmt = $pdo->prepare("SELECT m.order_id AS thread_key,
       CAST(m.order_id AS UNSIGNED) DIV 1000000000 AS customer_id,
       m.message AS last_message, m.image_url AS last_image, m.created_at AS last_at
FROM order_messages m
WHERE CAST(m.order_id AS UNSIGNED) % 1000000000 = :uid
  AND CAST(m.order_id AS UNSIGNED) DIV 1000000000 > 0
  AND m.id = (SELECT MAX(m2.id) FROM order_messages m2 WHERE m2.order_id = m.order_id)
ORDER BY m.created_at DESC
LIMIT 30");
$stmt->execute(['uid' => $uid]);
$threads = [];
foreach ($stmt->fetchAll() as $t) {
$cId = (int)$t['customer_id'];
$u = $pdo->prepare("SELECT name, avatar_url FROM users WHERE id = ?");
$u->execute([$cId]);
$uu = $u->fetch();
$un = $pdo->prepare("SELECT COUNT(*) AS c FROM order_messages WHERE order_id = ? AND sender_id = ? AND read_at IS NULL");
$un->execute([$t['thread_key'], $cId]);
$threads[] = [
'threadKey'      => (string)$t['thread_key'],
'customerId'     => $cId,
'customerName'   => $uu['name'] ?? 'مشتری کندوره',
'customerAvatar' => $uu['avatar_url'] ?? null,
'lastMessage'    => $t['last_message'],
'lastImage'      => $t['last_image'],
'lastTime'       => date('H:i', strtotime($t['last_at'])),
'lastDate'       => date('Y/m/d', strtotime($t['last_at'])),
'ts'             => strtotime($t['last_at']),
'unread'         => (int)$un->fetch()['c'],
];
}
echo json_encode(['success' => true, 'threads' => $threads], JSON_UNESCAPED_UNICODE);
exit();
}

    $orderId    = trim($_GET['order_id'] ?? '');
    $viewerRole = in_array($_GET['viewer_role'] ?? '', ['customer','tailor']) ? $_GET['viewer_role'] : 'customer';
    $peerId     = (int)($_GET['peer_id'] ?? 0);
$afterId    = (int)($_GET['after_id'] ?? 0);
$stmt = $pdo->prepare("SELECT m.*,
u.name AS sender_name, u.avatar_url AS sender_avatar,
r.message AS reply_message, r.image_url AS reply_image, ru.name AS reply_sender_name
FROM order_messages m
LEFT JOIN users u ON u.id = m.sender_id
LEFT JOIN order_messages r ON r.id = m.reply_to_id
LEFT JOIN users ru ON ru.id = r.sender_id
WHERE m.order_id = ? AND m.id > ?
ORDER BY m.id ASC");
$stmt->execute([$orderId, $afterId]);

    $hiddenCol = ($viewerRole === 'tailor') ? 'hidden_for_tailor' : 'hidden_for_customer';
    $messages = [];
    foreach ($stmt->fetchAll() as $m) {
        if ((int)$m[$hiddenCol] === 1) continue; // فقط برای این بیننده مخفی شده
        $isDeleted = (int)$m['deleted_everyone'] === 1;
        $messages[] = [
            'id'           => (int)$m['id'],
            'orderId'      => $m['order_id'],
            'senderId'     => (int)$m['sender_id'],
            'senderRole'   => $m['sender_role'],
            'senderName'   => $m['sender_name'] ?? 'کاربر',
            'senderAvatar' => $m['sender_avatar'] ?? null,
            'message'      => $isDeleted ? null : $m['message'],
            'imageUrl'     => $isDeleted ? null : $m['image_url'],
            'deleted'      => $isDeleted,
            'readAt'       => $m['read_at'],
            'replyTo'      => $m['reply_to_id'] ? [
                'id'         => (int)$m['reply_to_id'],
                'senderName' => $m['reply_sender_name'] ?? 'کاربر',
                'message'    => $m['reply_message'],
                'imageUrl'   => $m['reply_image'],
            ] : null,
            'time' => date('H:i', strtotime($m['created_at'])),
            'date' => date('Y/m/d', strtotime($m['created_at'])),
            'ts'   => strtotime($m['created_at']),
        ];
    }
    $peer = presenceOf($pdo, $peerId);
    echo json_encode([
        'success' => true, 'messages' => $messages,
        'peerOnline' => $peer['online'], 'peerLastSeen' => $peer['lastSeen'], 'peerTyping' => $peer['typing'],
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ═══ POST ═══
$data = getJsonInput();
$action = $data['action'] ?? 'send';

// ۱) ضربان قلب / در حال نوشتن / اعلام خروج یا رفتن به پس‌زمینه
if ($action === 'heartbeat' || $action === 'go_offline') {
$userId = (int)resolveUserId($pdo, $data['user_id'] ?? 0);
$isActive = ($action === 'heartbeat') && (bool)($data['active'] ?? true);
if ($userId) {
if ($action === 'go_offline' || !$isActive) {
// خروج/پس‌زمینه: last_seen را ۵ دقیقه عقب می‌کشیم تا همان لحظه «آفلاین» شود
$pdo->prepare("UPDATE user_presence SET last_seen = (NOW() - INTERVAL 5 MINUTE), typing_at = NULL WHERE user_id = ?")->execute([$userId]);
} elseif (!empty($data['typing'])) {
$pdo->prepare("INSERT INTO user_presence (user_id, last_seen, typing_at) VALUES (?, NOW(), NOW())
ON DUPLICATE KEY UPDATE last_seen = NOW(), typing_at = NOW()")->execute([$userId]);
} else {
$pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW())
ON DUPLICATE KEY UPDATE last_seen = NOW()")->execute([$userId]);
}
}
echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE); exit();
}

// ۲) خوانده‌شدن پیام‌ها (دو تیک)
if ($action === 'mark_read') {
$orderId  = trim($data['order_id'] ?? '');
$viewerId = (int)resolveUserId($pdo, $data['viewer_id'] ?? 0);
    $pdo->prepare("UPDATE order_messages SET read_at = NOW() WHERE order_id = ? AND sender_id != ? AND read_at IS NULL")
        ->execute([$orderId, $viewerId]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE); exit();
}

// ۳) حذف پیام (برای من / برای همه)
if ($action === 'delete') {
$msgId      = (int)($data['message_id'] ?? 0);
$mode       = ($data['mode'] ?? 'me') === 'all' ? 'all' : 'me';
$viewerId   = (int)resolveUserId($pdo, $data['viewer_id'] ?? 0);
$viewerRole = in_array($data['viewer_role'] ?? '', ['customer','tailor']) ? $data['viewer_role'] : 'customer';
// بررسی مالکیت: فقط فرستنده یا یکی از دو طرف سفارش می‌تواند حذف/پنهان کند
$stmtMsg = $pdo->prepare("SELECT m.sender_id, o.user_id AS c_id, o.tailor_user_id AS t_id FROM order_messages m LEFT JOIN orders o ON o.id = m.order_id WHERE m.id = ? LIMIT 1");
$stmtMsg->execute([$msgId]);
$msgRow = $stmtMsg->fetch();
if (!$msgRow) { echo json_encode(['success' => false, 'message' => 'پیام یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
$isParticipant = ($viewerId > 0) && ((int)$msgRow['sender_id'] === $viewerId || (int)$msgRow['c_id'] === $viewerId || (int)$msgRow['t_id'] === $viewerId);
if (!$isParticipant) { echo json_encode(['success' => false, 'message' => 'شما مجوز حذف این پیام را ندارید.'], JSON_UNESCAPED_UNICODE); exit(); }
if ($mode === 'all' && (int)$msgRow['sender_id'] !== $viewerId) { echo json_encode(['success' => false, 'message' => 'فقط فرستنده می‌تواند پیام را برای همه حذف کند.'], JSON_UNESCAPED_UNICODE); exit(); }
if ($mode === 'all') {
        $pdo->prepare("UPDATE order_messages SET deleted_everyone = 1 WHERE id = ?")->execute([$msgId]);
    } else {
        $col = ($viewerRole === 'tailor') ? 'hidden_for_tailor' : 'hidden_for_customer';
        $pdo->prepare("UPDATE order_messages SET `$col` = 1 WHERE id = ?")->execute([$msgId]);
    }
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE); exit();
}

// ۴) ارسال پیام (متن / عکس / کپشن / ریپلای)
$orderId    = trim($data['order_id'] ?? '');
$senderId   = (int)resolveUserId($pdo, $data['sender_id'] ?? 0);
if ($senderId <= 0) { echo json_encode(['success' => false, 'message' => 'احراز هویت ناموفق بود.'], JSON_UNESCAPED_UNICODE); exit(); }
$senderRole = in_array($data['sender_role'] ?? '', ['customer','tailor']) ? $data['sender_role'] : 'customer';
$message    = trim($data['message'] ?? '');
$imageUrl   = $data['image_url'] ?? null;
$replyToId  = !empty($data['reply_to_id']) ? (int)$data['reply_to_id'] : null;
// تعیین گیرنده (peer) بر اساس نقش فرستنده از روی خود سفارش
$peerId = 0;
$stmtOrder = $pdo->prepare("SELECT user_id, tailor_user_id FROM orders WHERE id = ? LIMIT 1");
$stmtOrder->execute([$orderId]);
$orderRow = $stmtOrder->fetch();
if ($orderRow) {
    $peerId = ($senderRole === 'tailor') ? (int)$orderRow['user_id'] : (int)$orderRow['tailor_user_id'];
}
// اگر سفارش یافت نشد، peer_id ارسالی کلاینت به‌عنوان جایگزین
if ($peerId <= 0) {
    $peerId = (int)($data['peer_id'] ?? 0);
}
if (empty($message) && empty($imageUrl)) {
    echo json_encode(['success' => false, 'message' => 'متن پیام یا تصویر الزامی است.'], JSON_UNESCAPED_UNICODE); exit();
}
$stmt = $pdo->prepare("INSERT INTO order_messages (order_id, sender_id, sender_role, message, image_url, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$orderId, $senderId, $senderRole, $message, $imageUrl, $replyToId]);
$newId = (int)$pdo->lastInsertId();
// ضربان قلب فرستنده
$pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()")->execute([$senderId]);
// اعلان به گیرنده فقط وقتی آنلاین نیست (ضد اسپم)
$peerPresence = presenceOf($pdo, $peerId);
if ($peerId > 0 && !$peerPresence['online']) {
$sn = $pdo->query("SELECT name FROM users WHERE id = " . (int)$senderId)->fetch();
$pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'پیام جدید در چت سفارش', ?, 'چت سفارش', '💬', ?)")
->execute([$peerId, ($sn['name'] ?? 'کاربر') . " برای سفارش #{$orderId} برای شما پیام فرستاد.", $orderId]);
}
echo json_encode(['success' => true, 'message_id' => $newId], JSON_UNESCAPED_UNICODE);