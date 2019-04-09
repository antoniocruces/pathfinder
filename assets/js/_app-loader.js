'use strict';

// app scripts loader
let s = {  
	url: url => (
		new Promise((resolve, reject) => {
			let script = document.createElement('script');
			script.type = 'text/javascript';
			script.id = 'js_' + url.split('/')[url.split('/').length - 1].split('.')[0];
			script.src = url; // + '?v=' + document.querySelector("meta[name='csrf-version']").getAttribute("content");
			script.charset = 'utf8';
			script.async = false;
			script.removeEventListener('load', () => resolve(script), false);
			script.removeEventListener('error', () => reject(script), false);			
			script.addEventListener('load', () => resolve(script), false);
			script.addEventListener('error', () => reject(script), false);
			document.getElementsByTagName('head')[0].appendChild(script);
			script.removeEventListener('load', () => resolve(script), false);
			script.removeEventListener('error', () => reject(script), false);
			script = undefined;	
		})
	),
	urls: urls => (Promise.all(urls.map(s.url)))
};

s.urls(
	[
		'./assets/js/_app-settings.js',
		'./assets/js/_app-cultures.js',
		'./assets/js/_app-i18n.js',
		'./assets/js/_app-primitives.js',
		'./assets/js/_app-classes.js',
		'./assets/js/_app-effects.js',
		'./assets/js/_app-toolkit.js',
		'./assets/js/_app-ui.js',
		'./assets/js/_app-files.js',
		'./assets/js/_app-database.js',
		'./assets/js/_app-trade.js',
		'./assets/js/_app-pagescripts.js',
		'./assets/js/_app-info.js',
		'./assets/js/_app-routing.js',
		'./assets/js/_app-stats.js',
		'./assets/js/_app-charts.js',
		'./assets/js/_app-maps.js',
		'./assets/js/_app-main.js',
	]
).then(() => { s = undefined; });
