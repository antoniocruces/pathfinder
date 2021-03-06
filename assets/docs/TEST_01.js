var schemacols = [
	"_cp__exh_curator|skey", 
	"_cp__peo_age|isalive", 
	"_cp__peo_age|yearsbin", 
	"_cp__peo_gender|gender",

	"_cp__exh_artwork_author|skey", 
	"_cp__peo_age|isalive", 
	"_cp__peo_age|yearsbin", 
	"_cp__peo_gender|gender",
/*
	"exhibition|string", 
	"_cp__exh_exhibition_access|string",
*/
	"tax_artwork_type|string"
];

var unfoldedlist = cols => {
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
		result: [],
		links: []
	}));
		
	let tree = {};
	let graph = new Graph();
	let result = [];
	
	if(cols.length) {
		let list = [];
		let setfil = new Set();
		let ages = [];
		let keys = new Set(fields.map(o => o.field));
		
		console.time('leap_0');
		setfil = new Set(dbe._filterids());
		ages = dbm.ages(false);
		console.timeEnd('leap_0');

		console.time('leap_1');
		list = objectunique([].concat(
			dbe._mutate(Object.values(d.store.pos).flatten()), 
			dbe._mutate(Object.values(d.store.met).flatten()),  
			dbe._mutate(Object.values(d.store.tax).flatten()),
			dbe._mutate(ages).flatten()
		).filter(o => setfil.has(o.ID)).filter(o => keys.has(o.rkey)));
		console.timeEnd('leap_1');

		console.time('leap_2');
		fields.forEach(f => {
			f.result = list
				.filter(o => o.rkey === f.field)
				.map(o => prepare(o, f.isrel, f.facet));
			f.result.forEach(o => {
				let obj = tree[o.ID] || {};
				tree[o.ID] = Object.assign({}, obj, removekey(o, 'RID'));
				obj = undefined;
			});			
		});		
		console.timeEnd('leap_2');

		console.time('leap_3');
		fields.forEach(f => {
			if(f.fid === 0) {
				f.result.forEach(o => {
					let idr = normalize(Object.assign({}, {RID: o.RID}, tree[o.ID]), f.fid);
					result.push(idr);
					idr = undefined;
				});
			} else {
				if((f.isrel || f.ispos) && result.length) {
					let last = Math.max.apply(null, Object.keys(result[0]).map(o => Number(o.split('|')[0])));
					let pid = `${last}|ID`;
					let prid = `${last}|RID`;
					let tmp = [];
					result.filter(o => o[pid] !== o[prid]).forEach(o => {
						f.result.filter(r => r.RID === o[prid]).forEach(r => {
							let idr = Object.assign({}, o, normalize(Object.assign({}, {RID: r.RID}, tree[r.ID]), f.fid));
							tmp.push(idr);
							idr = undefined;
						});
					});
					result = tmp.slice();
					pid = prid = tmp = undefined;
				}
			}
		});		
		console.timeEnd('leap_3');

		setfil = ages = list = undefined;
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
	flatten = undefined;
	
	//return out
	return {result: result, graph: graph, tree: tree, fields: fields};
};

var list = unfoldedlist(schemacols);
