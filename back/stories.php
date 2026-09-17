<?php
// مسیر فایل در هاست: api/stories.php
date_default_timezone_set('Asia/Tehran');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

// هماهنگ‌سازی تایم دیتابیس با ساعت ایران
try { $pdo->exec("SET time_zone = '+03:30'"); } catch(Exception $e){}

// ساخت خودکار جدول story_likes در صورت عدم وجود (جلوگیری از خطای 500)
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `story_likes` (
      `id` int NOT NULL AUTO_INCREMENT,
      `story_id` int NOT NULL,
      `user_id` int NOT NULL,
      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `unique_story_like` (`story_id`, `user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch(Exception $e){}

$method = $_SERVER['REQUEST_METHOD'];

// ─── دریافت اطلاعات (GET) ───
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // ۱. دریافت لیست کاربران بیننده یک استوری (برای کشوی خیاط)
    if ($action === 'viewers') {
        $storyId = (int)($_GET['story_id'] ?? 0);
        if ($storyId <= 0) {
            echo json_encode(['success' => false, 'message' => 'story_id الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT sv.id, sv.user_id, sv.viewed_at,
                   u.name as user_name, u.username as user_phone, u.avatar_url as user_avatar, u.role as user_role,
                   (sl.id IS NOT NULL) as has_liked
            FROM story_views sv
            LEFT JOIN users u ON u.id = sv.user_id
            LEFT JOIN story_likes sl ON sl.story_id = sv.story_id AND sl.user_id = sv.user_id
            WHERE sv.story_id = ?
            ORDER BY sv.viewed_at DESC
            LIMIT 100
        ");
        $stmt->execute([$storyId]);
        $viewers = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'viewers' => array_map(function($v) {
                return [
                    'id'       => (int)$v['id'],
                    'userId'   => (int)$v['user_id'],
                    'name'     => $v['user_name'] ?: ($v['user_phone'] ? 'کاربر ' . substr($v['user_phone'], -4) : 'مشتری کَندوره'),
                    'avatar'   => $v['user_avatar'],
                    'role'     => $v['user_role'] ?: 'customer',
                    'hasLiked' => (bool)$v['has_liked'],
                    'time'     => date('Y/m/d H:i', strtotime($v['viewed_at'])),
                    'viewedAt' => strtotime($v['viewed_at']) * 1000
                ];
            }, $viewers)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ۲. دریافت لیست استوری‌های فعال ۲۴ ساعت گذشته (با تایم استاندارد ایران)
    $currentUserId = (int)($_GET['viewer_user_id'] ?? 0);
    $twentyFourHoursAgo = date('Y-m-d H:i:s', time() - 86400);

    $stmt = $pdo->prepare("
        SELECT s.*, 
               COALESCE(sv.view_count, 0) as view_count,
               COALESCE(sl.like_count, 0) as like_count,
               (EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = ?)) as is_liked
        FROM stories s
        LEFT JOIN (
            SELECT story_id, COUNT(DISTINCT user_id) as view_count
            FROM story_views
            GROUP BY story_id
        ) sv ON s.id = sv.story_id
        LEFT JOIN (
            SELECT story_id, COUNT(DISTINCT user_id) as like_count
            FROM story_likes
            GROUP BY story_id
        ) sl ON s.id = sl.story_id
        WHERE s.created_at >= ? 
        ORDER BY s.id DESC
    ");
    $stmt->execute([$currentUserId, $twentyFourHoursAgo]);
    $stories = $stmt->fetchAll(); // فقط یک‌بار خوانده می‌شود

    echo json_encode([
        'success' => true,
        'stories' => array_map(function($s) {
            return [
                'id'          => (int)$s['id'],
                'userId'      => (int)($s['user_id'] ?? 2),
                'name'        => $s['tailor_name'],
                'storyTitle'  => $s['story_title'],
                'tag'         => $s['tag'],
                'desc'        => $s['description'],
                'price'       => (int)$s['price'],
                'image'       => $s['image_url'],
                'iconEmoji'   => $s['icon_emoji'],
                'bgGradient'  => $s['bg_gradient'],
                'views'       => (int)$s['view_count'],
                'likes'       => (int)$s['like_count'],
                'isLiked'     => (bool)$s['is_liked'],
                'time'        => 'امروز',
                'createdAt'   => strtotime($s['created_at']) * 1000
            ];
        }, $stories)
    ], JSON_UNESCAPED_UNICODE);
    exit;

// ─── عملیات ارسالی (POST) ───
} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'create';

    // ثبت بازدید از استوری
    if ($action === 'view') {
        $storyId = (int)($data['story_id'] ?? 0);
        $userId  = (int)($data['user_id'] ?? 0);

        if ($storyId <= 0 || $userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'story_id and user_id are required']);
            exit;
        }

        // اگر خود صاحب استوری باشد بازدید شمرده نمی‌شود
        $ownerStmt = $pdo->prepare("SELECT user_id FROM stories WHERE id = ? LIMIT 1");
        $ownerStmt->execute([$storyId]);
        $storyOwner = $ownerStmt->fetch();

        if ($storyOwner && (int)$storyOwner['user_id'] !== $userId) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO story_views (story_id, user_id) VALUES (?, ?)");
            $stmt->execute([$storyId, $userId]);
        }

        $countStmt = $pdo->prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM story_views WHERE story_id = ?");
        $countStmt->execute([$storyId]);
        $count = (int)($countStmt->fetch()['cnt'] ?? 0);

        echo json_encode([
            'success' => true,
            'views'   => $count
        ], JSON_UNESCAPED_UNICODE);
        exit;

    // ثبت یا حذف لایک استوری (Toggle Like)
    } elseif ($action === 'like') {
        $storyId = (int)($data['story_id'] ?? 0);
        $userId  = (int)($data['user_id'] ?? 0);

        if ($storyId <= 0 || $userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'شناسه استوری و کاربر الزامی است.']);
            exit;
        }

        // بررسی اینکه قبلاً لایک کرده یا نه
        $check = $pdo->prepare("SELECT id FROM story_likes WHERE story_id = ? AND user_id = ?");
        $check->execute([$storyId, $userId]);
        $alreadyLiked = $check->fetch();

        if ($alreadyLiked) {
            $pdo->prepare("DELETE FROM story_likes WHERE story_id = ? AND user_id = ?")->execute([$storyId, $userId]);
            $isLikedNow = false;
        } else {
            $pdo->prepare("INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)")->execute([$storyId, $userId]);
            $isLikedNow = true;

            // ارسال اعلان برای خیاط صاحب استوری
            $owner = $pdo->query("SELECT user_id, tailor_name FROM stories WHERE id = {$storyId}")->fetch();
            $liker = $pdo->query("SELECT name FROM users WHERE id = {$userId}")->fetch();
            if ($owner && (int)$owner['user_id'] !== $userId) {
                $likerName = $liker['name'] ?? 'مشتری';
                $pdo->prepare("INSERT INTO notifications (user_id, title, message, category, icon_emoji, reference_id) VALUES (?, 'استوری شما پسندیده شد ❤️', ?, 'نظرات و امتیازها', '❤️', ?)")
                    ->execute([(int)$owner['user_id'], "{$likerName} استوری کارگاه شما را پسندید.", (string)$storyId]);
            }
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM story_likes WHERE story_id = ?");
        $countStmt->execute([$storyId]);
        $totalLikes = (int)($countStmt->fetch()['cnt'] ?? 0);

        echo json_encode([
            'success' => true,
            'liked'   => $isLikedNow,
            'likes'   => $totalLikes
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } elseif ($action === 'delete') {
        $storyId = (int)($data['story_id'] ?? 0);
        $userId  = (int)($data['user_id'] ?? 0);

        if ($storyId > 0 && $userId > 0) {
            $stmt = $pdo->prepare("DELETE FROM stories WHERE id = ? AND user_id = ?");
            $stmt->execute([$storyId, $userId]);
        }

        echo json_encode(['success' => true, 'message' => 'استوری با موفقیت حذف شد.'], JSON_UNESCAPED_UNICODE);
        exit;

    // انتشار استوری جدید
    } else {
        $userId     = (int)($data['user_id'] ?? 2);
        $tailorName = !empty($data['name']) ? trim($data['name']) : 'کارگاه خیاطی';
        $title      = isset($data['storyTitle']) && $data['storyTitle'] !== null ? trim($data['storyTitle']) : '';
        $tag        = !empty($data['tag']) ? trim($data['tag']) : null;
        $desc       = !empty($data['desc']) ? trim($data['desc']) : null;
        $price      = !empty($data['price']) ? (int)$data['price'] : null;
        $image      = !empty($data['image']) ? $data['image'] : null;
        $emoji      = $data['iconEmoji'] ?? '🪡';
        $bgGradient = $data['bgGradient'] ?? 'bg-gradient-to-b from-[#1C150F] via-[#2A1F16] to-[#0A0705]';

        $stmt = $pdo->prepare("INSERT INTO stories (user_id, tailor_name, story_title, tag, description, price, image_url, icon_emoji, bg_gradient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $tailorName, $title, $tag, $desc, $price, $image, $emoji, $bgGradient]);
        $newId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'id'      => (int)$newId,
            'message' => 'استوری با موفقیت در دیتابیس منتشر شد.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}