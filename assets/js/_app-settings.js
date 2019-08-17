'use strict';

/* exported d, k */

// app global settings
window.settings = {
	errorcatching: 1,
	debugconsole: 0,
	verboseerror: 0,
	reloadwarning: 0,
	timeout: 5000,
	
	listrowsperpage: 10,
	matchrelated: 1,
	statstopvalues: 10,	
	minentropy: 3,
	graphnodemax: 10000,
	graphedgemax: 50000,
	scalecolorbase: 0,
	zscoreassstars: 0,
	querylengthlimit: 500000,
	
	maphomelat: 50,
	maphomelon: 17,
	maphomezoom: 3,
	mapbasedefault: 3,
	mapanimation: 3000,
	
	hmaplow: '#00ffff',
	hmapmedium: '#ffff00',
	hmaphigh: '#ff0000',
	
	themecolor: '#777777',
	themebackgroundcolor: '#ffffff',
	themefontfamilymain: 'Helvetica,Arial,sans-serif',
	themefontfamilyalternate: 'Georgia,serif',
	themefontfamilyheader: 'Raleway,\'Helvetica Neue\',Helvetica,Arial,sans-serif;',
	themefontfamilymono: 'Consolas,Courier,monospace',
	themefontsize: '16px',
};

window.theme = {
	color: '#000000',
	backgroundcolor: '#ffffff',
	fontfamilymain: 'Helvetica,Arial,sans-serif',
	fontfamilyalternate: 'Georgia,serif',
	fontfamilyheader: 'Raleway,\'Helvetica Neue\',Helvetica,Arial,sans-serif;',
	fontfamilymono: 'Consolas,Courier,monospace',
	fontsize: '16px',
};

window.servers = {
	appserver: './',
	dataserver: './assets/data/netstatus.php?u=expofinder.uma.es',
	videoserver: 'https://hdplus.es/pathfinder/assets/video/'
};

window.estimative = {
	ops: 150000000,
	opstime: 0,
	opsbyte: 35,
};

window.appTimeStart = 0;
window.appTimeCaller = null;
window.appOverlay = false;

window.storeoriginalsize = {bytes: 0, kib: 0, mib: 0, gib: 0};
window.storecurrentsize = {bytes: 0, kib: 0, mib: 0, gib: 0};

window.fullscreensupport = document.fullscreenEnabled ? '' : 
	document.webkitFullscreenEnabled ? 'webkit' : 
	document.mozFullscreenEnabled ? 'moz' : 
	document.msFullscreenEnabled ? 'ms' : 
	null;

// EU Cookies Law
window.dropCookie = true; 
window.cookieDuration = 30; 
window.cookieName = 'eucl_cookie'; 
window.cookieValue = 'on'; 

window.version = {
	appname: 'PATHFINDER', 
	version: 1, 
	subversion: 0, 
	release: 0, 
	date: new Date('2019-08-01'),
	license: 'CC BY-SA 4.0', 
	author: 'Antonio Cruces Rodríguez', 
	organization: 'University of Málaga', 
	suborganization: 'Art History Department',
	workgroup: 'iArtHis_LAB Research Group',
	country: 'Spain',
	DOIcite: 'ANTONIO CRUCES RODRÍGUEZ, 2018. antoniocruces/pathfinder: Initial release. 1 May 2019. S.l.: Zenodo.',
	DOIlink: 'http://doi.org/10.5281/zenodo.1196786',
	DOIbadge: [
		'<a rel="nofollow" target="_blank" style="vertical-align: middle;" ',
		'href="https://doi.org/10.5281/zenodo.1196786">',
		'<img src="https://zenodo.org/badge/DOI/10.5281/zenodo.1196786.svg" ',
		'alt="DOI" style="height:1.3em"></a>',
	].join(''),
	GitHublink: 'https://github.com/antoniocruces',
	GitHubbadge: [
		'<a rel="nofollow" target="_blank" href="https://github.com/antoniocruces">', 
		'<img src="./assets/img/logos/GitHub_Logo.png" style="height:1.3em" />',
		'</a>',
	].join(''),
	citation: [
		'\n\n----------\n\nCruces Rodríguez, Antonio.', 
		'“PATHFINDER.”', 
		'PATHFINDER,',
		'University of Málaga, Art History Department, iArtHis_LAB Research Group,', 
		new Date(), 
		',',
		document.location.href,
	].join(' '),
};

window.resources = [
	{
		url: './assets/js/vendor/vega/datalib.min.js', 
		filetype: 'js', 
		namespace: 'dl', 
		libname: 'datalib', 
		slug: 'dl', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: 'dl',
	},
	{
		url: './assets/js/vendor/lodash/lodash.min.js', 
		filetype: 'js', 
		namespace: '_', 
		libname: 'lodash', 
		slug: 'lo', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: '_',
	},
	{
		url: './assets/js/vendor/echarts/echarts.min.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'ec', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: 'echarts',
	},
	{
		url: './assets/js/vendor/echarts/ecStat.min.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'ecstats', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
	},
	{
		url: './assets/js/vendor/echarts/echarts-wordcloud.min.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'wordcloud', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	
	{
		url: './assets/js/vendor/echarts/themes/dark.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'thdark', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/echarts/themes/vintage.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'thvintage', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/echarts/themes/macarons.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'thmacarons', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/echarts/themes/infographic.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'thinfographic', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/echarts/themes/shine.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'thshine', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/echarts/themes/roma.js', 
		filetype: 'js', 
		namespace: 'echarts', 
		slug: 'ec', 
		libname: 'throma', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	

	{
		url: './assets/js/vendor/leaflet/leaflet-src.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lj', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: 'L',
	},
	{
		url: './assets/js/vendor/leaflet/leaflet-heat.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lh', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/CanvasFlowmapLayer.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lf', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/leaflet-providers.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lp', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},	
	{
		url: './assets/js/vendor/leaflet/turf.min.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lt', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/leaflet.markercluster.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lx', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/oms.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lo', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/Tween.min.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lx', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/dom-to-image.min.js', 
		filetype: 'js', 
		namespace: 'L', 
		slug: 'lw', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/MarkerCluster.css', 
		filetype: 'css', 
		namespace: 'L', 
		slug: 'ly', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/MarkerCluster.Default.css', 
		filetype: 'css', 
		namespace: 'L', 
		slug: 'ly', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
	{
		url: './assets/js/vendor/leaflet/leaflet.css', 
		filetype: 'css', 
		namespace: 'L', 
		slug: 'lc', 
		libname: 'lf', 
		isloaded: false, 
		iserror: false, 
		errormsg: '', 
		isconstant: false,
		id: null,
	},
];

// data constants
const d = {
	store: {pos: null, met: null, tax: null}, 
	chains: [],
	links: [],
	relations: null,
	datalength: 0,
	poslength: 0,
	metlength: 0,
	taxlength: 0,
	credentials: [],
	countries: [],
	file: {name: '', size: 0},
	stackedchartslocal: {},
	stackedchartsremote: {},
	staticmapsrc: [
		[
			'https://www.mapquestapi.com/staticmap/v4/getplacemap?location=@&size=800,400',
			'&type=map&zoom=17&imagetype=png&scalebar=true&scalebarPos=top&showicon=blue-1',
			'&key=',
			window.version.MapQuestAPIKey,
		].join(''),
		[
			'./assets/data/maps/staticmap.php?center=@&amp;',
			'zoom=14&amp;size=865x350&amp;markers=@&amp;maptype=osma',
		].join('')
	],
	currentipsrc: 'https://api.ipify.org/?format=json',
	currentlocationsrc: 'https://geoip.nekudo.com/api/', 
	countrygeocodesrc: 'https://nominatim.openstreetmap.org/search/?format=json&country=',
	reversegeocodesrc: 'https://nominatim.openstreetmap.org/reverse',
	qrcodesrc: 'https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=',
	filteruuid: null,
	filterids: null,
	filterrefine: null,
	filterrelids: null,
	filterrecord: {value: '', rkey: '', operator: 'li', modifier: '', results: []},
	filtersubfilter: {artwork: false, book: false, company: false, entity: false, exhibition: false, person: false},
	filtersublinks: [],
	filterexclude: '',
	nullpoint: {latitude: null, longitude: null, string: null},
	filter: [],
	filtermatches: {artwork: {}, book: {}, company: {}, entity: {}, exhibition: {}, person: {}},
	filtered: 0,
	filteredrel: 0,
	currentfilterlink: null,
	currentpages: {
		list: 1,
		pivot: 1,
		schema: 1,
		relations: 1,
		cooccurrences: 1,
		graph: 1,
	},
	singlechain: [],
	yeardatelimits: [100, new Date().getFullYear() + 10],
	forbiddendates: ['0000-01-01'],
	
	/* stats */
	accountnumericfields: [
		'count', 'account', 'sum', 'total', 'med', 'mea', 
		'max', 'min', 'std', 'stdev', 'mod', 'q1', 'q3', 'dis', 
		'mis', 'val', 'msk'
	],
	statscolumns: ['z', 'l', 'o', 's', 'b', 'f', 't'],
	
	schemarectype: null,
	schemacols: [],
	schemastrict: true,
	schemaoutliersonly: false,
	schemaresults: [],
	schemapivot: {cols: [], rows: [], result: [], visible: false},
	schemastats: [],
	schemaoutliers: [],
	schemarelevance: [],
	schemauuid: null,
	cooccurrencessource: '',
	cooccurrencestarget: '',
	cooccurrencesroute: [],
	cooccurrencesoutliersonly: false,
	cooccurrencesstats: [],
	cooccurrencesoutliers: [],
	cooccurrencesrelevance: [],
	cooccurrencesresults: [],
	cooccurrencesfeatures: [],
	cooccurrencesuuid: null,
	
	appelements: [
		{name: 'style', shortname: 's', color: '#1f8dd6'},
		{name: 'script', shortname: 'x', color: '#8058a5'},
		{name: 'view', shortname: 'v', color: '#5eb95e'},
		{name: 'document', shortname: 'd', color: '#dd514c'},
		{name: 'image', shortname: 'i', color: '#fad232'},
	],	
	scales: [
		{start: 180, end: 225, inverted: false, name: 'blue'},
		{start: 225, end: 180, inverted: true, name: 'inverse-blue'},
		{start: 65, end: 150, inverted: null, name: 'green'},
		{start: 150, end: 65, inverted: null, name: 'inverse-green'},
		{start: 60, end: 0, inverted: false, name: 'red'},
		{start: 0, end: 60, inverted: true, name: 'inverse-red'},
		{start: 320, end: 280, inverted: false, name: 'mauve'},
		{start: 280, end: 320, inverted: true, name: 'inverse-mauve'},
		{start: 0, end: 120, inverted: null, name: 'red-to-green'},
		{start: 120, end: 0, inverted: null, name: 'green-to-red'},
	],	

	charttables: [
		{model: 'qry', name: 'places', filters: 'places', facets: ['town', 'region', 'country']}, 
		{model: 'qry', name: 'ages', filters: 'ages', facets: ['days', 'months', 'weeks', 'years', 'yearsbin', 'isalive']}, 
		{model: 'qry', name: 'genders', filters: 'genders', facets: ['gender']}, 
		{model: 'qry', name: 'hosts', filters: 'uris', facets: ['hostname']}, 
		{model: 'qry', name: 'startdates', filters: 'startdates', facets: ['decade', 'year', 'month', 'monthname', 'day']}, 
		{model: 'qry', name: 'enddates', filters: 'enddates', facets: ['decade', 'year', 'month', 'monthname', 'day']}, 
		{model: 'qry', name: 'taxonomies', filters: 'taxonomies', facets: ['value']}, 
		{model: 'tbl', name: 'schema', filters: [], facets: []}, 
		{model: 'tbl', name: 'relations', filters: [], facets: []}, 
		{model: 'tbl', name: 'cooccurrences', filters: [], facets: []},
	], 
	chartblacklist: [
		'ID',
		'value', 
		'rtype', 
		'string', 
		'number'
	],
	chartselectedtheme: 'infographic',	
	chartselectedmodel: null,	
	chartselectedname: null,	
	chartselectedfilter: null,	
	chartselectedfacet: null, 
	chartselectedserie: null, 
	chartselectedlines: true,
	chartselectedmarks: true,
	chartselectedscale: true,
	chartselectedlegend: true,
	chartgaussiansort: false,
	chartcooccurrenceslayout: null,
	chartregression: null,
	chartexcludenulls: true,
	
	chartsymbols: [
		'circle', 
		'rect', 
		'triangle', 
		'diamond', 
		'pin', 
		'arrow'
	],
	chartsymbolcolors: [
		'rgba(25,93,230,0.5)', 
		'rgba(0,116,173,0.5)', 
		'rgba(230,25,161,0.5)', 
		'rgba(192,12,0,0.5)', 
		'rgba(255,102,26,0.5)', 
		'rgba(0,179,0,0.5)', 
	],

	networkresults: [],

	/* maps */
	mapdata: {},
	mapdatauuid: null,
	map: {
		base: null,
		single: null,
	},
	mapoms: {
		base: null,
		single: null,
	},
	mapexport: {
		base: null,
		single: null,
	},
	mapiconradius: 10,
	mapgendercolors: [
		{name: 'undeclared', color: '#f50'},
		{name: 'female', color: '#e619a1'},
		{name: 'male', color: '#195de6'},
	],
	mapshapes: ['Circle', 'Star', 'Square', 'Diamond', 'Triangle', 'InvertedTriangle', 'HexaStar'],
	mapratios: [1, 1, 1, 1, 1, 1, 1],
	mapopacity: [0.5, 0.6, 0.7, 0.3, 0.4, 0.8, 0.9],
	mapcolors: ['#00b5f7', '#00faff', '#b1ff59', '#ff47a6', '#e500b7', '#d27038', '#7a8b99'],
	mapiconfeatures: {
		size: {
			micro: 6,
			tiny: 12,
			small: 16,
			medium: 20,
			big: 24,
		},
		opacity: {
			low: 0.2,
			medium: 0.5,
			high: 0.8,
			solid: 1,
		},
	},
	mapchoroplethranges: [0, 10, 100, 500, 1000, 5000, 10000, 50000],
	mapdataranges: [
		{min: -Infinity, max: 5},
		{min: 6, max: 50},
		{min: 51, max: 100},
		{min: 101, max: 250},
		{min: 251, max: 500},
		{min: 501, max: 1000},
		{min: 1001, max: Infinity},
	],
	mapexportexclude: [
		'.leaflet-control', 
		'.leaflet-control-scale-line', 
		'.leaflet-control-zoom', 
		'.leaflet-control-attribution', 
		'.leaflet-linfo-panel'
	],
	mapproviders: [
		{name: 'OSM Color', provider: 'OpenStreetMap.Mapnik'},
		{name: 'OSM HOT', provider: 'OpenStreetMap.HOT'},
		{name: 'CartoDB DarkMatter', provider: 'CartoDB.DarkMatter'},
		{name: 'CartoDB Positron', provider: 'CartoDB.Positron'},
		{name: 'CartoDB Positron No Labels', provider: 'CartoDB.PositronNoLabels'},
		{name: 'CartoDB Positron Labels Only', provider: 'CartoDB.PositronOnlyLabels'},
		{name: 'CartoDB Voyager', provider: 'CartoDB.Voyager'},
		{name: 'CartoDB Voyager No Labels', provider: 'CartoDB.VoyagerNoLabels'},
		{name: 'CartoDB Voyager Labels Only', provider: 'CartoDB.VoyagerOnlyLabels'},
		{name: 'ESRI World Imagery', provider: 'Esri.WorldImagery'},
		{name: 'ESRI World Street Map', provider: 'Esri.WorldStreetMap'},
		{name: 'ESRI World Topographic Map', provider: 'Esri.WorldTopoMap'},
		{name: 'ESRI World Gray Canvas', provider: 'Esri.WorldGrayCanvas'},
		{name: 'Hydda Full', provider: 'Hydda.Full'},
		{name: 'Hydda Base', provider: 'Hydda.Base'},
		{name: 'OpenTopoMap', provider: 'OpenTopoMap'},
		{name: 'Stamen TonerLite', provider: 'Stamen.TonerLite'},
		{name: 'Stamen Terrain', provider: 'Stamen.Terrain'},
		{name: 'Wikimedia', provider: 'Wikimedia'},
	],
	mapgeojsonlayers: [
		{
			name: 'world_continents', color: '#00a8e8', opacity: 1, 
			weight: 1, fillColor: '#00a8e8', fillOpacity: 0.2, field: ['continent'],
			fieldname: ['continent']
		},
		{
			name: 'world_admin0', color: '#2c739e', opacity: 1, 
			weight: 1, fillColor: '#2c739e', fillOpacity: 0.2, field: ['ADMIN', 'ISO_A3'],
			fieldname: ['country', 'iso-code']
		},
		{
			name: 'world_admin1', color: '#d3372f', opacity: 1, 
			weight: 1, fillColor: '#d3372f', fillOpacity: 0.2, field: ['country', 'ISO3166-1-Alpha-3', 'name'], 
			fieldname: ['country', 'iso-code', 'region-or-province']
		},
		{
			name: 'eu_countries', color: '#6bf178', opacity: 1, 
			weight: 1, fillColor: '#6bf178', fillOpacity: 0.2, field: ['country', 'population2009'],
			fieldname: ['country', 'population']
		},
		{
			name: 'spain_regions', color: '#d8973c', opacity: 1, 
			weight: 1, fillColor: '#d8973c', fillOpacity: 0.2, field: ['nombre'],
			fieldname: ['region']
		},
		{
			name: 'spain_provinces', color: '#0090c1', opacity: 1, 
			weight: 1, fillColor: '#0090c1', fillOpacity: 0.2, field: ['nombre'],
			fieldname: ['province']
		},
		{
			name: 'spain_municipalities', color: '#a42cd6', opacity: 1, 
			weight: 1, fillColor: '#a42cd6', fillOpacity: 0.2, field: ['ComAutonom', 'Provincia', 'Texto'],
			fieldname: ['region', 'province', 'municipality']
		},
		{
			name: 'spain_quarters', color: '#f2c56d', opacity: 1, 
			weight: 1, fillColor: '#f2c56d', fillOpacity: 0.2, field: ['municipio', 'distrito', 'barrio'],
			fieldname: ['municipality', 'district', 'quarter']
		},
		{
			name: 'spain_malaga_districts', color: '#7a6262', opacity: 1, 
			weight: 1, fillColor: '#7a6262', fillOpacity: 0.2, field: ['NUMERO', 'NOMBRE'],
			fieldname: ['number', 'district']
		},
		{
			name: 'spain_malaga_quarters', color: '#ea805b', opacity: 1, 
			weight: 1, fillColor: '#ea805b', fillOpacity: 0.2, field: ['NUMBARRIO', 'NOMBARRIO'],
			fieldname: ['number', 'quarter']
		},
		{
			name: 'spain_malaga_schools', color: '#6d9c00', opacity: 1, 
			weight: 1, fillColor: '#6d9c00', fillOpacity: 0.2, field: ['Denominaci', 'Nombre', 'Dependenci', 'Enseñanzas'],
			fieldname: ['type', 'name', 'ownership', 'teachings']
		},
		{
			name: 'spain_malaga_cultural_centers', color: '#5f2580', opacity: 1, 
			weight: 1, fillColor: '#5f2580', fillOpacity: 0.2, field: ['TIPO', 'NOMBRE'],
			fieldname: ['type', 'name']
		},
	],
	maplayers: {
		base: {
			base: {}, 
			overlays: {}, 
			graticules: {},
			data: {}, 
			queries: {},
			datepanel: null,
			infopanel: null,
			legend: null,
		},
		single: {
			base: {}, 
			overlays: {}, 
			graticules: {},
			data: {}, 
			queries: {},
			datepanel: null,
			infopanel: null,
			legend: null,
		},
	},
	maptimelimits: {low: 0, high: new Date().getFullYear() + 10},
	maptransformations: {
		base: {
			related: false,
			neighbourhood: false,
			relatedhmap: false,
			neighbourhoodhmap: false,
			voronoi: false,
			envelope: false,
			convex: false,
			tin: false,
			buffer: 0,
			maintainqueries: false,
			timerange: {
				totalmin: 0, 
				totalmax: 0, 
				min: 0, 
				max: 0, 
				sliderpos: 0, 
				slideractive: false, 
				repeater: null, 
				repeateractive: false,
			},
			legend: {artwork: true, book: true, company: true, entity: true, exhibition: true, person: true},
		},
		single: {
			related: false,
			neighbourhood: false,
			relatedhmap: false,
			neighbourhoodhmap: false,
			voronoi: false,
			envelope: false,
			convex: false,
			tin: false,
			buffer: 0,
			maintainqueries: false,
			timerange: {
				totalmin: 0, 
				totalmax: 0, 
				min: 0, 
				max: 0, 
				sliderpos: 0, 
				slideractive: false, 
				repeater: null, 
				repeateractive: false,
			},
			legend: {artwork: true, book: true, company: true, entity: true, exhibition: true, person: true},
		},
	},
	mapsearch: {
		base: {
			text: null,
			id: null,
		},
		single: {
			text: null,
			id: null,
		},
	},
	
	/* collection */
	collections: [],
	
	/* colors by clrs.cc */
	post_types: [
		{
			name: 'a', slug: 'artwork', tip: 'art', background: '#08c', 
			color: '#08c', bcolor: 'info', shape: 'circle', radius: 10
		}, 
		{
			name: 'b', slug: 'book', tip: 'boo', background: '#e619a1', 
			color: '#e619a1', bcolor: 'tertiary', shape: 'circle', radius: 10
		}, 
		{
			name: 'c', slug: 'company', tip: 'com', background: '#7f19e6', 
			color: '#7f19e6', bcolor: 'secondary', shape: 'circle', radius: 10
		}, 
		{
			name: 'e', slug: 'entity', tip: 'ent', background: '#c00', 
			color: '#c00', bcolor: 'error', shape: 'circle', radius: 10
		}, 
		{
			name: 'x', slug: 'exhibition', tip: 'exh', background: '#00b300', 
			color: '#00b300', bcolor: 'success', shape: 'circle', radius: 10
		}, 
		{
			name: 'p', slug: 'person', tip: 'peo', background: '#f50', 
			color: '#f50', bcolor: 'warning', shape: 'circle', radius: 10
		}, 
		{
			name: 't', slug: 'taxonomy', tip: 'tax', background: '#d5d7dd', 
			color: '#d5d7dd', bcolor: 'light', shape: 'circle', radius: 10
		}, 
		{
			name: 'r', slug: 'record', tip: 'pos', background: '#5c6370', 
			color: '#5c6370', bcolor: 'grey', shape: 'circle', radius: 10
		}, 
	],
	nativetypes: [
		'met', 
		'pos', 
		'tax' 
	],
	validexporttypes: [
		'CSV', 
		'JSON',
		'TAB', 
		'XLS',
		'XML'
	],
	record_types: [
		'artwork',
		'book',
		'company',
		'entity',
		'exhibition',
		'person',
	],
	quotable_types: [
		'artwork',
		'book',
		'exhibition',
	],
	metadata: [
		'_cp__art_alternative_title',
		'_cp__boo_catalog_type',
		'_cp__com_company_dimension',
		'_cp__exh_exhibition_access',
		'_cp__exh_exhibition_site',
		'_cp__exh_geotag',
		'_cp__peo_gender',
		'_cp__peo_person_type',
	],
	taxonomies: [
		'tax_topic',
		'tax_artwork_type',
		'tax_period',
		'tax_movement',
		'tax_exhibition_type',
		'tax_typology',
		'tax_ownership',
		'tax_keyword',
		'tax_activity',
		'tax_publisher',
		'tax_isic4_category',
		'tax_catalog_typology',
	],
	taxonomy_pairs: [
		{tax: 'tax_topic', tips: ['exh']},
		{tax: 'tax_artwork_type', tips: ['art', 'exh']},
		{tax: 'tax_period', tips: ['art', 'exh']},
		{tax: 'tax_movement', tips: ['art', 'exh']},
		{tax: 'tax_exhibition_type', tips: ['exh']},
		{tax: 'tax_typology', tips: ['ent']},
		{tax: 'tax_ownership', tips: ['ent']},
		{tax: 'tax_keyword', tips: ['ent']},
		{tax: 'tax_activity', tips: ['peo']},
		{tax: 'tax_publisher', tips: ['boo']},
		{tax: 'tax_isic4_category', tips: ['com']},
		{tax: 'tax_catalog_typology', tips: ['boo']},
	],
	startdates: [
		'_cp__art_artwork_start_date',
		'_cp__boo_publishing_date',
		'_cp__exh_exhibition_start_date',
		'_cp__peo_birth_date',
	],
	enddates: [
		'_cp__art_artwork_end_date',
		'_cp__exh_exhibition_end_date',
		'_cp__peo_death_date',
	],
	uris: [
		'_cp__ent_html_uri',
		'_cp__ent_rss_uri',
	],
	points: [
		'_cp__art_coordinates',
		'_cp__peo_coordinates',
		'_cp__com_coordinates',
		'_cp__boo_coordinates',
		'_cp__ent_coordinates',
		'_cp__exh_coordinates'
	],
	places: [
		'_cp__boo_publishing_place',
		'_cp__com_company_headquarter_place',
		'_cp__ent_town',
		'_cp__exh_exhibition_town',
		'_cp__peo_country',
	],
	relatives: [
		'_cp__art_artwork_author',
		'_cp__art_entity_when_cataloging',
		'_cp__art_related_boo_catalogs',
		'_cp__art_owner', 
		'_cp__boo_artwork',
		'_cp__boo_artwork_author',
		'_cp__boo_paper_author',
		'_cp__boo_paper_editor',
		'_cp__boo_sponsorship',
		'_cp__ent_parent_entity',
		'_cp__exh_art_collector',
		'_cp__exh_artwork_author',
		'_cp__exh_catalog',
		'_cp__exh_curator',
		'_cp__exh_funding_entity',
		'_cp__exh_info_source',
		'_cp__exh_museography',
		'_cp__exh_parent_exhibition',
		'_cp__exh_source_entity',
		'_cp__exh_supporter_entity',
		'_cp__peo_entity_relation',
		'_cp__peo_person_relation',
	],
	genders: [
		'_cp__peo_gender',
	],
	ownership: [
		'tax_ownership',
	],
	ages: [
		'_cp__art_age',
		'_cp__boo_age',
		'_cp__peo_age',
		'_cp__exh_age',
	],
	linkables: [
		'_cp__exh_geotag',
		'_cp__peo_country',
		'_cp__boo_publishing_place',
		'_cp__com_company_headquarter_place',
		'_cp__ent_town',
		'_cp__exh_exhibition_town',
		'_cp__exh_exhibition_site',
	],
	operators: [
		'eq',
		'ne',
		'gt',
		'ge',
		'lt',
		'le',
		'li',
		'nl',
		'bt',
		'nu',
		'nn'
	],
	linkers: [
		'_and',
		'_not',
		'_and_not'
	],
	modifiers: [
		'century',
		'year',
		'month',
		'monthname',
		'day',
		'weekday',
		'weekdayname',
		'town',
		'region',
		'country',
		'host',
		'years',
		'months',
		'weeks',
		'days',
		'longitude',
		'latitude'
	],
};

const k = {
	keys: [
		...d.record_types, 
		...d.metadata, 
		...d.startdates, 
		...d.enddates, 
		...d.ages, 
		...d.uris, 
		...d.places, 
		...d.points, 
		...d.relatives,
		...d.taxonomies
	],
	metadata: [
		...d.metadata, 
		...d.taxonomies, 
		...d.places,
		...d.startdates, 
		...d.enddates, 
		...d.ages, 
	],
	record_types: [
		...d.record_types, 
	],
	taxonomies: [
		...d.taxonomies
	],
	dates: [
		...d.startdates, 
		...d.enddates, 
	],
	qualifiers: [
		...d.genders,
		...d.ownership,
	],
	formats: {
		longdate: {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}
	},
	statsmeasures: {
		fld: 'field',
		vld: 'valid',
		dst: 'distinct',
		mis: 'missing',
		mea: 'mean',
		med: 'median',
		std: 'stdev',
		msk: 'modeskew',
		q1: 'q1',
		q3: 'q3',
	},
	relfacets: [
		'relkey',
		'reltype',
		'reltitle',
		'relstartcentury',
		'relstartdecade',
		'relstartyear',
		'relstartmonth',
		'relstartweekday',
		'relstartday',
		'relendcentury',
		'relenddecade',
		'relendyear',
		'relendmonth',
		'relendweekday',
		'relendday',
		'relyears',
		'reldays',
		'reltown',
		'relregion',
		'relcountry',
		'relgender',
		'reltaxtopic',
		'reltaxartworktype',
		'reltaxperiod',
		'reltaxmovement',
		'reltaxexhibitiontype',
		'reltaxtypology',
		'reltaxownership',
		'reltaxactivity',	
	],
	menus: [
		{
			nen: 'PATHFINDER',
			nes: 'PATHFINDER',
			den: 'Application',
			des: 'Aplicación',
			sub: [  
				{  
					nen: 'Home',
					nes: 'Inicio',
					den: 'Home page',
					des: 'Página inicial',
					lnk: 'home',
				},
				{
					nen: 'Data',
					nes: 'Datos',
					den: 'Database and filter management',
					des: 'Base de datos y gestión de filtros',
					lnk: 'data',
					sub: [
						{  
							nen: 'Panel',
							nes: 'Panel',
							den: 'Database setup and data download',
							des: 'Configuración de la base de datos y descarga desde el servidor',
							sub: [
								{  
									nen: 'Update data',
									nes: 'Actualizar datos',
									den: 'ExpoFinder server data download',
									des: 'Descarga de datos del servidor de ExpoFinder',
								},
								{  
									nen: 'Load file',
									nes: 'Carga de archivo',
									den: 'Database initialization using downloaded JSON file',
									des: 'Inicialización de la base de datos utilizando un archivo JSON descargado',
								},
								{  
									nen: 'Info',
									nes: 'Información',
									den: 'Most relevant figures of PATHFINDER database',
									des: 'Cifras más relevantes de la base de datos PATHFINDER',
								},
								{  
									nen: 'Export',
									nes: 'Exportación',
									den: 'Interchange formats data output',
									des: 'Salida de datos en formatos de intercambio',
								},
								{  
									nen: 'Collections',
									nes: 'Colecciones',
									den: 'Pre-selected PATHFINDER database subsets',
									des: 'Subconjuntos de la base de datos PATHFINDER preseleccionados',
								},
								{  
									nen: 'Reports',
									nes: 'Informes',
									den: 'Making off of analyzable data files',
									des: 'Generación de archivos de datos analizables',
								},
							]
						},
						{  
							nen: 'Filter',
							nes: 'Filtro',
							den: 'Data subset selection using logical conditions array',
							des: 'Selección del subconjunto de datos usando una matriz de condiciones lógicas',
						},
						{  
							nen: 'Listing',
							nes: 'Listado',
							den: 'Database navigation in paginated mode and single record exploration',
							des: 'Navegación de la base de datos en modo paginado y exploración de registros individuales',
						},
						{  
							nen: 'Stats',
							nes: 'Estadísticas',
							den: 'Deduct properties from the dataset and make comparisons',
							des: 'Deducir propiedades del conjunto de datos y hacer comparaciones',
							sub: [
								{  
									nen: 'Info',
									nes: 'Información',
									den: 'Short help about stats operations',
									des: 'Breve ayuda sobre operaciones estadísticas',
								},
								{  
									nen: 'Grouping',
									nes: 'Grupos',
									den: 'Aggregation functions over quantified data',
									des: 'Funciones de agregado sobre datos cuantificados',
								},
								{  
									nen: 'Correlations',
									nes: 'Correlaciones',
									den: 'Discovering of hidden relationships between subsets of primary records',
									des: 'Descubrimiento de relaciones ocultas entre subconjuntos de registros primarios',
								},
							],
						},
						{  
							nen: 'Charts',
							nes: 'Gráficos',
							den: 'Graphical representation of the statistical properties of the database',
							des: 'Representación gráfica de las propiedades estadísticas de la base de datos',
						},
						{  
							nen: 'Networks',
							nes: 'Redes',
							den: 'Draw of database relational properties in graph format',
							des: 'Dibujo de las propiedades relacionales de la base de datos en formato de grafo',
						},
						{  
							nen: 'Maps',
							nes: 'Mapas',
							den: 'Geographical distribution of primary records and their features',
							des: 'Distribución geográfica de los registros primarios y sus características',
						},
					]
				},	
				{
					nen: 'Options',
					nes: 'Opciones',
					den: 'What PATHFINDER needs to work and how it should do it',
					des: 'Qué necesita PATHFINDER para funcionar y cómo debe hacerlo',
					lnk: 'settings',
					sub: [
						{  
							nen: 'Requirements',
							nes: 'Requisitos',
							den: 'Minimum and optimal hardware and software features to work with PATHFINDER',
							des: 'Características mínimas y óptimas de <em>hardware</em> y <em>software</em> para trabajar con PATHFINDER',
						},
						{  
							nen: 'Settings',
							nes: 'Ajustes',
							den: 'Configuring PATHFINDER behavior',
							des: 'Configuración del comportamiento de PATHFINDER',
						},
						{  
							nen: 'Language',
							nes: 'Idioma',
							den: 'Language switching',
							des: 'Cambio de idioma',
						},
						{  
							nen: 'Application',
							nes: 'Aplicación',
							den: 'Info about app',
							des: 'Información sobre la aplicación',
						},
					]
				},
				{  
					nen: 'Documents',
					nes: 'Documentos',
					den: 'PATHFINDER operation: theory and description',
					des: 'Funcionamiento de PATHFINDER: teoría y descripción',
					lnk: 'documents',
					sub: [
						{  
							nen: 'Documents',
							nes: 'Documentos',
							den: 'Scientific and technical foundations of PATHFINDER',
							des: 'Fundamentos científicos y técnicos de PATHFINDER',
							sub: [
								{  
									nen: 'What is',
									nes: 'Qué es',
									den: 'What PATHFINDER is',
									des: 'Qué es PATHFINDER',
								},
								{  
									nen: 'Purpose',
									nes: 'Propósito',
									den: 'What PATHFINDER aims to achieve',
									des: 'Qué pretende conseguir PATHFINDER',
								},
								{  
									nen: 'Resources',
									nes: 'Recursos',
									den: 'Human and material resources behind PATHFINDER',
									des: 'Recursos humanos y materiales detrás de PATHFINDER',
								},
								{  
									nen: 'Onthology',
									nes: 'Ontología',
									den: 'ExpoFinder information system',
									des: 'Sistema de información ExpoFinder',
								},
								{  
									nen: 'Manual',
									nes: 'Manual',
									den: 'Operating instructions for PATHFINDER',
									des: 'Manual de operatoria para PATHFINDER',
								},
							],
						},
						{  
							nen: 'Tutorials',
							nes: 'Tutorial',
							lnk: 'starting',
							den: 'Learning how PATHFINDER works',
							des: 'Aprendiendo cómo funciona PATHFINDER',
						},
						{  
							nen: 'Projects',
							nes: 'Proyectos',
							den: 'Which research projects is PATHFINDER working for?',
							des: 'Para qué proyectos de investigación trabaja PATHFINDER',
						},
						{  
							nen: 'Institutions',
							nes: 'Instituciones',
							den: 'Academic and institutional support to PATHFINDER',
							des: 'Apoyo académico e institucional a PATHFINDER',
						},
					]
				},
				{  
					nen: 'ES (Language)',
					nes: 'EN (Idioma)',
					den: 'Language change to ES',
					des: 'Cambio de idioma a EN',
				},				
				{
					nen: 'Legal',
					nes: 'Legal',
					den: 'Compliance with regulations, location of the research team and licenses',
					des: 'Cumplimiento de normativas, localización del equipo investigador y licencias',
					lnk: 'legal',
					sub: [
						{  
							nen: 'Contact',
							nes: 'Contacto',
							den: 'Know where and how to establish contact with research and development team',
							des: 'Sepa dónde y cómo establecer contacto con el equipo de investigación y desarrollo',
						},
						{  
							nen: 'Legal',
							nes: 'Legal',
							den: 'Laws and legal regulations for the use of PATHFINDER',
							des: 'Normativas y regulaciones legales del uso de PATHFINDER',
						},
						{  
							nen: 'Licenses',
							nes: 'Licencias',
							den: 'Terms of use of PATHFINDER, gratefulness and acknowledgments to other open source developments employees',
							des: 'Condiciones de uso de PATHFINDER, agradecimientos y reconocimientos a otros desarrollos de código libre empleados',
						},
					]
				},
				{  
					nen: 'Colors',
					nes: 'Colores',
					den: 'Chromatic codes used in app',
					des: 'Códigos cromáticos usados en la aplicación',
				},				
				{  
					nen: 'Libraries',
					nes: 'Bibliotecas',
					den: 'Code libraries used in PATHFINDER and its loading status',
					des: 'Bibliotecas de código usadas en PATHFINDER y su estado de carga',
				},				
			]
		}
	],
};
