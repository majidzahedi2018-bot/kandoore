<?php
// مسیر فایل در هاست: api/support.php
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

// ─── دریافت اطلاعات (GET) ───
if ($method === 'GET') {
    $ticketId = (int)($_GET['ticket_id'] ?? 0);
$userId   = (int)resolveUserId($pdo, $_GET['user_id'] ?? 0);

    // حالت اول: دریافت کل تاریخچه پیام‌های یک تیکت مشخص (صفحه چت تیکت)
    if ($ticketId > 0) {
        $stmtT = $pdo->prepare("
            SELECT st.*, u.name as user_name, u.role as user_role, u.username as user_phone, u.avatar_url as user_avatar
            FROM support_tickets st
            LEFT JOIN users u ON u.id = st.user_id
            WHERE st.id = ?
        ");
        $stmtT->execute([$ticketId]);
        $ticket = $stmtT->fetch();

        if (!$ticket) {
            echo json_encode(['success' => false, 'message' => 'تیکت یافت نشد.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // دریافت تمام پیام‌های این تیکت به ترتیب زمان
        $stmtM = $pdo->prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC");
        $stmtM->execute([$ticketId]);
        $messages = $stmtM->fetchAll();

        echo json_encode([
            'success' => true,
            'ticket'  => [
                'id'          => (int)$ticket['id'],
                'ticketCode'  => '#TCK-' . str_pad($ticket['id'], 3, '0', STR_PAD_LEFT),
                'orderId'     => $ticket['order_id'],
                'subject'     => $ticket['subject'],
                'status'      => $ticket['status'],
                'date'        => date('Y/m/d', strtotime($ticket['created_at'])),
                'time'        => date('H:i', strtotime($ticket['created_at'])),
                'userName'    => $ticket['user_name'],
                'userRole'    => $ticket['user_role'],
                'userPhone'   => $ticket['user_phone'],
                'userAvatar'  => $ticket['user_avatar']
            ],
            'messages' => array_map(function($m) {
                return [
                    'id'             => (int)$m['id'],
                    'senderId'       => (int)$m['sender_id'],
                    'senderRole'     => $m['sender_role'],
                    'senderName'     => $m['sender_name'],
                    'message'        => $m['message'],
                    'attachmentUrl'  => $m['attachment_url'],
                    'date'           => date('Y/m/d', strtotime($m['created_at'])),
                    'time'           => date('H:i', strtotime($m['created_at']))
                ];
            }, $messages)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // حالت دوم: دریافت لیست تیکت‌های یک کاربر (صفحه اصلی تیکت‌ها)
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'شناسه کاربر الزامی است.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT st.*, 
               (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = st.id) as messages_count,
               (SELECT message FROM ticket_messages WHERE ticket_id = st.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT created_at FROM ticket_messages WHERE ticket_id = st.id ORDER BY id DESC LIMIT 1) as last_activity
        FROM support_tickets st 
        WHERE st.user_id = ? 
        ORDER BY st.id DESC
    ");
    $stmt->execute([$userId]);
    $tickets = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'tickets' => array_map(function($t) {
            return [
                'id'            => (int)$t['id'],
                'ticketCode'    => '#TCK-' . str_pad($t['id'], 3, '0', STR_PAD_LEFT),
                'orderId'       => $t['order_id'],
                'subject'       => $t['subject'],
                'message'       => $t['message'],
                'lastMessage'   => $t['last_message'] ?? $t['message'],
                'messagesCount' => (int)($t['messages_count'] ?: 1),
                'status'        => $t['status'],
                'date'          => date('Y/m/d', strtotime($t['last_activity'] ?? $t['created_at'])),
                'time'          => date('H:i', strtotime($t['last_activity'] ?? $t['created_at']))
            ];
        }, $tickets)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── ارسال و ثبت اطلاعات (POST) ───
if ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'create_ticket';

    // ۱. ثبت تیکت کاملاً جدید
    if ($action === 'create_ticket') {
$userId        = (int)resolveUserId($pdo, $data['user_id'] ?? 1);
        $orderId       = !empty($data['order_id']) ? trim($data['order_id']) : null;
        $subject       = trim($data['subject'] ?? 'درخواست پشتیبانی');
        $message       = trim($data['message'] ?? '');
        $attachmentUrl = !empty($data['attachment_url']) ? trim($data['attachment_url']) : null;
        $senderName    = trim($data['sender_name'] ?? 'کاربر کَندوره');
        $senderRole    = in_array($data['sender_role'] ?? '', ['tailor', 'customer']) ? $data['sender_role'] : 'customer';

        if (empty($message) && empty($attachmentUrl)) {
            echo json_encode(['success' => false, 'message' => 'متن پیام یا تصویر الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // ایجاد رکورد اصلی در جدول تیکت‌ها
        $stmt = $pdo->prepare("INSERT INTO support_tickets (user_id, order_id, subject, message, status) VALUES (?, ?, ?, ?, 'open')");
        $stmt->execute([$userId, $orderId, $subject, $message]);
        $newTicketId = (int)$pdo->lastInsertId();

        // ثبت اولین پیام در جدول پیام‌ها
        $stmtMsg = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, sender_name, message, attachment_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtMsg->execute([$newTicketId, $userId, $senderRole, $senderName, $message, $attachmentUrl]);

        // ارسال اعلان به ادمین
        $admin = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")->fetch();
        if ($admin) {
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'تیکت پشتیبانی جدید', ?, 'پیام‌های سیستمی', '🎧', ?)")
                ->execute([(int)$admin['id'], "تیکت #TCK-{$newTicketId} با عنوان «{$subject}» ثبت شد.", (string)$newTicketId]);
        }

        echo json_encode([
            'success'   => true,
            'ticket_id' => $newTicketId,
            'message'   => 'تیکت شما با موفقیت ثبت شد و در نوبت پاسخگویی قرار گرفت.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۲. ارسال پیام در یک تیکت موجود (چت رفت‌وبرگشتی)
if ($action === 'send_message') {
$ticketId      = (int)($data['ticket_id'] ?? 0);
$userId        = (int)resolveUserId($pdo, $data['user_id'] ?? 0);
$claimedRole   = $data['sender_role'] ?? 'customer';
// راستی‌آزمایی نقش از دیتابیس (جلوگیری از جعل نقش ادمین)
$stmtU = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
$stmtU->execute([$userId]);
$uRow = $stmtU->fetch();
if (!$uRow) { echo json_encode(['success' => false, 'message' => 'کاربر یافت نشد.'], JSON_UNESCAPED_UNICODE); exit(); }
$realRole = $uRow['role'];
if ($claimedRole === 'admin' && $realRole !== 'admin') { echo json_encode(['success' => false, 'message' => 'مجوز ارسال پاسخ مدیریت را ندارید.'], JSON_UNESCAPED_UNICODE); exit(); }
$senderRole = ($realRole === 'admin') ? 'admin' : $claimedRole;
// برای غیرادمین: فقط صاحب تیکت می‌تواند پیام بفرستد
if ($senderRole !== 'admin') {
$stmtT = $pdo->prepare("SELECT user_id FROM support_tickets WHERE id = ? LIMIT 1");
$stmtT->execute([$ticketId]);
$tRow = $stmtT->fetch();
if (!$tRow || (int)$tRow['user_id'] !== $userId) { echo json_encode(['success' => false, 'message' => 'شما مجوز ارسال پیام در این تیکت را ندارید.'], JSON_UNESCAPED_UNICODE); exit(); }
}
$senderName    = trim($data['sender_name'] ?? ($senderRole === 'admin' ? 'مدیریت کَندوره' : 'کاربر'));
        $message       = trim($data['message'] ?? '');
        $attachmentUrl = !empty($data['attachment_url']) ? trim($data['attachment_url']) : null;

        if ($ticketId <= 0 || (empty($message) && empty($attachmentUrl))) {
            echo json_encode(['success' => false, 'message' => 'اطلاعات پیام نامعتبر است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // ثبت پیام در جدول پیام‌ها
        $stmtMsg = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, sender_name, message, attachment_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtMsg->execute([$ticketId, $userId, $senderRole, $senderName, $message, $attachmentUrl]);

        // به‌روزرسانی وضعیت تیکت
        if ($senderRole === 'admin') {
            // اگر ادمین پیام داد: وضعیت = پاسخ داده شد
            $pdo->prepare("UPDATE support_tickets SET status = 'answered', admin_reply = ?, admin_name = ?, replied_at = NOW() WHERE id = ?")
                ->execute([$message, $senderName, $ticketId]);

            // اعلان به کاربر صاحب تیکت
            $ticketOwner = $pdo->query("SELECT user_id, subject FROM support_tickets WHERE id = {$ticketId}")->fetch();
            if ($ticketOwner) {
                $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'پاسخ جدید پشتیبانی', ?, 'پیام‌های سیستمی', '🎧', ?)")
                    ->execute([(int)$ticketOwner['user_id'], "پاسخ جدیدی برای تیکت «{$ticketOwner['subject']}» ثبت شد.", (string)$ticketId]);
            }
        } else {
            // اگر کاربر پیام داد: وضعیت مجدداً = باز (در انتظار پاسخ ادمین)
            $pdo->prepare("UPDATE support_tickets SET status = 'open' WHERE id = ?")->execute([$ticketId]);
        }

        echo json_encode(['success' => true, 'message' => 'پیام با موفقیت ارسال شد.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۳. بستن تیکت توسط کاربر یا ادمین
if ($action === 'close_ticket') {
$ticketId = (int)($data['ticket_id'] ?? 0);
$userId   = (int)resolveUserId($pdo, $data['user_id'] ?? 0);
if ($ticketId > 0) {
$stmtT = $pdo->prepare("SELECT user_id FROM support_tickets WHERE id = ? LIMIT 1");
$stmtT->execute([$ticketId]);
$tRow = $stmtT->fetch();
$stmtU = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
$stmtU->execute([$userId]);
$uRow = $stmtU->fetch();
$isAdmin = ($uRow && $uRow['role'] === 'admin');
if (!$tRow || (!$isAdmin && (int)$tRow['user_id'] !== $userId)) { echo json_encode(['success' => false, 'message' => 'مجوز بستن این تیکت را ندارید.'], JSON_UNESCAPED_UNICODE); exit(); }
$pdo->prepare("UPDATE support_tickets SET status = 'closed' WHERE id = ?")->execute([$ticketId]);
            echo json_encode(['success' => true, 'message' => 'تیکت با موفقیت بسته شد.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}