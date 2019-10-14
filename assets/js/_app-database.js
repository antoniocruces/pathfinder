'use strict';

/* global AppError, byId, c, charts, d, equijoin, fc, fetchtextasync, filteruuid, Graph, gscreen, isBlank, isJSON, isNil, isNumber, isObject, isVisible, joinobjects, k, l, maphelpers, memoize, objectflatten, pick, Record, Relative, sortobjectbykey, sleep, Stats, stats, toolkit */
/* eslint no-confusing-arrow: ["error", {"allowParens": true}] */
/* exported dbb, dbe, dbq, dbs */
/* eslint-env es6 */

// database engine functions
const dbe = {
	_operation: (operation, a, b) => {
		operation = isBlank(operation) ? 'li' : operation;
		const operators = {
			eq: (a, b) => a === b,
			ne: (a, b) => a !== b,
			gt: (a, b) => a > b,
			ge: (a, b) => a >= b,
			lt: (a, b) => a < b,
			le: (a, b) => a <= b,
			li: (a, b) => dbe._roundtrip(a, b),
			nl: (a, b) => !dbe._operation('li', a, b),
			bt: (a, b) => dbe._operation('ge', a, dbe._divide(b, 0)) && dbe._operation('le', a, dbe._divide(b, 1)),
			nu: a => isBlank(a),
			nn: a => !dbe._operation('nu', a, null),
		};
		return operators[operation](a, b);
	},

	_roundtrip: (a, b) => {
		let arr = b.split(window.settings.roundtripsep);
		let res = false;
		arr.forEach(val => {
			if(dbe._normalize(a).includes(dbe._normalize(val))) res = true;
		});
		return res;
	},
	
	_finder: {
		both: (a, b, id = 'ID') => a.filter(
			(set => xa => true === set.has(xa[id]))(new Set(b.map(xb => xb[id])))
		),
		first: (a, b, id = 'ID') => a.filter(
			(set => xa => false === set.has(xa[id]))(new Set(b.map(xb => xb[id])))
		),
		second: (b, a, id = 'ID') => a.filter(
			(set => xa => false === set.has(xa[id]))(new Set(b.map(xb => xb[id])))
		),
	},

	_filterids: () => !d.filterrefine ? d.filterids : d.filterids.filter(o => d.filterrefine.has(o)),

	_filtered: () => !d.filterrefine ? d.filtered : dbe._filterids().length,
	
	_normalize: val => String(val).na().toLowerCase(),
	
	_divide: (val, pos) => String(val).split('/')[pos] || null,
	
	_ohash: txt => btoa(txt),

	_deploy: (key, val) => {
		if(k.dates.includes(key)) return String(val).dateparts(key);
		if(d.places.includes(key)) return String(val).places(key);
		if(d.uris.includes(key)) return String(val).hosts(key);
		if(d.points.includes(key)) return String(val).points(key);
		if(d.relatives.includes(key)) return String(val).relations(key);
		if(d.ages.includes(key)) return Number(val).ages(key).value; 
		if(d.genders.includes(key)) return String(val).gender(key);
		return String(val).string(key);
	},

	_fieldname: (key) => {
		if(k.dates.includes(key)) return Object.keys(String(null).dateparts(key)).map(o => key + '|' + o);
		if(d.places.includes(key)) return Object.keys(String(null).places(key)).map(o => key + '|' + o);
		if(d.uris.includes(key)) return Object.keys(String(null).hosts(key)).map(o => key + '|' + o);
		if(d.points.includes(key)) return Object.keys(String(null).points(key)).map(o => key + '|' + o);
		if(d.relatives.includes(key)) return Object.keys(String(null).relations(key)).map(o => key + '|' + o);
		if(d.ages.includes(key)) return Object.keys(Number(null).ages(key)).map(o => key + '|' + o);
		if(d.genders.includes(key)) return Object.keys(String(null).gender(key)).map(o => key + '|' + o);
		return Object.keys(String(null).string()).map(o => key + '|' + o);
	},

	_mutate: (array, astree = false) => {
		let out;
		if(Array.isArray(array)) {
			out = array.map(o => Object.assign({}, o, dbe._deploy(o.rkey, o.value)));
		} else {
			out = Object.assign({}, array, dbe._deploy(array.rkey, array.value));
		}
		return astree ? (Array.isArray(array) ? dbe.hashrecord(out, 'ID') : out) : out; 
	},
	
	_validyear: sdate => {
		let year = String(sdate).dateparts().year;
		if(!year) return false;
		if(isNaN(year)) return false;
		return (year - d.yeardatelimits[0]) * (year - d.yeardatelimits[1]) < 0;
	},
	
	_modify: (modifier, val) => {
		modifier = isBlank(modifier) ? 'string' : modifier;
		const modifiers = {
			century: val => String(val).dateparts().century,
			romancentury: val => String(val).dateparts().romancentury,
			decade: val => String(val).dateparts().decade,
			year: val => String(val).dateparts().year,
			month: val => String(val).dateparts().month,
			monthname: val => String(val).dateparts().monthname,
			day: val => String(val).dateparts().day,
			town: val => String(val).places().town,
			region: val => String(val).places().region,
			country: val => String(val).places().country,
			host: val => String(val).hosts().hostname,
			xyears: val => Number(val).ages().years,
			xyearsbin: val => Number(val).ages().yearsbin,
			xmonths: val => Number(val).ages().months,
			xweeks: val => Number(val).ages().weeks,
			xdays: val => Number(val).ages().days,
			years: val => val.years,
			yearsbin: val => val.yearsbin,
			months: val => val.months,
			weeks: val => val.weeks,
			days: val => val.days,
			isalive: val => val.isalive,
			longitude: val => String(val).points().latitude,
			latitude: val => String(val).points().longitude,
			rid: val => String(val).relations().rid,
			rtitle: val => String(val).relations().rtitle,
			gender: val => String(val).gender().gender,
			number: val => Number(val),
			string: val => String(val),
		};
		return modifiers[modifier](val);		
	},

	_difference: (a, b) => Array.from(new Set([...a].filter(x => !b.includes(x)))),	
	_setdifference: (a, b) => new Set([...a].filter(x => !b.has(x))),
	
	_comparable: val => d.relatives.includes(val.rkey) ? String(val.value).relations().rtitle : String(val.value),

	_objectkeysmap: (items, applyFunction) => {
		let item;
		for (let key in items) {
			if(items.hasOwnProperty(key)) {
				item = items[key];
				if (item && Array.isArray(item) || (
					typeof item === 'object' && 
					item && 
					item.toString() === '[object Object]' 
				)) {
					items[applyFunction(key)] = dbe._objectkeysmap(item, applyFunction);
				} else {
					items[applyFunction(key)] = item;
				}
				if (applyFunction(key) !== key) delete items[key];
			}
		}
		item = undefined;
		return items;
	},

	_updatearray: (arr, val) => { if(!arr.includes(val)) arr.push(val); },
	
	_assignpos: obj => {
		if(!isObject(obj)) return obj;
		if(!obj.ID) return obj;
		if(!d.store[obj.ID]) return obj;
		return Object.assign({}, obj, {ptype: d.store[obj.ID].rkey, color: d.store[obj.ID].color});
	},
	
	_cartesian: (...arrays) => [...arrays].reduce((a, b) => a.map(x => b.map(y => x.concat(y))).reduce((a, b) => a.concat(b), []), [[]]),
	
	hashrecord: (col, cid) => col.reduce((acc, rec) => {
		if(!acc[rec[cid]]) acc[rec[cid]] = {};
		acc[rec[cid]] = rec;
		return acc;
	}, {}),

	hashtable: (col, cid) => col.reduce((acc, rec) => {
		if(!acc[rec[cid]]) acc[rec[cid]] = [];
		acc[rec[cid]].push(rec);
		return acc;
	}, {}),

	arraycolumnsum: array => {
		let add = (x, y) => !isNaN(x) && !isNaN(y) ? x + y : 0;
		let sum = xs => xs.reduce(add, 0);
		let head = ([x, ...xs]) => { xs = undefined; return x; };
		let tail = ([x, ...xs]) => { x = undefined; return xs; };
		
		let transpose = ([xs, ...xxs]) => {
			let aux = ([x, ...xs]) =>
				x === undefined ? 
					transpose(xxs) : 
					[[x, ...xxs.map(head)], ...transpose([xs, ...xxs.map(tail)])];
			return xs === undefined ? [] : aux(xs);
		};
		return transpose(array).map(sum);
	},

	fastpivot: arr => {
		// as seen at https://github.com/techslides/FastPivot but slightly modified to include array as value
		let obj = {};
		if (typeof arr !== 'string' && arr.length > 0) {
			let thekeys = Object.keys(arr[0]);
			let temp = {};
			thekeys.forEach(function(f) {
				temp[f] = {};
				temp[f]._labels = [];
				temp[f]._labelsdata = [];
				temp[f]._data = {};
			});
			arr.forEach(f => {
				thekeys.forEach(a => {
					let value = f[a];
					if(Array.isArray(value)) {
						value.forEach(r => {
							temp[a]._data[r] = (temp[a]._data[r] || 0) + 1;
							temp[a]._labels[r] = null;
						});
					} else {
						temp[a]._data[value] = (temp[a]._data[value] || 0) + 1;
						temp[a]._labels[value] = null;
					}
					value = undefined;
				});
			});
			thekeys.forEach(f => {
				for(let i in temp[f]._data) {
					if(temp[f]._data.hasOwnProperty(i)) {
						temp[f]._labelsdata.push(temp[f]._data[i]);
					}
				}
				temp[f]._labels = Object.keys(temp[f]._labels);
			});
			obj = temp;
			thekeys = temp = undefined;
		}
		return obj;
	},
	
	parsequery: terms => {
		let tokens = [...k.keys, ...d.operators, ...d.modifiers].map(o => c(o));
		let tags = [];
		let val = '';
		let finds = terms.match(/"(.*?)"/);
		if(finds && finds.length > 0) {
			let vals = finds.map(x => String(x).replace('"', '').replace('"', '').trim());
			if(vals.length > 0) val = vals[0];
			let cleanterms = terms.replace(/"([^"]+)"/g, '');
			let ttags = cleanterms.split('@').map(o => String(o).trim());
			if(ttags.length > 0) {
				ttags.forEach(t => {
					t = t.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
					let vtags = toolkit.fuzzymatch(t, tokens);
					if(vtags.length > 0) tags.push(vtags[0]);
					vtags = undefined;
				});
			}
			vals = cleanterms = ttags = undefined;
		}
		tokens = finds = undefined;
		return {isok: val !== '', value: val, validtags: tags};
	},

	gettipfromrkey: rkey => rkey.substr(0, 1) === '_' ? rkey.substr(5, 3) : 'tax',
	getnamefromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.name)[0],
	gettipfromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.tip)[0],
	getslugfromtip: tip => d.post_types.filter(o => o.tip === tip).map(o => o.slug)[0],
	getcolorfromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.color)[0],
	getbcolorfromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.bcolor)[0],
	getshapefromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.shape)[0],
	getradiusfromslug: slug => d.post_types.filter(o => o.slug === slug).map(o => o.radius)[0],
	getcolorfromtip: tip => d.post_types.filter(o => o.tip === tip).map(o => o.color)[0],
	getbcolorfromtip: tip => d.post_types.filter(o => o.tip === tip).map(o => o.bcolor)[0],
	getposbyid: cid => (cid && !isNaN(cid)) ? d.store.pos[cid] : null,
	gettitlefromid: cid => dbe.getposbyid(cid) ? toolkit.titleformat(dbe.getposbyid(cid).value) : toolkit.titleformat(''),
	gettabletypefromrkey: rkey => rkey.gettabletype(),
	
	getkeysfromarray: arr => {
		let out = [];
		arr.forEach(o => {
			Object.keys(o).forEach(x => {
				if(!out.includes(x)) out.push(x);
			});
		});
		return out.unique();
	},
	
	datafileinfo: function(shorten = false) {
		let out = [];
		if(dbe.verifytables()) {
			if(shorten) {
				out = [
					d.file.name,
					d.file.size.toLocaleString(l) + 'B',
					d.credentials.ctime,
				];
			} else {				
				out = [
					c`name` + ': ' + d.file.name,
					c`size` + ': ' + d.file.size.toLocaleString(l) + 'B',
					c`user-name` + ': ' + d.credentials.cuser,
					c`date` + ': ' + d.credentials.ctime,
					c`ipaddress` + ': ' + d.credentials.caddr,
					c`object-size` + ': ' + dbe.dbsize().toLocaleString(l) + 'B', 
				];
			}
		} else {
			out = [c`no-data`.uf()]; 
		}
		return out.join('; ');
	},
	
	tablesinfo: function() {
		if(dbe.verifytables()) {
			return [
				c`pos` + ': ' + Number(d.poslength).toLocaleString(l),
				c`met` + ': ' + Number(d.metlength).toLocaleString(l),
				c`tax` + ': ' + Number(d.taxlength).toLocaleString(l),
				c`total-data` + ': ' + (Number(d.poslength) + Number(d.metlength) + Number(d.taxlength)).toLocaleString(l)
			].join('; ');
		} else {
			return c`no-data`.uf(); 
		}
	},
	
	dbsize: () => JSON.stringify(d.store || {}).length,
	
	datalength: () => Object.keys(d.store.pos || {}).length + 
		Object.keys(d.store.met || {}).length + 
		Object.keys(d.store.tax || {}).length,

	verifytables: () => !isBlank(d.store.pos) && !isBlank(d.store.met) && !isBlank(d.store.tax),

	_documents: (astree = false, filtered = false) => { 
		if(filtered) {
			let tmp = dbe._filterids();
			return astree ? 
				pick(d.store.pos, tmp) : 
				Object.values(d.store.pos).filter(o => tmp.includes(o.ID)); 
		} else {
			return astree ? 
				d.store.pos : 
				Object.values(d.store.pos);
		}
	},

	_mutated: (astree = false, filtered = true) => {
		let blacklist = ['ID', 'rtype', 'value', 'rkey'];
		let doc = dbm.documents(false, filtered).map(o => ({ID: o.ID}));
		let mut = dbe._mutate(Object.values(dbm.metadata(true, false)).flatten(), false);
		let tax = dbe._mutate(Object.values(dbm.taxonomies(true, false)).flatten(), false);
		let met = [
			...mut,
			...tax,
			...dbm.ages(false, filtered).map(o => Object.assign({}, o, o.value)), 
		].filter(o => d.store.pos[o.ID] !== undefined).map(o => {			
			let obj = {
				ID: o.ID,
				ptype: d.store.pos[o.ID].rkey, 
				color: d.store.pos[o.ID].color,
				title: toolkit.titleformat(d.store.pos[o.ID].value)
			};
			obj[obj.ptype + '|string'] = obj.title;
			obj[obj.ptype + '_type|string'] = obj.ptype;
			let key = o.rkey;
			Object.keys(o).filter(k => !blacklist.includes(k)).forEach(k => {
				obj[key + '|' + k] = o[k];
			});
			return obj;
		});
		let out = joinobjects(doc, met);
		blacklist = doc = mut = met = tax = undefined;
		return astree ? dbe.hashrecord(out, 'ID') : out; 
	},

	_metadata: (astree = false, filtered = false) => {
		if(filtered) {
			let tmp = dbe._filterids();
			return astree ? 
				pick(d.store.met, tmp) : 
				Object.values(pick(d.store.met, tmp)).flatten(); 
		} else {
			return astree ? 
				d.store.met : 
				Object.values(d.store.met).flatten();
		}
	},

	_features: (astree = false, filtered = false) => {
		let prepare = obj => {
			let rkey = obj.rkey;
			let blacklist = new Set(['rtype']);
			let out = {};
			Object.keys(obj)
				.filter(o => !blacklist.has(o))
				.forEach(o => out[o === 'ID' ? o : rkey + '|' + o] = obj[o]);
			out.RID = out.ID;
			rkey = blacklist = undefined;
			return out;
		};
		let ages = dbm.ages(false);
		let baseset = new Set(k.metadata);
		let baseres = [].concat(
			dbe._mutate(Object.values(d.store.met).flatten().filter(o => baseset.has(o.rkey))),  
			dbe._mutate(Object.values(d.store.tax).flatten().filter(o => baseset.has(o.rkey))),
			dbe._mutate(ages.filter(o => baseset.has(o.rkey)))
		).map(o => prepare(o));
		prepare = ages = baseset = undefined;
		if(filtered) {
			let tmp = dbe._filterids();
			return astree ? 
				dbe.hashtable(pick(baseres, tmp), 'ID') : 
				Object.values(pick(baseres, tmp)).flatten(); 
		} else {
			return astree ? 
				dbe.hashtable(baseres, 'ID') : 
				Object.values(baseres).flatten();
		}
	},

	_taxonomies: (astree = false, filtered = false) => {
		let tax = d.store.tax; 
		if(filtered) {
			let tmp = dbe._filterids();
			return astree ? 
				pick(tax, tmp) : 
				Object.values(pick(tax, tmp)).flatten(); 
		} else {
			return astree ? 
				tax : 
				Object.values(tax).flatten();
		}
	},

	_relations: (astree = false, filtered = false) => {
		let ids = new Set(Object.keys(d.store.pos).map(o => Number(o)));
		let fil = new Set(dbe._filterids());
		let rel = [
			...Object.values(d.store.met).flatten()
				.filter(o => d.relatives.includes(o.rkey))
				.map(o => ({ID: o.ID, bound: '>', rkey: o.rkey, RID: o.value.relations().rid}))
				.filter(o => ids.has(o.ID) && ids.has(o.RID)),
			...Object.values(d.store.met).flatten()
				.filter(o => d.relatives.includes(o.rkey))
				.map(o => ({ID: o.value.relations().rid, bound: '<', rkey: o.rkey, RID: o.ID}))
				.filter(o => ids.has(o.ID) && ids.has(o.RID))
		].filter(o => filtered ? fil.has(o.ID) : true);
		ids = fil = undefined;
		return astree ? dbe.hashtable(rel, 'ID') : rel; 
	},

	_points: (astree = true, filtered = false, formatted = false) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.points.includes(o.rkey))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, String(o.value).points()): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.points.includes(o.rkey))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, String(o.value).points()): o);
	},

	_places: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.places.includes(o.rkey))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, String(o.value).places()): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.places.includes(o.rkey))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, String(o.value).places()): o);
	},

	_startdates: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.startdates.includes(o.rkey) && dbe._validyear(o.value))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, String(o.value).dateparts()): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.startdates.includes(o.rkey) && dbe._validyear(o.value))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, String(o.value).dateparts()): o);
	},

	_enddates: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.enddates.includes(o.rkey) && dbe._validyear(o.value))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, String(o.value).dateparts()): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.enddates.includes(o.rkey) && dbe._validyear(o.value))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, String(o.value).dateparts()): o);
	},

	_genders: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.genders.includes(o.rkey))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, dbe._deploy(o.rkey, o.value)): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.genders.includes(o.rkey))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, dbe._deploy(o.rkey, o.value)): o);
	},

	_ownership: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.tax, tmp) : d.store.tax;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.ownership.includes(o.rkey))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, dbe._deploy(o.rkey, o.value)): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.ownership.includes(o.rkey))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, dbe._deploy(o.rkey, o.value)): o);
	},
	
	_ages: (astree = true, filtered = false) => {
		let xmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, xmp) : d.store.met;
		xmp = undefined;
		let sta = dbm.startdates(false, filtered, false, toolkit.randomstring());
		let tmp = dbe.hashrecord(
			dbm.enddates(false, filtered, false, toolkit.randomstring()).map(o => ({ID: o.ID, value: Date.parse(o.value)})),
			'ID'
		);
		let currentyear = new Date().getFullYear();
		let forbidden = new Set(d.forbiddendates);
		let age = sta
			.map(o => {
				if(!forbidden.has(o.value)) {
					let ages = ((tmp[o.ID] ? tmp[o.ID].value : Date.now()) - Date.parse(o.value)).ages();
					let isalive = tmp[o.ID] === undefined;
					if(ages.years > -1 && ages.years < currentyear) {
						return {
							ID: o.ID, 
							rtype: 'met',
							rkey: o.rkey.substr(0, 9) + 'age', 
							color: d.store.pos[o.ID] ? d.store.pos[o.ID].color : null,
							years: ages.years || null,
							yearsbin: ages.yearsbin || null,
							months: ages.months || null,
							weeks: ages.weeks || null,
							days: ages.days || null,
							string: ages.string || null,
							number: ages.number || null,
							isalive: isalive ? c`dead` : c`alive`,
							value: ages
						};
					}
				}
			})
			.filter(o => o !== undefined)
			.filter(o => dbe.gettipfromrkey(o.rkey) === 'peo' ? (o.years >= 0 && o.years <= 105) : true);
		obj = sta = tmp = undefined;
		return astree ? dbe.hashrecord(age, 'ID') : age;
	},
	
	_hosts: (astree = true, filtered = false, formatted = true) => {
		let tmp = dbe._filterids();
		let obj = filtered ? pick(d.store.met, tmp) : d.store.met;
		tmp = undefined;
		return astree ? 
			dbe.hashrecord(
				Object.values(obj).flatten().filter(o => d.uris.includes(o.rkey))
					.filter(o => !isBlank(o.value))
					.map(o => formatted ? Object.assign({}, o, String(o.value).hosts()): o),
				'ID'
			) : 
			Object.values(obj).flatten().filter(o => d.uris.includes(o.rkey))
				.filter(o => !isBlank(o.value))
				.map(o => formatted ? Object.assign({}, o, String(o.value).hosts()): o);
	},

	_autogeolocation: (astree = true, filtered = false) => {
		let met = dbm.places(true, filtered, false, toolkit.randomstring());
		let pox = dbm.points(true, filtered, false, toolkit.randomstring());
		let poi = new Set(Object.keys(pox).map(o => Number(o)));
		let pla = new Set(Object.keys(met).map(o => Number(o)));
		let fil = new Set(dbe._filterids());
		let dif = [...dbe._setdifference(pla, poi)].filter(o => filtered ? fil.has(o) : true);
		let out = [];
		dif.forEach(o => {
			let pla = met[o] || null;
			let cou = null;
			let loc = null;
			if(isObject(pla)) {
				cou = String(pla.value).places().country;
				if(cou) {
					loc = k.isocountries.find(x => x[l].na().toLowerCase() === cou.na().toLowerCase()) || null;
					if(loc) {
						out.push({
							ID: o,
							rtype: d.store.pos[o].rtype,
							rkey: '_cp__' + dbe.gettipfromslug(d.store.pos[o].rkey) + '_coordinates',
							value: String(loc.lat) + ',' + String(loc.lon)
						});
					}
				}
			}
			pla = cou = loc = null;
		});
		met = pox = poi = pla = dif = fil = undefined;
		return astree ? dbe.hashrecord(out, 'ID') : out;
	},
	list: (filtered = false, regenerate = false) => regenerate ? [
		...dbm.documents(false, filtered, toolkit.randomstring()), 
		...Object.values(dbm.metadata(false, filtered, toolkit.randomstring())), 
		...Object.values(dbm.taxonomies(false, filtered, false, toolkit.randomstring())),
		...dbm.ages(false, filtered, toolkit.randomstring())
	] : [
		...dbm.documents(false, filtered), 
		...Object.values(dbm.metadata(false, filtered)), 
		...Object.values(dbm.taxonomies(false, filtered, false)),
		...dbm.ages(false, filtered)
	],
	
	tree: () => dbe.hashtable(dbe.list(), 'ID'),

	makegeojson: (data, simple = false) => {
		let geojson = {};
		geojson.type = 'FeatureCollection';
		geojson.features = [];
		let rels = dbm.relations(true);

		for (let k = 0, len = data.length; k < len; k++) {
			let rsize = rels[data[k].id || data[k].ID] ? rels[data[k].id || data[k].ID].length : 1;
			let rrange = maphelpers.clamprange(d.mapdataranges, rsize, 1, d.mapiconfeatures.size.micro);
			let newFeature = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: simple ? 
						[data[k].longitude, data[k].latitude] : 
						[data[k].destination_lon, data[k].destination_lat]
				},
				properties: {
					id: data[k].id || data[k].ID || null,
					title: data[k].title || null,
					color: data[k].color || null,
					shape: data[k].shape || null,
					radius: data[k].radius || null,
					origin_id: data[k].origin_id || null,
					origin_lat: data[k].origin_lat || null,
					origin_lon: data[k].origin_lon || null,
					destination_id: data[k].destination_id || null,
					destination_lat: data[k].destination_lat || null,
					destination_lon: data[k].destination_lon || null,
					latitude: data[k].latitude || null,
					longitude: data[k].longitude || null,
					rkey: data[k].rkey || null,
					year: data[k].year || null,
					size: rsize,
					range: rrange,
					gender: data[k].gender || null,
					ownership: data[k].ownership || null,
				},
			};
			geojson.features.push(newFeature);
			newFeature = rsize = rrange = undefined;
		}
		rels = undefined;
		return geojson;		
	},
};

// database executive functions
const dbx = {
	union: sets => {
		let x = new Set();
		sets.forEach(s => s.forEach(e => x.add(e)));
		return x;
	},
	intersection: sets => sets.reduce((a, b) => {
		let x = new Set();
		b.forEach((v => { 
			if(a.has(v)) x.add(v);
		}));
		return x;
	}),
	difference: (sets => sets.reduce(((a, b) => {
		let x = new Set(a);
		b.forEach(v => { 
			if(x.has(v)) x.delete(v);
		});
		return x;
	}))),	
	_union: (...sets) => {
		let x = new Set();
		sets.forEach(s => s.forEach(e => x.add(e)));
		return x;
	},
	_intersection: (...sets) => sets.reduce((a, b) => {
		let x = new Set();
		b.forEach((v => { 
			if(a.has(v)) x.add(v);
		}));
		return x;
	}),
	_difference: ((...sets) => sets.reduce(((a, b) => {
		let x = new Set(a);
		b.forEach(v => { 
			if(x.has(v)) x.delete(v);
		});
		return x;
	}))),	
};

// database build functions
const dbb = {
	setupstore: data => new Promise(resolve => {
		if(!data || data.length < 1) throw new AppError(c`invalid-data`);
		let validdate = o => !d.startdates.includes(o.rkey) || 
			(d.startdates.includes(o.rkey) && 
			String(o.value).isvalidyear());
		let colorize = o => Object.assign({}, o, {color: d.post_types.find(x => x.slug === o.rkey).color});
		
		d.store.pos = dbe.hashrecord(data.pos.map(o => colorize(o)), 'ID');
		d.store.met = dbe.hashtable(data.met, 'ID');
		d.store.tax = dbe.hashtable(data.tax.filter(o => d.taxonomies.includes(o.rkey)), 'ID');

		d.poslength = data.pos.length;
		d.metlength = data.met.length;
		d.taxlength = data.tax.length;

		d.filterids = Object.keys(d.store.pos).map(o => Number(o));
		d.filteruuid = filteruuid();
		d.datalength = dbe.datalength(); 
		
		data = validdate = colorize = undefined;
		resolve(true);
	}),
	setuphelpers: () => new Promise(resolve => {
		d.chains = dbe._relations(false).map(o => JSON.stringify({
			tin: d.store.pos[o.ID].rkey,
			link: o.rkey,
			bound: o.bound,
			tout: d.store.pos[o.RID].rkey
		})).unique().map(o => JSON.parse(o));

		window.storecurrentsize = toolkit.currentmemory();
		toolkit.showmemory('app-memory');
		resolve(true);
	}),
};

// memoized functions
const dbm = {
	documents: memoize(dbe._documents),
	mutated: memoize(dbe._mutated),
	metadata: memoize(dbe._metadata),
	taxonomies: memoize(dbe._taxonomies),
	relations: memoize(dbe._relations),
	points: memoize(dbe._points),
	places: memoize(dbe._places),
	startdates: memoize(dbe._startdates),
	enddates: memoize(dbe._enddates),
	genders: memoize(dbe._genders),
	ownership: memoize(dbe._ownership),
	ages: memoize(dbe._ages),
	hosts: memoize(dbe._hosts),
	autogeolocation: memoize(dbe._autogeolocation),
	features: memoize(dbe._features),
	list: memoize(dbe.list),
};

// database stats functions
const dbs = {
	stats: (array, includezsmap = true) => {
		let tmp = new Stats(array);
		return {
			max: tmp.max(),
			min: tmp.min(),
			meanabsolutedeviation: tmp.meanabsolutedeviation(),
			outliers: tmp.findoutliers().unique(),
			modes: tmp.modes(),
			range: tmp.range(),
			midrange: tmp.midrange(),
			q1: tmp.q1(),
			q3: tmp.q3(),
			iqr: tmp.iqr(),
			lowlimit: tmp.lowlimit(),
			highlimit: tmp.highlimit(),
			median: tmp.median(),
			mean: tmp.mean(),
			size: tmp.size(),
			sum: tmp.sum(),
			variance: tmp.variance(),
			standarddeviation: tmp.standarddeviation(),
			zscores: tmp.zscores(),
			zscoresmap: includezsmap ? tmp.zscoresmap() : null,
		};
	},
	count: (array, filter, facet) => sortobjectbykey(
		array
			.filter(o => isBlank(filter) ? true : o.rkey === filter)
			.filter(o => dbhelper.filterexclude(o.value) === false)
			.countByMultiple(['rkey', 'color', facet])
	),
	ages: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.ages(false, filtered, toolkit.randomstring()), filter, facet)),
	places: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.places(false, filtered, true, false, toolkit.randomstring()), filter, facet)),
	startdates: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.startdates(false, filtered, true, false, toolkit.randomstring()), filter, facet)),
	enddates: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.enddates(false, filtered, true, false, toolkit.randomstring()), filter, facet)),
	genders: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.genders(false, filtered, true, false, toolkit.randomstring()), filter, facet)),
	hosts: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.hosts(false, filtered, true, false, toolkit.randomstring()), filter, facet)),
	taxonomies: (filter, facet, filtered = true) => 
		objectflatten(dbs.count(dbm.taxonomies(false, filtered, true, toolkit.randomstring()), filter, facet)),
};

// database queries functions
const dbq = {
	clearfilter: (condition = null) => new Promise((resolve, reject) => {
		if(!d.store.pos) reject('no-data');
		d.filterids = Object.values(d.store.pos).sortBy(['rkey', 'value']).map(o => o.ID); 
		d.filteruuid = filteruuid();
		Object.keys(d.filtersubfilter).forEach(o => {
			d.filtersubfilter[o] = false;
		});
		d.filtermatches = {};
		d.filtersubrel = [];
		d.filtersublinks = [];
		d.filter = [];
		if(condition) d.filter.push(condition);
		d.filtered = d.filterids.length;
		// Stats data clear
		dbq.clearstats();
		resolve(d.filtered);
	}),
	clearstats: () => {
		d.schemarectype = null;
		d.schemacols = [];
		d.schemastrict = true;
		d.schemaoutliersonly = false;
		d.schemaresults = [];
		d.schemapivot = {cols: [], rows: [], result: [], visible: false};
		d.schemastats = [];
		d.schemaoutliers = [];
		d.schemarelevance = [];
		d.schemauuid = null;
		d.cooccurrencessource = '';
		d.cooccurrencestarget = '';
		d.cooccurrencesroute = [];
		d.cooccurrencesoutliersonly = false;
		d.cooccurrencesstats = [];
		d.cooccurrencesoutliers = [];
		d.cooccurrencesrelevance = [];
		d.cooccurrencesresults = [];
		d.cooccurrencesfeatures = [];
		d.cooccurrencesuuid = null;

		if(isVisible(byId('schema-listing'))) stats.schema();
		if(isVisible(byId('stats-charts'))) {
			charts.chart();
		}
		if(isVisible(byId('stats-network'))) {
			charts.relations();
		}
		
		window.storecurrentsize = toolkit.currentmemory();
		toolkit.showmemory('app-memory');
	},
	dbinfo: () => new Promise((resolve, reject) => {
		if(!dbe.verifytables()) reject(c`no-data`);
		resolve([...dbm.metadata(), ...dbm.taxonomies()].map(o => new Record(o)).countBy('key'));
	}),
	export: () => new Promise(resolve => {
		let tmp = [];
		let all = dbe.tree();
		let tmp2 = dbe._filterids();
		tmp2.forEach(i => all[i].forEach(o => tmp.push(o)));
		all = tmp2 = undefined;
		resolve(tmp
			.map(o => ({ID: o.ID, type: c(o.rtype), key: c(o.rkey), value: o.value}))
			.sortBy(['ID', 'key', 'value'])
		);
	}),
	filterinfo: (skey = 'key') => new Promise((resolve, reject) => {		
		if(!dbe.verifytables()) reject(c`no-data`);
		let doc = dbm.documents();
		let docs = doc.map(o => new Record(o)).countBy(skey); 
		let matches = [];
		let tmp = dbe._filterids();
		for(let i = tmp.length; i--;) {
			if(d.store.pos[tmp[i]]) matches.push(d.store.pos[tmp[i]]);
		}
		let tmatches = matches.map(o => new Record(o)).countBy(skey);
		Object.keys(docs).forEach(o => Object.assign(docs[o], {
			ids: tmatches[o] ? tmatches[o].count : 0
		}));
		doc = matches = tmatches = tmp = undefined;
		resolve(docs);
	}),
	filteraccounting: () => {
		let tmp = new Set(dbe._filterids());
		let obj = Object.values(d.store.pos).filter(o => tmp.has(o.ID)).countBy(['rkey']);
		tmp = undefined;
		return {
			records: Object.keys(obj).map(o => ({name: o, value: obj[o].count})),
			filtered: Math.round(
				(Object.values(obj).map(o => o.count).sum() / Object.keys(d.store.pos).length) * 100
			), 
		};	
	},
	search: (operator = null, modifier = null, val = null, key = null) => new Promise(resolve => {
		let rk = item => key ? key === item.rkey : true;
		let op = dbe._operation;
		let md = dbe._modify;
		let arr = dbe.list();
		let matches = [];
		let i;
		for(i = arr.length; i--;) {
			if(rk(arr[i]) && op(operator, md(modifier, arr[i].value), val)) matches.push(arr[i].ID);
		}
		i = arr = md = op = rk = undefined;
		resolve({results: matches.unique()});
	}),
	immediatesearch: (operator = null, modifier = null, val = null, key = null) => {
		let rk = item => key ? key === item.rkey : true;
		let op = dbe._operation;
		let md = dbe._modify;
		let arr = dbe.list();
		let matches = [];
		let i;
		for(i = arr.length; i--;) {
			if(rk(arr[i]) && op(operator, md(modifier, arr[i].value), val)) matches.push(arr[i].ID);
		}
		i = arr = md = op = rk = undefined;
		return {results: matches.unique()};
	},
	setfilter: () => new Promise((resolve, reject) => {
		try {
			d.filtermatches = {};
			d.post_types.filter(o => !['taxonomy', 'record'].includes(o.slug)).forEach(o => d.filtermatches[o.slug] = {});
			//let doc = dbm.documents().sortBy(['rkey', 'value']).map(o => o.ID);
			let trans = array => array.map(o => d.store.pos[o]);
			let ptype = nid => d.store.pos[nid].rkey;
			let simplify = obj => {
				let out = {};
					Object.keys(obj).forEach(o => {
						out[o] = out[o] || obj[o].size;
					});
				return out;
			};
			let classify = (array, key) => {
				let obj = {};
				array.forEach(o => {
					let tmp = trans(o).groupBy([key]);
					Object.keys(tmp).forEach(k => {
						obj[k] = obj[k] || {};
						obj[k].results = obj[k].results || [];
						obj[k].results.push(tmp[k].map(f => f.ID));
					});
					tmp = undefined;
				});
				
				Object.keys(obj).forEach(o => {
					obj[o].results = dbx.intersection(obj[o].results.map(r => new Set(r)));
					obj[o].matches = obj[o].matches || [];
				});
				Object.keys(obj).forEach(o => {
					obj[o].neighbors = obj[o].neighbors || {};
					obj[o].neighbors['>'] = group([relations.filter(f => f.bound === '>' && obj[o].results.has(f.ID)).map(f => f.RID)], 'rkey');
					obj[o].neighbors['<'] = group([relations.filter(f => f.bound === '<' && obj[o].results.has(f.ID)).map(f => f.RID)], 'rkey');
					d.filtermatches[o]['>'] = d.filtermatches[o]['>'] || simplify(obj[o].neighbors['>']);
					d.filtermatches[o]['<'] = d.filtermatches[o]['<'] || simplify(obj[o].neighbors['<']);
				});
				return obj;
			};
			let group = (array, key) => {
				let obj = {};
				array.forEach(o => {
					let tmp = trans(o).groupBy([key]);
					Object.keys(tmp).forEach(k => {
						obj[k] = obj[k] || [];
						obj[k].push(tmp[k].map(f => f.ID));
					});
					tmp = undefined;
				});
				Object.keys(obj).forEach(o => {
					obj[o] = dbx.intersection(obj[o].map(r => new Set(r)));
				});
				return obj;
			};
			
			let relations = dbm.relations(false);
			let filter = classify(d.filter.map(o => o.results), 'rkey');
			let subfilter = group([Object.keys(d.filtersubfilter)
				.filter(o => d.filtersubfilter[o])
				.map(o => relations.filter(f => ptype(f.ID) === o).map(f => f.ID).unique()).flatten()], 'rkey');
			Object.keys(filter).forEach(o => {
				let results = filter[o].results;
				let matches = filter[o].matches;
				let list = Object.keys(filter).filter(f => f !== o);
				let same = Object.keys(filter).filter(f => f === o);
				matches.push(results);
				list.forEach(lst => {
					let neighbors = filter[lst].neighbors;
					if(neighbors['>'][o]) {
						matches.push(dbx.intersection([results, neighbors['>'][o]]));
					}
					if(neighbors['<'][o]) {
						matches.push(dbx.intersection([results, neighbors['<'][o]]));
					}
					neighbors = undefined;
				});
				same.forEach(lst => {
					let neighbors = filter[lst].neighbors;
					if(neighbors['<'][o]) {
						matches.push(dbx.union([results, neighbors['<'][o]]));
					}
					neighbors = undefined;
				});
				results = matches = list = same = undefined;
			});
			
			let results = {};
			Object.keys(filter).forEach(o => {
				results[o] = results[o] || new Set();
				results[o] = dbx.intersection(filter[o].matches);
			});
			
			let result = Object.values(results).map(o => Array.from(o)).flatten();
			let submatches = [];
			
			Object.keys(subfilter).filter(o => o !== 'artwork').forEach(o => {
				let rsl = group([result], 'rkey');
				Object.keys(rsl).forEach(k => {
					let tmp = subfilter[o];
					if(rsl[k]) {
						let rset = rsl[k];
						submatches.push(
							relations.filter(f => 
								rset.has(f.ID) && tmp.has(f.RID) && (
									d.filtersublinks.length ? d.filtersublinks.includes(f.rkey) : true
								)
							).forEach(f => result.push(f.RID))
						);
						rset = undefined;
					}
					tmp = undefined;
				});
				rsl = undefined;
			});
			Object.keys(subfilter).filter(o => o === 'artwork').forEach(o => {
				let rsl = group([result], 'rkey');
				Object.keys(rsl).forEach(k => {
					let tmp = subfilter[o];
					if(rsl[k]) {
						let rset = rsl[k];
						submatches.push(
							relations.filter(f => 
								rset.has(f.ID) && tmp.has(f.RID) && (
									d.filtersublinks.length ? d.filtersublinks.includes(f.rkey) : true
								)
							).forEach(f => result.push(f.RID))
						);
						submatches.push(
							relations.filter(f => 
								rset.has(f.RID) && tmp.has(f.ID) && (
									d.filtersublinks.length ? d.filtersublinks.includes(f.rkey) : true
								)
							).forEach(f => result.push(f.ID))
						);
						rset = undefined;
					}
					tmp = undefined;
				});
				rsl = undefined;
			});
			
			result = result.unique();
			d.filterids = trans(result)
				.sortBy(['rkey', 'value'])
				.map(o => o.ID);
			d.filteruuid = filteruuid();
			
			d.filtered = d.filterids.length;
			d.filterrefine = null;
			
			// Stats clear
			dbq.clearstats();

			ptype = classify = simplify = group = undefined;
			subfilter = relations = filter = undefined;
			results = submatches = undefined;

			trans = undefined;
			resolve(d.filterids);
		} catch(err) {
			reject(err);
		}
	}),
	readytosetfilter: () => (d.filter.map(o => o.results).flatten().length > 0),
	
	listvalues: fid => new Promise(resolve => {
		let f = d.filter[fid];
		let rk = item => f.rkey ? f.rkey === item.rkey : true;
		let rv = item => !isBlank(f.value) ? op(f.operator, md(f.modifier, item.value), f.value) : true;
		let rs = item => {
			let arr = isObject(item) ? item : String(item).split(': ');
			return isObject(item) ? item : arr.length > 1 && !isNaN(arr[0]) ? String(item).relations().rtitle : String(item);
		};
		let op = dbe._operation;
		let md = dbe._modify;
		let arr = dbe.list();
		let matches = [];
		let i;
		for(i = arr.length; i--;) {
			if(rk(arr[i]) && rv(arr[i])) 
				matches.push(arr[i].value && isObject(arr[i].value) ? arr[i].value[f.modifier] : arr[i].value);
		}
		i = null;
		f = rv = rk = op = md = arr = undefined;
		resolve(matches.sort((a, b) => !isNaN(rs(a)) ? a - b : String(rs(a)).localeCompare(String(rs(b)))).unique());
	}),
	updatefiltercondition: (fid, elm) => {
		d.filter[fid][[...elm.classList].filter(o => o.includes('filter-'))[0].replace('filter-', '')] = elm.value;
	},
	updatesearchcondition: val => {
		d.filter[0].value = val || '';
	},
	singletimeline: cid => new Promise((resolve, reject) => {
		cid = parseInt(Number(cid), 10);
		let pos = d.store.pos[cid] || null;
		let tim = d.store.met[cid] || null;
		let relations = dbm.relations(true)[cid].slice(0) || null;
		let nodes = [];
		let main = {};
		if(pos && tim) {
			let selfstart = tim.find(o => d.startdates.includes(o.rkey));
			if(selfstart && !isNaN(Date.parse(selfstart.value))) {
				let dstart = selfstart.value;
				main.startyear = String(dstart).dateparts().year;
				main.category = pos.rkey;
				dstart = undefined;
			}
			if(Array.isArray(relations) && relations.length > 0) {
				let cat = relations.map(o => o.rkey).unique();
				let rel = relations.map(o => new Relative(o));
				rel.forEach(o => {
					let normalized = !isNaN(Date.parse(o.relstartstring)) ? 
						new Date(o.relstartstring).toISOString().slice(0, 10) : 
						null;
					if(isNumber(o.relstartyear) && normalized) {
						let ss = normalized ? normalized : null;						
						if(ss) {
							let color = dbe.getcolorfromslug(o.relrkey);
							let dss = String(ss).dateparts();
							let el = {
								id: o.RID, 
								name: toolkit.titleformat(o.reltitle),
								category: o.rkey, 
								color: color,
								start: String(ss),
								year: dss.year,
								month: dss.month,
								day: dss.day,
								weekday: new Date(ss).getDay()
							};
							nodes.push(el);
							el = color = dss = undefined;
						}
						ss = undefined;
					}
					normalized = undefined;
				});
				pos = tim = relations = rel = undefined;
				resolve({main: main, nodes: nodes, categories: cat});
			} else {
				pos = tim = relations = nodes = main = undefined;
				reject(null);
			}
			selfstart = undefined;
		} else {
			pos = tim = relations = nodes = main = undefined;
			reject(null);
		}
	}),		
	singlegeogram: cid => new Promise((resolve, reject) => {
		cid = parseInt(Number(cid), 10);
		let pos = d.store.pos[cid] || null;
		let rel = dbm.relations(true)[cid].slice(0) || null;
		let nodes = [];
		let main = {};
		if(pos && rel) {
			let places = dbm.places();
			let relations = rel.filter(o => places[o.RID]);
			if(places[cid]) {
				let pplace = places[cid].value;
				main.id = cid;
				main.town = pplace.places().town;
				main.region = pplace.places().region;
				main.country = pplace.places().country;
				pplace = undefined;
			}
			if(relations.length) {
				relations.forEach(o => {
					if(d.store.pos[o.RID]) {
						let eplace = places[o.RID].value;
						if(eplace) {
							let element = {
								id: o.RID, 
								name: toolkit.titleformat(d.store.pos[o.RID].value),
								category: d.store.pos[o.RID].rkey, 
								color: d.store.pos[o.RID].color,
								town: eplace.places().town,
								region: eplace.places().region,
								country: eplace.places().country
							};
							nodes.push(element);
							element = undefined;
						}
						eplace = undefined;
					}
				});
				pos = rel = places = relations = undefined;
				resolve({main: main, nodes: nodes});
			} else {
				pos = rel = places = relations = nodes = main = undefined;
				reject(null);
			}
		} else {
			pos = rel = nodes = main = undefined;
			reject(null);
		}
	}),		
	singletaxogram: cid => new Promise((resolve, reject) => {
		cid = parseInt(Number(cid), 10);
		let pos = d.store.pos[cid] || null;
		let rel = dbm.relations(true)[cid].slice(0) || null;
		let nodes = [];
		let taxes = [];
		if(pos && rel) {
			let taxonomies = dbm.taxonomies(true);
			if(rel.length) {
				rel.forEach(o => {
					if(d.store.pos[o.RID]) {
						let etaxonomy = taxonomies[o.RID];
						if(etaxonomy && etaxonomy.length) {
							etaxonomy.forEach(t => {
								let element = {
									id: o.RID, 
									name: toolkit.titleformat(d.store.pos[o.RID].value),
									category: d.store.pos[o.RID].rkey, 
									color: d.store.pos[o.RID].color,
									taxonomy: t.value || null,
									rkey: t.rkey || null
								};
								nodes.push(element);
								taxes.push(element.rkey);
								element = undefined;
							});
						}
						etaxonomy = undefined;
					}
				});
				pos = rel = taxonomies = undefined;
				resolve({nodes: nodes, taxonomies: taxes.unique()});
			} else {
				pos = rel = taxonomies = taxes = undefined;
				reject(null);
			}
		} else {
			pos = rel = taxes = undefined;
			reject(null);
		}
	}),	
	singlestats: (cid) => new Promise(resolve => {
		cid = parseInt(Number(cid), 10);
		let rll = dbm.relations(true);
		if(rll[cid]) {
			let rls = rll[cid].slice(0) || null;
			if(Array.isArray(rls) && rls.length > 0) {
				let rel = rls.map(o => new Relative(o));
				let rows = dbe.fastpivot(rel);  
				rll = rls = rel = undefined;
				resolve(rows);
			} else {
				rll = rls = undefined;
				resolve([]);
			}
		} else {
			rll = undefined;
			resolve([]);			
		}
	}),
	singlemap: cid => new Promise(resolve => {
		cid = parseInt(Number(cid), 10);
		let pos = d.store.pos[cid] || null;
		let rels = dbm.relations(true)[cid] || null;
		let rls = dbm.relations(true);
		let ppo = dbm.points(true)[cid] ? String(dbm.points(true)[cid].value).points() : null;
		if(pos) {
			let out = {main: [], related: [], neighbourhood: []};
			if(ppo) {
				out.main.push({
					id: cid,
					title: toolkit.titleformat(pos.value),
					color: dbe.getcolorfromslug(pos.rkey),
					bcolor: dbe.getbcolorfromslug(pos.rkey),
					shape: 'cross',
					radius: 16,
					origin_id: cid,
					origin_lat: ppo ? ppo.latitude : ppo, 
					origin_lon: ppo ? ppo.longitude : ppo,
					destination_id: cid,
					destination_lat: ppo ? ppo.latitude : ppo,
					destination_lon: ppo ? ppo.longitude : ppo,
					rkey: pos.rkey
				});
			}
			if(Array.isArray(rels) && rels.length > 0) {
				let rel = rels
					.map(o => ({origin: cid, relkey: o.rkey, destination: o.RID}))
					.uniqueby('destination');
				let nei = rels
					.filter(o => dbe.getposbyid(o.ID) && dbe.getposbyid(o.RID))
					.map(o => rls[o.RID])
					.flatten()
					.map(o => ({origin: o.ID, relkey: o.rkey, destination: o.RID}))
					.uniqueby('destination');
				let poi = dbm.points();
				
				for(let i = 0, len = rel.length; i < len; i++) {
					if(!isNil(rel[i].destination) && dbe.getposbyid(rel[i].destination)) {
						let origin_point = poi[rel[i].origin] ? 
							String(poi[rel[i].origin].value).points() : 
							d.nullpoint;
						let destination_point = poi[rel[i].destination] ? 
							String(poi[rel[i].destination].value).points() : 
							d.nullpoint;
						let color = d.store.pos[rel[i].destination].color;
						let title = dbe.gettitlefromid(rel[i].destination);
						let rkey = !isNil(rel[i]) ? d.store.pos[rel[i].destination].rkey : '';
						out.related.push({
							id: rel[i].destination,
							title: title,
							color: color,
							shape: 'square',
							radius: 8,
							origin_id: rel[i].origin,
							origin_lat: origin_point.latitude, 
							origin_lon: origin_point.longitude,
							destination_id: rel[i].destination,
							destination_lat: destination_point.latitude,
							destination_lon: destination_point.longitude,
							rkey: rkey,
							relkey: rel[i].relkey
						});
						origin_point = destination_point = color = title = rkey = undefined;
					}
				}
				for(let i = 0, len = nei.length; i < len; i++) {
					if(!isNil(nei[i].destination) && dbe.getposbyid(nei[i].destination)) {
						let origin_point = poi[nei[i].origin] ? 
							String(poi[nei[i].origin].value).points() : 
							d.nullpoint;
						let destination_point = poi[nei[i].destination] ? 
							String(poi[nei[i].destination].value).points() : 
							d.nullpoint;
						let color = d.store.pos[nei[i].destination] ? d.store.pos[nei[i].destination].color : '#000';
						let title = nei[i].destination ? dbe.gettitlefromid(nei[i].destination) : '';
						let rkey = !isNil(nei[i]) ? d.store.pos[nei[i].destination].rkey : '';
						out.neighbourhood.push({
							id: nei[i].destination,
							title: title,
							color: color,
							shape: 'circle',
							radius: 8,
							origin_id: nei[i].origin,
							origin_lat: origin_point.latitude, 
							origin_lon: origin_point.longitude,
							destination_id: nei[i].destination,
							destination_lat: destination_point.latitude,
							destination_lon: destination_point.longitude,
							rkey: rkey,
							relkey: nei[i].relkey
						});
						origin_point = destination_point = color = title = rkey = undefined;
					}
				}
				poi = rel = pos = rels = rls = ppo = undefined;
				resolve(out);
			} else {
				pos = rels = rls = ppo = undefined;
				resolve(out);
			}
		} else {
			pos = rels = rls = ppo = undefined;
			resolve({main: [], related: [], neighbourhood: []});
		}
	}),
	singlenetwork: () => new Promise((resolve) => {
		let rls = dbm.relations(false, false)
			.filter(o => d.store.pos[o.ID] && d.store.pos[o.RID])
			.map(o => Object.assign({}, o, {
				ptype: d.store.pos[o.ID].rkey,
				color: d.store.pos[o.ID].color,
				title: toolkit.titleformat(d.store.pos[o.ID].value),
				'rel|ptype': d.store.pos[o.RID].rkey,
				'rel|color': d.store.pos[o.RID].color,
				'rel|title': toolkit.titleformat(d.store.pos[o.RID].value)
			}));

		let rlt = dbe.hashtable(rls, 'ID');
		let rlc = rls.countBy('ID');
		let cat = rls.map(o => o.ptype).unique().sort();
		let bou = rls.map(o => o.bound).unique().sort();
		let nodes = [];
		let edges = [];
		Object.keys(rlt).forEach(o => {
			let obj = rlt[o];
			if(Array.isArray(obj) && obj.length) {
				nodes.push({
					id: obj[0].ID, 
					name: String(obj[0].title || '').shorten(50), 
					label: String(obj[0].title || '').shorten(50),
					category: obj[0].ptype, 
					color: obj[0].color, 
					symbolSize: rlc[obj[0].ID].count || 0,
					value: rlc[obj[0].ID].count || 0,
					x: 0, 
					y: 0,
				});
			}
			obj.forEach(r => {
				edges.push({
					bound: r.bound, 
					source: r.ID, 
					rkey: r.rkey, 
					target: r.RID, 
					value: rlc[obj[0].ID].count || 0
				});
			});
			obj = undefined;
		});
		let counts = edges.countBy('source');
		nodes.forEach(o => {
			Object.assign(o, {symbolSize: typeof counts[o.id] !== 'undefined' ? Number(counts[o.id].count) : 0});
		});
		edges.forEach(o => {
			Object.assign(o, {value: typeof counts[o.source] !== 'undefined' ? Number(counts[o.source].count) : 0});
		});
		rls = rlt = rlc = counts = undefined;
		resolve({
			nodes: nodes, 
			edges: [...new Set(edges)], 
			categories: cat, 
			bounds: bou
		});
	}),
	simplemap: () => new Promise((resolve) => {
		let points = dbe._points(false, true);
		let pointlist = [];
		points.forEach(poi => {
			if(poi.value && poi.value.includes(',')) {
				let lat = Number(poi.value.split(',')[0].trim());
				let lon = Number(poi.value.split(',')[1].trim());
				let rec = d.store.pos[poi.ID] || null;
				if(rec) {
					pointlist.push({
						id: poi.ID,
						title: toolkit.titleformat(rec.value),
						rkey: rec.rkey,
						color: dbe.getcolorfromslug(rec.rkey),
						latitude: lat,
						longitude: lon
					});
				}
				lat = lon = rec = undefined;
			}
		});
		points = undefined;
		resolve({points: pointlist});
	}),
	mappedpoints: () => {
		let points = dbm.points(false, true);
		let pointlist = [];
		points.forEach(poi => {
			if(poi.value && poi.value.includes(',')) {
				let lat = Number(poi.value.split(',')[0].trim());
				let lon = Number(poi.value.split(',')[1].trim());
				let rec = d.store.pos[poi.ID] || null;
				if(rec) {
					pointlist.push({
						id: poi.ID,
						title: toolkit.titleformat(rec.value),
						rkey: rec.rkey,
						color: dbe.getcolorfromslug(rec.rkey),
						shape: dbe.getshapefromslug(rec.rkey),
						radius: dbe.getradiusfromslug(rec.rkey),
						latitude: lat,
						longitude: lon
					});
				}
				lat = lon = rec = undefined;
			}
		});
		return pointlist;
	},

	globalnetwork: (ptype = '', rtype = '', relfield = '', bound = '>', singleid = null) => {
		let sourcefield = bound === '>' ? 'ID' : 'RID';
		let targetfield = bound === '>' ? 'RID' : 'ID';

		let filterrel = () => {
			let fil = new Set(dbe._filterids());
			let rll = dbe._relations(false, false);
			let fre = rll.filter(o => fil.has(o.ID) && fil.has(o.RID));
			let stages = {};
			stages.bound = fre.filter(o => o.bound === bound);
			stages.source = stages.bound.filter(o => !isBlank(ptype) ? d.store.pos[o.ID].rkey === ptype : true);
			stages.target = stages.source.filter(o => !isBlank(ptype) ? d.store.pos[o.RID].rkey === rtype : true);
			
			stages.excid = stages.target.filter(o => dbhelper.filterexclude(d.store.pos[o.ID].value) === false);
			stages.excrid = stages.excid.filter(o => dbhelper.filterexclude(d.store.pos[o.RID].value) === false);
			stages.single = stages.excrid.filter(o => 
				singleid ?
					dbe._operation('li', d.store.pos[o.ID].value, singleid) || dbe._operation('li', d.store.pos[o.RID].value, singleid) : 
					true
			);
			stages.rkey = stages.single.filter(o => !isBlank(relfield) ? o.rkey === relfield : true);
			let tmp = stages.rkey;
			fil = rll = fre = stages = undefined;
			return tmp;
		};
			
		let res = filterrel();
		let nodes = Object.entries([
			...res.map(o => ({id: o[sourcefield]})),
			...res.map(o => ({id: o[targetfield]})),
		].unique()
		.countBy('id'))
		.map(o => [Number(o[0]), o[1].count])
		.map(o => {
			let pos = d.store.pos[o[0]] || null;
			let count = o[1];
			return {
				id: o[0], 
				name: o[0],
				label: pos ? toolkit.titleformat(pos.value).shorten(50) : '',  
				value: count,
				color: pos ? pos.color : null,
				category: pos ? pos.rkey : null,
			};
		});
		let categories = nodes.map(o => ({name: o.category, color: dbe.getcolorfromslug(o.category)}));
		let edges = res.map(o => ({
			source: Number(o[sourcefield]), 
			target: Number(o[targetfield]), 
			rkey: o.rkey,
			value: 1,
			nvalue: 1
		})).unique();
		let rkeys = res.map(o => o.rkey).unique();

		sourcefield = targetfield = filterrel = res = undefined;
		return {
			nodes: nodes,
			bounds: [bound], 
			edges: edges,
			rkeys: rkeys,
			categories: categories
		};
	},
	cooccurrences: (rebuild = false, includenid = false) => {
		// RULES TO BUILD FINAL QUERY
		// if subset has bound as '>' link to next subset must have the form ID > RID
		// if subset has bound as '<' link to next subset must have the form RID > RID
		if(isBlank(d.cooccurrencessource) || isBlank(d.cooccurrencestarget)) {
			gscreen.siteoverlay(false);
			toolkit.timer('stats.cooccurrences');
			toolkit.statustext();
			return;
		}

		if(rebuild) dbhelper.routecalculate(rebuild);
		dbhelper.routeshow('cooccurrences-route', rebuild);
		
		let relations = dbe._relations(false, true);

		let tmpstore = [];
		let result = [];
		let fset = new Set(dbe._filterids());
		let isvalid = (a, b) => a.rkey === b.rkey && gtype(a.RID) === b.tin && gtype(a.ID) === b.tout;
		let gtype = nid => d.store.pos[nid].rkey;
		d.cooccurrencesroute.forEach((o, i) => {
			let tmp = relations.filter(f => isvalid(f, o)).map(f => {
				let obj = {};
				obj['L' + i + 'ID'] = f.ID;
				obj['L' + i + 'rkey'] = f.rkey;
				obj['L' + i + 'bound'] = f.bound;
				obj['L' + i + 'RID'] = f.RID;
				return obj;
			});
			tmpstore.push(tmp);
			tmp = undefined;
		});
		
		if(!tmpstore.length) return [];
		
		let tmparr = tmpstore[0].slice();
		for(let i = 0, len = tmparr.length; i < len; i++) {
			result.push(tmparr[i]);
		}
		tmparr = undefined;
		
		let bound = tmpstore[0][0].L0bound;
		for(let i = 1, len = tmpstore.length; i < len; i++) {
			let tmp = equijoin(
				result, 
				tmpstore[i], 
				bound === '>' ? `L${i - 1}ID` : `L${i - 1}RID`, 
				`L${i}RID`, 
				function(a, b) {
					return Object.assign({}, a, b);
				}
			);
			result = tmp;
			tmp = undefined;
			bound = tmpstore[i][0]['L' + i + 'bound'];
		}
		result = result.filter(o => o[`L0RID`] !== o[`L${d.cooccurrencesroute.length - 1}ID`]);
		result = result.map(o => {
			let tmp = {};
			d.cooccurrencesroute.forEach((r, i) => {
				if(i === 0) {
					if(r.showtin) {
						let tid = o.bound === '<' ? o[`L${i}ID`] : o[`L${i}RID`];
						tmp[d.store.pos[tid].rkey] = d.store.pos[tid].value;
						if(includenid) tmp[d.store.pos[tid].rkey + '_NID'] = tid;
						tid = undefined;
					} else {
						let tid = o.bound === '<' ? o[`L${i}RID`] : o[`L${i}ID`];
						tmp[d.store.pos[tid].rkey] = d.store.pos[tid].value;
						if(includenid) tmp[d.store.pos[tid].rkey + '_NID'] = tid;
						tid = undefined;
					}
				} else {
					if(r.showtout) tmp[o[`L${i}rkey`]] = o.bound === '<' ? 
						d.store.pos[o[`L${i}RID`]].value : 
						d.store.pos[o[`L${i}ID`]].value;
					if(includenid) {
						if(r.showtout) tmp[o[`L${i}rkey`] + '_NID'] = o.bound === '<' ? o[`L${i}RID`] : o[`L${i}ID`];
					}
				}
			});
			return tmp;
		});
		relations = fset = tmpstore = isvalid = gtype = tmparr = bound = undefined;
		return result;
	},
	sizechart: (ishome = true) => new Promise((resolve, reject) => {
		if(!ishome) {
			if(!dbe.verifytables()) {
				reject(new AppError(c`no-data`));
			}
			let tmpkeys = Object.values(d.store.pos).countBy(['rkey']);
			let tmpobj = {};
			Object.keys(tmpkeys).forEach(o => tmpobj[o] = tmpkeys[o].count);
			d.stackedchartslocal = dbhelper.calculatescale(tmpobj); 
			tmpkeys = tmpobj = undefined;
			resolve(d.stackedchartslocal);
		} else {
			fetchtextasync(`./assets/data/dbsize.php`).then(res => {
				let isok = isJSON(res);
				if(isok) {
					res = JSON.parse(res);
					d.stackedchartsremote = dbhelper.calculatescale(res);
					res = undefined; 
					resolve(d.stackedchartsremote);
				} else {
					fetchtextasync(`./assets/data/dirsize.php`).then(res => {
						let tmp = [];
						let types = d.appelements.map(n => n.name);
						let sizes = res.split(',').map(o => Number(o));
						let rmp = {};
						types.forEach((o, i) => rmp[o] = sizes[i]);
						d.stackedchartsremote = dbhelper.calculatescale(rmp);
						tmp = types = sizes = rmp = undefined;
						resolve(d.stackedchartsremote);
					})
					.catch(err => {
						d.stackedchartsremote = {};
						reject(c`fetc-async-error` + ': ' + err);
					});
				}
			})
			.catch(err => {
				d.stackedchartsremote = {};
				reject(c`fetc-async-error` + ': ' + err);
			});
		}
	}),	
};

const dbhelper = {
	addtoquery: (val, key, cid) => {
		let elm = byId(cid);
		d[key].push(val);
		elm.innerHTML = d[key].map(o => fc(o)).join(', ');
		elm = undefined;
	},
	filterexclude: txt => isBlank(d.filterexclude) ? false : d.filterexclude
		.split(';')
		.map(o => String(o).trim())
		.map(o => dbe._operation('li', txt, o))
		.filter(o => o)
		.length > 0,
	calculatescale: arr => {
		let names = Object.keys(arr);
		let counts = Object.values(arr);
		let scale = counts.scalebetween(100, 1000);
		let total = scale.sum();
		let sizes = scale.map(o => (o / total) * 100);
		let out = {};
		names.forEach((o, i) => {
			out[o] = {
				name: o, 
				shortname: !d.appelements.map(n => n.name).includes(o) ? 
					dbe.getnamefromslug(o) : 
					d.appelements.find(n => n.name === o).shortname, 
				count: counts[i],
				size: sizes[i],
				color: !d.appelements.map(n => n.name).includes(o) ? 
					dbe.getcolorfromslug(o) : 
					d.appelements.find(n => n.name === o).color
			};
		});
		names = counts = scale = total = sizes = undefined;
		return out;
	},
	routeshow: did => {
		gscreen.siteoverlay(true);
		let legend = `${did.split('-')[0]}-legend`;
		let rset = `${did.split('-')[0]}-routeset`;
		sleep(50).then(() => {
			if(isBlank(d.cooccurrencessource) || isBlank(d.cooccurrencestarget)) {
				byId(did).classList.remove('breadcrumbs');
				byId(legend).classList.add('hide');
				byId(rset).classList.add('hide');
				toolkit.msg(did, '');
				gscreen.siteoverlay(false);
				legend = rset = undefined;
				return;
			}
			dbhelper.routedraw(did);
			gscreen.siteoverlay(false);
			legend = undefined;
		});
	},
	routedraw: did => {
		let legend = `${did.split('-')[0]}-legend`;
		let rset1 = `${did.split('-')[0]}-routeset1`;
		let rset2 = `${did.split('-')[0]}-routeset2`;
		let tmp = [];

		d.cooccurrencesroute.forEach((o, i) => {
			let ctin = dbe.getbcolorfromslug(o.tin);
			let ctout = dbe.getbcolorfromslug(o.tout);
			let lastmargin = i === d.cooccurrencesroute.length - 1 ? '' : ' margin-right-xs';
			if(i === 0) {
				if(o.showtin) {
					tmp.push([
						`<a class="button button-square button-xs button-${ctin} margin-right-xs" `,
						`href="javascript:dbhelper.routeremove(${i}, 'tin');">`,
						`${dbe.getnamefromslug(o.tin).toUpperCase()}`,
						`</a>`,
					].join(''));
				}
			}
			if(o.showrkey) {
				tmp.push([
					`<button class="button button-light button-xs margin-right-xs" disabled>`,
					`${c(o.rkey)}`,
					`</button>`,
				].join(''));
			}
			if(o.showtout) {
				tmp.push([
					`<a class="button button-square button-xs button-${ctout}${lastmargin}" `,
					`href="javascript:dbhelper.routeremove(${i}, 'tout');">`,
					`${dbe.getnamefromslug(o.tout).toUpperCase()}`,
					`</a>`,
				].join(''));
			}
			
			ctin = ctout = lastmargin = undefined;
		});

		toolkit.msg(did, tmp.join(''));
		byId(legend).classList.remove('hide');
		byId(legend).classList.add('visible');
		byId(rset1).classList.remove('hide');
		byId(rset1).classList.add('visible');
		byId(rset2).classList.remove('hide');
		byId(rset2).classList.add('visible');
		toolkit.drawicons();
		legend = rset1 = rset2 = tmp = undefined;
	},
	routeremove: (index, item) => {
		d.cooccurrencesroute[index]['show' + item] = false;
		stats.cooccurrences(null, 1, null, '', 1, false, false);
	},
	routecalculate: (recalc = true) => {
		if(!recalc) return;
		if(isBlank(d.cooccurrencessource) || isBlank(d.cooccurrencestarget)) return;
		let relations = dbm.relations(false, true);
		let ptype = nid => dbe.getposbyid(nid).rkey;
		let g = new Graph();
		let keys = relations.map(o => `${ptype(o.ID)}|${o.rkey}|${ptype(o.RID)}`).unique();
		keys.forEach(v => {
			let rels = relations.filter(o => o.bound === '<' && `${ptype(o.ID)}|${o.rkey}|${ptype(o.RID)}` === v);
			let set = new Set(rels.map(o => o.RID));
			let tmp = relations.filter(o => set.has(o.ID));
			tmp
				.map(o => `${ptype(o.ID)}|${o.rkey}|${ptype(o.RID)}`)
				.unique()
				.forEach(o => { g.addedge(v, o); });
			rels = set = tmp = undefined;
		});
		let source = d.cooccurrencessource;
		let target = d.cooccurrencestarget;
		let path = g.shortestpath(source, target);
		if(!path) return;
		if(recalc) d.cooccurrencesroute = path.map(o => {
			let tmpobj = o.split('|');
			return {
				tin: tmpobj[0] || '', 
				rkey: tmpobj[1] || '', 
				tout: tmpobj[2] || '', 
				showtin: true,
				showrkey: true,
				showtout: true,
			};
		});
		relations = ptype = g = keys = source = target = path = undefined;
	},
	routedescription: () => {
		if(isBlank(d.cooccurrencessource) || isBlank(d.cooccurrencestarget)) return '';
		let tmp = [];
		let tsource = d.cooccurrencessource.split('|');
		let ttarget = d.cooccurrencestarget.split('|');
		tmp.push([
			`${c`cooccurrences`.uf()} ${c`between`} `,
			`${c(tsource[0])} ${c`as`} ${c(tsource[1])} `,
			`${c`and`} `,
			`${c(ttarget[2])} ${c`as`} ${c(ttarget[1])}`,
		].join(''));
		return tmp.join('');
	},
};
