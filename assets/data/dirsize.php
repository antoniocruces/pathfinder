<?php
function GetDirectorySize($path){
    $bytestotal = 0;
    $path = realpath($path);
    if($path!==false && $path!='' && file_exists($path)){
        foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $object){
            $bytestotal += $object->getSize();
        }
    }
    return $bytestotal;
}

$parentdir = dirname(__FILE__) . '/..'; 
$cssdir = $parentdir . '/css';
$jsdir = $parentdir . '/js';
$viewsdir = $parentdir . '/views';
$docsdir = $parentdir . '/docs';
$imgdir = $parentdir . '/img';
echo GetDirectorySize($cssdir) . ',' . GetDirectorySize($jsdir) . ',' . GetDirectorySize($viewsdir) . ',' . GetDirectorySize($docsdir) . ',' . GetDirectorySize($imgdir);
?>
