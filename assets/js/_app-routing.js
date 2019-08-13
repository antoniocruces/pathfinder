'use strict';

/* global cfetch, loadstyles, pagescripts, removeAllEventListener, toolkit */
/* exported router */

// router
const router = {
	options: {
		routes: {},
		templatepath: '',
		defaultpage: '#home'
	},
	init: function() {
		router.bindevents();
		let event = document.createEvent('Event');
		event.initEvent('hashchange', false, true); 
		window.dispatchEvent(event);
		event = undefined;
	},
	stop: function() {
		router.unbindevents();
	},
	bindevents: function() {
		window.addEventListener('hashchange', router.render.bind(router), false);
	},
	unbindevents: function() {
		window.removeEventListener('hashchange', router.render.bind(router), false);
	},
	render: function() {
		let keyname = window.location.hash.split('/')[0] !== '' ? window.location.hash.split('/')[0] : router.options.defaultpage;
		let url = window.location.hash;
		if (router.options.routes[keyname]) {
			router.options.routes[keyname](url);
		} else {
			router.renderpage('footer', '#footer');
			router.renderpage('error', 'main');
			router.renderpage('sidehome', '#side');
		}
		keyname = url = undefined;
	},
	renderpage: function(templateid, targetid, lres = []) {
		let _target = targetid || 'main';

		let _events = ['click', 'mousedown', 'mouseup', 'focus', 'change', 'blur', 'select', 'keyup', 'copy'];
		_events.forEach(o => {
			removeAllEventListener(o);
		});
		
		router.fetch(templateid, _target, router.options.templatepath + templateid + '.html');
		if(_target === 'main') {
			window.resources.forEach(o => {
				router.unloadresource(o.url, o.filetype, o.namespace, o.isconstant);
			});
			lres.forEach(o => {
				let resource = window.resources.filter(r => r.namespace === o);
				if(resource.length) {
					resource.forEach(r => router.loadresource(r.url, r.filetype, r.namespace));
				}
				resource = undefined;
			});
		}
		_target = _events = undefined;
	},
	fetch: function(tid, target, url) {
		return cfetch(url).then(r => r.text()).then(r => { 
			if(document.querySelector(target)) {
				toolkit.cleardomelement(target);
				document.querySelector(target).innerHTML = r;
			}
			pagescripts[tid].call(); 
		});
	},
	loadresource: function(url, filetype, namespace) {
		let lres = null;
		if (filetype === 'js') { 
			lres = document.createElement('script');
			lres.setAttribute('type', 'text/javascript');
			lres.setAttribute('src', url);
			lres.setAttribute('id', 'js_' + url.split('/')[url.split('/').length - 1].split('.')[0]);
		} else if (filetype === 'css') { 
			loadstyles([url]);
		}
		if (lres && filetype === 'js') {
			lres.async = false;
			lres.addEventListener('load', function _loader() { 
				router.resourcestatus('LOAD ' + lres.id, namespace, true, false, '');
				lres.removeEventListener('load', _loader);
				lres = undefined;
			}, true);
			lres.addEventListener('error', function _loader(err) { 
				router.resourcestatus('ERROR ' + lres.id, namespace, false, true, err); 
				lres.removeEventListener('error', _loader);
				lres = undefined;
			}, true);
			document.getElementsByTagName('head')[0].appendChild(lres);
		}
	},
	unloadresource: function(url, filetype, namespace, isconstant) {
		namespace = namespace || null;
		let telm = filetype === 'js' ? 'script' : filetype === 'css' ? 'link' : 'none';
		let tatt = filetype === 'js' ? 'src' : filetype === 'css' ? 'href' : 'none';
		let susp = document.getElementsByTagName(telm);
		for (let i = susp.length; i >= 0; i--) {
			if (susp[i] && susp[i].getAttribute(tatt) !== null && susp[i].getAttribute(tatt).indexOf(url) !== -1) {
				susp[i].parentNode.removeChild(susp[i]);
			}
		}
		if(namespace && eval('typeof ' + namespace + ' !== \'undefined\'')) {
			if(isconstant) {
				eval('Object.entries(' + namespace + ').forEach(o => { o = undefined; });');
			} else {
				eval(namespace + ' = undefined;');
				// special cases: Leaflet
				if(namespace === 'L') {
					eval('window.Leaflet = undefined;');
					eval('window.turf = undefined;');
					eval('window.TWEEN = undefined;');
					eval('window._Group = undefined;');
				}
			}
		}
		router.resourcestatus('UNLOAD ' + namespace, namespace, false, false, '');
		telm = tatt = susp = undefined;
	},
	resourcestatus: function(operation, namespace, loadstatus, errorstatus, msg) {
		if(window.settings.debugconsole === 1) console.log('RESOURCESTATUS - OPERATION: %s', operation)
		let resource = window.resources.filter(o => o.namespace === namespace);
		if(resource.length) {
			resource.forEach(r => {
				r.isloaded = loadstatus;
				r.iserror = errorstatus;
				r.errormsg = msg;
			});
			resource = undefined;
		} else {
			resource = undefined;
			throw new AppError('router.resourcestatus: ' + c`invalid-resource`);
		}
	},
};
