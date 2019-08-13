<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

if(isset($_REQUEST['q']) && isset($_REQUEST['f']) && isset($_REQUEST['c']) && isset($_REQUEST['x']) && isset($_REQUEST['u'])) {
	$query = $_REQUEST['q'];
	$filter = $_REQUEST['f'];
	$compress	= $_REQUEST['c'] == 'c';
	$selector	= $_REQUEST['x'];
	$credential = $_REQUEST['u']; 
	
	$ch  = curl_init("http://expofinder.uma.es/xx-xxxxx/xxxxx-xxxx.php?q=$query&action=xxx_xxxxxxx_xxxx_xxxx&f=$filter&x=$selector&u=$credential");
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
	
	if($filter == 'tsv') {
		header("Content-Type: text/plain");
	} else {
		//header("Content-Type: text/plain");
		header( "Content-Type: application/json", true );	
	}
	if($compress) {
		header("Content-Encoding: gzip");
		ob_start(PHP_OUTPUT_HANDLER_CLEANABLE | PHP_OUTPUT_HANDLER_FLUSHABLE | PHP_OUTPUT_HANDLER_REMOVABLE);
		ob_implicit_flush(0);
		ob_start();
		ob_implicit_flush(0);
		echo $response;
		
		ob_end_flush();
		ob_end_clean();
	} else {
		ob_start();
		ob_implicit_flush(0);
		echo $response;
		
		ob_end_flush();
	}
	exit();
} else {
	var_dump($_REQUEST);
	exit();
}

?>