<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

$ch  = curl_init("http://expofinder.uma.es/wp-admin/admin-ajax.php?q=countdat&action=xxx");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
curl_setopt($ch, CURLOPT_USERAGENT, "PATHFINDER");
curl_setopt($ch, CURLOPT_HEADER, false);
$response = curl_exec($ch);
curl_close($ch);

header("Accept-Ranges: bytes");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true ");
header("Access-Control-Allow-Methods: OPTIONS, GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control");
header('G-Content-Length: ' . mb_strlen(gzencode($response)), true);
header('X-Content-Length: ' . mb_strlen($response), true);
//session_cache_limiter('');

header("Content-Type: text/plain");
//header( "Content-Type: application/json", true );	

ob_start();
ob_implicit_flush(0);
echo $response;

ob_end_flush();
exit();

?>
