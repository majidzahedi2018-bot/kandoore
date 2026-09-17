<?php
// مسیر فایل در هاست: api/sms_helper.php

function sendOtpSms($phone, $code) {
    $apiKey = "4yqu1COm0U51FnHjvxFpB9FfsgMbaXQhJOttcdUoRHR4XEnW";
    $templateId = 571994;

    $url = "https://api.sms.ir/v1/send/verify";

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

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3); // حداکثر ۳ ثانیه برای اتصال اولیه
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);        // حداکثر ۵ ثانیه برای دریافت پاسخ
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Accept: application/json",
        "x-api-key: " . $apiKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($httpCode === 200 || $httpCode === 201);
}