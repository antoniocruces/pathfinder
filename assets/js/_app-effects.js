'use strict';

/* global AppError, byId, c, d, file, removeqoutes, toolkit */
/* eslint no-confusing-arrow: ["error", {"allowParens": true}] */
/* exported screen */
/* eslint-env es6 */

// global screen functions
const gscreen = {
	overlay: undefined,
	alert: undefined,
	modal: undefined,
	siteoverlayisset: false,
	documentoverlay: function() {
		let instance = this;
		function getdocumentdimensions(prop, m) {
			m = m || 'max';
			return Math[m](
				Math[m](document.body['scroll' + prop], document.documentElement['scroll' + prop]),
				Math[m](document.body['offset' + prop], document.documentElement['offset' + prop]),
				Math[m](document.body['client' + prop], document.documentElement['client' + prop])
			);
		}
		
		let css = (el, o) => {
			for(let i in o) { 
				if(o.hasOwnProperty(i)) {
					el.style[i] = o[i];
				}
			}
			return el;
		};
	 
		this.css = function(o){
			css(instance.element, o);
			return instance;
		};
	 
		this.duration = null;
		
		this.element = (function() {
			let elm = document.createElement('div');
			let txt = document.createElement('div');
			txt.id = 'app-overlay-txt';
			txt.style.backgroundColor = 'transparent !important';
			elm.appendChild(txt);
			elm.id = 'app-overlay';
			return css(elm, {
				width: '100%',
				height: getdocumentdimensions('Height') + 'px',
				position: 'absolute', 
				zIndex: 1100,
				left: 0, 
				top: 0,
				cursor: 'wait'
			});
		})();
	 
		window.onresize = function() {
			instance.css({display: 'none'});
			setTimeout(() => {
				instance.css({
					height: getdocumentdimensions('Height') + 'px',
					display: 'block'
				});
			}, 10);
		};
		
		this.remove = function() {
			if(this.element.parentNode) this.element.parentNode.removeChild(instance.element);
		};
		
		this.show = function() {};
		
		this.on = function(what, handler){
			if(what.toLowerCase() === 'show') {
				instance.show = handler;
			} else {
				instance.element['on' + what] = handler;
			} 
			return instance;
		};
	 
		this.init = function(duration) {
			instance.duration = duration || instance.duration;
			document.getElementsByTagName('body')[0].appendChild(instance.element);
			instance.show.call(instance.element,instance);
			if(instance.duration) setTimeout(() => { instance.remove(); }, instance.duration);
			return instance;
		};
	},
	siteoverlay: (active = true, txt = 'working') => {
		let over = byId('siteoverlay');
		let text = byId('siteoverlaytext');
		if(active) {
			if(!gscreen.siteoverlayisset) {
				if(over) {
					text.parentNode.removeChild(text);
					over.parentNode.removeChild(over);
				}
				let newover = document.createElement('DIV');
				let newtext = document.createElement('DIV');
				newover.id = 'siteoverlay';
				newtext.id = 'siteoverlaytext';
				newtext.innerHTML = c(txt).length > 50 ? 
					`${c(txt).uf()}` : 
					`<span class="loading">${c(txt).uf()}</span>`;
				
				newover.style.position = 'fixed';
				newover.style.width = '100%';
				newover.style.height = '100%';
				newover.style.top = 0;
				newover.style.left = 0;
				newover.style.right = 0;
				newover.style.bottom = 0;
				newover.style.backgroundColor = 'rgba(0,0,0,0.5)';
				newover.style.zIndex = 8000;
				newover.style.cursor = 'wait';
				
				newover.style.display='none';
				
				newtext.style.position = 'absolute';
				newtext.style.top = '50%';
				newtext.style.left = '50%';
				newtext.style.color = '#ffffff';
				newtext.style.transform = 'translate(-50%,-50%)';
				newtext.style.height = 'auto';
	
				newover.appendChild(newtext);
				document.body.appendChild(newover);
				
				let tmp = newover.offsetHeight;
				tmp = undefined;
				newover.style.display='block';
				
				gscreen.siteoverlayisset = true;
				newover = newtext = undefined;
			}
		} else {
			if(over) {
				text.parentNode.removeChild(text);
				over.parentNode.removeChild(over);
			}
			gscreen.siteoverlayisset = false;
		}
		over = text = undefined;
	},
	displaymodal: features => {
		features = {
			title: features.title || null,
			content: features.content || '',
			action: features.action || '',
			cancel: features.cancel || false,	
			canceltitle: features.canceltitle || c`cancel`.uf(),
			help: features.help || null,
			icon: features.icon || '',
		};
		if(byId('appmodal')) byId('appmodal').remove();
		let modal = document.createElement('div');
		modal.id = 'appmodal';
		let body = document.getElementsByTagName('body')[0];
		let closemark = [
			`<a class="pull-right no-print" `,
			`href="javascript:if(gscreen.modal){gscreen.modal.remove();`,
			`gscreen.modal=undefined;if(gscreen.siteoverlayisset){gscreen.siteoverlay(false);}`,
			`gscreen.togglebodyscrollbar();}">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="xcircle" d=""></path>`,
			`</svg>`,
			`</a>` ,
		].join('');
		let exporttext = [
			`<a class="pull-right no-print margin-right-s" `,
			`href="javascript:gscreen.exportmodaltext('modal-content');">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="download" d=""></path>`,
			`</svg>`,
			`</a>` ,
		].join('');
		let help = [
			`<a class="pull-right no-print margin-right-s" `,
			`href="javascript:info.help('${features.help}');">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="helpcircle" d=""></path>`,
			`</svg>`,
			`</a>` ,
		].join('');
		modal.setAttribute('class', 'modal');
		modal.innerHTML = [
			`<header class="margin-bottom-s">`,
			features.title ? [
				`<h4 id="modal-title">`,
				`${features.icon}`,
				`${features.title}`,
				`<span>`,
				`${closemark}`,
				`<a class="pull-right no-print margin-right-s" `,
				`href="javascript:toolkit.printdiv('modal-content', '${removeqoutes(features.title)}');">`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="printer" d=""></path>`,
				`</svg>`,
				`</a>`,
				`${exporttext}`,
				`${features.help ? help : ''}`,
				`</span>`,
				`</h4>`,
			].join('') : '',
			`</header>`,
			`<div id="modal-content" class="modal-content">`,
			features.content,
			`</div>`,
			(features.action || features.cancel) ? [
				`<footer class="text-align-right">`,
				features.action,
				features.cancel ? 
					`<a id="modal-close" class="button button-light" href="javascript:;">${features.canceltitle}</a>` : 
					'',
				`</footer>`,
			].join('') : '',
			`<section class="show-print">`,
			`<p id="prn-modal-footer" class="prn-copyright"></p>`,
			`<figure>`,
			`<img id="prn-modal-qrcode" `,
			`style="display:block;margin-left:auto;margin-right:auto;" `,
			`src="" />`,
			`</figure>`,
			`</section>`,
		].join('');

		body.appendChild(modal);	
		document.documentElement.style.overflowY = 'hidden';
		toolkit.drawicons();			
		
		let modalclose = document.querySelector('#modal-close');
		if(!gscreen.siteoverlayisset) gscreen.siteoverlay(true);
		
		if(modalclose) {
			modalclose.addEventListener('click', function() {
				if(byId('single-map')) {
					if(d.map.single) {
						d.map.single.eachLayer(function(layer) {
							layer.remove();
						});
						d.map.single.remove();
						d.map.single = null;
					}
				}
				modal.remove();
				if(modal) modal = undefined;
				document.documentElement.style.overflowY = 'auto';
				if(gscreen.siteoverlayisset) gscreen.siteoverlay(false);
			});
		}

		window.scrollTo(0, 0);
		
		body = closemark = undefined;
		return modal;
	},
	displayalert: features => {
		features = {
			title: features.title || null,
			content: features.content || '',
			action: features.action || '',
			cancel: features.cancel || true,	
			canceltitle: features.canceltitle || c`ok`.uf(),
			extended: features.extended || false,
		};

		if(byId('appalert')) byId('appalert').remove();
		let modal = document.createElement('div');
		modal.id = 'appalert';
		modal.classList.add('alert');
		let body = document.getElementsByTagName('body')[0];
		let closemark = [
			`<span class="pull-right no-print">`,
			`<a href="javascript:if(gscreen.alert){gscreen.alert.remove();`,
			`gscreen.alert=undefined;}">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="xcircle" d=""></path>`,
			`</svg>`,
			`</a>` ,
			`</span>`,
		].join('');
		let printmark = [
			`<a class="pull-right no-print margin-right-s" `,
			`href="javascript:toolkit.printdiv('alert-content', '${removeqoutes(features.title)}');">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="printer" d=""></path>`,
			`</svg>`,
			`</a>`,
		].join('');
		modal.setAttribute('class', 'alert');
		if(features.extended) {
			modal.style.minHeight = '60%';
			modal.style.minWidth = '75%';		
		}
		modal.innerHTML = [
			`<header class="margin-bottom-s">`,
			features.title ? [
					`<h4 id="alert-title" class="fc-3">`,
					`${features.title}`,
					`<span class="pull-right no-print">`,
					`${closemark}${printmark}`,
					`</span>`,
					`</h4>`,
				].join('') : '',
			`</header>`,
			`<div id="alert-content" class="alert-content">`,
			features.content,
			`</div>`,
			(features.action || features.cancel) ? [
				`<footer class="text-align-right">`,
				features.action,
				features.cancel ? 
					`<a id="alert-close" class="button button-light" href="javascript:;">${features.canceltitle}</a>` : 
					'',
				`</footer>`,
			].join('') : '',
			`<section class="show-print">`,
			`<p id="prn-alert-footer" class="prn-copyright"></p>`,
			`<figure>`,
			`<img id="prn-alert-qrcode" `,
			`style="display:block;margin-left:auto;margin-right:auto;" `,
			`src="" />`,
			`</figure>`,
			`</section>`,
		].join('');

		body.appendChild(modal);
		toolkit.drawicons();

		let modalclose = document.querySelector('#alert-close');

		if(modalclose) {
			modalclose.addEventListener('click', function() {
				modal.remove();
				if(modal) modal = undefined;
			});
		}

		window.scrollTo(0, 0);

		body = closemark = undefined;
		return modal;
	},
	lightbox: cid => {
		let url = byId(cid).src;
		let title = byId(cid).title || '';
		if(!url) return;
		let txt =  [
			`<p class="text-align-center">`,
			`<img src="${url}" />`,
			`</p>`,
		].join('');
		let features = {
			progress: false,
			title: c(title),
			content: txt,
			action: false,
			cancel: true,
			canceltitle: c`close`.uf()
		};
		gscreen.alert = gscreen.displayalert(features);
		txt = url = features = undefined;
	},
	theme: (name, value) => {
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
		root.style.setProperty('--' + name, value);
		window.settings['theme' + vars.find(o => o.name === name).themevar] = value;
		localStorage.setItem(window.version.appname, JSON.stringify(window.settings));
	},
    toggleclass: (element, className) => {
		let classes = element.className.split(/\s+/);
		let length = classes.length;
		let i = 0;
	
		for(; i < length; i++) {
			if (classes[i] === className) {
				classes.splice(i, 1);
				break;
			}
		}
		if (length === classes.length) {
			classes.push(className);
		}
		
		element.className = classes.join(' ');
		classes = length = i = undefined;
	},
	exportmodaltext: (cid) => {
		gscreen.siteoverlay(true);
		toolkit.timer('gscreen.exportmodaltext');
		toolkit.statustext(true);
		if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', `<span class="loading">${c`working`.uf()}</span>`);
		try {
			let out = byId(cid).innerText;
			let filename = Math.random().toString(36).substring(7) + '.txt';
			let filetype = 'text/plain;charset=' + document.characterSet;
			file.save(out, filename, filetype);
			gscreen.siteoverlay(false);
			toolkit.timer('gscreen.exportmodaltext');
			toolkit.statustext();
			out = filename = filetype = undefined;
		} catch(err) {
			gscreen.siteoverlay(false);
			toolkit.timer('gscreen.exportmodaltext');
			toolkit.statustext();
			throw new AppError(c`export-modal-text` + ': ' + c`export-save-error`);
		}
	},
	togglebodyscrollbar: () => {
		let current = document.documentElement.style.overflowY;
		document.documentElement.style.overflowY = current === 'hidden' ? 'auto' : 'hidden';
	},
};
