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
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>PATHFINDER</title>
		<meta name="description" content="PATHFINDER. ExpoFinder Data Analysis & Exploitation">
		<meta name="author" content="Antonio Cruces Rodríguez" >
		<link rel="stylesheet" href="./assets/css/_app-styles.css">
	</head>
	<body class="text-black background-white">
		<div id="body">
			<section class="padding-top-l flex-grow-container">
				<div id="main" class="flex-grow-main">
					<main>
						<header class="padding-vertical-l text-align-center">
							<div class="container">
	    							<img class="logo" src="./assets/img/logos/ANIMATEDLOGOPF.svg" 
	    							alt="PATHFINDER" style="min-height:95px;">
								<p class="lead lead-s margin-vertical-m">
									Herramienta para el análisis gráfico y textual de datos procedentes de 
									<a rel="noopener" href="http://expofinder.uma.es" target="_blank">ExpoFinder</a>.
								</p>
								<h2 class="no-margin-bottom color-error">
									This page is shown because PATHFINDER is in an unrecoverable error condition.
								</h2>
								<h2 class="no-margin-top color-error">
									Esta página se muestra porque PATHFINDER está en una condición de error irrecuperable.
								</h2>
								<h2><?php echo $errortitle; ?></h3>
				
								<p>
									Error description / Descripción del error: 
									<strong>
										<span id="err-description"><?php echo $message; ?></span>
									</strong>
								</p>
						
								<p>
									<a class="button" href="./">Home / Inicio</a>
								</p>
							</div>
						</header>						
					</main>
				</div>
			</section>
		</div>
	</body>
</html>
