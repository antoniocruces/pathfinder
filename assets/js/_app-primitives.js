'use strict';

/* global c, d, dbe, escape, fc, l, MapTree, Response, router, times, unescape */
/* exported arraymax, arraymin, byId, fetchasync, immutable, handleKey, isBlank, isEmptyData, isFunction, isIterable, isloaded, isNil, isNumber, isObject, isPrimitive, isVisible, loadstyles, memoize, objectsize, plural, removeAllEventListener, resourceisloaded, selectItem, sleep, sizeOf, sortobjectbykey, sortobjectbyvalue, getradiusfromsize, cosinesimilarity, joinobjects, equijoin,
leftjoin, objectunique, pick, setintersection, isDefined, isNumeric, isString, isJSON, removekey, arraygroup, cfetch, fetchtextasync, existsasync, cartesianproduct, syncsleep, waitforlib, similarity, callername, escapeqoutes, removeqoutes, filteruuid, cleartext */

// prototyping
Object.defineProperty(Number.prototype, 'toroman', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let num = this;
		let decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
		let roman = ['M', 'CM','D','CD','C', 'XC', 'L', 'XL', 'X','IX','V','IV','I'];
		let result = '';
		for(let i = 0, len = decimal.length; i <= len; i++) {
			while (num % decimal[i] < num) {     
				result += roman[i];
				num -= decimal[i];
			}
		}
		num = decimal = roman = undefined;
		return result;
	}
});

Object.defineProperty(Number.prototype, 'ages', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		return {
			years: Math.floor(this / 31536000000) || 0,
			yearsbin: ((Math.floor(this / 315360000000) || 0) * 10) + '-' + (((Math.floor(this / 315360000000) || 0) * 10) + 9),
			months: Math.floor(this / 2592000000) || 0,
			weeks: Math.floor(this / 604800000) || 0,
			days: Math.floor(this / 86400000) || 0,
			string: String(this),
			number: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null,
			isalive: c`no`,
		};
	}
});

Object.defineProperty(Number.prototype, 'clamp', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(min, max) {
		return Math.min(Math.max(this, min), max);
	}
});

Object.defineProperty(Number.prototype, 'between', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(min, max) {
		return this >= min && this <= max;
	}
});

Object.defineProperty(String.prototype, 'slugify', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let sstring = this;
		return sstring.replace(/[^0-9A-Z]/gi, '_');
	}
});

Object.defineProperty(String.prototype, 'relations', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		let arr = this.split(': ').map(e => e.toString().trim());
		let tit = (d.store.pos[Number(arr[0])] || {value: null}).value; 
		return {
			rid: Number(arr[0]) || null,
			rtitle: tit, /* String(arr[1]) || null, */
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'places', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		let arr = this.split(';').map(e => e.toString().trim());	
		return {
			town: arr.length > 1 ? (arr[0] || null) : null,
			region: arr[1] || null,
			country: (arr[2] || arr[0]) || null,
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'dateparts', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		let arr = this.split('-').map(e => e.toString().trim());	
		let decade = y => (Math.floor(y / 10) * 10) + '-' + ((Math.floor(y / 10) * 10) + 9);
		let century = y => Math.floor(y / 100) + 1;
		let romancentury = y => (Math.floor(y / 100) + 1).toroman();
		
		return {
			century: arr.length && !isNaN(arr[0]) ? century(parseInt(arr[0], 10)) : null,
			romancentury: arr.length && !isNaN(arr[0]) ? romancentury(parseInt(arr[0], 10)) : null,
			decade: arr.length && !isNaN(arr[0]) ? decade(parseInt(arr[0], 10)) : null,
			year: arr.length ? isNaN(arr[0]) ? null : parseInt(arr[0], 10) : null,
			month: arr.length > 1 ? isNaN(arr[1]) ? null : parseInt(arr[1], 10) : null,
			monthname: arr.length > 1 ? isNaN(arr[1]) ? null : times[l].month[parseInt(arr[1], 10) - 1] : null,
			day: arr.length > 2 ? isNaN(arr[2]) ? null : parseInt(arr[2], 10) : null,
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'hosts', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		let parser = document.createElement('a');
		parser.href = this;
		return {
			href: parser.href || null,
			hostname: parser.hostname || null,
			protocol: parser.protocol || null,
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'points', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		let arr = this.split(',').map(e => e.toString().trim());
		return {
			latitude: parseFloat(arr[0]) || null,
			longitude: parseFloat(arr[1]) || null,
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'isvalidyear', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let tyear = this.split('-')[0];
		let isvalid = Number(tyear) !== 0;
		tyear = undefined;
		return this.length > 3 && isvalid;
	}
});

Object.defineProperty(String.prototype, 'gender', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		return {
			gender: this,
			string: this,
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		}; 
	}
});

Object.defineProperty(String.prototype, 'string', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(key) {
		return {
			string: this, 
			rkey: key || null,
			skey: key !== undefined ? c(key) : null
		};
	}
});

Object.defineProperty(String.prototype, 'uf', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
});

Object.defineProperty(String.prototype, 'na', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		return this.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}
});

Object.defineProperty(String.prototype, 'shorten', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(n) {
		let out = (this.match(RegExp('.{' + n + '}\\S*')) || [this])[0];
		return out.length < this.length ? [out, '...'].join('') : out;
	}
});
		
Object.defineProperty(String.prototype, 'abbrev', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(n = 3) {
		return this.substr(0, n);
	}
});

Object.defineProperty(String.prototype, 'getposttype', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let pty = [];
		d.post_types.map(o => o.tip).forEach(o => { if(this.indexOf('__' + o + '_') > -1) pty.push(o); });
		return pty.join('');
	}
});

Object.defineProperty(String.prototype, 'gettabletype', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let isrelation = d.relatives.includes(this);
		let istaxonomy = d.taxonomies.includes(this);
		let ispost = d.record_types.includes(this);
		return (isrelation ? 'r' : istaxonomy ? 't' : ispost ? 'p' : 'm');
	}
});

Object.defineProperty(String.prototype, 'getrkeytype', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let iskey = this.includes('_cp__');
		let istax = this.includes('tax_');
		return iskey ? this.substr(5, 3) : istax ? 'tax' : dbe.gettipfromslug(this);
	}
});

Object.defineProperty(String.prototype, 'b64encode', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		return btoa(unescape(encodeURIComponent(this))); 
	}
});

Object.defineProperty(String.prototype, 'b64decode', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		return decodeURIComponent(escape(atob(this))); 
	}
});

Object.defineProperty(Array.prototype, 'groupBy', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(i, excludeundefined = false) {
		let array = this.slice();
		let groups = {};
		array.forEach(o => {
			let group = o[i];
			if(excludeundefined) {
				if(group) {
					groups[group] = groups[group] || [];
					groups[group].push(o);
				}
			} else {
				groups[group] = groups[group] || [];
				groups[group].push(o);
			}
			group = undefined;
		});
		return groups;
	}
});

Object.defineProperty(Array.prototype, 'groupByMultiple', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(values, excludeundefined = false) {
		let list = this.slice();
		if (!values.length) return list;
		let byFirst = list.groupBy(values[0], excludeundefined);
		let rest = values.slice(1);
		for (let prop in byFirst) {
			if(byFirst.hasOwnProperty(prop)) {
				byFirst[prop] = byFirst[prop].groupByMultiple(rest, excludeundefined);
			}
		}
		list = rest = undefined;
		return byFirst;
	}
});

Object.defineProperty(Array.prototype, 'countBy', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(prop) {
		return this.reduce(function(groups, item) {
			let val = item[prop];
			groups[val] = groups[val] || {count: 0};
			groups[val].count++;
			val = undefined;
			return groups;
		}, {});
	}
});

Object.defineProperty(Array.prototype, 'countByMultiple', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(values, excludeundefined = false) {
		let list = this.slice();
		if (!values.length) return list;
		let byFirst = list.groupBy(values[0], excludeundefined);
		let rest = values.slice(1);
		let isLast = rest.length === 0;
		for (let prop in byFirst) {
			if(byFirst.hasOwnProperty(prop)) {
				byFirst[prop] = isLast ? byFirst[prop].length : byFirst[prop].countByMultiple(rest, excludeundefined);
			}
		}
		list = rest = isLast = undefined;
		return byFirst;
	}
});

Object.defineProperty(Array.prototype, 'count', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		return this.reduce((acc, val) => {
			acc[val] = acc[val] === undefined ? 1 : acc[val] += 1;
			return acc;
		}, {});
	}
});

Object.defineProperty(Array.prototype, 'sortBy', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(attrs) {
		let predicates = attrs.map(pred => {
			let descending = pred.charAt(0) === '-' ? -1 : 1;
			pred = pred.replace(/^-/, '');
			return {
				getter: o => o[pred],
				descend: descending
			};
		});
		// schwartzian transform idiom implementation; 
		// see https://en.wikipedia.org/wiki/Schwartzian_transform; 
		// aka: "decorate-sort-undecorate"
		return this.map(item => ({
				src: item,
				compareValues: predicates.map(predicate => {
					if(isNumber(predicate.getter(item))) {
						return predicate.getter(item);
					} else {
						return c(String(predicate.getter(item))).toLowerCase().na();
					}
				})
			}
		)).sort((o1, o2) => {
			let i = -1;
			let result = 0;
			while (++i < predicates.length) {
				if (o1.compareValues[i] < o2.compareValues[i]) result = -1;
				if (o1.compareValues[i] > o2.compareValues[i]) result = 1;
				if ((result *= predicates[i].descend)) break;
			}
			i = undefined;
			return result;
		}).map(item => item.src);		
	}
});

Object.defineProperty(Array.prototype, 'sortlocale', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(field) {
		let array = this.slice();
		return array.sort((a, b) => fc(String(a[field])).localeCompare(fc(String(b[field]))));
	}
});

Object.defineProperty(Array.prototype, 'unique', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
	    return Array.from(new Set(this));
	}
});

Object.defineProperty(Array.prototype, 'uniqueby', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(predicate) {
		let cb = typeof predicate === 'function' ? predicate : o => o[predicate];
		return [...this.reduce((map, item) => {
			let key = cb(item);
			//map.has(key) || map.set(key, item);
			if(!map.has(key)) map.set(key, item);
			key = undefined;
			return map;
		}, new Map()).values()];
	}
});

Object.defineProperty(Array.prototype, 'flatten', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
	    return Array.prototype.flat ? this.flat(1) : Array.prototype.concat(...this);
	}
});

Object.defineProperty(Array.prototype, 'range', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(start, end) {
	    return Array.from({length: (end - start)}, (v, k) => k + start);
	}
});


Object.defineProperty(Array.prototype, 'gaussiansort', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(index = null) {
		let _a = this.slice();
		_a.sort((a, b) => index ? a[index] - b[index] : a - b);
		_a.reverse();
		let _out = [];
		for (let i = 0, l = _a.length; i < l; i++) {
			if(i % 2) {
				_out.push(_a[i]);
			} else { 
				_out.splice(0, 0, _a[i]);
			}
		}
		_a = undefined;
		return _out;
	}
});

Object.defineProperty(Array.prototype, 'quantile', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(quant) {
		if(quant < 0 || quant > 1) return false;
		let _a = this.slice();
		_a.sort((a, b) => a - b);
		return _a[Math.floor(_a.length * quant) - 1];
	}
});

Object.defineProperty(Array.prototype, '_intersection', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(...a) {
		return [this, ...a].reduce((p, c) => p.filter(e => c.includes(e)) || c);
	}
});

Object.defineProperty(Array.prototype, '_difference', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(...a) {
		return [this, ...a].reduce((p, c) => p.filter(e => !c.includes(e)));
	}
});

Object.defineProperty(Array.prototype, '_union', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(...a) {
		return [this, ...a].reduce((p, c) => Array.from(new Set([...p, ...c])));
	}
});

Object.defineProperty(Array.prototype, 'scalebetween', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function(scaledmin, scaledmax) {
		let max = Math.max.apply(Math, this);
		let min = Math.min.apply(Math, this);
		let cur = this.slice();
		return cur.map(num => (scaledmax - scaledmin) * (num - min) / (max - min) + scaledmin);
	}
});

Object.defineProperty(Array.prototype, 'remove', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function() {
		let what;
		let a = arguments;
		let len  = a.length;
		let ax;
		while (len && this.length) {
			what = a[--len];
			while ((ax = this.indexOf(what)) !== -1) {
				this.splice(ax, 1);
			}
		}
		return this;
	}
});

Object.defineProperty(Object.prototype, 'filterbyvalue', {
	value: function(filter) {
		let object = Object.assign({}, this);
		let result = {};
		let matchobject = (object, needle) => {
			if (typeof needle === 'function') {
				return needle(object);
			}
			return Object.keys(needle)
				.every(property => object.hasOwnProperty(property) && matchobject(object[property], needle[property]));
		};
		if (matchobject(object, filter)) {
			result = object;
			object = undefined;
			return result;
		}
		Object.keys(object).forEach(key => {
			let item = object[key];
			if (matchobject(item, filter)) {
				result[key] = item;
			} else {
				let tmp =  item.filterbyvalue(filter);
				if(Object.keys(tmp).length) result[key] = tmp;
				tmp = undefined;
			}
			item = undefined;
		});
		return result;
	},
	enumerable: false,
	writable: true,
	configurable: true,
});

Object.defineProperty(Set.prototype, 'intersection', {
	configurable: true,
	enumerable: true,
	writable: true,
    value: function*(set1, set2) {
		for(let value of set1.values()) {
			if(set2.has(value)) yield value;
		}
	}
});

// polyfills
if(!Array.prototype.hasOwnProperty('sum')) {
	Object.defineProperty(Array.prototype, 'sum', {
		configurable: true,
		enumerable: true,
		writable: true,
	    value: function() {
			return this.reduce(function(p, c) { return p + c; }, 0);
		}
	});
}

if(!Array.prototype.hasOwnProperty('avg')) {
	Object.defineProperty(Array.prototype, 'avg', {
		configurable: true,
		enumerable: true,
		writable: true,
	    value: function() {
			return this.sum() / this.length;
		}
	});
}

if(!String.prototype.hasOwnProperty('startsWith')) {
	Object.defineProperty(String.prototype, 'startsWith', {
		configurable: true,
		enumerable: true,
		writable: true,
	    value: function(searched, position) {
			position = position || 0;
			return this.indexOf(searched, position) === position;
		}
	});
}

if(!String.prototype.hasOwnProperty('endsWith')) {
	Object.defineProperty(String.prototype, 'endsWith', {
		configurable: true,
		enumerable: true,
		writable: true,
	    value: function(searchString, position) {
			let subjectString = this.toString();
			if(
				typeof position !== 'number' || !isFinite(position) || 
				Math.floor(position) !== position || position > subjectString.length
			) {
				position = subjectString.length;
			}
			position -= searchString.length;
			let lastIndex = subjectString.indexOf(searchString, position);
			subjectString = undefined;
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

// get radius from size
const getradiusfromsize = y => Math.sqrt(y / Math.PI);

// strings similarity
const cosinesimilarity = (text1, text2) => {
	let gettermfrequencymap = terms => {
		let map = new Map();
		for(let term of terms) {
			let n = map.get(term);
			if (n === undefined) map.set(term, 1); 
			else  map.set(term, n + 1);
		}
		return map;
	};

	let a = gettermfrequencymap(text1);
	let b = gettermfrequencymap(text2);
	let s1 = new Set(a.keys());
	let s2 = new Set(b.keys());
	let dotProduct = 0;
	let magnitudeA = 0;
	let magnitudeB = 0;
    
	for (let item of Set.intersection(s1, s2)) {
		dotProduct += a.get(item) * b.get(item);
	}
	for (let k of a.keys()) {
		magnitudeA += Math.pow( a.get( k ), 2 );
	}
	for (let k of b.keys()) {
		magnitudeB += Math.pow( b.get( k ), 2 );
	}
	a = b = s1 = s2 = undefined;
	return dotProduct / Math.sqrt(magnitudeA * magnitudeB);
};

// objects joining
function joinobjects() {
	let idmap = {};
	for (let i = 0, len = arguments.length; i < len; i++) {
		for (let j = 0, jlen = arguments[i].length; j < jlen; j++) {
			let currentid = arguments[i][j].ID;
			if (!idmap[currentid]) {
				idmap[currentid] = {};
			}
			for (let key in arguments[i][j]) {
				if(arguments[i][j].hasOwnProperty(key)) {
					idmap[currentid][key] = arguments[i][j][key];
				}
			}
			currentid = undefined;
		}
	}
	let newarray = [];
	for (let property in idmap) {
		if(idmap.hasOwnProperty(property)) {
			newarray.push(idmap[property]);
		}
	}
	idmap = undefined;
	return newarray;
}

// object joins
function equijoin(arr1, arr2, arr1Key, arr2Key, select) {
	// as seen at https://seethespark.com/blog/JavaScript-inner-join-and-outer-join/14
	let m = arr1.length;
	let n = arr2.length;
	let index = new Map();
	let c = [];
	let row;
	let rowKey;
	let arr1Row;

	function mapFunc(keyItem) { 
		return row[keyItem];
	}

	if (Array.isArray(arr1Key) && Array.isArray(arr2Key)) {
		arr1Key.sort();
		arr2Key.sort();
		for (let i = 0; i < m; i++) {
			row = arr1[i];
			rowKey = arr1Key.map(mapFunc).join('~~'); 
			index.set(rowKey, row); 
		}
		for (let j = 0; j < n; j++) { 
			row = arr2[j];
			rowKey = arr2Key.map(mapFunc).join('~~');
			if (rowKey !== undefined && rowKey !== '') { 
				arr1Row = index.get(rowKey); 
			} else {
				arr1Row = undefined;
			}
			if (arr1Row) {
				c.push(select(arr1Row, row)); 
			}
		}
	} else {
		for (let k = 0; k < m; k++) {
			row = arr1[k];
			index[row[arr1Key]] = row; 
		}
		for (let l = 0; l < n; l++) {
			row = arr2[l];
			if (row[arr2Key] !== null) {
				arr1Row = index[row[arr2Key]];
			} else {
				arr1Row = undefined;
			}

			if (arr1Row) {
				c.push(select(arr1Row, row)); 
			}
		}
	}

	m = n = index = row = rowKey = arr1Row = undefined;
	return c;
}

const leftjoin = (objarr1, objarr2, key1, key2) => {
	return objarr1.map(
		anobj1 => ({
			...objarr2.find(
				anobj2 => anobj1[key1] === anobj2[key2]
			),
			...anobj1
		})
	);
};

// object unique
const objectunique = tmp => Array.from(new Set(tmp.map(o => JSON.stringify(o)))).map(o => JSON.parse(o));

// object filter by key
const pick = (o, fields) => {
	return fields.reduce((a, x) => {
		if(o.hasOwnProperty(x)) a[x] = o[x];
		return a;
	}, {});
};

// set operations
function setintersection(a) {
	let m = new Map();
	let r = new Set();
	let l = a.length;
	a.forEach(sa => new Set(sa).forEach(n => m.has(n) ? m.set(n, m.get(n) + 1) : m.set(n, 1)));
	m.forEach((v, k) => v === l && r.add(k));
	m = l = undefined;
	return r;
}

// utility primitive constants
// IMPORTANT: to follow "arguments.caller" use "const args = Array.prototype.slice.call(arguments)"
const sizeOf = x => (typeof x === 'undefined' ? -1 : isObject(x) ? Object.keys(x).length : x.length);
const resourceisloaded = r => window.resources.find(o => o.slug === r).isloaded;

const byId = elm => document.getElementById(elm);
const plural = (num, sin, plu) => parseInt(num, 10) === 1 ? sin : plu;

const isVisible = elm =>  {
	if(!elm) { return false; }
	if(!elm.offsetHeight && !elm.offsetWidth) { return false; }
	if(getComputedStyle(elm).visibility === 'hidden') { return false; }
	return true;
};
const isNil = x => x === null || x === undefined;
const isDefined = x => {
	let undefined;
	return x !== undefined;
};
const isBlank = x => x === null || x === undefined || String(x).trim() === '';
const isObject = x => x && Object(x) === x;
const isPrimitive = value => ((typeof value !== 'object') && (typeof value !== 'function')) || (value === null);
const isIterable = obj => obj !== null && typeof obj[Symbol.iterator] === 'function';
const isEmptyData = obj => obj === null || Array.isArray(obj) && obj.length === 0;
const isFunction = x => x && typeof x === 'function';
const isNumber = num => !isNaN(String(num).replace(/[.,+-]/g, ''));
const isNumeric = n => !isNaN(parseFloat(n)) && isFinite(n);
const isString = str => Object.prototype.toString.call(str) === '[object String]';
const isJSON = str => {
	try {
		return (JSON.parse(str) && !!str);
	} catch (e) {
		return false;
	}
};

// remove key from object using destructuring assignment
const removekey = (obj, prop) => {
	let {[prop]: omit, ...res} = obj;
	omit = undefined;
	return res;
};

// more robust & faster alternative to array max/min
const arraymin = arr => {
	let len = arr.length;
	let min = Infinity;
	while (len--) {
		if (arr[len] && arr[len] < min) min = arr[len];
	}
	len = undefined;
	return min;
};

const arraymax = arr => {
	let len = arr.length;
	let max = -Infinity;
	while (len--) {
		if (arr[len] && arr[len] > max) max = arr[len];
	}
	len = undefined;
	return max;
};

// robust alternative to grouping in objects array
const arraygroup = (list, components, children = 'results', excludenulls = true) => {
	let grouping = [...list.reduce((r, o) => {
		const key = components.map(_ => `${o[_]}`).join(' :: ');
		let keyed = r.get(key) || components.reduce((x, y) => { x[y] = o[y]; return x; }, {});
		keyed[children] = keyed[children] || [];
		keyed[children].push(o);
		return r.set(key, keyed);
	}, new Map()).values()];
	let base = excludenulls ? grouping.filter(o => !Object.values(o).some(v => isBlank(v))) : grouping;
	grouping = undefined;
	return base;
};

// flattening
const arrayflatten = (arr, result = []) => {
	for (let i = 0, length = arr.length; i < length; i++) {
		let value = arr[i];
		if (Array.isArray(value)) {
			arrayflatten(value, result);
		} else {
			result.push(value);
		}
		value = undefined;
	}
	return result;
};

// objects sorting
const sortobjectbykey = function(object) {
	return []
		.concat(Object.keys(object))
		.sort((a, b) => a.localeCompare(b, {sensitivity: 'base'}))
		.reduce(function(total, key) {
			total[key] = object[key];
			return total;
		}, Object.create(null));
	
};
const sortobjectbyvalue = function(obj) {
	let object = JSON.parse(JSON.stringify(obj));
	return Object.keys(object).sort(function(a, b) { return object[a] - object[b]; });
};

// object flattening
const objectflatten = (input, reference, output) => {
	output = output || {};
	for(let key in input) {
		let value = input[key];
		key = reference ? reference + '|' + key : key;
		if (typeof value === 'object' && value !== null) {
			objectflatten(value, key, output);
		} else {
			output[key] = value;
		}
		value = undefined;
	}
	return output;
};

const fastobjectflatten = (json, flattened, str_key, separator = '.') => {
	for(let key in json) {
		if(json.hasOwnProperty(key)) {
			if (json[key] instanceof Object && json[key] !== '') {
				fastobjectflatten(json[key], flattened, str_key + separator + key);
			} else {
				flattened[str_key + separator + key] = json[key];
			}
		}
	}
};

// object size calculations
function objectsize(obj) {
	let bytes = 0;
	function sizeof(obj) {
		if(obj !== null && obj !== undefined) {
			switch(typeof obj) {
			case 'number':
				bytes += 8;
				break;
			case 'string':
				bytes += obj.length * 2;
				break;
			case 'boolean':
				bytes += 4;
				break;
			case 'object':
				let objclass = Object.prototype.toString.call(obj).slice(8, -1);
				if(objclass === 'Object' || objclass === 'Array') {
					for(let key in obj) {
						if(!obj.hasOwnProperty(key)) continue;
						sizeof(obj[key]);
					}
				} else {
					bytes += obj.toString().length * 2;
				}
				objclass = undefined;
				break;
			}
		}
		return bytes;
	}

	let size = sizeof(obj);
	return {
		bytes: size, 
		kib: (size / 1024), 
		mib: (size / 1048576),
		gib: (size / 1073741824)
	};
}

// cached fetching
// heavily based in https://github.com/theJian/cached-fetch
const cfetch = (url, options = undefined, iscached = false) => {
	let expiry = 86400; // seconds by default: 24 hours
	if(iscached) {
		if(typeof options === 'number') {
			expiry = options;
			options = undefined;
		} else if(typeof options === 'object') {
			expiry = options.seconds || expiry;
		}
		let cachedKey = url;
		let cachedItem = localStorage.getItem(cachedKey);
		let whenCached = localStorage.getItem(cachedKey + ';ts');
		if(cachedItem !== null && whenCached !== null) {
			let age = (Date.now() - whenCached) / 1000;
			if(age < expiry) {
				let response = new Response(new Blob([cachedItem]));
				return Promise.resolve(response);
			} else {
				localStorage.removeItem(cachedKey);
				localStorage.removeItem(cachedKey + ';ts');
			}
			age = undefined;
		}
		return fetch(url, options).then(response => {
			if(response.status === 200) {
				let ct = response.headers.get('Content-type');
				if(ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
					response.clone().text().then(content => {
						localStorage.setItem(cachedKey, content);
						localStorage.setItem(cachedKey + ';ts', Date.now());
					});
				}
				ct = undefined;
			}
			return response;
		});
	} else {
		return fetch(url, options).then(response => response);
	}
};

// non-cached remote fetching && asynchronous stylesheet loader
async function fetchasync(uri) {
	let response = await fetch(uri, {mode: 'no-cors'});
	return await response.json();
}

async function fetchtextasync(uri) {
	let response = await fetch(uri);
	return await response.text();
}

async function loadstyles(stylesheets) {
	let arr = await Promise.all(stylesheets.map(url => fetch(url)));
	arr = await Promise.all(arr.map(url => url.text()));
	let style = document.createElement('style');
	style.textContent = arr.reduce((prev, fileContents) => prev + fileContents, '');
	document.head.appendChild(style);
}

async function existsasync(uri) {
	let response = await fetch(uri);
	return await response.status === 200;
}

// cartesian product
function *cartesianproduct(...arrays) {
	if (!arrays.length) {
		yield [];
	} else {
		let [tail, ...head] = arrays.reverse();
		let beginning = cartesianproduct(...head.reverse());
		for(let b of beginning) for(let t of tail) yield b + t;
	}
}

// events management
const listeners = {};

const originalEventListener = window.addEventListener;
window.addEventListener = function(type, fn, options) {
	if (!listeners[type]) listeners[type] = [];
	listeners[type].push(fn);
	return originalEventListener(type, fn, options);
};

const removeAllEventListener = function(type) {
	if (!listeners[type] || !listeners[type].length) return;
	for (let i = 0; i < listeners[type].length; i++) {
		window.removeEventListener(type, listeners[type][i]);
	}
};

// timeout interface
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const syncsleep = ms => {
	let start = new Date().getTime();
	for (let i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > ms) break;
	}
};
const wait = async (asynccond, ms = 5000, debug = false) => {
	let waiter = ms => new Promise(resolve => setTimeout(resolve, ms));
	let intvms = 1000;
	let start = Date.now();
	let result = await asynccond();
	let end = Date.now();
	let spent = end - start;
	if(debug) console.log(`waiting, timeout in: ${ms}ms`);
	if (result) return result;
	if (ms - spent - intvms < 0) return result;
	await waiter(intvms);
	return await wait(asynccond, ms - spent - intvms);
};
const isloaded = lib => window.resources.filter(o => o.namespace === lib).map(o => o.isloaded)[0];
const __delay__ = timer => {
	return new Promise(resolve => {
		timer = timer || 2000;
		setTimeout(function () { resolve(); }, timer);
	});
};
async function waitforlib(lib) {
	while (!isloaded(lib)) await __delay__(1000);
	router.resourcestatus(lib, true, false, '');
}

// copy citation
const addcitation = function(event) {
	event.preventDefault();
	let pagelink = `${window.version.citation}`;
	let copytext = window.getSelection() + pagelink;
	(event.clipboardData || window.clipboardData).setData('Text', copytext);
	pagelink = copytext = undefined;
};

document.addEventListener('copy', addcitation);

// Memoization
// as seen at https://github.com/timkendrick/memoize-weak but not so slightly modified

function memoize(fn) {
	let argsTree = new MapTree();

	function memoized() {
		let args = Array.prototype.slice.call(arguments);
		let argNode = args.reduce(function getBranch(parentBranch, arg) {
			return parentBranch.resolveBranch(arg);
		}, argsTree);
		if (argNode.hasValue) {
			return argNode.value;
		}
		let value = fn.apply(null, args);
		return argNode.setValue(value);
	}

	memoized.clear = argsTree.clear.bind(argsTree);

	return memoized;
}

// similarity between strings
// as seen at https://github.com/stephenjjbrown/string-similarity-js but slightly modified
const similarity = (str1, str2, substringLength = 2, caseSensitive = false) => {
	if (!caseSensitive) {
		str1 = str1.toLowerCase();
		str2 = str2.toLowerCase();
	}
	
	if (str1.length < substringLength || str2.length < substringLength) return 0;
	
	let map = new Map();
	for(let i = 0, len = str1.length - (substringLength - 1); i < len; i++) {
		let substr1 = str1.substr(i, substringLength);
		map.set(substr1, map.has(substr1) ? map.get(substr1) + 1 : 1);
	}
	
	let match = 0;
	for(let j = 0, jlen = str2.length - (substringLength - 1); j < jlen; j++) {
		let substr2 = str2.substr(j, substringLength);
		let count = map.has(substr2) ? map.get(substr2) : 0;
		if(count > 0) {
			map.set(substr2, count - 1);
			match++;
		}
		substr2 = count = undefined;
	}
	
	return (match * 2) / (str1.length + str2.length - ((substringLength - 1) * 2));
};

// Fuction caller name in strict mode
function callername() {
	try {
		throw new Error();
	} catch (e) {
		try {
			return e.stack.split('at ')[3].split(' ')[0];
		} catch (e) {
			return '';
		}
	}
}

// Function escape quotes
function escapeqoutes(text) {
	return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
// Function remove quotes
function removeqoutes(text) {
	return text.replace(/'/g, '').replace(/"/g, '');
}

// Function unique identifier for filters
const filteruuid = () => (new Date()).getTime() + Math.trunc(365 * Math.random());

// Remove quotes and other stuff from text
const cleartext = dat => String(dat)
	.replace(/""/g,'\"')
	.replace(/"/g,'\"')
	.replace(/'/g,"\'")
	.replace(/\t/, ' ')
	.replace(/\n/, ' ');
