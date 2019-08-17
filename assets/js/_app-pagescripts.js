'use strict';

/* global ajax, AppError, byId, c, charts, d, dbe, gscreen, i18n, icons, info, isBlank, isloaded, l, sleep, toolkit, ui, wait */
/* exported pagescripts */

// pagescripts functions
const pagescripts = {
	sidehome: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sidedocuments: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sideprojects: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sideinstitutions: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sidelegal: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sidedata: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sidesettings: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	sidestarting: () => {
		toolkit.statustext();
		toolkit.drawicons();
		pagescriptshelper.sideappinfo();
	},
	footer: () => {
		toolkit.drawicons();
		toolkit.msg('footer-application', toolkit.appinfo());
		toolkit.msg('prn-footer', toolkit.appinfo(true));
		byId('doi-link').href = window.version.DOIlink;
		byId('github-link').href = window.version.GitHublink;
		toolkit.msg('nav-lang', i18n.showlang(l, true));
		toolkit.showmemory('app-memory');
	},
	error: () => {
		toolkit.msg('err-description', c`page-not-found`.uf());
		toolkit.drawicons();
	},
	home: () => {
		toolkit.drawicons();
		let appinfo = 
		[
			[window.version.version, window.version.subversion, window.version.release].join('.'),
			window.version.date.toLocaleDateString(l, {year: 'numeric'}),
			l.toUpperCase(),
			icons.flags[l]
		].join(' ') ;
		toolkit.msg('app-home-info', appinfo);
		appinfo = undefined;

		byId('main').querySelectorAll('img').forEach(o => o.style.background = '');
	},
	data: (starttimer = true, setoverlay = true) => {
		toolkit.selecttab('tab', 'zero');
		toolkit.drawicons();
		let isactive = dbe.verifytables();
		let renderstatus = res => {
			let ms = (res.tim || 0).toLocaleString(l) + 'ms';
			let status = res.sta === 200 ? c`on-line` : c`out-of-line`;
			let scolor = res.sta === 200 ? 'background-success' : 'background-error';
			toolkit.msg(
				'data-s-server', 
				[
					`<span class="${scolor.replace('background-', 'color-')}">${status}</span> `,
					`[`,
					`<span data-tooltip="${c`response-time`}">${ms}</span>`,
					`]`,
				].join('')
			);
			if(res.sta !== 200) {
				byId('data-a-server').classList.remove('button-secondary');
				byId('data-a-server').classList.add('disabled');
				byId('data-a-server').classList.add('button-error');
			} else {
				byId('data-a-server').classList.remove('button-error');
				byId('data-a-server').classList.remove('disabled');
				byId('data-a-server').classList.add('button-secondary');
			}
			ms = status = scolor = undefined;

			byId('main').querySelectorAll('img').forEach(o => o.style.background = '');
		};
		toolkit.msg('data-s-server', `[&hellip;]`);
		ajax.networkinfo(window.servers.dataserver, true).then(res => renderstatus(res)).catch(err => renderstatus(err));
		if(isactive) {
			if(setoverlay) {
				if(!gscreen.siteoverlayisset) gscreen.siteoverlay(true);
				toolkit.statustext(true);
			}
			if(starttimer) toolkit.timer('pagescripts.data');
			sleep(50).then(() => {
				wait(() => 
					isloaded('L') && 
					isloaded('_') && 
					isloaded('echarts') && 
					isloaded('dl') 
				).then(() => {
					if(byId('data-size')) {
						byId('data-size').classList.remove('hide');
						charts.sizechart('data-size', false);
					}
					
					let info = dbe.datafileinfo(true);
					let recs = Object.keys(d.store.pos).length || 0;
					byId('panel').querySelectorAll('.panelelement').forEach(o => {
						o.classList.remove('hide');
					});
					
					toolkit.msg(
						'data-s-datastatus', 
						[
							`<span data-tooltip="${c`records`}: ${recs.toLocaleString(l)}">`,
							`${info}`,
							`</span>`,
						].join('')
					);
					byId('data-s-datastatus').classList.remove('muted');
					byId('data-s-db-info').classList.remove('hide');
					byId('data-s-db-export').classList.remove('hide');

					toolkit.msg('data-listing', '');
					let reports = ui.reportselector();
					toolkit.msg('data-s-reports-0', reports[0]);
					toolkit.msg('data-s-reports-1', reports[1]);
					byId('dr-ana').href = reports[2];
					byId('dr-tex').href = reports[3];
					ui.reportdescriptor();
					reports = undefined;
					toolkit.msg('data-s-collections', `${c`working`.uf()}&hellip;`);
					ui.collectionselector('data-s-collections', setoverlay);

					ui.datalist('', d.currentpages.list);

					if(gscreen.siteoverlayisset) gscreen.siteoverlay(false);
					
					if(setoverlay) {
						toolkit.statustext();
					}
					if(starttimer) toolkit.timer('pagescripts.data');					
					info = recs = undefined;
				});
			});
		} else {
			if(byId('data-size')) {
				byId('data-size').classList.remove('hide');
				charts.sizechart('data-size', true);
			}
		}
		isactive = undefined;
	},
	documents: () => {
		toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		toolkit.drawicons();
	},
	projects: () => {
		toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		toolkit.drawicons();
	},
	institutions: () => {
		toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		toolkit.drawicons();
	},
	starting: () => {
		toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		toolkit.drawicons();
		let splashhandler = function(e) {
			e.preventDefault();
			let splashtarget = this.value;
			let references = ['10', '11', '12', '13', '14'];
			references.forEach(o => {
				if(o === splashtarget) {
					byId(`step${o}`).classList.remove('hide');
					byId(`step${o}`).classList.add('visible');
				} else {
					byId(`step${o}`).classList.remove('visible');
					byId(`step${o}`).classList.add('hide');
				}
			});
		};
		let videohandler = function(e) {
			e.preventDefault();
			let videotarget = this.value;
			let filename = videotarget.substr(0, videotarget.lastIndexOf('.')) || videotarget;
			let video = document.querySelector('#videoplayer');
			let source = document.querySelectorAll('#videoplayer source');
			video.removeAttribute('poster');
			source[0].src = window.servers.videoserver + filename + '.mp4';
			source[1].src = window.servers.videoserver + filename + '.webm';
			source[1].src = window.servers.videoserver + filename + '.ogv';
			video.load();
			video.play(); 
			videotarget = filename = video = source = undefined;   
		};
		byId('splashselector').onchange = splashhandler;
		byId('videoselector').onchange = videohandler;
		splashhandler = videohandler = undefined;
	},
	legal: () => {
		toolkit.generictab('stab0', 'step0', 'stabcontent', 'stablinks');
		toolkit.drawicons();
		
		toolkit.msg('legal-user', d.credentials.cuser || c`no-data`);
		toolkit.msg('legal-lastdownload', d.credentials.ctime || c`no-data`);
		toolkit.msg('legal-ipaddress', d.credentials.caddr || c`no-data`);
		
		byId('legal-user').classList.remove('background-light-200');
		byId('legal-lastdownload').classList.remove('background-light-200');
		byId('legal-ipaddress').classList.remove('background-light-200');

		byId('legal-user').classList.add(
			isBlank(d.credentials.cuser) ? 
				'background-error-50' : 
				'background-success-50'
		);
		byId('legal-lastdownload').classList.add(
			isBlank(d.credentials.ctime) ? 
				'background-error-50' : 
				'background-success-50'
		);
		byId('legal-ipaddress').classList.add(
			isBlank(d.credentials.caddr) ? 
				'background-error-50' : 
				'background-success-50'
		);
		byId('legal-user').classList.add(
			isBlank(d.credentials.cuser) ? 
				'color-error' : 
				'color-success'
		);
		byId('legal-lastdownload').classList.add(
			isBlank(d.credentials.ctime) ? 
				'color-error' : 
				'color-success'
		);
		byId('legal-ipaddress').classList.add(
			isBlank(d.credentials.caddr) ? 
				'color-error' : 
				'color-success'
		);
		
		ajax.fetchjson(d.currentipsrc, 'GET', 'omit')
		.then(ret => { 
			toolkit.msg('legal-current-ipaddress', ret.ip);
			byId('main').querySelectorAll('img').forEach(o => o.style.background = ''); 
		})
		.catch(err => { throw new AppError(c`remote-access-error` + ': ' + err); });
	},
	settings: () => {
		toolkit.drawicons();
		let scales = [];
		let ops = (window.estimative.ops / window.estimative.opstime) / 1000;
		d.scales.forEach((o, i) => {
			let title = `<a data-scalecolorbase="${i}" 
				class="text-decoration-none" 
				href="javascript:info.settings('scalecolorbase', ${i});">${c(o.name)}</a>`;
			scales.push(toolkit.colorlegend(i, title));
			title = undefined;
		});
		toolkit.msg('colorscales', scales.join('\n'));
		
		if(byId('mapbase-select')) byId('mapbase-select').value = String(window.settings.mapbasedefault);

		if(byId('hmaplow')) byId('hmaplow').value = window.settings.hmaplow;
		if(byId('hmapmedium')) byId('hmapmedium').value = window.settings.hmapmedium;
		if(byId('hmaphigh')) byId('hmaphigh').value = window.settings.hmaphigh;
		
		let resyesno = res => res ? `<span class="color-success">${c`yes`}</span>` : `<span class="color-error">${c`no`}</span>`;
		let rescolor = res => res ? 'color-success' : 'color-error';
		Object.keys(window.settings).forEach(k => info.settings(k, window.settings[k]));
		let bi = toolkit.browserinfo();
		let bisvalid = toolkit.isavalidbrowser();
		let binfo = `<span class="${bisvalid ? 'color-success' : 'color-error'}">
			${bi.sName} ${bi.sVersion} ${bi.platform} HWC ${bi.hwConcurrence} <span data-tooltip="${c`processors`}">[?]</span>
		</span>`;
		toolkit.msg('settings-detected', binfo);

		toolkit.msg('br-cookies', resyesno(bi.sCookieEnabled));
		toolkit.msg('br-device', `<span class="${rescolor(bi.sDevice === 'desktop')}">${bi.sDevice}</span>`);
		toolkit.msg('br-languages', `<span class="${rescolor(['en', 'es'].includes(bi.sLanguage))}">${bi.sLanguage}</span> <span class="color-grey">(${bi.sLanguages})</span>`);
		toolkit.msg('br-online', resyesno(bi.sOnline));
		toolkit.msg('br-referrer', `<span class="color-primary">${c(bi.sReferrer)}</span>`);
		toolkit.msg('br-screenresolution', `<span class="color-primary">${bi.sScreenResolution}</span>`);
		toolkit.msg('br-timezone', `<span class="color-primary">${bi.sTimeZone}</span>`);
		toolkit.msg('br-useragent', `<span class="color-primary">${bi.sUserAgent}</span>`);

		toolkit.msg('br-storeoriginal', `<span class="color-primary">${window.storeoriginalsize.bytes.toLocaleString(l)}B</span>`);
		toolkit.msg('br-storecurrent', `<span class="color-primary">${window.storecurrentsize.bytes.toLocaleString(l)}B</span>`);
		toolkit.msg('br-opsspeed', `<span class="color-primary">${ops.toLocaleString(l)} <span data-tooltip="${c`ops`}">OPS</span></span>`);
		scales = ops = resyesno = rescolor = bi = bisvalid = binfo = undefined;
	},
};

const pagescriptshelper = {
	sideappinfo: () => {
		toolkit.msg(
			'side-app-info', 
			[
				[
					`v`,
					[
						window.version.version, 
						window.version.subversion, 
						window.version.release
					].join('.'),
				].join(''),
				window.version.date.toLocaleDateString(l, {year: 'numeric'}),
				l.toUpperCase(),
			].join(' ')
		);
		if(dbe.verifytables()) {
			byId('search-container').classList.remove('hide');
			byId('search-container').classList.add('visible');
			byId('search-input').removeEventListener('keyup', ui.directsearch);
			byId('search-input').removeEventListener('search', ui.directsearch);
			byId('search-input').addEventListener('keyup', ui.directsearch);
			byId('search-input').addEventListener('search', ui.directsearch);
		} else {
			byId('search-container').classList.remove('visible');
			byId('search-container').classList.add('hide');
		}
	},
};
