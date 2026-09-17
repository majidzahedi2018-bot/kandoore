<?php
// مسیر فایل در هاست: api/addresses.php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = (int)resolveUserId($pdo, $_GET['user_id'] ?? 1);

    $stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC");
    $stmt->execute([$userId]);
    $addresses = $stmt->fetchAll();

    echo json_encode([
        'success'   => true,
        'addresses' => array_map(function($a) {
            return [
                'id'          => (int)$a['id'],
                'userId'      => (int)$a['user_id'],
                'title'       => $a['title'],
                'fullAddress' => $a['full_address'],
                'recipient'   => $a['recipient'],
                'phone'       => $a['phone'],
                'type'        => $a['type'] ?? 'home',
                'isDefault'   => (bool)$a['is_default']
            ];
        }, $addresses)
    ], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'create';
    $userId = (int)resolveUserId($pdo, $data['user_id'] ?? 1);

    // ۱. حذف آدرس
    if ($action === 'delete') {
        $addressId = (int)($data['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?");
        $stmt->execute([$addressId, $userId]);

        echo json_encode(['success' => true, 'message' => 'آدرس با موفقیت حذف شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۲. ثبت آدرس جدید
    if ($action === 'create') {
        $title       = trim($data['title'] ?? 'منزل');
        $fullAddress = trim($data['full_address'] ?? '');
        $recipient   = trim($data['recipient'] ?? 'مشتری');
        $phone       = trim($data['phone'] ?? '');
        $type        = trim($data['type'] ?? 'home');

        $stmt = $pdo->prepare("INSERT INTO addresses (user_id, title, full_address, recipient, phone, type, is_default) VALUES (?, ?, ?, ?, ?, ?, 0)");
        $stmt->execute([$userId, $title, $fullAddress, $recipient, $phone, $type]);
        $newId = $pdo->lastInsertId();

        echo json_encode(['success' => true, 'id' => (int)$newId, 'message' => 'آدرس جدید ذخیره شد.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
}