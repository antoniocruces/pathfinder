var schemacols = [
	/*
	"_cp__exh_curator|rtitle", 
	"_cp__exh_artwork_author|rtitle",
	*/

	"_cp__exh_curator|skey", 
	"_cp__peo_age|isalive", 
	"_cp__peo_age|yearsbin", 
	"_cp__peo_gender|gender",

	"_cp__exh_artwork_author|skey", 
	"_cp__peo_age|isalive", 
	"_cp__peo_age|yearsbin", 
	"_cp__peo_gender|gender",

	"exhibition|skey", 
	"_cp__exh_exhibition_access|string",
/*
	"tax_artwork_type|string"
*/
];

/*
d.schemacols = [
	"_cp__exh_curator|skey", 
	"_cp__peo_gender|gender", 
	"_cp__peo_age|yearsbin", 
	"_cp__exh_artwork_author|skey", 
	"_cp__peo_gender|gender", 
	"_cp__peo_age|isalive", 
	"_cp__peo_age|yearsbin"
];
*/

/*
dbq.singlemap(23805).then(res => {
	var baserkey = res.main[0].rkey;
	var sameonly = d.maptransformations['base'].sametyperels;
	console.log(baserkey, res['related'].filter(o => sameonly ? o.rkey === baserkey : true))
})
*/

var unfoldedlist = (cols, cid = 'schema-table-performance') => {
	let prepare = (obj, isrel, facet) => {
		let rkey = obj.rkey;
		let blacklist = new Set(['rtype']);
		let out = {};
		Object.keys(obj)
			.filter(o => !blacklist.has(o))
			.forEach(o => {
				let key = o === 'ID' ? `${o}` : `${rkey}|${o}`;
				let hasfacet = key.includes('|');
				if(hasfacet) {
					if(key.includes(`|${facet}`)) out[key] = obj[o];
				} else {
					out[key] = obj[o];
				}
			});
		out.ID = isrel ? obj.rid : out.ID;
		out.RID = obj.ID;
		
		rkey = blacklist = undefined;
		return out;
	};
	let clearobj = obj => {
		let mandatory = ['ID', 'RID'];
		let out = {};
		Object.keys(obj).forEach(o => {
			if(mandatory.concat(cols).includes(o)) out[o] = obj[o];
		});
		mandatory = undefined;
		return out;
	};
	let normalize = (obj, num) => {
		let out = {};
		Object.keys(obj).forEach(o => out[`${num}|${o}`] = obj[o]);
		return out;
	};
	let sanitize = obj => {
		let blacklist = ['ID', 'RID'];
		let whitelist = Object.keys(obj).filter(o => !blacklist.includes(o.split('|')[1]));
		let out = {};
		whitelist.forEach(o => out[o] = obj[o]);
		blacklist = whitelist = undefined;
		return out;
	};
	let flatten = (object, separator = '|') => {
		let isvalid = value => {
			if(!value) return false;
			let isarray  = Array.isArray(value);
			let isobject = Object.prototype.toString.call(value) === '[object Object]';
			let haskeys  = !!Object.keys(value).length;
			return !isarray && isobject && haskeys;
		};
		let walker = (child, path = []) => {
			return Object.assign({}, ...Object.keys(child).map(key => isvalid(child[key]) ? 
				walker(child[key], path.concat([key])) : 
				{ [path.concat([key]).join(separator)] : child[key] })
			);
		};
		return Object.assign({}, walker(object));
	};
	
	let fields = cols.map((o, i) => ({
		fid: i,
		field: o.split('|')[0], 
		facet: o.split('|')[1],
		isrel: d.relatives.includes(o.split('|')[0]),
		ispos: d.record_types.includes(o.split('|')[0]),
		istax: d.taxonomies.includes(o.split('|')[0]),
		result: [],
	}));
		
	let result = [];
	
	if(cols.length) {
		let list = [];
		let setfil = new Set();
		let ages = [];
		let queue = {
			leap0: () => {
				console.time('leap_0');
				setfil = new Set(dbe._filterids());
				ages = dbm.ages(false);
				console.timeEnd('leap_0');
			},
			leap1: () => { 
				console.time('leap_1');
				list = [].concat(
					dbe._mutate(Object.values(d.store.pos).flatten()), 
					dbe._mutate(Object.values(d.store.met).flatten()),  
					dbe._mutate(Object.values(d.store.tax).flatten()),
					dbe._mutate(ages).flatten()
				).filter(o => setfil.has(o.ID));
				console.timeEnd('leap_1');
			},
			leap2: () => {
				console.time('leap_2');
				fields.forEach(f => {
					let tmp = list.filter(o => o.rkey === f.field).map(o => prepare(o, f.isrel, f.facet));
					let ids = dbe.hashtable(tmp, 'ID');
					let rids = dbe.hashtable(tmp, 'RID');
					if(f.fid === 0) {
						f.result = tmp.slice();
					} else {
						let prev = fields[f.fid - 1].result;
						let previsrel = fields[f.fid - 1].isrel;
						prev.forEach(o => {
							let cids = f.ispos ? 
								objectunique([].concat(ids[o.RID] || [])) : 
								objectunique([].concat(rids[o.ID] || [], rids[o.RID] || []));
							cids.forEach(r => {
								if(f.ispos) {
									f.result.push(r);
								} else {
									f.result.push(Object.assign({}, r, {RID: o.RID}));
								}
							});
						});
					}
				});
				console.timeEnd('leap_2');
			},
			leap3: () => {
				console.time('leap_3');
				fields.forEach(f => {
					if(f.fid === 0) {
						result = f.result.map(o => normalize(o, f.fid));
					} else {
						let last = f.fid - 1;
						let tmp = [];
						result.forEach(o => {
							let iset = new Set([o[`${last}|ID`]]);
							let rset = new Set([o[`${last}|RID`]]);
							if(f.ispos) {
								objectunique(f.result.filter(r => rset.has(r.RID)))
									.forEach(r => tmp.push(Object.assign({}, o, normalize(r, f.fid))));
							} else {
								objectunique(f.result.filter(r => rset.has(r.RID)))
									.filter(r => !f.isrel ? iset.has(r.ID) : true)
									.forEach(r => tmp.push(Object.assign({}, o, normalize(r, f.fid))));
							}
							iset = rset = undefined;
						});
						result = objectunique(tmp.slice());
						last = tmp = undefined;
					}
				});
				console.timeEnd('leap_3');
			},
			leap4: () => {
				setfil = ages = list = undefined;
			},
		};
		Object.keys(queue).forEach((o, i) => {
			queue[o].call();
		});
	}
	
	result = result.map(o => sanitize(o));
	
	let out = [];
	if(result.length) {
		let outcols = Object.keys(result[0]);
		out = Object.entries(flatten(result.countByMultiple(outcols))).map(o => {
			let obj = {};
			let values = o[0].split('|');
			outcols.forEach((k, i) => obj[k] = c(values[i]));
			obj.count = o[1];
			values = undefined;
			return obj;
		});
	}
	
	prepare = clearobj = normalize = undefined;
	flatten = queue = fields = undefined;
	
	return out;
};

var list = unfoldedlist(schemacols);

