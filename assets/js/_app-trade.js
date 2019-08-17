'use strict';

/* global c, d, dbe, toolkit */
/* exported trade */

const trade = {
	json2xml: function(o, tab) {
		let xml = [];
		xml.push('<?xml version="1.0"?>');
		let addChild = function(name, v, ind) {
			let childs;
			if (v instanceof Array) {
				for (let i = 0, n = v.length; i < n; i++)
					addChild(name, v[i], ind);
			} else if (typeof v === 'object') {
				xml.push(ind, '<', name);
				childs = [];
				for (let p in v) {
					if (!v.hasOwnProperty(p))
						continue;
					if (p.charAt(0) === '@')
						xml.push(' ', p.substr(1), '="', v[p].toString().replace('&', '&amp;').replace('"', '&quot;'), '"');
					else
						childs.push(p);
				}
				xml.push(childs.length ? '>' : '/>');
				if (childs.length) {
					for (let i = 0, n = childs.length, p; i < n; i++) {
						p = childs[i];
						if (p === '#text')
							xml.push(v[p].toString().replace('&', '&amp;').replace('<', '&lt;'));
						else if (p === '#cdata')
							xml.push(['<![CDATA[', v[p].toString().replace([']]', '>'].join(''), [']]]]', '><![CDATA[>'].join('')) + ']]>'].join(''));
						else
							addChild(p, v[p], ind + tab);
					}
					if (/[>\n]$/.test(xml[xml.length - 1]))
						xml.push(ind);
					xml.push('</', name, '>');
				}
			} else {
				xml.push([ind, '<', name, '>', v.toString().replace('&', '&amp;').replace('<', '&lt;'), '</', name, '>'].join(''));
			}
			childs = null;
		};
		for(let m in o) {
			if(m) {
				addChild(m, o[m], '\n');
			}
		}
		xml.shift(); // Remove the first indent
		
		addChild = undefined;
		return xml.join('');
	},
	makereport: (xkey = null, ffkey = null, filtered = true) => new Promise(resolve => {
		let out = [];
		let doc = dbe._documents(true, filtered);
		let poi = dbe._points(true, filtered, true);
		let pla = dbe._places(true, filtered, true);
		let sdt = dbe._startdates(true, filtered, true);
		let edt = dbe._enddates(true, filtered, true);
		let gnd = dbe._genders(true, filtered, true);
		let age = dbe._ages(true, filtered, true);
		let rel = dbe._relations(true, filtered);
		let tax = dbe._taxonomies(true, filtered);
		Object.keys(doc).forEach(o => {
			let rec = doc[o] || null;
			let pos = d.store.pos[o] || null;
			let zrl = rel[o] || null;
			let ztx = tax[o] || null;
			let zag = age[o] || null;
			let i = rec ? rec.ID : null;
			if(rec) {
				let xpo = poi[i] ? poi[i] : null;
				let xpl = pla[i] ? pla[i] : null;
				let xsd = sdt[i] ? sdt[i] : null;
				let xed = edt[i] ? edt[i] : null;
				let xgn = gnd[i] ? gnd[i] : null;
				let xag = zag ? zag.value : null;
				let xrl = zrl && zrl.length ? zrl : null;
				
				let tto = ztx ? ztx.filter(x => x.rkey === 'tax_topic').map(x => x.value).join(', ') : null;
				let tat = ztx ? ztx.filter(x => x.rkey === 'tax_artwork_type').map(x => x.value).join(', ') : null;
				let tpe = ztx ? ztx.filter(x => x.rkey === 'tax_period').map(x => x.value).join(', ') : null;
				let tmo = ztx ? ztx.filter(x => x.rkey === 'tax_movement').map(x => x.value).join(', ') : null;
				let tet = ztx ? ztx.filter(x => x.rkey === 'tax_exhibition_type').map(x => x.value).join(', ') : null;
				let tty = ztx ? ztx.filter(x => x.rkey === 'tax_typology').map(x => x.value).join(', ') : null;
				let tow = ztx ? ztx.filter(x => x.rkey === 'tax_ownership').map(x => x.value).join(', ') : null;
				let tac = ztx ? ztx.filter(x => x.rkey === 'tax_activity').map(x => x.value).join(', ') : null;
				let tpb = ztx ? ztx.filter(x => x.rkey === 'tax_publisher').map(x => x.value).join(', ') : null;
				let tct = ztx ? ztx.filter(x => x.rkey === 'tax_catalog_typology').map(x => x.value).join(', ') : null;
				
				let isok = !xkey || rec.rkey === xkey;
				if(isok) {
					let obj = {
						ID: rec.ID,						
						key: c(rec.rkey),
						title: toolkit.titleformat(rec.value),
						latitude: xpo ? xpo.longitude : xpo,
						longitude: xpo ? xpo.latitude : xpo,
						town: xpl ? xpl.town : xpl,
						region: xpl ? xpl.region : xpl,
						country: xpl ? xpl.country : xpl,
						startyear: xsd ? xsd.year : xsd,
						startmonth: xsd ? xsd.month : xsd,
						startday: xsd ? xsd.day : xsd,
						endyear: xed ? xed.year : xed,
						endmonth: xed ? xed.month : xed,
						endday: xed ? xed.day : xed,
						agedays: xag ? xag.days : xag,
						gender: xgn ? xgn.value : xgn,
						topics: tto,
						artworktypes: tat,
						periods: tpe,
						movements: tmo,
						exhibitiontypes: tet,
						typologies: tty,
						ownerships: tow,
						activities: tac, 
						publishers: tpb, 
						catalog_typologies: tct, 
						relrkey: null,
						relkey: null,
						relID: null,
						reltitle: null,
						reltype: null,
						relpostrkey: null,
						relpostkey: null,
						relgender: null,
						relstartyear: null,
						relstartmonth: null,
						relstartday: null,
						relendyear: null,
						relendmonth: null,
						relendday: null,
						reldays: null,
						relcountry: null,
						relregion: null,
						reltown: null,
						reltopics: null,
						relartworktypes: null,
						relperiods: null,
						relmovements: null,
						relexhibitiontypes: null,
						reltypologies: null,
						relownerships: null,
						relactivities: null,
						relpublishers: null,
						relcatalog_typologies: null
					};
					if(xrl && Array.isArray(xrl)) {
						xrl.forEach(x => {
							let rpl = pla[x.RID] ? pla[x.RID] : null;
							let rsd = sdt[x.RID] ? sdt[x.RID] : null;
							let red = edt[x.RID] ? edt[x.RID] : null;
							let rgn = gnd[x.RID] ? gnd[x.RID].value : null;
							let rag = age[x.RID] ? age[x.RID] : null;
							
							let rpo = tax[x.RID] || null;
							
							let rtto = rpo ? rpo.filter(x => x.rkey === 'tax_topic').map(x => x.value).join(', ') : null;
							let rtat = rpo ? rpo.filter(x => x.rkey === 'tax_artwork_type').map(x => x.value).join(', ') : null;
							let rtpe = rpo ? rpo.filter(x => x.rkey === 'tax_period').map(x => x.value).join(', ') : null;
							let rtmo = rpo ? rpo.filter(x => x.rkey === 'tax_movement').map(x => x.value).join(', ') : null;
							let rtet = rpo ? rpo.filter(x => x.rkey === 'tax_exhibition_type').map(x => x.value).join(', ') : null;
							let rtty = rpo ? rpo.filter(x => x.rkey === 'tax_typology').map(x => x.value).join(', ') : null;
							let rtow = rpo ? rpo.filter(x => x.rkey === 'tax_ownership').map(x => x.value).join(', ') : null;
							let rtac = rpo ? rpo.filter(x => x.rkey === 'tax_activity').map(x => x.value).join(', ') : null;
							let rtpb = rpo ? rpo.filter(x => x.rkey === 'tax_publisher').map(x => x.value).join(', ') : null;
							let rtct = rpo ? rpo.filter(x => x.rkey === 'tax_catalog_typology').map(x => x.value).join(', ') : null;

							let isffield = !ffkey || x.rkey === ffkey;
							if(isffield) {
								out.push(Object.assign({}, obj, {
									relrkey: x.rkey,
									relkey: c(x.rkey),
									relID: x.RID,
									reltitle: d.store.pos[x.RID] ? toolkit.titleformat(d.store.pos[x.RID].value) : null,
									reltype: x.bound,
									relpostrkey: d.store.pos[x.RID] ? d.store.pos[x.RID].rkey : null,
									relpostkey: d.store.pos[x.RID] ? c(d.store.pos[x.RID].rkey) : null,
									relgender: rgn,
									relstartyear: rsd ? rsd.year : null,
									relstartmonth: rsd ? rsd.month : null,
									relstartday: rsd ? rsd.day : null,
									relendyear: red ? red.year : null,
									relendmonth: red ? red.month : null,
									relendday: red ? red.day : null,
									reldays: rag ? rag.value.days : null,
									relcountry: rpl ? rpl.country : null,
									relregion: rpl ? rpl.region : null,
									reltown: rpl ? rpl.town : null,
									reltopics: rtto,
									relartworktypes: rtat,
									relperiods: rtpe,
									relmovements: rtmo,
									relexhibitiontypes: rtet,
									reltypologies: rtty,
									relownerships: rtow,
									relactivities: rtac, 
									relpublishers: rtpb, 
									relcatalog_typologies: rtct, 
								}));
							}
							rpl = rsd = red = rgn = rag = rpo = undefined;
							rtto = rtat = rtpe = rtmo = rtet = rtty = rtow = rtac = isffield = undefined;
							zrl = ztx = zag = undefined;
						});
					} else {
						out.push(obj);
					}
					obj = null;
				}
				xpo = xpl = xsd = xed = xgn = xag = xrl = undefined;
				isok = tto = tat = tpe = tmo = tet = tty = tow = tac = undefined;
			}
			rec = pos = i = undefined;
		});
		doc = poi = pla = sdt = edt = gnd = age = rel = tax = undefined;
		resolve(out.sortBy(['key', 'title', 'ID', 'relkey', 'reltitle', 'relID']));
	}),
};
