'use strict';

/* global AppError, byId, c, charts, cfetch, cultures, d, dbe, dbm, echarts, fc, fetchtextasync, file, gscreen, isBlank, isNil, isNumber, isString, isVisible, k, l, L, maps, objectsize, sleep, stats */
/* exported toolkit */

// toolkit functions
const toolkit = {
	goto: (pag, tab) => { 
		if(gscreen.alert) toolkit.alertclose(); 
		window.location.hash = pag; 
		if(tab) {
			gscreen.siteoverlay(true);
			sleep(100).then(() => { 
				toolkit.selecttab('tab', tab);
				gscreen.siteoverlay(false);
			});
		}
	},
	cleardomelement: function(eid) {
		let el = document.querySelector(eid);
		if(el) {
			el.innerHTML = '';
			let elclone = el.cloneNode(true);
			el.parentNode.replaceChild(elclone, el);
			el = elclone = null;		
		}
		return false;
	},
	msg: function(elm, txt) {
		document.getElementById(elm).innerHTML = txt;
	},
	showsidebar: visible => {
		if(visible) {
			byId('side').classList.remove('hidden');
			byId('body').classList.add('main');
		} else {
			byId('side').classList.add('hidden');
			byId('body').classList.remove('main');
		}
	},
	copytoclipboard: cid => {
		let range = document.createRange();
		range.selectNode(document.getElementById(cid));
		window.getSelection().removeAllRanges(); 
		window.getSelection().addRange(range); 
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
		if(byId(cid + '-copy-link')) {
			toolkit.msg(cid + '-copy-link', c`copied`.uf());
			byId(cid + '-copy-link').classList.add('button-success');
			window.setTimeout(() => {
				byId(cid + '-copy-link').classList.remove('button-success');
				toolkit.msg(cid + '-copy-link', c`copy`.uf());
			}, 2000);
		}
	},
	showfooter: visible => {
		if(visible) {
			byId('pagefooter').classList.remove('hidden');
			byId('pagefooter').classList.add('padding-vertical-l');
			byId('body').classList.add('main');
		} else {
			byId('pagefooter').classList.add('hidden');
			byId('pagefooter').classList.remove('padding-vertical-l');
			byId('body').classList.remove('main');
		}
	},
	drawicons: () => {
		document.querySelectorAll('.svgicon path').forEach(o => {
			let path = o.getAttribute('class');
			let pnode = o.parentNode.parentNode;
			let snode = o.parentNode;
			let ocolor = window.getComputedStyle(pnode, null).getPropertyValue('color');
			snode.style.fill = ocolor;
			fetchtextasync(`./assets/img/paths/${path}`).then(res => o.setAttribute('d', res));
			pnode = snode = ocolor = undefined;
		});
	},
	required: (elm, isok) => {
		if(isok) {
			if(isBlank(elm.value)) {
				elm.classList.add('pure-form-required');
			} else {
				elm.classList.remove('pure-form-required');
			}
		} else {
			elm.classList.remove('pure-form-required');
		}
	},
	restrictinput: (textbox, inputfilter) => {
		// as seen at https://stackoverflow.com/questions/469357/html-text-input-allow-only-numeric-input
		// toolkit.restrictinput(byId('id'), value => /^-?\d*[.,]?\d*$/.test(value)); float
		// toolkit.restrictinput(byId('id'), value => /^\d*$/.test(value)); uint
		let actions = [
			'input', 'keydown', 'keyup', 'mousedown', 
			'mouseup', 'select', 'contextmenu', 'drop'
		];
		actions.forEach(function(event) {
			textbox.addEventListener(event, function() {
				if(inputfilter(this.value)) {
					this.oldvalue = this.value;
					this.oldselectionstart = this.selectionStart;
					this.oldselectionend = this.selectionEnd;
				} else if(this.hasOwnProperty('oldvalue')) {
					this.value = this.oldvalue;
					this.setSelectionRange(this.oldselectionstart, this.oldselectionend);
				}
			});
		});
	},
	showhide: elm => {
		elm = String(elm) === elm ? byId(elm) : elm;
		if(!elm.classList) return;
		if(elm.classList.contains('hidden')) {
			elm.classList.remove('hidden');
			elm.classList.add('visible');
		} else {
			elm.classList.remove('visible');
			elm.classList.add('hidden');
		}
	},
	randomstring: () => '_' + Math.random().toString(36).substr(2, 9),
	chartpercent: function(current, total, coloured = false) {
		let percent = Math.round((current / total) * 100);
		let color = toolkit.colorscale(current / total, window.settings.scalecolorbase, false);
		let prefix = coloured ? `<span style="${color}">` : '';
		let suffix = coloured ? `</span>` : '';
		return [
			prefix,
			'&#10033;'.repeat(Math.round(percent / 10)),
			suffix,
			'<span style="color:#ddd;">&#10033;</span>'.repeat(10 - Math.round(percent / 10)),
		].join('');
	},
	dotspercent: function(current, total, factor = 10, sdot = '*', sback = '_') {
		let percent = Math.round((current / total) * 100);
		let prefix = `<span style="color:#000;" data-tooltip="${percent}%">`;
		let suffix = `</span>`;
		return [
			'[',
			prefix,
			sdot.repeat(Math.round(percent / factor)),
			suffix,
			`<span style="color:#ccc;">${sback}</span>`.repeat(factor - Math.round(percent / factor)),
			'] ',
			percent,
			'%'
		].join('');
	},
	showprogress: function(current, total, target = 'app-overlay-txt') {
		let percent = Math.round((current / total) * 100);
		if(byId('siteoverlaytext')) target = 'siteoverlaytext';
		if(gscreen.overlay || gscreen.siteoverlayisset) {
			toolkit.msg(
				target, 
				`<span>${c`working`.uf()}:&nbsp;${percent}%</span>`
			);
		}
		percent = undefined;
		toolkit.msg('app-status', c`working`.uf() + '&hellip;&nbsp;' + (Math.round((current / total) * 100)) + '%');
	},
	showstars: (val, total = 1, color = 'color:#ff0000', negcolor = 'color:#ccc', altcolor = 'color:#ccc') => val < 0 ? 
		(`<span data-format="star" style="${altcolor}">&#10033;</span>`).repeat(Math.ceil((total - val) * 5)) + 
		(`<span data-format="star" style="${negcolor}">&#10033;</span>`).repeat(5) : 
		(`<span data-format="star" style="${color}">&#10033;</span>`).repeat(Math.floor(val * 5)) + 
		(`<span data-format="star" style="${altcolor}">&#10033;</span>`).repeat(Math.ceil((total - val) * 5)),
	shownumericlevel: val => !isNaN(val) ? (val * 5).toFixed(5) : '',
	timer: function(caller = null) {
		if(window.appTimeCaller === null) {
			window.appTimeStart = performance.now();
			window.appTimeCaller = caller;
			toolkit.msg(
				'app-timer', 
				[
					'<img src="./assets/img/svg/watch.svg" style="height:1.2rem" />', 
					'&nbsp;···'
				].join('')
			);
			if(window.settings.debugconsole === 1) {
				console.log('TIMER. caller: %s, appTimeCaller: %s', caller, window.appTimeCaller);
			}
		} else {
			if(caller === window.appTimeCaller) {
				let ftime = performance.now() - window.appTimeStart;
				toolkit.msg(
					'app-timer',
					[
						'<img src="./assets/img/svg/watch.svg" style="height:1.2rem" /> ',
						(ftime / 1000).toLocaleString(c.culture), 
						's'
					].join('')
				);
				window.appTimeStart = 0;
				window.appTimeCaller = null;
				if(window.settings.debugconsole === 1) {
					console.log('TIMER. caller: %s, appTimeCaller: %s, time: %s', caller, window.appTimeCaller, ftime);
				}
				ftime = undefined;
			} else {
				if(window.settings.debugconsole === 1) {
					console.log('TIMER. caller: %s, appTimeCaller: %s', caller, window.appTimeCaller);
				}
			}
		}
	},
	alertclose: function() {
		if(gscreen.alert) {
			gscreen.alert.remove();
			gscreen.alert = undefined;
		}
	},
	modalclose: function() {
		if(gscreen.modal) {
			gscreen.modal.remove();
			gscreen.modal = undefined;
			if(gscreen.siteoverlayisset) gscreen.siteoverlay(false);
		}
	},
	markdemo: did => {
		let demo = document.querySelectorAll(`[data-demo='${did}']`);
		let offset = window.pageYOffset;
		demo.forEach(o => {
			o.classList.add('demo');
			o.scrollIntoView();
		});
		sleep(2000).then(() => {
			demo.forEach(o => {
				o.classList.remove('demo');
			});
			window.scrollBy(0, offset);
			demo = undefined;
		});
	},
	currentmemory: () => objectsize(d.store),
	usedmemory: () => window.performance.memory ? 
		window.performance.memory.totalJSHeapSize : 
		parseInt(window.storecurrentsize.mib, 10), 
	memorylimit: () => window.performance.memory ? 
		window.performance.memory.jsHeapSizeLimit : 
		null,
	showmemory: elm => toolkit.msg(
		elm, 
		[
			`<img src="./assets/img/svg/cpu.svg" style="height:1rem" /> `, 
			(toolkit.usedmemory() / 1073741824).toLocaleString(l),
			toolkit.memorylimit() ? `/${(toolkit.memorylimit() / 1073741824).toLocaleString(l)}` : ``,
			`GiB`
		].join('')
	),
	
listbox_move: (cid, direction = 'up') => {
	let lbx = byId(cid);
	if(!lbx) return;
	let sel = lbx.selectedIndex;
	if(-1 === sel) {
		alert(c`select-option-to-move`.uf());
		return;
	}
	let inc = direction === 'up' ? -1 : 1;
	if((sel + inc) < 0 || (sel + inc) > (lbx.options.length - 1)) return;
	let selvalue = lbx.options[sel].value;
	let seltext = lbx.options[sel].text;
	lbx.options[sel].value = lbx.options[sel + inc].value;
	lbx.options[sel].text = lbx.options[sel + inc].text;
	lbx.options[sel + inc].value = selvalue;
	lbx.options[sel + inc].text = seltext;
	lbx.selectedIndex = sel + inc;
},
listbox_moveacross: (sid, did, mid, aid) => {
	let src = byId(sid);
	let dst = byId(did);
	if(!src || !dst) return;
	for (let count = 0, len = src.options.length; count < len; count++) {
		if(src.options[count]) {
			if(src.options[count].selected === true) {
				let opt = src.options[count];
				let newopt = document.createElement('option');
				newopt.value = opt.value;
				newopt.text = opt.text;
				newopt.selected = true;
				try {
					dst.add(newopt, null);
					src.remove(count, null);
				} catch (error) {
					dst.add(newopt);
					src.remove(count);
				}
				count--;
			}
		}
	}
	if(mid) {
		if(byId(mid).options.length) {
			if(aid) {
				byId(aid).classList.remove('hide');
			}
		} else {
			byId(aid).classList.add('hide');
		}
	}
},
listbox_selectall: (cid, isselect) => {
	let lbx = byId(cid);
	if(!lbx) return;
	for (let count = 0, len = lbx.options.length; count < len; count++) {
		lbx.options[count].selected = isselect;
	}
},

	toggleelement: eid => {
		let elm = byId(eid + '-stats-info');
		let alm = byId(eid + '-listing');
		let plm = byId(eid + '-pareto');
		let rlm = byId(eid + '-relevance');
		let rls = byId(eid + '-relevancescatter');
		let xlm = byId(eid + '-dropdown') ? byId(eid + '-dropdown') : null;
		let slm = byId(eid + '-showhidestats');
		if(!eid || isBlank(eid)) throw new AppError(c`stats` + ': ' + c`no-data`);
		if(elm.classList.contains('hide')) {
			elm.classList.remove('hide');
			elm.classList.add('visible');
			alm.classList.remove('visible');
			alm.classList.add('hide');
			if(xlm) xlm.classList.remove('visible');
			if(xlm) xlm.classList.add('hide');
			slm.innerHTML = c`table`.uf();
		} else {
			elm.classList.remove('visible');
			elm.classList.add('hide');
			alm.classList.remove('hide');
			alm.classList.add('visible');
			if(xlm) xlm.classList.remove('hide');
			if(xlm) xlm.classList.add('visible');
			slm.innerHTML = c`stats`.uf();
		}
		if(plm) {
			let tmp = echarts.getInstanceByDom(plm);
			tmp.resize();
			tmp = undefined;
		}
		if(rlm) {
			let tmp = echarts.getInstanceByDom(rlm);
			tmp.resize();
			tmp = undefined;
		}
		if(rls) {
			let tmp = echarts.getInstanceByDom(rls);
			tmp.resize();
			tmp = undefined;
		}
		elm = alm = plm = xlm = rlm = rls = slm = undefined;
	},
	togglepair: (elma, elmb, isstartingpage = false) => {
		let selma = byId(elma);
		let selmb = byId(elmb);
		if(selma.classList.contains('hide')) {
			selma.classList.add('visible');
			selma.classList.remove('hide');
			selmb.classList.add('hide');
			selmb.classList.remove('visible');
		} else {
			selma.classList.add('hide');
			selma.classList.remove('visible');
			selmb.classList.add('visible');
			selmb.classList.remove('hide');
			if(isstartingpage) toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		}
		selma = selmb = undefined;
	},
	selecttab: (prefix, tid) => {
		let tabs = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
		tabs.forEach(o => {
			let elm = byId('c-' + prefix + '-' + o);
			let tab = byId('s-' + prefix + '-' + o);
			let par = byId('s-' + prefix + '-' + o) ? byId('s-' + prefix + '-' + o).parentNode : null;
			if(elm) {
				if(o === tid) {
					elm.classList.remove('hide');
					elm.classList.add('visible');
					if(tab) {
						tab.classList.add('active');
					}
					if(par) {
						par.classList.add('active');
					}					
				} else {
					elm.classList.remove('visible');
					elm.classList.add('hide');
					if(tab) {
						tab.classList.remove('active');
					}
					if(par) {
						par.classList.remove('active');
					}
				}
			}
			elm = tab = undefined;
		});
		if(dbe.verifytables()) {
			if(isVisible(byId('schema-listing'))) stats.schema();
			if(isVisible(byId('relations-listing'))) stats.relations();
			if(isVisible(byId('stats-charts'))) {
				charts.chart();
			}
			if(isVisible(byId('stats-network'))) {
				charts.relations();
			}
			toolkit.showactivecollection();
		}
		if(isVisible(byId('base-map'))) {
			maps.basemap();
		}
		tabs = undefined;
	},
	generictab: (element, selected, content, links) => {
		let tabcontent = document.getElementsByClassName(content);
		let tablinks = document.getElementsByClassName(links);
		let tabelement = byId(element).parentNode;
		for (let i = 0; i < tabcontent.length; i++) {
			tabcontent[i].classList.remove('visible');
			tabcontent[i].classList.add('hide');
		}
		for (let i = 0; i < tablinks.length; i++) {
			tablinks[i].classList.add('button-border');
		}
		byId(selected).classList.remove('hide');
		byId(selected).classList.add('visible');
		byId(element).classList.remove('button-border');
		toolkit.drawicons();
		tabcontent = tablinks = tabelement = undefined;
	},
	statustext: function(isworking = false) {
		let wrk = isworking;
		let status = byId('app-status');
		let parent = status.parentNode.parentNode;
		let clear = nod => {
			nod.classList.remove('background-error-50');
			nod.classList.remove('background-success-50');
		};
		if(wrk) {
			clear(parent);
			parent.classList.add('background-error-50');
			toolkit.msg('app-status', c`working`.uf() + '&hellip;');
			toolkit.msg('app-microchart', '');
		} else {
			clear(parent);
			if(dbe.verifytables()) {
				let fil = dbe._filterids().length.toLocaleString(l);
				let tot = d.poslength.toLocaleString(l);
				toolkit.msg(
					'app-status', 
					[
						`<span class="color-success">${fil}</span>`,
						d.filterrefine ? ' [R]' : '',
						` / `,
						`<span class="color-error">${tot}</span>`,
						` (${Math.round((dbe._filtered() / d.poslength) * 100)}%)`
					].join('')
				);
				toolkit.microchart('app-microchart', Math.round((dbe._filtered() / d.poslength) * 100));
				parent.classList.add('background-success-50');
				fil = tot = undefined;
			} else {
				parent.classList.add('background-error-50');
				toolkit.msg('app-status', c`no-data`.uf());
			}
		}
		wrk = status = parent =  clear = undefined;
	},
	loadertext: () => {
		let txt = [];
		let lib = [];
		window.resources.forEach(o => {
			if(!lib.includes(o.libname)) {
				lib.push(o.libname);
				txt.push(o.iserror ? `<span class="text-error">${o.slug}</span>` : o.isloaded ? o.slug : '');			
			}
		});
		window.setTimeout(() => {
			if(byId('app-loader')) toolkit.msg('app-loader', txt.join(' ').trim());
			txt = lib = undefined;
		}, window.settings.timeout);
	},
	rtfchar: (a, b) => (++b ? 
		'\\' + ((a = a.charCodeAt()) >> 12 ? 
			'\'' : a >> 8 ? '\'0' : '\'') + a.toString(16).toLowerCase() : 
			a.replace(/[^\0-~]/g, toolkit.rtfchar)),
	browserinfo: () => {
		let ua = navigator.userAgent;
		let oBrowserInfo = {};
		let ismobile = () => (/Mobi/.test(navigator.userAgent));
		
		let sTempInfo;
		let sBrowserString = ua.match(/(vivaldi|opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([0-9|\.]+)/i) || [];
			
		if (/trident/i.test(sBrowserString[1])) {
			sTempInfo = /\brv[ :]+(\d+)/g.exec(ua) || [];
			oBrowserInfo.sName = 'MSIE';
			oBrowserInfo.sVersion = sTempInfo[1];
			ua = ismobile = sTempInfo = sBrowserString = undefined;
			return oBrowserInfo;
		}
		
		if (sBrowserString[1] === 'Chrome') {
			sTempInfo = ua.match(/\b(OPR|Edge)\/(\d+)/);
			//Opera/Edge case:
			if (sTempInfo !== null) {
				if (sTempInfo.indexOf('Edge')) {
					oBrowserInfo.sName = 'MSIE'; //mark ms edge browser as MSIE
				} else {
					oBrowserInfo.sName = 'Opera';
				}
				oBrowserInfo.sVersion = sTempInfo.slice(1);
				ua = ismobile = sTempInfo = sBrowserString = undefined;
				return oBrowserInfo;
			}
		}
		
		sBrowserString = sBrowserString[2] ? 
			[sBrowserString[1], sBrowserString[2]] : 
			[navigator.appName, navigator.appVersion, '-?'];
			
		sTempInfo = ua.match(/version\/(\d+)/i);
	
		if (sTempInfo !== null) {
			sBrowserString.splice(1, 1, sTempInfo[1]);
		}
		
		oBrowserInfo.sLanguage = navigator.language;
		oBrowserInfo.sLanguages = navigator.languages.join(', ');
		oBrowserInfo.sUserAgent = navigator.userAgent;
		oBrowserInfo.sDevice = ismobile() ? 'mobile' : 'desktop';
		oBrowserInfo.sReferrer = document.referrer || 'n-a';
		oBrowserInfo.sOnline = navigator.onLine;
		oBrowserInfo.sTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		oBrowserInfo.sScreenResolution = [
			`${window.screen.availWidth} x ${window.screen.availHeight} `,
			`(${window.screen.width} x ${window.screen.height})`,
		].join('');
		oBrowserInfo.sCookieEnabled = navigator.cookieEnabled;
		oBrowserInfo.sName = sBrowserString[0];
		oBrowserInfo.sVersion = sBrowserString[1];
		oBrowserInfo.platform = navigator.platform || c`unknown`;
		oBrowserInfo.hwConcurrence = navigator.hardwareConcurrency || c`unknown`;
		ua = ismobile = sTempInfo = sBrowserString = undefined;
		return oBrowserInfo;
	},
	isavalidbrowser: () => {
		let browser = toolkit.browserinfo();
		let bname = ['chrome', 'safari', 'opera', 'firefox'].indexOf(browser.sName.toLowerCase());
		let bver = Array.isArray(browser.sVersion) ? browser.sVersion[0] : browser.sVersion.split('.')[0];
		browser = undefined;
		return bname > -1 && ['56', '11', '4', '51'][bname] <= bver;
	},
	appversion: () => [
		window.version.appname, 
		[window.version.version, window.version.subversion, window.version.release].join('.'),
		window.version.date.toLocaleDateString(l, {year: 'numeric'}),
	], 
	appinfo: (forprint = false) => {
		let appinfo = toolkit.appversion();
		let detail = [
			window.version.license,
			window.version.author,
			window.version.organization,
			window.version.suborganization,
			window.version.workgroup,
			window.version.country
		];
		return forprint ? `<hr class="margin-top margin-bottom">` + [
				appinfo.join(', '), 
				detail.join(', ')
			].join('. ') : 
			appinfo.join(', '); 
	},
	addcopylink: event => {
        event.preventDefault();
        let pagelink = `
			<br /><br />
			Read more at: 
			<a href="${document.location.href}">${document.location.href}</a>
			<br />${toolkit.appinfo(true)}
		`;
		let copytext = window.getSelection() + pagelink;

        if (window.clipboardData) {
            window.clipboardData.setData('Text', copytext);
        }
        pagelink = copytext = undefined;
	},
	encode: function(s, k) {
		let enc = '';
		let str = s.toString() || '';
		for (let i = 0, len = str.length; i < len; i++) {
			let a = s.charCodeAt(i);
			let b = a ^ k;
			enc += String.fromCharCode(b);
			a = b = undefined;
		}
		str = undefined;
		return enc;
	},
	processingtime: size => (size * window.estimative.opsbyte) / (window.estimative.ops / window.estimative.opstime),
	cpuspeed: () => {
		performance.clearMarks();
		performance.clearMeasures();
		performance.mark('loop-s');	
		for (let i = 150000000; i > 0; i--) {} 
		performance.mark('loop-e');
		performance.measure('speed', 'loop-s', 'loop-e');
		let measures = performance.getEntriesByName('speed');
		console.log(measures[0].duration, window.hweval.iterations / measures[0].duration);
	},
	runinsequence: function(promises, targetdomid = 'app-overlay-txt') {
		// as seen in Github, /mull/sequential-promise, but modified to show progress
		return new Promise(function (resolve, reject) {
			if(byId('siteoverlaytext')) targetdomid = 'siteoverlaytext';
			toolkit.showprogress(0, promises.length);
			let values = [];
			let i = 0;
			let save = value => {
				return values.push(value);
			};
			let iterate = function iterate() {
				return i++;
			};
			let loop = () => {
				toolkit.showprogress(i, promises.length, targetdomid);
				let tmo = window.setTimeout(() => {
					if (i < promises.length) {
						let entry = promises[i];
						let promise = typeof entry === 'function' ? entry() : entry;
						return promise.then(save).then(iterate).then(function () {
							return window.setTimeout(loop, 0);
						}).catch(function (e) {
							reject(e);
							window.clearTimeout(tmo);
							values = i = save = iterate = loop = tmo = entry = promise = undefined;
							return Promise.reject(e);
						});
					} else {
						i = null;
						window.clearTimeout(tmo);
						i = save = iterate = loop = tmo = undefined;
						return resolve(values);
					}
				}, 500);
			};
			loop();
		});
	},
	getposition: elm => {
		elm = String(elm) === elm ? byId(elm) : elm;
		let rect = elm.getBoundingClientRect();
		return {x: rect.left, y: rect.top};
	},
	printdiv: function(divid, divtitle = null) {
		toolkit.printfast(divid, divtitle);
	},
	printfast: (divid, divtitle = null) => {
		if(isBlank(divid)) {
			gscreen.siteoverlay(true);
			byId('prn-qrcode').src = d.qrcodesrc + encodeURI(window.location.href);
			sleep(300).then(() => {
				gscreen.siteoverlay(false);
				window.print(); 
			});
			return;
		} else {
			if(byId('prn-modal-qrcode')) byId('prn-modal-qrcode').src = d.qrcodesrc + encodeURI(window.location.href);
			if(byId('prn-alert-qrcode')) byId('prn-alert-qrcode').src = d.qrcodesrc + encodeURI(window.location.href);
		}
		let htmlstring = byId(divid).innerHTML || ''; 
		let newiframe = document.createElement('iframe');
		newiframe.width = '1px';
		newiframe.height = '1px';
		newiframe.src = 'about:blank';
		
		newiframe.onload = function() {
			let scripttag = newiframe.contentWindow.document.createElement('script');
			scripttag.type = 'text/javascript';
			let scripttext = 'function Print(){ window.focus(); window.print(); }';
			let script = newiframe.contentWindow.document.createTextNode(scripttext);
			scripttag.appendChild(script);

			if(!divtitle) {
				divtitle = window.location.hash ? 
					`<h2>
					${window.version.appname}. ${c(window.location.hash).uf()}
					</h2>` : 
					`<h2>
					${window.version.appname}
					</h2>`; 
			}
			let allcss = [].slice
				.call(document.styleSheets)
				.reduce(function (prev, stylesheet) {
					let rules;
					try {
						rules = stylesheet.cssRules;
					} catch(err) {}
					if (rules) {
						return prev + [].slice.call(rules).reduce(function (prev, cssrule) {
							return prev + cssrule.cssText;
						}, '');
					} else {
						return prev;
					}
				}, '');
				
			let ifstyles = document.createElement('style');
			ifstyles.textContent = allcss;			
			
			newiframe.contentWindow.document.body.innerHTML = divtitle + htmlstring + toolkit.appinfo(true);
			newiframe.contentWindow.document.body.appendChild(scripttag);
			newiframe.contentWindow.document.head.appendChild(ifstyles);
			
			// for Chrome, a timeout for loading large amounts of content
			setTimeout(function() {
				newiframe.contentWindow.Print();
				newiframe.contentWindow.document.body.removeChild(scripttag);
				newiframe.parentElement.removeChild(newiframe);
			}, 200);
		};
		document.body.appendChild(newiframe);
	},
	getnumberinrange: (num, range) => {
		let pos = 0;
		for(let i = 0, len = range.length; i < len; i++) {
			pos = num.between(range[i], (range[i + 1] ? range[i + 1] : Infinity)) ? i : pos;
		}
		return pos;
	},
	highlight: function(str, fragment) {
		if(!isString(str)) return str;
		let str_folded = str.na().toLowerCase().replace(/[<>]+/g, '');
		let q_folded = fragment.na().toLowerCase().replace(/[<>]+/g, '');
		let re = new RegExp(q_folded, 'g');
		let hiliteHints = str_folded.replace(re, '<' + q_folded + '>');
		let spos = 0;
		let highlighted = '';
	
		for (let i = 0; i < hiliteHints.length; i++) {
			let ch = str.charAt(spos);
			let hg = hiliteHints.charAt(i);
			if (hg === '<') {
				highlighted += '<mark class="no-padding-horizontal">';
			} else if (hg === '>') {
				highlighted += '</mark>';
			} else {
				spos += 1;
				highlighted += ch;
			}
			ch = hg = undefined;
		}
		str_folded = q_folded = re = hiliteHints = spos = undefined;
		return highlighted;
	},
	colorscale: (val, base, isbackground = true) => {
		let color = percentage => {
			let hue0 = d.scales[base].start;
			let hue1 = d.scales[base].end;
			let hue = (percentage * (hue1 - hue0)) + hue0;
			return 'hsl(' + hue + ', 100%, 50%)';
		};
		let invertedcolor = percentage => {
			let hue0 = d.scales[base].start;
			let hue1 = d.scales[base].end;
			let inverted = d.scales[base].inverted;
			let hue = (percentage * (hue1 - hue0)) + hue0;
			let highhalf = percentage > 0.5;
			if(highhalf) {
				if(inverted === null) return 'hsl(' + hue + ', 0%, 0%)';
				return inverted ? 'hsl(' + hue + ', 0%, 0%)' : 'hsl(' + hue + ', 100%, 100%)';
			} else {
				if(inverted === null) return 'hsl(' + hue + ', 0%, 0%)';
				return inverted ? 'hsl(' + hue + ', 100%, 100%)' : 'hsl(' + hue + ', 0%, 0%)';
			}
		};

		if(isbackground) {
			return `background-color:${color(val)};color:${invertedcolor(val)}`;
		} else {
			return `color:${color(val)}`;
		}
	},
	colorlegend: (base, title = null, source = null) => {
		let out = [];
		if(title) out.push(`<h4 id="${'c' + base}">${title}</h4>`);
		out.push(`<div class="palette">`);
		for (let i = 1; i <= 10; i++) {
			out.push('<div class="text-align-center" style="' + toolkit.colorscale(i / 10, base) + '">' + i + '</div>');
		}
		out.push(`</div>`);
		if(source) out.push(`<div>${source}</div>`);
		return out.join('\n');	
	},
	colorshortlegend: (base, kmin, kmax) => {
		let out = [];
		let range = kmax - kmin;
		let step = Math.ceil(range / 5);
		let cls = 'rectangle';
		let first = `<span class="no-print ${cls}" style="${toolkit.colorscale(0, base)};">${kmin.toLocaleString(l)}</span>`;
		let last = `<span class="no-print ${cls}" style="${toolkit.colorscale(1, base)};">${kmax.toLocaleString(l)}</span>`;
		for(let i = 1; i < 4; i++) {
			let val = i * step;
			let txt = (kmin + val).toLocaleString(l);
			out.push(`<span class="no-print ${cls}" style="${toolkit.colorscale(i / 5, base)};">${txt}</span>`);
		}
		range = step = cls = undefined;
		return first + out.join('') + last;
	},
	colormicrolegend: base => {
		let out = [];
		let cls = 'microrectangle';
		let first = `<span class="no-print ${cls}" style="${toolkit.colorscale(0, base)};"></span>`;
		let last = `<span class="no-print ${cls}" style="${toolkit.colorscale(1, base)};"></span>`;
		for(let i = 1; i < 4; i++) {
			out.push(`<span class="no-print ${cls}" style="${toolkit.colorscale(i / 5, base)};"></span>`);
		}
		cls = undefined;
		return first + out.join('') + last;
	},
	changeclass: (cid, cclass) => {
		let elm = document.getElementById(cid);		
		if(elm.classList.contains(cclass + '-one')) {
			elm.classList.remove(cclass + '-one');
			elm.classList.add(cclass + '-two');
		} else {
			elm.classList.remove(cclass + '-two');
			elm.classList.add(cclass + '-one');
		}
	},
	sortlocale: (a, b) => fc(String(a)).localeCompare(fc(String(b)), l, {sensitivity: 'base', numeric: true}), 
	relationtypeformat: rel => rel === '<' ? `${c`inbound`}` : `${c`outbound`}`,
	posttypeformat: (typ, number) => {
		let num = Number(number);
		let plr = num === 1 ? typ : typ + 's';
		return `${num.toLocaleString(l)} ${c(plr)}`;
	},
	titleformat: tit => isBlank(tit) ? `[${c`untitled`.uf()}]` : String(tit).trim(),
	nullformat: txt => isBlank(txt) ? `<span class="desc">[${c`n-a`.toUpperCase()}]</span>` : txt,
	texttourl: function(rkey, text, rid, xid = null) {
		if(!isNaN(text)) text = String(text);
		if(d.relatives.indexOf(rkey) > -1) {
			if(xid) {
				return `<a href="javascript:ui.singlerecord(${xid},${rid});">${String(text).relations().rtitle.trim()}</a>`;
			} else {
				return text;
			}
		} else {
			if(d.linkables.indexOf(rkey) > -1) {
				return toolkit.wikipediasearch(rkey, text);
			} else {
				if(d.uris.indexOf(rkey) > -1) {
					let urlRegex = /(https?:\/\/[^\s]+)/g;
					return text.toString().replace(urlRegex, '<a rel="noopener" target="_blank" href="$1">$1</a>');
				} else if(d.startdates.indexOf(rkey) > -1) {
					//let ages = dbe.getposbyid(rid).age ? dbe.getposbyid(rid).age.value : null;
					let lages = dbm.ages(true);
					let ages = lages[rid] !== undefined ? lages[rid].value : null;
					let agestext = ages ? 
						dbe.gettipfromrkey(rkey) === 'exh' ? 
							`${ages.weeks.toLocaleString(l)} ${c`weeks`} ${c`or`}
							${ages.days.toLocaleString(l)} ${c`days`}` : 
							`${ages.years.toLocaleString(l)} ${c`years`}` : 
						null;
					ages = lages = undefined;
					return `
						<a href="javascript:ui.filtersearch('${text.toString()}', '${rkey}', true);">
						${new Date(text).toLocaleDateString(l, k.formats.longdate)}
						</a>
						${agestext ? '&rarr;&nbsp;' + agestext : ''}
					`;
				} else if(d.enddates.indexOf(rkey) > -1) {
					return `
						<a href="javascript:ui.filtersearch('${text.toString()}', '', true);">
						${new Date(text).toLocaleDateString(l, k.formats.longdate)}
						</a>
					`;
				} else {
					return `
						<a href="javascript:ui.filtersearch('${text.toString()}','', true);">${text.toString()}</a>
					`;
								
				}
			}
		}
	},
	wikipediasearch: (rkey, text) => {
		if(d.linkables.indexOf(rkey) < 0) return text;
		let locator = d.places.indexOf(rkey) > -1 ? (String(text).places().town || text) : text;
		return [
			`<a href="javascript:ui.filterbyterm('${text.toString()}', true, true);">${text.toString()}</a>`,
			'&nbsp;',
			'<a href="https://',
			l,
			'.wikipedia.org/wiki/',
			locator.replace(';;', ''),
			'" target="_blank" rel="nofollow">',
			'[*]',
			'</a>'
		].join('');
	},
	hostfromurl: function(url, part = 'hostname') {
		// part: protocol, hostname, port, pathname, search, hash, host (hostname + port)
		let parser = document.createElement('a');
		parser.href = url;
		return parser[part];
	},
	hex2rgb: function(a) {
		return [].map.call(a.replace('#', ''), function(a, b, c) {
			a = undefined;
			return c.slice(b, 2 + b);
		}).filter(function(a, b) {
			a = undefined;
			return b % 2 === 0;
		}).map(function(a) {
			return ('0x' + a) * 1;
		});
	},
	hsl2hex: (h, s, l, torgb = false) => {
		h /= 360;
		s /= 100;
		l /= 100;
		let r, g, b;
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			let hue2rgb = (p, q, t) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};
			let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			let p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		let tohex = x => {
			let hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		let tonum = x => Math.round(x * 255).toString(10);
		
		if(torgb) {
			return `${tonum(r)},${tonum(g)},${tonum(b)}`;
		} else {
			return `#${tohex(r)}${tohex(g)}${tohex(b)}`;
		}
	},
	striphtml: html => {
		if (html === null) return '';
		let tmp = document.createElement('DIV');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	},
	humansize: size => {
		let i = Math.floor(Math.log(size) / Math.log(1024));
		return ((size / Math.pow(1024, i)).toFixed(2) * 1).toLocaleString(l) + ['B', 'KB', 'MB', 'GB', 'TB'][i];
	},
	simpletable: (json, cid) => {
		if(!json.length) {
			return [
				`<div class="table-responsive">`,
				`<table id="${cid}">`,
				`<caption>`,
				`<p class="text-align-right">`,
				`<a class="button button-tertiary button-icon button-border disabled" `,
				`href="javascript:file.exporttabletocsv('${cid}');">`,
				`<span>${c`export`.uf()}</span>`,
				`<svg width="24" height="18" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="download" d=""></path>`,
				`</svg>`, 
				`</a>`,	
				`</p>`,
				`</caption>`, 
				`<thead><tr>&nbsp;</tr></thead>`,
				`<tbody>`,
				`<tr>`,
				`<td class="text-align-center color-error">${c`no-data`.uf()}</td>`,
				`</tr>`,
				`</tbody>`,
				`</table>`,
				`</div>`,
			].join('');			
		}
		let cols = Object.keys(json[0]);
		let smallclass = cols.length > 4 ? 'table-smaller' : '';
		let headerrow = [];
		let bodyrows = [];
		cid = cid || 'tbl-' + toolkit.randomstring();
	
		cols.map(col => {
			headerrow.push(`<th class="text-align-center">${fc(col).uf()}</th>`);
		});
	
		json.map(function(row) {
			bodyrows.push(`<tr>`);
			cols.map(colname => {
				bodyrows.push([
					`<td${isNumber(row[colname]) ? ' class="text-align-right"' : ''}>`,
					isNumber(row[colname]) ? row[colname].toLocaleString(l) : fc(row[colname]), 
					`</td>`,
				].join(''));
			});
			bodyrows.push(`</tr>`);
		});
		
		cols = undefined;

		return [
			`<div class="table-responsive">`,
			`<table id="${cid}" class="${smallclass}">`,
			`<caption>`,
			`<p class="text-align-right">`,
			`<a class="button button-tertiary button-icon button-border" `,
			`href="javascript:file.exporttabletocsv('${cid}');">`,
			`<span>${c`export`.uf()}</span>`,
			`<svg width="24" height="18" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="download" d=""></path>`,
			`</svg>`, 
			`</a>`,	
			`</p>`,
			`</caption>`, 
			`<thead><tr>${headerrow.join('')}</tr></thead>`,
			`<tbody>${bodyrows.join('\n')}</tbody>`,
			`</table>`,
			`</div>`,
		].join('');
	},
	linkfunction: (fun, args) => fun.apply(this, args),
	togglecells: (tid, mark, colidx, coldat, arr) => {
		if(!byId(tid)) throw new AppError(c`account` + ': ' + c`no-data`);
		let rows = byId(tid).tBodies[0].rows;
		if(rows.length) {
			mark = typeof mark === 'undefined' ? true : mark;
			colidx = colidx || rows[0].cells.length - 1;
			coldat = coldat || 'svalue';
			arr = arr || d.accountresults.outliers;
			if(mark) {
				for(let i = 0, len = rows.length; i < len; ++i) {
					let val = Number(rows[i].cells[colidx].dataset[coldat]) || 0;
					if(arr.includes(val)) {
						rows[i].classList.remove('hidden');
						rows[i].classList.add('is-row-visible');
					} else {
						rows[i].classList.remove('is-row-visible');
						rows[i].classList.add('hidden');
					}
					val = undefined;
				}
			} else {
				for(let i = 0, len = rows.length; i < len; ++i) {
					rows[i].classList.remove('hidden');
					rows[i].classList.add('is-row-visible');
				}
			}
		}
		rows = undefined;
	},
	pivotfieldstitle: title => {
		let elm = String(title).split(`\\`);
		let out = elm.map(o => c(o));
		elm = undefined;
		return out.join(' / ');
	},
	ddtodms: (dd, islng) => {
		let dir = dd < 0 ? islng ? 'W' : 'S' : islng ? 'E' : 'N';
		let absdd = Math.abs(dd);
		let deg = absdd | 0;
		let frac = absdd - deg;
		let min = (frac * 60) | 0;
		let dsm = 'º';
		let ssm = '\'';
		let msm = '"';
		let sec = frac * 3600 - min * 60;
		sec = Math.round(sec * 100) / 100;
		absdd = frac = undefined;
		return `${deg}${dsm} ${min}${msm} ${sec}${ssm} ${dir}`;
	},
	performanceinfo: () => new Promise((resolve, reject) => {
		let perf = window.performance || performance;
		if (!perf) {
			reject(false);
		}
		let t = perf.timing;
		let navi = perf.navigation;
		perf = undefined;
		resolve({
			redirectcount: navi.redirectCount,
			loadtype: navi.type, // 0:user action(typing, link), 1:reload, 2: history move
			latency: t.responseEnd - t.fetchStart,
			servertime: t.responseEnd - t.requestStart,
			domcomplete: t.domComplete - t.responseEnd,
			pageload: t.loadEventEnd - t.responseEnd
		});
	}),
	posttypelegend: (letter = false) => d.post_types.filter(o => !['pos', 'tax'].includes(o.tip)).map(o => [
		`<span class="${letter ? 'rectangle' : 'empty-square'} `,
		`background-${dbe.getbcolorfromslug(o.slug)} margin-right-s">`,
		`${letter ? dbe.getnamefromslug(o.slug) : ''}`,
		`</span>${c(o.slug).uf()}`,
	].join('')),
	formatfield: (val, nid = null) => {
		let out = [];
		if(d.points.indexOf(val.rkey) > -1) {
			let coords = val.value ? val.value.toString().trim().split(',') : [];
			if (coords.length > 1) {
				out.push(`
					<a href="javascript:toolkit.mappopup('${coords[0] + ',' + coords[1]}',${nid});">${val.value}</a>
				`);
			} else {
				out.push(toolkit.texttourl(val.rkey, val.value, val.ID));
			}
			coords = undefined;
		} else {
			out.push(toolkit.texttourl(val.rkey, val.value, val.ID, String(val.value).relations().rid));
		}
		return out.join(', ');
	},
	mappopup: coords => {
		let coo = coords.toString().trim().split(',');
		let tit = toolkit.ddtodms(parseFloat(coo[0]), false) + ', ' + toolkit.ddtodms(parseFloat(coo[1]), true);
		let pro = d.mapproviders.find(o => o.name === 'CartoDB Positron');
		let src = d.reversegeocodesrc + '?format=json&lat=@&zoom=27&addressdetails=1';
		cfetch(src.replace(new RegExp('@', 'g'), coo.join('&lon=')))
		.then(ret => ret.json())
		.then(ret => {
			let modalcontent = [
				`<p>${tit}</p>`, 
				`<div id="stmapid" style="width: 100%; height: 250px;"></div>`
			].join('');
			let features = {
				title: `${c`map`.uf()}: ${ret.display_name}`,
				content: modalcontent,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			let stmap = L.map('stmapid', {zoomControl: false}).setView(coo, 13);
			
			L.tileLayer.provider(pro.provider).addTo(stmap);
			L.circle(coo, {
				color: 'red',
				fillColor: '#f03',
				fillOpacity: 0.5,
				radius: 100
			}).addTo(stmap);
			
			modalcontent = features = undefined;
			src = coo = tit = stmap = undefined;
		})
		.catch(() => {
			let modalcontent = [
				`<p>${tit}</p>`, 
				`<div id="stmapid" style="width: 100%; height: 250px;"></div>`
			].join('');
			let features = {
				title: c`map`.uf() + ': ' + tit,
				content: modalcontent,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			let stmap = L.map('stmapid', {zoomControl: false}).setView(coo, 13);
			
			L.tileLayer.provider(pro.provider).addTo(stmap);
			L.circle(coo, {
				color: 'red',
				fillColor: '#f03',
				fillOpacity: 0.5,
				radius: 100
			}).addTo(stmap);
			
			modalcontent = features = undefined;
			src = coo = tit = stmap = undefined;
		});
	},
	rkeytranslate: function(rkey) { return rkey.substr(0, 5) === '_cp__' ? c(rkey.substr(5, 3)) + ': ' + c(rkey) : c(rkey); },
	microchart: (element, value, clsclass = 'microchart') => {
		let p = parseFloat(value);
		let NS = 'http://www.w3.org/2000/svg';
		let pie = document.getElementById(element);
		let svg = document.createElementNS(NS, 'svg');
		let circle = document.createElementNS(NS, 'circle');
		let title = document.createElementNS(NS, 'title');
		circle.setAttribute('r', 16);
		circle.setAttribute('cx', 16);
		circle.setAttribute('cy', 16);
		circle.setAttribute('stroke-dasharray', p + ' 100');
		svg.setAttribute('viewBox', '0 0 32 32');
		svg.classList.add(clsclass);
		title.textContent = value;
		pie.textContent = '';
		svg.appendChild(title);
		svg.appendChild(circle);
		pie.appendChild(svg);
		p = NS = pie = svg = circle = title = undefined;
	},
	piechart: (svgEl, slices) => {
		let cumulativePercent = 0;

		let getCoordinatesForPercent = percent => {
			let x = Math.cos(2 * Math.PI * percent);
			let y = Math.sin(2 * Math.PI * percent);
			return [x, y];
		};
		slices.forEach(slice => {
			let [startX, startY] = getCoordinatesForPercent(cumulativePercent);
			cumulativePercent += slice.percent;
			let [endX, endY] = getCoordinatesForPercent(cumulativePercent);
			let largeArcFlag = slice.percent > 0.5 ? 1 : 0;
			let pathData = [
				`M ${startX} ${startY}`, // Move
				`A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
				`L 0 0`, // Line
			].join(' ');
		
			let pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			pathEl.setAttribute('d', pathData);
			pathEl.setAttribute('fill', slice.color);
			svgEl.appendChild(pathEl);
			startX = startY = endX = endY = largeArcFlag = pathData = pathEl = undefined;
		});
		cumulativePercent = undefined;
	},
	fuzzymatch: (text, collection) => {
		if(isNil(text) || text === '') return [];
		let sorted = (a, b) => {
			let x = a[1];
			let y = b[1];
			if (a[0] === b[0]) return x < y ? -1 : x > y ? 1 : 0;
			return a[0] - b[0];
		};
		text = text.na().toLowerCase();
		let suggestions = [];
		let results = [];
		let pattern = text.split('').join('.*?');
		let re = new RegExp(pattern, 'i');
		let match;
	
		for (let i = 0, len = collection.length; i < len; i++) {
			match = re.exec(collection[i].na().toLowerCase());
			if (match !== null) suggestions.push([match[0].length, match.index, collection[i]]);
		}
		suggestions = suggestions.sort(sorted);
		for (let i = 0, len = suggestions.length; i < len; i++) {
			results.push(suggestions[i][2]);
		}
		suggestions = match = pattern = sorted = re = undefined;
		return results;
	},
	countwords: () => {
		let list = Object.keys(cultures.es);
		let path = './assets/js/complete.js';
		let results = [];
		let totaltext = '';
		fetchtextasync(path).then(string => {
			totaltext += string;
			list.forEach(word => {
				if(!totaltext.includes('`' + word + '`')) {
					results.push(word);
				}
			});
			results = results.unique();
			file.save(results.join('\n'), 'res.txt');
			list = path = totaltext = results = undefined;
		});
	},
	showactivecollection: () => {
		if(!byId('data-collection')) return;
		if(!d.collections.length) {
			toolkit.msg('data-collection', '');
			byId('data-collection').classList.add('hide');
			byId('data-collection').classList.remove('visible');
			return;
		}
		let active = d.collections.find(o => o.active);
		if(!active) {
			toolkit.msg('data-collection', '');
			byId('data-collection').classList.add('hide');
			byId('data-collection').classList.remove('visible');
			return;
		}
		let modifiedtext = !toolkit.comparecollection() ? 
			[
				` <span `,
				`data-tooltip="${c`modified`}" `,
				`class="color-error">*</span>`,
			].join('') : 
			'';
		if(byId('data-collection')) {
			toolkit.msg(
				'data-collection', 
				[
					`<svg width="24" height="24" viewBox="0 0 24 24" `,
					`class="svgicon margin-left-s pull-right" `,
					`style="margin-top:0.2em">`,
					`<path class="archive" d=""></path>`,
					`</svg>`,
					active.title,
					modifiedtext,
				].join('')
			);
			byId('data-collection').classList.remove('hide');
			byId('data-collection').classList.add('visible');
			toolkit.drawicons();
		}
	},
	comparecollection: () => {
		let currentcol = d.collections.find(o => o.active === 1);
		if(!currentcol) return false;
		let out = true;
		let currentquery = currentcol.query;
		if(!currentquery.length) return false;
		if(d.filter.length !== currentquery.length) return false;
		currentquery.forEach((o, i) => {
			let curentflt = d.filter[i] || null;
			if(!curentflt) {
				out = false;
			} else {
				if(curentflt.value !== o.value) out = false;
				if(curentflt.rkey !== o.rkey) out = false;
				if(curentflt.operator !== o.operator) out = false;
				if(curentflt.modifier !== o.modifier) out = false;
			}
			curentflt = undefined;
		});
		currentcol = currentquery = undefined;
		return out;
	},
	tagfield: (fid, lid, arr, ref, fnc = undefined) => {
		let tagsinput = byId(fid);
		let tagslist = byId(lid);
		let tagsarr = arr;
		let tagsref = ref;
		let tagsfnc = fnc;
		
		tagsinput.addEventListener('keyup', ({key, target}) => {
			if (key === 'Enter' && target.value.trim() && target.dataset.field.trim()) {
				if(!tagsref.includes(target.dataset.field)) {
					alert(`${c`error`.uf()}: ${c`invalid-value`}.`);
				} else {
					let elm = createtagelement(target.dataset.field);
					tagslist.appendChild(elm);
					tagsarr.push(target.dataset.field);
					target.value = '';
					target.dataset.field = '';
					if(byId(lid + '-trigger')) byId(lid + '-trigger').classList.add('disabled');
					toolkit.drawicons();
					elm = undefined;
				}
			} else {
				if(target.value.trim() === '') {
					if(byId(lid + '-trigger')) byId(lid + '-trigger').classList.add('disabled');
				} else {
					if(byId(lid + '-trigger')) byId(lid + '-trigger').classList.remove('disabled');
				}
			}
		});
		tagslist.addEventListener('click', event => {
			let {target} = event;
			let isremove = target.classList.contains('tag-remove-btn');
			let par = target.parentElement.parentElement.parentElement;
			let tag = target.parentElement.parentElement;
			if (isremove) {
				let idx = tagsarr.indexOf(target.dataset.field);
				tagsarr.splice(idx, 1);
				par.removeChild(tag);
				if(tagsfnc) tagsfnc.call();
			}
			target = isremove = par = tag = undefined;
		});
		let createtagelement = content => {
			let lie = document.createElement('li');
			lie.innerHTML = [
				`<button class="button button-light button-icon">`,
				`<span class="tag-name">${fc(content)}</span>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" `,
				`data-field="${content}" `,
				`class="svgicon tag-remove-btn">`,
				`<path class="trash" d=""></path>`,
				`</svg>`,
				`</button>`,
			].join('');
			return lie;
		};
		if(tagslist.innerHTML.trim() !== '') tagslist.innerHTML = '';
		tagsarr.forEach(tagvalue => tagslist.appendChild(createtagelement(tagvalue)));
	},
};

// EU cookies law compliance
// Remotely based on Creare's 'Implied Consent' EU Cookie Law Banner v:2.4
const eucookielaw = {
	creatediv: () => {
		let url = 'assets/views/' + l.toLowerCase() + '/eucookies.html';
		cfetch(url).then(res => res.text()).then(data => { 
			gscreen.siteoverlay(true, data); 
			toolkit.drawicons();
			url = undefined;
		});
	},
	acceptcookie: () => eucookielaw.createcookie(window.cookieName, window.cookieValue, window.cookieDuration),
	createcookie: (name, value, days) => {
		let expires = null;
		let date = null;
		if (days) {
			date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); 
			expires = '; expires=' + date.toGMTString(); 
		} else {
			expires = '';
		}
		if(window.dropCookie) { 
			document.cookie = name + '=' + value + expires + '; path=/'; 
		}
		expires = date = undefined;
	},
	checkcookie: name => {
		let nameEQ = name + '=';
		let ca = document.cookie.split(';');
		for(let i = 0, len = ca.length; i < len; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
		}
		return null;
	},
	eraseCookie: name => eucookielaw.createcookie(name, '', -1),
};
