<?php

$status   = (int)$_SERVER['REDIRECT_STATUS'];
$language = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
$rmessage = $_REQUEST['m'];
$rtitle = $_REQUEST['t'];

$codes=array(
      200 => array('200 OK', 'La solicitud es correcta.'),
      400 => array('400 Bad Request', 'La solicitud contiene sintaxis errónea.'),
      401 => array('401 Unauthorized', 'Acceso a recurso no autorizado.'),
      402 => array('402 Payment Required', 'Se requiere pago previo.'),
      403 => array('403 Forbidden', 'Acceso prohibido a personal no autorizado.'),
      404 => array('404 Not found', 'El recurso solicitado no existe.'),
      405 => array('405 Method Not Allowed', 'El método empleado en la solicitud no es adecuado para el tipo de recurso solicitado.'),
      406 => array('406 Not Acceptable', 'Ninguno de los métodos aceptables propuestos por el cliente lo es para el servidor.'),
      407 => array('407 Proxy Authentication Required', 'Es necesario que el servidor proxy autorice la petición.'),
      408 => array('408 Request Timeout', 'El tiempo requerido para completar la solicitud realizada por el cliente ha excedido el límite máximo permitido.'),
      409 => array('409 Conflict', 'La solicitud no puede ser procesada por un conflicto con el estado actual del recurso que la solicitud identifica.'),
      410 => array('410 Gone', 'El recurso solicitado ya no está disponible y no lo estará de nuevo.'),
      411 => array('411 Length Required', 'La longitud del contenido de la solicitud especificada por el cliente no es correcta.'),
      412 => array('412 Precondition Failed', 'El servidor no es capaz de cumplir con algunas de las condiciones impuestas por el cliente en su petición.'),
      413 => array('413 Request Entity Too Large', 'La entidad cuyo acceso solicita el cliente excede la longitud máxima permitida.'),      
      414 => array('414 Request URI Too Large', 'La URI de la petición del navegador excede la longitud máxima permitida.'),
      415 => array('415 Unsupported Media Type', 'El formato de la solicitud del cliente no es aceptable para el servidor.'),

      416 => array('416 Requested Range Not Satisfiable', 'El rango de acceso solicitado por el cliente no es aceptable para el navegador.'),
      417 => array('417 Expectation Failed', 'El servidor no ha aceptado los requerimientos de la cabecera Expect de la petición realizada por el cliente.'),

      429 => array('429 Too Many Requests', 'El servidor ha detectado un número excesivo de conexiones solicitadas por el cliente.'),
      431 => array('431 Request Header Fileds Too Large', 'Una o más cabeceras de la solicitud realizada por el cliente excede el máximo permitido.'),
      451 => array('451 Unavailable for Legal Reasons', 'El recurso solicitado ha sido eliminado como consecuencia de una orden judicial o sentencia emitida por un tribunal.'),
      
      500 => array('500 Internal Server Error', 'Se ha producido un error interno en el servidor.'),
      501 => array('501 Not Implemented', 'El servidor no soporta alguna funcionalidad necesaria para responder a la solicitud del cliente.'),
      502 => array('502 Bad Gateway', 'La respuesta ofrecida por el servidor contactado a través de pasarela no es aceptable.'),
      503 => array('503 Service Unavailable', 'En estos momentos el servidor no puede responder a la solicitud del cliente.'),
      504 => array('504 Gateway Timeout', 'La respuesta ofrecida por el servidor contactado a través de pasarela ha excedido el tiempo máximo aceptable.'),
      505 => array('505 HTTP Version Not Supported', 'El servidor no soporta la versión HTTP solicitada por el cliente.'),
      506 => array('506 Variant Also Negotiates (RFC 2295)', 'El servidor ha detectado una referencia circular al procesar la parte de la negociación del contenido de la solicitud del cliente.'),
      507 => array('507 Insufficient Storage (WebDAV - RFC 4918)', 'El servidor no puede crear o modificar el recurso solicitado porque no hay suficiente espacio de almacenamiento libre.'),
      508 => array('508 Loop Detected (WebDAV)', 'La petición no se puede procesar porque el servidor ha encontrado un bucle infinito al intentar procesarla.'),
      509 => array('509 Exceeded Bandwidth (Unofficial)', 'Límite de ancho de banda excedido.'),
      510 => array('510 Not Extended (RFC 2774)', 'La petición del cliente debe añadir más extensiones para que el servidor pueda procesarla.'),
      511 => array('511 Network Authentication Required', 'El cliente debe autenticarse para poder realizar peticiones.'),
);

$errortitle = $rtitle ? $rtitle : $codes[$status][0];
$message    = $rmessage ? $rmessage : $codes[$status][1];

?>

<!doctype html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="PATHFINDER. ExpoFinder Data Analysis & Exploitation">
	<meta name="author" content="Antonio Cruces Rodríguez. iArtHis_LAB">
	<title>PATHFINDER</title>
	<link rel="stylesheet" href="https://unpkg.com/purecss@1.0.0/build/pure-min.css" integrity="sha384-nn4HPE8lTHyVtfCBi5yW9d20FjT8BJwUXyWZT9InLYax14RDjBj46LmSztkmNP9w" crossorigin="anonymous">
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway:200">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Dosis">
	<link id="css_app-styles" rel="stylesheet" href="assets/css/_app-styles.css">
</head>

<body>
	<div id="layout">
		<a href="#menu" id="menuLink" class="menu-link">
			<span></span>
		</a>
		<div id="side" class="no-print">
			<div class="pure-menu">
				<a class="pure-menu-heading" href="./">PATHFINDER</a>
				<ul class="pure-menu-list">
					<li class="pure-menu-item bg-red text-light-red">
						<a href="javascript:;" class="pure-menu-link pure-menu-status">
							<span id="app-microchart"></span>
							<span id="app-status">ERROR</span>
						</a>
					</li>
					<li class="pure-menu-item menu-item-divided">
						<a href="./" class="pure-menu-link">Home / Inicio</a>
					</li>
				</ul>
			</div>			
		</div>
		<div id="main">
			<main>
				<div class="header">
					<h1>
						<img class="logo" src="./assets/img/logos/IMGLOGOPF.svg" alt="PATHFINDER" height="50">
						<span class="text-error">ERROR</span>
					</h1>
					<h2>
						This page is shown because PATHFINDER is in an unrecoverable error condition.
					</h2>
					<h2>
						Esta página se muestra porque PATHFINDER está en una condición de error irrecuperable.
					</h2>
				</div>
				
				<div class="pagecontent">
					<div class="content">
						<h3 class="pagecontent-header"><?php echo $errortitle; ?></h3>
				
						<p>
							Error description / Descripción del error: 
							<strong>
								<span id="err-description"><?php echo $message; ?></span>
							</strong>
						</p>
				
						<p>
							<a class="pure-button" href="./">Home / Inicio</a>
						</p>
					</div>
				</div>				
			</main>
		</div>
	</div>
	<div id="footer" class="footer no-print">
		<div class="legal pure-g">
			<div class="pure-u-1 u-sm-1-2">
				<p class="legal-license">
					<span data-demo="footerleft" id="ftr-id">
						<a href="javascript:info.app();">
							<span id="footer-application"></span>
						</a>
						<a rel="noopener" target="_blank" href="https://hdplus.es">HD+</a>
						&nbsp;|&nbsp;
						<a id="doi-link" rel="noopener" target="_blank" href="">DOI</a>
						&nbsp;|&nbsp;
						<a id="github-link" rel="noopener" target="_blank" href="">GitHub</a>
					</span>
				</p>
				<p class="legal-license">&copy; 2019 
					<a rel="noopener" target="_blank" href="http://iarthislab.es">iArtHis_LAB</a>
					. All rights reserved. 
					<a rel="noopener" target="_blank" href="https://creativecommons.org/licenses/by-sa/4.0/deed.es_ES">
						<img src="./assets/img/logos/cc.svg" width="12" height="12" />
						<img src="./assets/img/logos/by.svg" width="12" height="12" />
						<img src="./assets/img/logos/sa.svg" width="12" height="12" />
					</a>
				</p>
			</div>
		</div>
	</div>	
</body>
</html>
