<?php
declare(strict_types=1);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$key = $_GET['key'] ?? '';
if ($key !== 'kandoore-debug-1') { http_response_code(403); echo 'forbidden'; exit; }

$logFile = __DIR__ . '/crash.log';

if (isset($_GET['view'])) {
    $lines = is_file($logFile) ? file($logFile) : [];
    $lines = array_slice($lines, -500);
    header('Content-Type: text/plain; charset=utf-8');
    echo implode('', $lines);
    exit;
}

$raw = file_get_contents('php://input');
$entry = json_encode([
    'time' => date('c'),
    'ip'   => $_SERVER['REMOTE_ADDR'] ?? '',
    'ua'   => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'g'    => $_GET,
    'payload' => $raw,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
@file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);

http_response_code(200);
header('Content-Type: application/json');
echo '{"ok":true}';