<?php
// مسیر فایل: api/test_sms.php
header('Content-Type: text/html; charset=utf-8');

$apiKey = "4yqu1COm0U51FnHjvxFpB9FfsgMbaXQhJOttcdUoRHR4XEnW";
$templateId = 475715;
$phone = "09055167823"; // شماره موبایل خودتان را اینجا بگذارید
$code = "1234";

$payload = [
    "mobile"     => $phone,
    "templateId" => (int)$templateId,
    "parameters" => [
        [
            "name"  => "CODE",
            "value" => (string)$code
        ]
    ]
];

$ch = curl_init("https://api.sms.ir/v1/send/verify");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Accept: application/json",
    "x-api-key: " . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "<h3>نتیجه تست ارسال پیامک:</h3>";
echo "<b>کد وضعیت HTTP:</b> " . $httpCode . "<br><br>";
echo "<b>پاسخ سرور SMS.ir:</b> <pre>" . htmlspecialchars($response) . "</pre>";
if ($curlError) {
    echo "<b>خطای اتصال cURL:</b> " . $curlError;
}