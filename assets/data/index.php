<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

function micro_time() {
	$temp = explode(" ", microtime());
	return bcadd($temp[0], $temp[1], 6);
}

/**
 * Two-way Encryption simple function
 * simple method to encrypt or decrypt a plain text string
 * initialization vector(IV) has to be the same when encrypting and decrypting
 * PHP 5.4.9 ( check your PHP version for function definition changes )
 *
 * this is a beginners template for simple encryption decryption
 * before using this in production environments, please read about encryption
 * use at your own risk
 *
 * @param string $action: can be 'encrypt' or 'decrypt'
 * @param string $string: string to encrypt or decrypt
 *
 * @return string
 */
function encrypt_decrypt($action, $string, $secret_key, $secret_iv) {
	$output = false;

	$encrypt_method = "AES-256-CBC";

	// hash
	$key = hash('sha256', $secret_key);
	
	// iv - encrypt method AES-256-CBC expects 16 bytes - else you will get a warning
	$iv = substr(hash('sha256', $secret_iv), 0, 16);

	if( $action == 'e' ) {
	   $output = openssl_encrypt($string, $encrypt_method, $key, 0, $iv);
	   $output = base64_encode($output);
	}
	else if( $action == 'd' ){
	   $output = openssl_decrypt(base64_decode($string), $encrypt_method, $key, 0, $iv);
	}

	return $output;
}

$descriptive_error = ($_REQUEST['e'] && $_REQUEST['e'] == 1) || false;

session_start();
if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json');
$headers = apache_request_headers();
$output  = array();

if (isset($headers['CsrfToken']) || isset($headers['csrftoken']) || isset($headers['Csrftoken'])) {
	$currentHeader = isset($headers['CsrfToken']) ? $headers['CsrfToken'] : (isset($headers['Csrftoken']) ? $headers['Csrftoken'] : $headers['csrftoken']);
	if ($currentHeader !== $_SESSION['csrf_token']) {
		if(!$descriptive_error) {
		   header('HTTP/1.0 401 Unauthorized', true, 401);
		   exit();
		} else {
		   $output['status'] = 'error';
		   $output['status_code'] = 401;
		   $output['status_message'] = 'Unauthorized.';
		   exit(json_encode($output));
		}
	} else {
	   if(
	   	isset($_REQUEST['q']) && isset($_REQUEST['f']) && isset($_REQUEST['x']) && isset($_REQUEST['r']) && isset($_REQUEST['t']) 
	   	&& isset($_REQUEST['d']) && isset($_REQUEST['u']) && isset($_REQUEST['c'])
	   ) {
		  $query		= $_REQUEST['q'];
		  $filter		= $_REQUEST['f'];
		  $selector		= $_REQUEST['x'];
		  $runout		= $_REQUEST['r']; // csrf_runout === encrypted pwd
		  $token		= $_REQUEST['t']; // csrf_token === secret key
		  $digest		= $_REQUEST['d']; // csrf_digest === secret iv
		  $uid		= $_REQUEST['u']; // csrf_uid === user name
		  $credential	= $uid . '@' . encrypt_decrypt('d', $runout, $token, $digest);
		  $compress	= $_REQUEST['c'] == 'c';
		  $ch  = curl_init("http://expofinder.uma.es/wp-admin/admin-ajax.php?q=$query&action=csl_generic_ajax_call&f=$filter&x=$selector&u=$credential");
		  
		  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		  curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
		  curl_setopt($ch, CURLOPT_USERAGENT, "GEODA");
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
				header( "Content-Type: application/json", true );	
			}
			if($compress) {
				header("Content-Encoding: gzip");
				
				ob_start(PHP_OUTPUT_HANDLER_CLEANABLE | PHP_OUTPUT_HANDLER_FLUSHABLE | PHP_OUTPUT_HANDLER_REMOVABLE);
				ob_implicit_flush(0);
				//ob_start("ob_gzhandler");
				ob_start();
				ob_implicit_flush(0);
				echo $response;
				
				ob_end_flush();
				//ob_end_flush();
				ob_end_clean();
				//echo $response;
			} else {
			  $length = ob_get_length();
				header( "Content-Type: application/json", true );
				session_cache_limiter('');
			  ob_end_flush();				 
			  echo $response;
			}
		  exit();
	   } elseif(isset($_REQUEST['p'])) {
			$time_start = micro_time();
		  $fp = fSockOpen(gethostbyname(filter_var($_REQUEST['p'], FILTER_SANITIZE_URL)), -1, $errno, $errstr, 1);
			if($fp) { 
				echo -1; 
				fclose($fp); 
			} else { 
				echo (float) round(((bcsub(micro_time(), $time_start, 6)) * 1000), 3); 
				fclose($fp);
			}
	  } else {
			if(!$descriptive_error) {
				header('HTTP/1.0 400 Bad request', true, 400);
				exit();
			} else {
			  $output['status'] = 'error';
			  $output['status_code'] = 400;
			  $output['status_message'] = "Bad request. $query $filter $selector $compress" ;
				exit(json_encode($output));
			}
	   }
	}
} else {
	if(!$descriptive_error) {
		header('HTTP/1.0 403 Forbidden', true, 403);
		exit();
	} else {
		$output['status'] = 'error';
		$output['status_code'] = 403;
		$output['status_message'] = 'Forbidden.';
		exit(json_encode($output));
	}
}

?>

