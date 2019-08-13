'use strict';

/* global AppError, ajax, c, charts, chartshelper, cultures, d, dbb, dbe, dbm, dbq, dbs, eucookielaw, file, i18n, icons, info, k, l, maps, objectsize, pagescripts, removeAllEventListener, router, stats, times, toolkit, trade, ui, uihelper */

// error catching

window.onerror = function(msg, url, line, col, error) {
	let title = [
		window.version.appname, 
		[window.version.version, window.version.subversion, window.version.release].join('.'),
		window.version.date.toLocaleDateString(l)
	].join(' ') + ' ' + l.toUpperCase();
	let oerror = error instanceof AppError || error instanceof AppWarning ? 
		Object.assign({}, error.toJSON()) : 
		{name: error.name, message: error.message};
	if(error) {
		if(!window.settings || window.settings.errorcatching === 1) {
			let detail = oerror.error.message;
			if(!window.settings || window.settings.verboseerror === 1) {
				detail = ([
					`<ul>`,
					`<li>ERRNAME: ${oerror.error.name}</li>`, 
					`<li>ERRMSG: ${oerror.error.message}</li>`,
					`<li>ERRURL: ${url}</li>`,
					`<li>ERRLINE: ${line}</li>`,
					`<li>ERRCOL: ${col}</li>`,
					`<li>ERRSTACK: ${oerror.error.stack}</li>`,				
					`</ul>`,
				].join('\n'));
				if(window.settings && window.settings.debugconsole) {
					console.error([
						`ERRNAME: ${oerror.error.name}`, 
						`ERRMSG: ${oerror.error.message}`,
						`ERRURL: ${url}`,
						`ERRLINE: ${line}`,
						`ERRCOL: ${col}`,
						`ERRSTACK: ${oerror.error.stack}`,				
					].join('\n'));
				}
			}
			if(screen) {
				let text = oerror.error.name === c`app-error`.uf() ? 
					c`error`.toUpperCase() : 
					c`warning`.toUpperCase();
				let color = oerror.error.name === c`app-error`.uf() ? 
					'error' : 
					'warning';
				let features = {
					progress: false,
					title: `${title}`,
					content: [
						`<div class="asset background-${color}-50 margin-bottom-s" style="padding:1em">`,
						`<h2 class="color-${color}">`,
						`${text}`,
						`</h2>`,
						`<p>`,
						`${detail}`,
						`</p>`,
						`</div>`,
					].join(''),
					action: false,
					cancel: true,
					canceltitle: c`close`.uf()
				}
				screen.alert = screen.displayalert(features);
				features = undefined;
			} else {
				detail = detail
					.replace('<ul>', '')
					.replace('</ul>', '')
					.replace('<li>', '')
					.replace('</li>', '');
				alert([
					`${title}\n----------\n`,
					`${detail}`,
				].join(''));
			}
		}
	}
	return true;
};

window.addEventListener('unhandledrejection', event => {
	event.preventDefault();
	throw new AppError(event.reason);
});

// load event
window.onload = function() {
	if(eucookielaw.checkcookie(window.cookieName) !== window.cookieValue) {
		eucookielaw.creatediv(); 
	}
	
	// settings local storage
	try {
		let tmp = JSON.parse(localStorage.getItem(window.version.appname));
		let arethesame = true;
		if(tmp) {
			let skeys = Object.keys(tmp);
			let nkeys = Object.keys(window.settings);
			nkeys.forEach(o => {
				if(!skeys.includes(o)) arethesame = false;
			});
			if(arethesame) window.settings = tmp;
		} else {
			localStorage.setItem(window.version.appname, JSON.stringify(window.settings));
			tmp = window.settings;
		}
		if(!arethesame) {
			alert(c`local-storage-difference-warning`.uf());
			localStorage.setItem(window.version.appname, JSON.stringify(window.settings));
			tmp = window.settings;
		}
		if(localStorage.pfdata) window.storeddata = true;
		let root = document.documentElement;
		let vars = [
			{themevar: 'color', name: 'color'},
			{themevar: 'backgroundcolor', name: 'background-color'},
			{themevar: 'fontfamilymain', name: 'font-family-main'},
			{themevar: 'fontfamilyheader', name: 'font-family-header'},
			{themevar: 'fontfamilyalternate', name: 'font-family-alternate'},
			{themevar: 'fontfamilymono', name: 'font-family-mono'},
			{themevar: 'fontsize', name: 'font-size'},
		];
		vars.forEach(o => {
			let elm = o.name;
			let val = o.themevar;
			root.style.setProperty('--' + elm, tmp['theme' + val]);
		});
		tmp = vars = root = undefined;
	} catch(error) {
		throw new AppError([c`local-storage-error`, ': ', error].join(''));	
	}

	// reload warning
	if(window.settings.reloadwarning === 1) {
		window.onbeforeunload = function() {
			return confirm('');
		};
	}
	
	// routing
	Object.assign(router.options, {
		routes: {
			"#home": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('home', 'main', ['echarts', 'L']);
				router.renderpage('sidehome', '#side');
			},
			"#starting": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('starting', 'main', ['L']);
				router.renderpage('sidedocuments', '#side');
			},
			"#legal": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('legal', 'main', ['L']);
				router.renderpage('sidelegal', '#side');
			},
			"#documents": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('documents', 'main', ['L']);
				router.renderpage('sidedocuments', '#side');
			},
			"#projects": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('projects', 'main', ['L']);
				router.renderpage('sidedocuments', '#side');
			},
			"#institutions": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('institutions', 'main', ['L']);
				router.renderpage('sidedocuments', '#side');
			},
			"#settings": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('settings', 'main', ['L']);
				router.renderpage('sidesettings', '#side');
			},
			"#data": () => {
				router.renderpage('footer', '#footer');
				router.renderpage('data', 'main', ['_', 'dl', 'echarts', 'L']);
				router.renderpage('sidedata', '#side');
			},
		},
		templatepath: './assets/views/' + l + '/'
	});
	
	existsasync(router.options.templatepath + 'home.html').then(rsp => {
		if(rsp) {
			router.init();
			window.storeoriginalsize = objectsize(d);
			window.storecurrentsize = window.storeoriginalsize;
			if(!toolkit.isavalidbrowser) {
				info.browserwarning();
			}
			
			// HW Speed evaluation
			performance.clearMarks();
			performance.clearMeasures();
			performance.mark("loop-s");	
			for (let i = window.estimative.ops; i > 0; i--) {} 
			performance.mark("loop-e");
			performance.measure('speed', 'loop-s', 'loop-e');
			let measures = performance.getEntriesByName('speed');
			window.estimative.opstime = measures[0].duration;
			window.estimative.opsbyte = 55;
			measures = undefined;
			
			if (byId('toggle')) {
				let toggle = byId('toggle');
				let body = document.getElementsByTagName('body')[0];
				toggle.addEventListener('click', function() {
					toolkit.showsidebar(true)
					if (body.classList.contains('open')) {
						body.classList.remove('open');
					} else {
						body.classList.add('open');
					}
				});
			}
		} else {
			window.location.href = encodeURI([
				`./error.php?`,
				`t=`,
				c`unrecoverable-error`.uf(),
				`&m=`,
				c`invalid-language`,
			].join(''));
		}
	})
	.catch(err => {
		throw new AppError(err);
	});
};

// unload event catching
window.addEventListener('unload', function () {
	window._ = undefined;
	window.L = undefined;
	window.echarts = undefined;
	window.dl = undefined;
	window.d3 = undefined;
	
	window.settings = undefined;
	window.servers = undefined;
	window.appTimeStart = undefined;
	window.appOverlay = undefined;
	window.fullscreensupport = undefined;
	window.dropCookie = undefined; 
	window.cookieDuration = undefined; 
	window.cookieName = undefined; 
	window.cookieValue = undefined; 
	window.version = undefined;
	window.resources = undefined;
	window.storeoriginalsize = undefined;
	window.storecurrentsize = undefined;

	window.fetchasync = undefined;
	window.fetchtextasync = undefined;
	window.loadstyles = undefined;
	window.handleKey = undefined;
	window.resetTime = undefined;
	window.setSelected = undefined;
	window.selectItem = undefined;
	
	Number.prototype.toroman = undefined;
	Number.prototype.ages = undefined;
	Number.prototype.clamp = undefined;
	Number.prototype.between = undefined;
	Date.prototype.dates = undefined;
	String.prototype.slugify = undefined;
	String.prototype.relations = undefined;
	String.prototype.places = undefined;
	String.prototype.dateparts = undefined;
	String.prototype.hosts = undefined;
	String.prototype.points = undefined;
	String.prototype.isvalidyear = undefined;
	String.prototype.string = undefined;
	String.prototype.uf = undefined;
	String.prototype.na = undefined;
	String.prototype.shorten = undefined;
	String.prototype.abbrev = undefined;
	String.prototype.getposttype = undefined;
	String.prototype.getrkeytype = undefined;
	String.prototype.b64encode = undefined;
	String.prototype.b64decode = undefined;
	String.prototype.gettabletype = undefined;
	Array.prototype.groupBy = undefined;
	Array.prototype.groupByMultiple = undefined;
	Array.prototype.countBy = undefined;
	Array.prototype.countByMultiple = undefined;
	Array.prototype.count = undefined;
	Array.prototype.sortBy = undefined;
	Array.prototype.unique = undefined;
	Array.prototype.uniqueby = undefined;
	Array.prototype.flatten = undefined;
	Array.range = undefined;
	Array.prototype.gaussiansort = undefined;
	Array.prototype.quantile = undefined;
	Array.prototype._intersection = undefined;
	Array.prototype._difference = undefined;
	Array.prototype._union = undefined;
	Array.prototype.sum = undefined;
	Array.prototype.avg = undefined;
	Array.prototype.sortlocale = undefined;
	Array.prototype.scalebetween = undefined;
	Array.prototype.remove = undefined;
	if (!String.prototype.startsWith) String.prototype.startsWith = undefined;
	if (!String.prototype.endsWith) String.prototype.endsWith = undefined;

	Object.prototype.vfilter = undefined;
	
	Set.intersection = undefined;
	
	router.stop();

	Object.entries(charts).forEach(o => { o = undefined; });
	Object.entries(chartshelper).forEach(o => { o = undefined; });
	Object.entries(cultures).forEach(o => { o = undefined; });
	Object.entries(times).forEach(o => { o = undefined; });
	Object.entries(dbb).forEach(o => { o = undefined; });
	Object.entries(dbe).forEach(o => { o = undefined; });
	Object.entries(dbm).forEach(o => { o = undefined; });
	Object.entries(dbq).forEach(o => { o = undefined; });
	Object.entries(dbs).forEach(o => { o = undefined; });
	Object.entries(dbhelper).forEach(o => { o = undefined; });
	Object.entries(ajax).forEach(o => { o = undefined; });
	Object.entries(file).forEach(o => { o = undefined; });
	Object.entries(i18n).forEach(o => { o = undefined; });
	Object.entries(icons).forEach(o => { o = undefined; });
	Object.entries(info).forEach(o => { o = undefined; });
	Object.entries(maps).forEach(o => { o = undefined; });
	Object.entries(mapengine).forEach(o => { o = undefined; });
	Object.entries(mapops).forEach(o => { o = undefined; });
	Object.entries(maphelpers).forEach(o => { o = undefined; });
	Object.entries(pagescripts).forEach(o => { o = undefined; });
	Object.entries(pagescriptshelper).forEach(o => { o = undefined; });
	
	Object.entries(d).forEach(o => { o = undefined; });
	Object.entries(k).forEach(o => { o = undefined; });
	
	Object.entries(stats).forEach(o => { o = undefined; });
	Object.entries(toolkit).forEach(o => { o = undefined; });
	Object.entries(eucookielaw).forEach(o => { o = undefined; });
	Object.entries(trade).forEach(o => { o = undefined; });
	Object.entries(ui).forEach(o => { o = undefined; });

	Object.entries(screen).forEach(o => { o = undefined; });

	let _events = ['click', 'mousedown', 'mouseup', 'focus', 'change', 'blur', 'select', 'keyup', 'copy'];
	_events.forEach(o => {
		removeAllEventListener(o);
	});
	
	window.removeEventListener('unhandledrejection', event => {
		event.preventDefault();
		throw new AppError(event.reason);
	});

	while (document.firstChild) {
		document.removeChild(document.firstChild);
	}
	
	['base', 'single'].forEach(cid => {
		if(d.maptransformations[cid].timerange.repeater) {
			window.clearInterval(d.maptransformations[cid].timerange.repeater);
		}
	});
	
	Record = undefined;
	Relative = undefined;
	ExtendableError = undefined;
	AppError = undefined;
	AppWarning = undefined;
	Circular = undefined;
	Stats = undefined;
	MapTree = undefined;
	Graph = undefined;
	PivotData = undefined;
	
	_events = undefined;
	
	console.clear();
});
