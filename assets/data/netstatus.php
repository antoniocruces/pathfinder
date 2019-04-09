<?php
/**
 *@param $domain string IP address or URL
 */
function pingdomain($domain){
	$data = parse_url($domain);
	if (isset($data['host'])) {
		$domain = $data['host'];
	}else{
		$domain = $data['path'];
	}
    $starttime = microtime(true);
    $file      = fsockopen ($domain, 80, $errno, $errstr, 10);
    $stoptime  = microtime(true);
    $status    = 0;

    if (!$file) $status = -1;  // Site is down
    else {
        fclose($file);
        $status = ($stoptime - $starttime) * 1000;
        $status = floor($status);
    }

    return $status;
}

echo pingdomain($_REQUEST['u']);
?>