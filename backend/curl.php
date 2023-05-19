<?php

error_reporting(0);

function err_4xx($code, $message) {
    header("HTTP/1.0 $code $message");
    exit(0);
}

if (!isset($_GET['url'])) {
    err_4xx(400, 'Bad Request');
}
$url = filter_var($_GET['url'], FILTER_SANITIZE_URL);
$parsed_url = parse_url($url);
if (!isset($parsed_url['scheme']) || $parsed_url['scheme'] !== 'https') {
    // Allow only HTTPS scheme.
    err_4xx(400, 'Bad Request');
}

// CORS check.
$server_host = (isset($_SERVER['HTTP_HOST'])) ? parse_url($_SERVER['HTTP_HOST']) : array();
$server_referer = (isset($_SERVER['HTTP_REFERER'])) ? parse_url($_SERVER['HTTP_REFERER']) : array();
if (!isset($server_host['scheme'])) {
    $server_host['scheme'] = (isset($_SERVER['HTTPS']) || isset($_SERVER['HTTP_X_FORWARDED_SSL'])) ? 'https' : 'http';
}
if (!isset($server_referer['scheme'])) {
    $server_referer['scheme'] = 'http';
}
if (!isset($server_host['host'])) {
    $server_host['host'] = $server_host['path'];
}
if (!isset($server_host['port'])) {
    $server_host['port'] = ($server_host['scheme'] === 'https') ? '443' : '80';
}
if (!isset($server_referer['port'])) {
    $server_referer['port'] = ($server_referer['scheme'] === 'https') ? '443' : '80';
}
$scheme_check = $server_host['scheme'] === $server_referer['scheme'];
$host_check = isset($server_referer['host']) && $server_host['host'] === $server_referer['host'];
$port_check = $server_host['port'] === $server_referer['port'];
if (!($scheme_check && $host_check && $port_check)) {
    err_4xx(403, 'Forbidden');
}

$headers = array(
    "HTTP/1.0",
    "Accept: */*",
    "Accept-Encoding: gzip, deflate",
    "Connection: keep-alive",
    "User-Agent: CurlFetcher/1.0.0"
);
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true);
$result = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header_str = substr($result, 0, $header_size);
$body_str = substr($result , $header_size);
curl_close($ch);

header('HTTP/1.0 200 OK');
foreach(explode("\r\n", $header_str) as $header) {
    header($header);
}

echo $body_str;
