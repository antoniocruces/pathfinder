'use strict';

/* global AppError, byId, c, cfetch, cleartext, d, dbb, dbe, dbq, fc, gscreen, Headers, isObject, k, l, pagescripts, pagescriptshelper, sleep, toolkit, trade, ui */
/* exported ajax, file */

// ajax operations
const ajax = {
	auth: function() {
		let title = c`authentication`.uf();
		let body = `
			<h4 class="margin-top-s">${c`credentials`.uf()}</h4>
			<form>
			<fieldset>
			<legend>${c`authentication-info`.uf()}</legend>
			<ul class="boxes boxes-two-cols">
			<li>
			<div class="field no-padding-vertical">
			<label for="loginID">${c`user-name`.uf()}</label>
			<input id="loginID" name="loginID" type="text" placeholder="${c`user-name`.uf()}">
			</div>
			</li>
			<li>
			<div class="field no-padding-vertical">
			<label for="loginPw">${c`password`.uf()}</label>
			<input id="loginPw" name="loginPw" type="password" placeholder="${c`password`.uf()}">
			</div>
			</li>
			</ul>
			</fieldset>
			</form>			
			<h4>
			<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">
			<path class="alerttriangle" d=""></path>
			</svg>
			${c`security-notice`.uf()}
			</h4>
			<p class="margin-top-s" style="margin-bottom:1em!important">
			${c`download-notice`.uf()}. ${c`credentials-notice`.uf()}. ${c`long-operation-notice`.uf()}.
			</p>
		`;
		let features = {
			progress: false,
			title: title,
			content: body,
			action: [
				`<a class="button button-secondary button-icon margin-right-s" `,
				`href="javascript:ajax.download();">`,
				`<span>${c`validation`.uf()}</span>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="login" d=""></path>`,
				`</svg>`,
				`</a>`,
			].join(''),
			cancel: true,
			canceltitle: c`close`.uf()
		};
		gscreen.alert = gscreen.displayalert(features);
		toolkit.drawicons();
		features = undefined;
		title = body = undefined;
	},
	download: function(plain) {
		let lid = document.querySelector('#loginID').value;
		let lpw = document.querySelector('#loginPw').value;
		toolkit.alertclose();
		gscreen.siteoverlay(true);
		toolkit.timer('ajax.download');
		toolkit.statustext(true);
		
		plain = plain || false;
		let url = ['c', 'p', 'm', 't'].map(o => `./assets/data/auth.php?q=pathfinder&f=json&c=z&x=${o}&u=${lid}@${lpw}`);
		let jsn = {};
		toolkit.runinsequence(url.map(o => ajax.fetchjson(o)))
		.then(res => {
			if(res instanceof AppError) throw res;
			jsn.crd = res[0];
			jsn.pos = res[1];
			jsn.met = res[2];
			jsn.tax = res[3];
			let pin = Math.floor(1000 + Math.random() * 9000);
			let filename = pin + '_' + (Math.random().toString(36).substring(7)) + '.json';
			let filetype = 'application/json;charset=' + document.characterSet;
			if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', c`encrypting`.uf() + '&hellip;');
			if(!plain) {
				['pos', 'met', 'tax'].forEach(tbl => {
					jsn[tbl].forEach(elm => {
						Object.keys(elm).forEach(obj => {
							elm[obj] = isNaN(elm[obj]) ? toolkit.encode(elm[obj], pin) : elm[obj];
						});
					});
				});
			}
			toolkit.statustext();
			toolkit.timer('ajax.download');
			gscreen.siteoverlay(false);
			alert(c`pin-notice`.uf() + ': ' + pin);
			file.save(JSON.stringify(jsn, null, 2), filename, filetype);
			lid = lpw = url = jsn = pin = filename = filetype = undefined;
		})
		.catch(err => {
			toolkit.statustext();
			toolkit.timer('ajax.download');
			gscreen.siteoverlay(false);
			lid = lpw = url = jsn = undefined;
			throw new AppError(c`download`.uf() + ': ' + err);
		});
	},
	savecollection: () => {
		if(!d.filter || d.filter.length < 1) {
			throw new AppError(c`collection-save`.uf() + ': ' + c`invalid-conditions-number`.uf());
		}
		gscreen.siteoverlay(true);
		toolkit.timer('ajax.savecollection');
		toolkit.statustext(true);
		try {
			let tmp = {};
			let out = d.filter.slice();
			out.forEach(o => Object.assign(o, {results: []}));
			tmp.filter = out;
			tmp.filtersubfilter = d.filtersubfilter;
			tmp.filtersublinks = d.filtersublinks;
			
			let filename = Math.random().toString(36).substring(7) + '.json';
			let filetype = 'application/json;charset=' + document.characterSet;
			
			file.save(JSON.stringify(tmp, null, 2), filename, filetype);
			
			gscreen.siteoverlay(false);
			toolkit.timer('ajax.savecollection');
			toolkit.statustext();
			tmp = out = filename = filetype = undefined;
		} catch(err) {
			gscreen.siteoverlay(false);
			toolkit.timer('ajax.savecollection');
			toolkit.statustext();
			throw new AppError(c`collection-save`.uf() + ': ' + c`collection-save-error`.uf());
		}
	},
	fetchjson: (url, method = 'POST', credentials = 'include') => new Promise((resolve, reject) => {
		fetch(url, {
			method: method || 'POST', 
			headers: new Headers({
				'Accept': 'application/json, text/plain',
				'Content-Type': 'application/x-www-form-urlencoded',
			}),
			credentials: credentials || 'include',
		})
		.then(r => r.json())
		.then(r => { resolve(r); })
		.catch(err => {
			reject(new AppError([
				`${c`download-file-error`}: `,
				`${err instanceof SyntaxError ? c`invalid-filecontent` : err.message}`,
			].join('')));
		});	
	}),
	networkinfo: (url, remote = false) => {
		let hd = {
			method: 'GET',
			headers: new Headers({
				'Accept': 'application/json, text/plain',
				'Content-Type': 'application/x-www-form-urlencoded',
			}),
			credentials: 'include',
		};
		return new Promise((resolve, reject) => {
			if(!remote) {
				let _pn = performance.now();
				cfetch(url, hd).then(r => {
					resolve({tim: performance.now() - _pn, sta: r.status});
				})
				.catch(err => {
					reject({tim: performance.now() - _pn, sta: err});
				});
			} else {
				cfetch(url, hd).then(r => r.text()).then(r => {
					if(parseFloat(r, 10) === -1) {
						reject({tim: -1, sta: 'ERROR'});
					} else {
						resolve({tim: parseFloat(r, 10), sta: 200});
					}
				})
				.catch(err => {
					reject({tim: -1, sta: err});
				});
			}
		});
	},
};

const file = {
	save: function (content, filename, contentType = 'application/octet-stream') {
		let a = document.createElement('a');
		let blob = new Blob([content], {
			'type': contentType
		});

		a.href = window.URL.createObjectURL(blob, {oneTimeOnly: true});
		a.download = filename;
		document.body.appendChild(a);

		a.onclick = () => {
			window.setTimeout(() => { 
				window.URL.revokeObjectURL(a.href); 
				document.body.removeChild(a);
				a = blob = undefined;
			}, 0);
		};		
		
		a.click();
	},
	datauritoblob: function (datauri) {
		let bytestring = atob(datauri.split(',')[1]);
		let mimestring = datauri.split(',')[0].split(':')[1].split(';')[0];
		let ab = new ArrayBuffer(bytestring.length);
		let dw = new DataView(ab);
		for(let i = 0, len = bytestring.length; i < len; i++) {
			dw.setUint8(i, bytestring.charCodeAt(i));
		}
		bytestring = dw = undefined;
		//return new Blob([ab], {type: mimestring});
		return {
			content: ab, 
			filename: window.version.appname + '_' + (Math.random().toString(36).substring(7)) + '.png', 
			contenttype: mimestring
		};
	},	
	loadremotecollection: cid => {
		if(!Array.isArray(d.collections) || !cid || cid >= d.collections.length) return;
		cid = Number(cid);
		gscreen.siteoverlay(true);
		toolkit.timer('file.loadremotecollection');
		toolkit.statustext(true);
		sleep(50).then(() => {
			dbq.clearfilter(Object.assign({}, d.filterrecord))
			.then(() => {
				file.unloadremotecollection();
				d.collections[cid].active = 1;
				d.filter = [];
				d.collections[cid].query.forEach(o => {
					d.filter.push(Object.assign({}, o));
				});
				d.filtersubfilter = d.collections[cid].filtersubfilter;
				d.filtersublinks = d.collections[cid].filtersublinks;
				d.filter.forEach((o, i) => {
					d.filter[i].results = dbq.immediatesearch(o.operator, o.modifier, o.value, o.rkey).results;
				});
				ui.setfilter('_relaxed', false);
				if(byId('data-collection')) {
					toolkit.showactivecollection();
				}
				toolkit.statustext();
				toolkit.timer('file.loadremotecollection');
				gscreen.siteoverlay(false);
			})
			.catch(err => { 
				toolkit.statustext();
				toolkit.timer('file.loadremotecollection');
				gscreen.siteoverlay(false);
				throw new AppError(c`filter` + ': ' + err); 
			});
		})
		.catch(err => {
			toolkit.statustext();
			toolkit.timer('file.loadremotecollection');
			gscreen.siteoverlay(false);
			throw new AppError(c`collection-load` + ': ' + err);
		});
	},
	unloadremotecollection: () => {
		d.collections.forEach(o => {
			o.active = 0;
		});
		if(byId('data-collection')) {
			toolkit.showactivecollection();
		}
	},
	loadcollection: fileinput => {
		gscreen.siteoverlay(true);
		toolkit.statustext(true);
		if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', `<span class="loading">${c`working`.uf()}</span>`);
		let extension = 'application/json'; 
		let file = fileinput.files[0];
		if (typeof file !== 'undefined' && (file.type.match(extension) || file.type === '')) { 
			let reader = new FileReader(); 
			let validkeys = ['value', 'rkey', 'operator', 'modifier', 'results']; 
			reader.onload = function () {
				let data = null;
				try {
					data = JSON.parse(reader.result);
					if(!isObject(data)) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(!data.filter || !data.filtersubfilter || !data.filtersublinks) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(!Array.isArray(data.filter)) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(Object.keys(data.filter[0]).filter(o => !validkeys.includes(o)).length) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(!isObject(data.filtersubfilter)) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(!Array.isArray(data.filtersublinks)) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`invalid-filecontent`.uf());
					}
					if(data.filter.length === 0) {
						extension = file = reader = validkeys = data = reader = undefined;
						throw new AppError(c`no-data`.uf());
					}
					d.filter = data.filter;
					d.filtersubfilter = data.filtersubfilter;
					d.filtersublinks = data.filtersublinks;
					gscreen.siteoverlay(false);
					toolkit.statustext();
					fileinput.value = '';
					extension = file = validkeys = data = reader = undefined;
					ui.filterscreen();
				} catch(err) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					fileinput.value = '';
					extension = file = reader = validkeys = data = reader = undefined;
					throw new AppError(c`collection-load`.uf() + ': ' + err);
				}
			};
			reader.readAsText(file); 
		} else { 
			gscreen.siteoverlay(false);
			toolkit.timer('ajax.savecollection');
			toolkit.statustext();
			extension = file = undefined;
			throw new AppError(c`file-load`.uf() + ': ' + c`invalid-filetype`.uf());
		}
	},
	load: function(fileinput) {
		gscreen.siteoverlay(true);
		toolkit.statustext(true);
		let extension = 'application/json'; 
		let file = fileinput.files[0];
		if (typeof file !== 'undefined' && (file.type.match(extension) || file.type === '')) { 
			let reader = new FileReader(); 
			reader.onload = function () {
				let data = null;
				try {
					data = JSON.parse(reader.result);
				} catch(err) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					fileinput.value = '';
					file = data = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`invalid-filecontent`.uf());
				}
				let pts = (toolkit.processingtime(file.size) / 1000).toLocaleString(l) + ' s';
				if(!data.pos || !data.met || !data.tax || !data.crd) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					fileinput.value = '';
					file = data = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`invalid-filecontent`.uf());
				}
				if(data.pos.length < 1) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					fileinput.value = '';
					file = data = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`main-table-empty`.uf());
				}
				let pin = prompt(
					c`estimated-processing-time`.uf() + ': ' + pts.toLocaleString(l) + '\n' + 
					c`pin-prompt`.uf() 
				);
				
				if(isNaN(pin) || !pin) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					extension = data = pts = pin = file = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`pin-error`.uf());
				}
				pin = parseInt(pin, 10);
				if(!data.pos[0].hasOwnProperty('rkey')) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					extension = data = pts = pin = file = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`invalid-record`.uf());
				}
				if(d.post_types.map(o => o.slug).indexOf(toolkit.encode(data.pos[0].rkey, pin)) < 0) {
					gscreen.siteoverlay(false);
					toolkit.statustext();
					extension = data = pts = pin = file = reader = undefined;
					throw new AppError(c`file-load`.uf() + ': ' + c`invalid-record`.uf());
				}
				
				if(byId('siteoverlaytext')) toolkit.msg('siteoverlaytext', c`decrypting`.uf() + '&hellip;');
				
				toolkit.timer('file.load');					
				d.credentials = data.crd.credentials;
				d.file.name = file.name;
				d.file.size = file.size;

				d.nativetypes.forEach(o => {
					data[o] = data[o].map(
						e => Object.entries(e).reduce((a, [k, v]) => (a[k] = isNaN(v) ? toolkit.encode(v, pin) : v, a), {})
					);
				});
				toolkit.runinsequence(
					[
						dbb.setupstore(data), 
						dbb.setuphelpers(), 
					]		
				)
				.then(() => {	
					dbq.clearfilter();
					
					file = data = pts = pin = null;
					
					gscreen.siteoverlay(false);
					toolkit.statustext();
					toolkit.timer('file.load');
					
					pagescripts.data(false, false);
					pagescriptshelper.sideappinfo();

					extension = data = pts = pin = file = undefined;
					reader = undefined;
				})
				.catch(err => {
					performance.clearMarks();
					performance.clearMeasures();
					toolkit.statustext();
					toolkit.timer('file.load');
					gscreen.siteoverlay(false);
					extension = data = pts = pin = file = reader = undefined;
					throw new AppError(c`file-load` + ': ' + err);
				});
			};
			reader.readAsText(file); 
		} else { 
			gscreen.siteoverlay(false);
			toolkit.statustext();
			extension = file = undefined;
			throw new AppError(c`file-load`.uf() + ': ' + c`invalid-filetype`.uf());
		}
	},
	export: function(etype) {
		if(!dbe.verifytables()) {
			throw new AppError(c`export`.uf() + ': ' + c`no-data`.uf());
		} else {
			if(d.validexporttypes.indexOf(etype.toUpperCase()) < 0) {
				throw new AppError(c`export`.uf() + ': ' + c`invalid-type`.uf());
			} else {
				gscreen.siteoverlay(true);
				sleep(50).then(() => { 
					toolkit.runinsequence(
						[
							dbq.export(),
						]
					)
					.then(function(ret) {
						let sep = etype.toUpperCase() === 'CSV' ? '","' : etype.toUpperCase() === 'TAB' ? '\t' : null;
						let quo = etype.toUpperCase() === 'CSV' ? '"' : '';
						let dat = null;
						let col = null;
						if(sep) {
							col = Object.keys(ret[0][0]);
							dat = ret[0].reduce(function(prev, row) {
								return prev + quo + Object.values(row)
									.map(o => (o || '')
									.toString()
									.replace(/\"/g, "\\\""))
									.join(sep) + quo + '\n';
							}, quo + col.join(sep) + quo + '\n');
						} else {
							if(etype.toUpperCase() === 'XML') {
								dat = trade.json2xml(ret[0], '\t');
							} else {
								dat = JSON.stringify(ret[0], null, 2);
							}
						}
						file.save(
							new Blob(
								[dat], {
									type: 'text/csv;charset=' + document.characterSet
								}
							), 
							(Math.random().toString(36).substring(7)) + '.' + etype.toLowerCase(), 
							'text/plain;charset=' + document.characterSet
						);
						dat = ret = sep = quo = col = undefined;
						gscreen.siteoverlay(false);
					})
					.catch(function(err) {
						gscreen.siteoverlay(false);
						throw new AppError(c`export`.uf() + ': ' + err);
					});
				});
			}
		}
	},
	makereport: (rtype, format = 'c', ffilter = '') => {
		gscreen.siteoverlay(true);
		toolkit.timer('file.makereport');
		toolkit.statustext(true);
		sleep(50).then(() => { 
			trade.makereport(rtype, ffilter === '' ? null : ffilter)
			.then(function(ret) {
				if(ret.length) {
					if(format === 'c') {
						let dat = Object.keys(ret[0]) + 
							'\n' + 
							ret								
								.map(o => '"' + Object.values(o).map(v => String(v).replace(/"/g, '""')).join('","') + '"').join('\n');
						file.save(
							new Blob(
								[dat], {
									type: 'text/csv;charset=' + document.characterSet
								}
							), 
							(Math.random().toString(36).substring(8)) + '.csv', 
							'text/plain;charset=' + document.characterSet
						);
						dat = undefined;
					} else {
						let cid = null;
						let out = [];
						let elm = (tit, txt) => '\\fs18 \\i ' + tit + '\\i0: ' + txt + '\\';
						out.push([
						'{\\rtf1\\ansi\\ansicpg1252\\cocoartf1404\\cocoasubrtf470\n' + 
						'{\\fonttbl\\f0\\fmodern\\fcharset0 Courier New;}\n' + 
						'{\\colortbl;\\red255\\green255\\blue255;\\red127\\green127\\blue127;}\n' + 
						'{\\info\n' + 
						'{\\title ' + 
						toolkit.rtfchar(window.version.appname) + 
						'. ' + 
						toolkit.rtfchar(c`report`.uf()) + 
						'}\n' + 
						'{\\author ' + 
						toolkit.rtfchar(window.version.author) + 
						'}\n' + 
						'{\\*\\company ' + 
						toolkit.rtfchar(window.version.organization) + 
						'}\n' + 
						'{\\*\\copyright ' + 
						toolkit.rtfchar(window.version.author) + 
						' ' +  
						toolkit.rtfchar(window.version.license) + 
						'}}\n' + 
						'\\paperw11900\\paperh16840\\margl1440\\margr1440\\vieww11940\\viewh7800\\viewkind0' + 
						'\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968' + 
						'\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803' + 
						'\\pardirnatural\\partightenfactor0' + 
						'\n' + 
						'\\f0\\b\\fs48 \\cf0 ' + 
						toolkit.rtfchar(window.version.appname.toUpperCase()) + 
						'\\b0\\fs24 \\' + 
						'\n' + 
						'\\fs36 ' + 
						toolkit.rtfchar(c`post_type`.uf()) + 
						': ' + 
						toolkit.rtfchar(c(rtype).uf()) + 
						'\\fs24 \\' + 
						'\n' + 
						'\\fs28 \\cf2 ' + 
						toolkit.rtfchar(new Date().toLocaleDateString(l, k.formats.longdate)) + 
						' ' + 
						new Date().toLocaleTimeString() + 
						'\\fs24 \\cf0 \\'
						].join(''));
						out.push('\\page');
						out.push([
							'{\\header ' + 
							toolkit.rtfchar(window.version.appname) + 
							'. ' + 
							toolkit.rtfchar(c`report`.uf()) + 
							'}\n' + 
							'{\\footer\\pard\qr \\chpgn  / {\\field{\\*\\fldinst NUMPAGES}}. ' + 
							toolkit.rtfchar(toolkit.appinfo(true)) + 
							'\\par}\n'
						].join(''));
						ret.forEach(o => {
							if(cid !== o.ID) {
								if(cid) out.push('\\page');
								out.push('\\fs36 \\b ' + 
									toolkit.rtfchar(toolkit.titleformat(o.title)) + 
									'\\b0 \\fs24  ID ' + o.ID + '\\'
								);
								if(o.latitude || o.longitude)
									out.push(elm(
										toolkit.rtfchar(c`point`.uf()),
										toolkit.rtfchar([o.latitude, o.longitude].join(', '))
									));
								if(o.town || o.region || o.country)
									out.push(elm(
										toolkit.rtfchar(c`place`.uf()),
										toolkit.rtfchar([o.country, o.region, o.town].join(', '))
									));
								if(o.startyear || o.startmonth || o.startday)
									out.push(elm(
										toolkit.rtfchar(c`start`.uf()),
										toolkit.rtfchar([o.startyear, o.startmonth, o.startday].join('-'))
									));
								if(o.endyear || o.endmonth || o.endday)
									out.push(elm(
										toolkit.rtfchar(c`end`.uf()),
										toolkit.rtfchar([o.endyear, o.endmonth, o.endday].join('-'))
									));
								if(o.agedays)
									out.push(elm(
										toolkit.rtfchar(c`duration`.uf()),
										toolkit.rtfchar(o.agedays + ' ' + c`days`)
									));
								if(o.gender)
									out.push(elm(
										toolkit.rtfchar(c`gender`.uf()),
										toolkit.rtfchar(o.gender)
									));
								if(o.topics)
									out.push(elm(
										toolkit.rtfchar(c`tax_topic`.uf()),
										toolkit.rtfchar(o.topics)
									));
								if(o.artworktypes)
									out.push(elm(
										toolkit.rtfchar(c`tax_artwork_type`.uf()),
										toolkit.rtfchar(o.artworktypes)
									));
								if(o.periods)
									out.push(elm(
										toolkit.rtfchar(c`tax_period`.uf()),
										toolkit.rtfchar(o.periods)
									));
								if(o.movements)
									out.push(elm(
										toolkit.rtfchar(c`tax_movement`.uf()),
										toolkit.rtfchar(o.movements)
									));
								if(o.exhibitiontypes)
									out.push(elm(
										toolkit.rtfchar(c`tax_exhibition_type`.uf()),
										toolkit.rtfchar(o.exhibitiontypes)
									));
								if(o.typologies)
									out.push(elm(
										toolkit.rtfchar(c`tax_typology`.uf()),
										toolkit.rtfchar(o.typologies)
									));
								if(o.ownerships)
									out.push(elm(
										toolkit.rtfchar(c`tax_ownership`.uf()),
										toolkit.rtfchar(o.ownerships)
									));
								if(o.activities)
									out.push(elm(
										toolkit.rtfchar(c`tax_activity`.uf()),
										toolkit.rtfchar(o.activities)
									));

								out.push('\\\n');
								out.push('\\pard \\brdrb \\brdrs\\brdrw10\\brsp20 {\\fs4\\~}\\par \\pard');
								out.push('\\\n');
								out.push('\\pard\\qc\\fs28 \\b ' + 
									toolkit.rtfchar(c`relations`.toUpperCase()) + 
									'\\b0\\\n'
								);
								out.push('\\\n');
								out.push('\\pard \\brdrb \\brdrs\\brdrw10\\brsp20 {\\fs4\\~}\\par \\pard');
								out.push('\\\n');
								cid = o.ID;
							}

							if(o.reltitle || o.relID)
								out.push('\\fs26 \\b ' + 
									toolkit.rtfchar(toolkit.titleformat(o.reltitle)) + 
									'\\b0 \\fs20  ID ' + o.relID + '\\'
								);
							if(o.reltype)
								out.push(elm(
									toolkit.rtfchar(c`relation-type`.uf()),
									toolkit.rtfchar(o.reltype === '>' ? c`inbound` : c`outbound`)
								));
							if(o.relkey)
								out.push(elm(
									toolkit.rtfchar(c`relation`.uf()),
									toolkit.rtfchar(o.relkey)
								));
							if(o.relpostkey)
								out.push(elm(
									toolkit.rtfchar(c`post_type`.uf()),
									toolkit.rtfchar(o.relpostkey)
								));
							if(o.rellatitude || o.rellongitude)
								out.push(elm(
									toolkit.rtfchar(c`point`.uf()),
									toolkit.rtfchar([o.rellatitude, o.rellongitude].join(', '))
								));
							if(o.reltown || o.relregion || o.relcountry)
								out.push(elm(
									toolkit.rtfchar(c`place`.uf()),
									toolkit.rtfchar([o.relcountry, o.relregion, o.reltown].join(', '))
								));
							if(o.relstartyear || o.relstartmonth || o.relstartday)
								out.push(elm(
									toolkit.rtfchar(c`start`.uf()),
									toolkit.rtfchar([o.relstartyear, o.relstartmonth, o.relstartday].join('-'))
								));
							if(o.relendyear || o.relendmonth || o.relendday)
								out.push(elm(
									toolkit.rtfchar(c`end`.uf()),
									toolkit.rtfchar([o.relendyear, o.relendmonth, o.relendday].join('-'))
								));
							if(o.reldays)
								out.push(elm(
									toolkit.rtfchar(c`duration`.uf()),
									toolkit.rtfchar(o.reldays + ' ' + c`days`)
								));
							if(o.relgender)
								out.push(elm(
									toolkit.rtfchar(c`gender`.uf()),
									toolkit.rtfchar(o.relgender)
								));
							if(o.reltopics)
								out.push(elm(
									toolkit.rtfchar(c`tax_topic`.uf()),
									toolkit.rtfchar(o.reltopics)
								));
							if(o.relartworktypes)
								out.push(elm(
									toolkit.rtfchar(c`tax_artwork_type`.uf()),
									toolkit.rtfchar(o.relartworktypes)
								));
							if(o.relperiods)
								out.push(elm(
									toolkit.rtfchar(c`tax_period`.uf()),
									toolkit.rtfchar(o.relperiods)
								));
							if(o.relmovements)
								out.push(elm(
									toolkit.rtfchar(c`tax_movement`.uf()),
									toolkit.rtfchar(o.relmovements)
								));
							if(o.relexhibitiontypes)
								out.push(elm(
									toolkit.rtfchar(c`tax_exhibition_type`.uf()),
									toolkit.rtfchar(o.relexhibitiontypes)
								));
							if(o.reltypologies)
								out.push(elm(
									toolkit.rtfchar(c`tax_typology`.uf()),
									toolkit.rtfchar(o.reltypologies)
								));
							if(o.relownerships)
								out.push(elm(
									toolkit.rtfchar(c`tax_ownership`.uf()),
									toolkit.rtfchar(o.relownerships)
								));
							if(o.relactivities)
								out.push(elm(
									toolkit.rtfchar(c`tax_activity`.uf()),
									toolkit.rtfchar(o.relactivities)
								));

							out.push('\\pard \\brdrb \\brdrs\\brdrw10\\brsp20 {\\fs4\\~}\\par \\pard');
							out.push('\\\n');

						});
						out.push('}');
						file.save(
							new Blob(
								[out.join('\n')], {
									type: 'application/rtf;charset=' + document.characterSet
								}
							), 
							(Math.random().toString(36).substring(8)) + '.rtf', 
							'application/rtf;charset=' + document.characterSet
						);
						out = cid = elm = undefined;
					}
					gscreen.siteoverlay(false);
					toolkit.timer('file.makereport');
					toolkit.statustext();
				} else {
					gscreen.siteoverlay(false);
					toolkit.timer('file.makereport');
					toolkit.statustext();
					window.setTimeout(() => { throw new AppError(c`report`.uf() + ': ' + c`no-results`); }, 500);
				}
			})
			.catch(function(err) {
				gscreen.siteoverlay(false);
				toolkit.timer('file.makereport');
				toolkit.statustext();
				throw new AppError(c`report`.uf() + ': ' + err);
			});
		});
	},
	exportchart: (elm = '.exportablechart') => {
		let canvasElement = document.querySelector(elm);
		if(!byId(canvasElement)) {
			canvasElement = undefined;
			throw new AppError(c`export` + ': ' + c`no-data`);
		}
		let MIME_TYPE = 'image/png';
		let imgURL = canvasElement.toDataURL(MIME_TYPE);
		let dlLink = document.createElement('a');
		dlLink.download = (Math.random().toString(36).substring(7)) + '.png';
		dlLink.href = imgURL;
		dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');
		document.body.appendChild(dlLink);
		dlLink.click();
		document.body.removeChild(dlLink);
		MIME_TYPE = imgURL = dlLink = canvasElement = undefined;
	},
	tabletoarray: (tbl, opt_cellValueGetter) => {
		opt_cellValueGetter = opt_cellValueGetter || function(td) {
			return td.textContent || td.innerText;
		};
		let twoD = [];
		for (let rowCount = tbl.rows.length, rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			twoD.push([]);
		}
		for (let rowIndex = 0, rowCount = tbl.rows.length; rowIndex < rowCount; rowIndex++) {
			let tr = tbl.rows[rowIndex];
			for (let colIndex = 0, colCount = tr.cells.length, offset = 0; colIndex < colCount; colIndex++) {
				let td = tr.cells[colIndex],
					text = opt_cellValueGetter(td, colIndex, rowIndex, tbl);
				while (twoD[rowIndex].hasOwnProperty(colIndex + offset)) {
					offset++;
				}
				for (let i = 0, colSpan = parseInt(td.colSpan, 10) || 1; i < colSpan; i++) {
					for (let j = 0, rowSpan = parseInt(td.rowSpan, 10) || 1; j < rowSpan; j++) {
						twoD[rowIndex + j][colIndex + offset + i] = text;
					}
				}
			}
		}
		return twoD;
	},
	exporttabletocsv: (tid, separator = '\t') => {
		if(!byId(tid)) throw new AppError(c`export` + ': ' + c`no-data`);
		let csv = [];
		let rows = document.querySelector('#' + tid).rows;
	
		for (let i = 0, len = rows.length; i < len; i++) {
			let row = [];
			let cols = rows[i].querySelectorAll('td, th');
			for (let j = 0, jlen = cols.length; j < jlen; j++) {
				if(cols[j].dataset.svalue) {
					row.push(cols[j].dataset.svalue);
				} else {
					row.push(cols[j].textContent);
				}
			}
			csv.push(row.join(separator));
			row = cols = undefined;
		}
		
		let filename = window.version.appname + '_' + (Math.random().toString(36).substring(7)) + '.csv';
		let filetype = 'text/csv;charset=' + document.characterSet;
		file.save(csv.join('\n'), filename, filetype);
		csv = rows = filename = filetype = undefined;
	},
	exportdatatocsv: (rows, separator = '\t', includehead = true) => {
		if(!rows) throw new AppError(c`export` + ': ' + c`no-data`);
		if(!Array.isArray(rows)) throw new AppError(c`export` + ': ' + c`invalid-format`);
		if(!rows.length) {
			if(gscreen.siteoverlayisset) gscreen.siteoverlay(false);
			throw new AppError(c`export` + ': ' + c`no-data`);
		}
		let csv = [];

		if(includehead) csv.push(Object.keys(rows[0]).map(o => fc(o)).join(separator));
		
		for (let i = 0, len = rows.length; i < len; i++) {
			csv.push(Object.values(rows[i]).map(o => cleartext(o)).join(separator));
		}
		
		let filename = window.version.appname + '_' + (Math.random().toString(36).substring(7)) + '.csv';
		let filetype = 'text/csv;charset=' + document.characterSet;
		file.save(csv.join('\n'), filename, filetype);
		csv = filename = filetype = undefined;
	},
};
