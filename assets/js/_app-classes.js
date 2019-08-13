 'use strict';

/* global arraymax, arraymin, byId, c, d, dbe, fc, isObject, l, toolkit */
/* eslint no-confusing-arrow: ["error", {"allowParens": true}] */
/* eslint-env es6 */
/* exported AppError, autocomplete, FastTable, pg, Record, Relative, Stats, w */

// custom record class
class Record {
	constructor(o) {
		this.ID = o.ID;
		this.rkey = o.rkey;
		this.key = c(o.rkey);
		this.value = o.value;
	}	
}
class Relative {
	constructor(o) {
		let post = dbe.getposbyid(o.RID) || null;
		let ages = dbm.ages(true)[o.RID] || null;
		let mets = dbm.metadata(true)[o.RID] || null;
		let taxs = dbm.taxonomies(true)[o.RID] || null;
 
		let rage = ages ? ages.value : null;
		let rsta = mets ? mets.find(o => d.startdates.includes(o.rkey)) : null;
		let rend = mets ? mets.find(o => d.enddates.includes(o.rkey)) : null;
		let rpla = mets ? mets.find(o => d.places.includes(o.rkey)) : null;
		let rpoi = mets ? mets.find(o => d.points.includes(o.rkey)) : null;
		let rgen = mets ? mets.find(o => d.genders.includes(o.rkey)) : null;
		let rbou = o.bound === '<' ? c`inbound` : c`outbound`;
		let rtit = post ? toolkit.titleformat(post.value) : null;

		let rtto = taxs ? taxs.filter(o => o.rkey === 'tax_topic').map(o => o.value).join(', ') : null;
		let rtat = taxs ? taxs.filter(o => o.rkey === 'tax_artwork_type').map(o => o.value).join(', ') : null;
		let rtpe = taxs ? taxs.filter(o => o.rkey === 'tax_period').map(o => o.value).join(', ') : null;
		let rtmo = taxs ? taxs.filter(o => o.rkey === 'tax_movement').map(o => o.value).join(', ') : null;
		let rtet = taxs ? taxs.filter(o => o.rkey === 'tax_exhibition_type').map(o => o.value).join(', ') : null;
		let rtty = taxs ? taxs.filter(o => o.rkey === 'tax_typology').map(o => o.value).join(', ') : null;
		let rtow = taxs ? taxs.filter(o => o.rkey === 'tax_ownership').map(o => o.value).join(', ') : null;
		let rtac = taxs ? taxs.filter(o => o.rkey === 'tax_activity').map(o => o.value).join(', ') : null;
				
		let atto = taxs ? taxs.filter(o => o.rkey === 'tax_topic').map(o => o.value) : null;
		let atat = taxs ? taxs.filter(o => o.rkey === 'tax_artwork_type').map(o => o.value) : null;
		let atpe = taxs ? taxs.filter(o => o.rkey === 'tax_period').map(o => o.value) : null;
		let atmo = taxs ? taxs.filter(o => o.rkey === 'tax_movement').map(o => o.value) : null;
		let atet = taxs ? taxs.filter(o => o.rkey === 'tax_exhibition_type').map(o => o.value) : null;
		let atty = taxs ? taxs.filter(o => o.rkey === 'tax_typology').map(o => o.value) : null;
		let atow = taxs ? taxs.filter(o => o.rkey === 'tax_ownership').map(o => o.value) : null;
		let atac = taxs ? taxs.filter(o => o.rkey === 'tax_activity').map(o => o.value) : null;

		this.ID = o.ID;
		this.RID = o.RID;
		this.rkey = o.rkey;
		this.key = c(o.rkey);
		
		this.reltitle = rtit;
		this.reltype = rbou;
		this.relrkey = post ? post.rkey : null;
		this.relkey = post ? c(post.rkey) : null;
		
		this.relstartcentury = rsta ? String(rsta.value).dateparts().century : null;
		this.relstartcentury = rsta ? String(rsta.value).dateparts().romancentury : null;
		this.relstartdecade = rsta ? String(rsta.value).dateparts().decade : null;
		this.relstartyear = rsta ? String(rsta.value).dateparts().year : null;
		this.relstartmonth = rsta ? String(rsta.value).dateparts().monthname : null;
		this.relstartmonth = rsta ? String(rsta.value).dateparts().month : null;
		this.relstartday = rsta ? String(rsta.value).dateparts().day : null;
		this.relstartstring = rsta ? String(rsta.value).dateparts().string : null;
		
		this.relendcentury = rend ? String(rend.value).dateparts().century : null;
		this.relstartcentury = rend ? String(rend.value).dateparts().romancentury : null;
		this.relenddecade = rend ? String(rend.value).dateparts().decade : null;
		this.relendyear = rend ? String(rend.value).dateparts().year : null;
		this.relendmonth = rend ? String(rend.value).dateparts().monthname : null;
		this.relendweekday = rend ? String(rend.value).dateparts().month : null;
		this.relendday = rend ? String(rend.value).dateparts().day : null;
		this.relendstring = rend ? String(rend.value).dateparts().string : null;
		
		this.relyears = rage ? rage.years : null;
		this.reldays = rage ? rage.days : null;
		
		this.reltown = rpla ? String(rpla.value).places().town : null;
		this.relregion = rpla ? String(rpla.value).places().region : null;
		this.relcountry = rpla ? String(rpla.value).places().country : null;
		
		this.relpoint = rpoi ? [String(rpoi.value).points().longitude, String(rpoi.value).points().latitude] : null;
		this.relgender = rgen ? String(rgen.value) : null;
		
		this.reltaxtopic = rtto;
		this.reltaxartworktype = rtat;
		this.reltaxperiod = rtpe;
		this.reltaxmovement = rtmo;
		this.reltaxexhibitiontype = rtet;
		this.reltaxtypology = rtty;
		this.reltaxownership = rtow;
		this.reltaxactivity = rtac;

		this.relataxtopic = atto;
		this.relataxartworktype = atat;
		this.relataxperiod = atpe;
		this.relataxmovement = atmo;
		this.relataxexhibitiontype = atet;
		this.relataxtypology = atty;
		this.relataxownership = atow;
		this.relataxactivity = atac;

		post = ages = mets = taxs = rage = rsta = rend = rpla = rpoi = rgen = undefined; 
		rbou = rtit = rtto = rtat = rtpe = rtmo = rtet = rtty = rtow = rtac = undefined;
		atto = atat = atpe = atmo = atet = atty = atow = atac = undefined;
	}	
}

// custom error class
class ExtendableError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else { 
			this.stack = (new Error(message)).stack; 
		}
	}
}

class AppError extends ExtendableError {
	constructor(message) {
		super(message);
		this.message = message;
		this.name = c`app-warning`.uf();
	}
	toJSON() {
		return {
			error: {
				name: this.name,
				message: this.message,
				stacktrace: this.stack
			}
		}
	}
}

class AppWarning extends ExtendableError {
	constructor(message) {
		super(message);
		this.message = message;
		this.name = c`app-warning`.uf();
	}
	toJSON() {
		return {
			error: {
				name: this.name,
				message: this.message,
				stacktrace: this.stack
			}
		}
	}
}

// Data ring (circular data structure)
class Circular {
	constructor (arr, startIntex) {
		this.arr = arr;
		this.currentIndex = startIntex || 0;
	}

	next() {
		let i = this.currentIndex;
		let arr = this.arr;
		this.currentIndex = i < arr.length-1 ? i+1 : 0;
		return this.current();
	}
	
	prev() {
		let i = this.currentIndex;
		let arr = this.arr;
		this.currentIndex = i > 0 ? i-1 : arr.length-1;
		return this.current();
	}
	
	current() {
		return this.arr[this.currentIndex];
	}
}

// Stats
class Stats {
	constructor(array, method = 1.5) {
		if (!array || !(array instanceof Array)) {
			array = [];
		}
		array = array.slice(0);
		array.sort(function(a, b) {
			return a - b;
		});
		this.array = array;
		this.method = method;
	}

	clone() {
		return new Stats(this.array.slice(0));
	}

	max() {
		return arraymax(this.array);
	}

	min() {
		return arraymin(this.array);
	}

	range() {
		return this.max() - this.min();
	}

	midrange() {
		return this.range() / 2;
	}

	sum() {
		let num = 0;
		for (let i = 0, l = this.size(); i < l; i++) num += this.array[i];
		return num;
	}

	q1() {
		let nums = this.clone();
		return nums.slice(0, Math.floor(nums.size() / 2)).median();
	}

	q3() {
		let nums = this.clone();
		return nums.slice(Math.ceil(nums.size() / 2)).median();
	}

	iqr() {
		return this.q3() - this.q1();
	}

	lowlimit() {
		let median = this.median();
		let range = this.iqr() * this.method;
		return median - range;
	}

	highlimit() {
		let median = this.median();
		let range = this.iqr() * this.method;
		return median + range;
	}

	median() {
		let half = Math.floor(this.size() / 2);
		if (this.size() % 2) {
			return this.array[half];
		} else {
			return (this.array[half - 1] + this.array[half]) / 2;
		}
	}

	mean(arr = null) {
		let nums = !arr ? this.array : arr;
		let num = 0;
		for (let i = 0, l = nums.length; i < l; i++) num += nums[i];
		return num / nums.length;
	}

	slice() {
		this.array = Array.prototype.slice.apply(this.array, arguments);
		return this;
	}

	each(fn) {
		for (let i = 0, l = this.size(); i < l; i++) {
			fn.call(this.array[i], this.array[i], i, this.array);
		}
		return this;
	}

	findoutliers() {
		let highlimit = this.highlimit();
		let lowlimit = this.lowlimit();
		let outliers = [];
		this.each(function(num) {
			if (num < lowlimit || num > highlimit) outliers.push(num);
		});
		highlimit = lowlimit = undefined;
		return outliers;
	}

	size() {
		return this.array.length;
	}

	modes() {
		if (!this.array.length) return [];
		let modemap = {};
		let modes = [];
		let maxcount = 0;

		this.array.forEach(val => {
			if (!modemap[val]) modemap[val] = 1;
			else modemap[val]++;

			if (modemap[val] > maxcount) {
				modes = [val];
				maxcount = modemap[val];
			} else if (modemap[val] === maxcount) {
				modes.push(val);
				maxcount = modemap[val];
			}
		});
		modemap = maxcount = undefined;
		return modes;
	}

	variance() {
		let mean = this.mean();
		return this.mean(this.array.map(num => Math.pow(num - mean, 2)));
	}

	standarddeviation() {
		return Math.sqrt(this.variance());
	}

	meanabsolutedeviation() {
		let mean = this.mean();
		return this.mean(this.array.map(num => Math.abs(num - mean)));
	}

	percentile(arr, ptile) {
		// like console.log("85th percentile: %s", stats.percentile(rolls, 0.85))
		arr = arr || this.array;
		if (arr.length === 0 || ptile === null || ptile < 0) return NaN;
		if (ptile > 1) ptile = 1;
		arr = arr.sort();
		let i = (arr.length * ptile) - 0.5;
		if ((i | 0) === i) return arr[i];
		let int_part = i | 0;
		let fract = i - int_part;
		i = undefined;
		return (1 - fract) * arr[int_part] + fract * arr[Math.min(int_part + 1, arr.length - 1)];
	}

	zscores() {
		let mean = this.mean();
		let standardDeviation = this.standarddeviation();
		return this.array.map(num => (num - mean) / standardDeviation);
	}

	zscoresmap() {
		let mean = this.mean();
		let standardDeviation = this.standarddeviation();
		let zscores = this.zscores();
		let zsmax = arraymax(zscores);
		let zsmin = arraymin(zscores);
		let zstotal = Math.max(zsmax - zsmin, zsmax);
		let zsdiff = zstotal - zsmax;
		let zsnormal = mean / standardDeviation;
		let out = [];
		this.array.forEach((o, i) => {
			let position = zscores[i] + zsdiff;
			out.push({
				num: o,
				zscore: zscores[i],
				zscoreposition: position,
				zscoreratio: position / zstotal,
				zsnormal: zsnormal
			});
			position = undefined;
		});
		mean = standardDeviation = zscores = zsmax = zsmin = zstotal = zsdiff = zsnormal = undefined;
		return dbe.hashrecord(out, 'num');
	}
}

// autocomplete
function autocomplete(input, array) {
	let currentFocus;
	let inputfunc = function() {
		let b;
		let val = this.value;
		closeAllLists();
		if (!val) return false;
		currentFocus = -1;
		let a = document.createElement('DIV');
		a.setAttribute('id', this.id + 'autocomplete-list');
		a.setAttribute('class', 'autocomplete-items');
		this.parentNode.appendChild(a);
		for (let i = 0, len = array.length; i < len; i++) {
			if (dbe._operation('li', fc(array[i]), val)) {
				b = document.createElement('DIV');
				b.innerHTML = toolkit.highlight(fc(array[i]), val);
				b.innerHTML += `<input type="hidden" value="${array[i]}">`;
				b.dataset.field = array[i];
				b.removeEventListener('click', elementlistener);
				b.addEventListener('click', elementlistener);
				a.appendChild(b);
			}
		}
		a = b = val = undefined;
	};
	let keydownfunc = function(e) {
		screen.siteoverlay(true);
		sleep(200).then(() => {
			let x = document.getElementById(this.id + 'autocomplete-list');
			if (x) x = x.getElementsByTagName('div');
			if (e.keyCode === 40) {
				currentFocus++;
				addActive(x);
			} else if (e.keyCode === 38) { 
				currentFocus--;
				addActive(x);
			} else if (e.keyCode === 13) {
				e.preventDefault();
				if (currentFocus > -1) {
					if (x) x[currentFocus].click();
				}
			}
			x = undefined;
			screen.siteoverlay(false);
		});
	};
	
	let documentlistener = function(e) {
		closeAllLists(e.target);
	};
	
	let elementlistener = function() {
		input.value = fc(this.getElementsByTagName('input')[0].value);
		input.dataset.field = this.getElementsByTagName('input')[0].value;
		closeAllLists();
	};
	
	input.removeEventListener('input', inputfunc);
	input.removeEventListener('keydown', keydownfunc);
	input.addEventListener('input', inputfunc);
	input.addEventListener('keydown', keydownfunc);

	function addActive(x) {
		if (!x) return false;
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		x[currentFocus].classList.add('autocomplete-active');
	}

	function removeActive(x) {
		for (let i = 0, len = x.length; i < len; i++) {
			x[i].classList.remove('autocomplete-active');
		}
	}

	function closeAllLists(elmnt) {
		let x = document.getElementsByClassName('autocomplete-items');
		for (let i = 0, len = x.length; i < len; i++) {
			if (elmnt !== x[i] && elmnt !== input) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
		x = undefined;
	}
	document.removeEventListener('click', documentlistener);
	document.addEventListener('click', documentlistener);
}

// map tree for memoize function
// as seen at https://github.com/timkendrick/memoize-weak but not so slightly modified
class MapTree {
	constructor() {
		this.childBranches = new WeakMap();
		this.primitiveKeys = new Map();
		this.hasValue = false;
		this.value = undefined;
	}

	has(key) {
		let keyObject = (isPrimitive(key) ? this.primitiveKeys.get(key) : key);
		return (keyObject ? this.childBranches.has(keyObject) : false);
	}
	
	get(key) {
		let keyObject = (isPrimitive(key) ? this.primitiveKeys.get(key) : key);
		return (keyObject ? this.childBranches.get(keyObject) : undefined);
	}
	
	resolveBranch(key) {
		if (this.has(key)) return this.get(key);
		let newBranch = new MapTree();
		let keyObject = this.createKey(key);
		this.childBranches.set(keyObject, newBranch);
		keyObject = undefined;
		return newBranch;
	}
	
	setValue(value) {
		this.hasValue = true;
		return (this.value = value);
	}
	
	createKey(key) {
		if (isPrimitive(key)) {
			let keyObject = {};
			this.primitiveKeys.set(key, keyObject);
			return keyObject;
		}
		return key;
	}
	
	clear() {
		if (arguments.length === 0) {
			this.childBranches = new WeakMap();
			this.primitiveKeys.clear();
			this.hasValue = false;
			this.value = undefined;
		} else if (arguments.length === 1) {
			let key = arguments[0];
			if (isPrimitive(key)) {
				let keyObject = this.primitiveKeys.get(key);
				if (keyObject) {
					this.childBranches.delete(keyObject);
					this.primitiveKeys.delete(key);
				}
			} else {
				this.childBranches.delete(key);
			}
			key = keyObject = undefined;
		} else {
			let childKey = arguments[0];
			if (this.has(childKey)) {
				let childBranch = this.get(childKey);
				childBranch.clear.apply(childBranch, Array.prototype.slice.call(arguments, 1));
				childBranch = undefined;
			}
			childKey = undefined;
		}
	}
} 

// simplified graph
class Graph {
	constructor(props) {
		this.neighbors = {};
	}

	addedge(u, v) {
		if (!this.neighbors[u]) this.neighbors[u] = [];
		this.neighbors[u].push(v);
	}

	bfs(start) {
		// Breadth First Search or BFS for a Graph
		if (!this.neighbors[start] || !this.neighbors[start].length) {
			return [start];
		}

		let results = {
			nodes: []
		};
		let queue = this.neighbors[start];
		let count = 1;

		while (queue.length) {
			let node = queue.shift();
			if (!results[node] || !results[node].visited) {
				results[node] = {
					visited: true,
					steps: count
				};
				results['nodes'].push(node);
				if (this.neighbors[node]) {
					if (this.neighbors[node].length) {
						count++;
						queue.push(...this.neighbors[node]);
					} else {
						continue;
					}
				}
			}
			node = undefined;
		}
		queue = count = undefined;
		return results;
	}

	shortestpath(start, end) {
		if (start === end) return [start, end];

		let queue = [start];
		let visited = {};
		let predecessor = {};
		let tail = 0;
		let path;

		while (tail < queue.length) {
			let u = queue[tail++];
			if (!this.neighbors[u]) continue

			let neighbors = this.neighbors[u];
			for (let i = 0, len = neighbors.length; i < len; ++i) {
				let v = neighbors[i];
				if (visited[v]) continue;
				visited[v] = true;
				if (v === end) { 
					path = [v];
					while (u !== start) {
						path.push(u);
						u = predecessor[u];
					}
					path.push(u);
					path.reverse();
					return path;
				}
				predecessor[v] = u;
				queue.push(v);
				v = undefined;
			}
			u = neighbors = undefined;
		}

		queue = visited = predecessor = tail = undefined;
		return path;
	}
}

// Pivot data class
class PivotData {
	constructor(data, opts) {
		this.inputData = data || [];
		this.colAttrs = opts.colAttrs || [];
		this.rowAttrs = opts.rowAttrs || [];
		this.aggregator = opts.aggregator || this._aggregator;

		this.tree = {};
		this.colKeys = [];
		this.rowKeys = [];
		this.colKeysMap = {};
		this.rowKeysMap = {};

		this.defoliate = this.aggregator();

		this.init();
	}

	init() {
		this.forEachRecord();

		this.sortColKeys();
		this.sortRowKeys();
	}

	static _comparearray(a, b, index) {
		let i = index || 0;
		if (i >= a.length || i >= b.length) return 1;
		if (a[i] > b[i]) {
			return 1;
		} else if (a[i] < b[i]) {
			return -1;
		} else {
			return PivotData._comparearray(a, b, ++i);
		}
	}

	static _aggregator() {
		return {
			data: [],
			push: function(record) {
				if (Array.isArray(record)) {
					this.data = this.data.concat(record);
				} else {
					this.data.push(record);
				}
				return this;
			},
			format() {
				return this.data.length;
			},
		};
	}

	static _spansize(arr, i, j) {
		let l, len, n, noDraw, ref, ref1, stop, x;
		if (i !== 0) {
			noDraw = true;
			for (x = l = 0, ref = j; 0 <= ref ? l <= ref : l >= ref; x = 0 <= ref ? ++l : --l) {
				if (arr[i - 1][x] !== arr[i][x]) {
					noDraw = false;
				}
			}
			if (noDraw) {
				return -1;
			}
		}
		len = 0;
		while (i + len < arr.length) {
			stop = false;
			for (x = n = 0, ref1 = j; 0 <= ref1 ? n <= ref1 : n >= ref1; x = 0 <= ref1 ? ++n : --n) {
				if (arr[i][x] !== arr[i + len][x]) {
					stop = true;
				}
			}
			if (stop) {
				break;
			}
			len++;
		}
		return len;
	}

	forEachRecord() {
		for (let i = 0, len = this.inputData.length; i < len; i++) {
			let record = this.inputData[i];
			this.processRecord(record);
		}
	}

	processRecord(record) {
		const rowKey = [];
		const colKey = [];

		this.rowAttrs.forEach((rowAttr) => {
			rowKey.push(record[rowAttr] || '');
		});

		this.colAttrs.forEach((colAttr) => {
			colKey.push(record[colAttr] || '');
		});

		const flatRowKey = rowKey.join(' ');
		const flatColKey = colKey.join(' ');

		if (colKey.length > 0) {

			if (!this.colKeysMap[flatColKey]) {

				this.colKeysMap[flatColKey] = this.aggregator();
				this.colKeys.push(colKey);
			}
			this.colKeysMap[flatColKey].push(record);
		}

		if (rowKey.length > 0) {

			if (!this.rowKeysMap[flatRowKey]) {

				this.rowKeysMap[flatRowKey] = this.aggregator();
				this.rowKeys.push(rowKey);
			}
			this.rowKeysMap[flatRowKey].push(record);
		}

		if (colKey.length > 0 && rowKey.length > 0) {

			if (!this.tree[flatRowKey]) {

				this.tree[flatRowKey] = {};
			}

			if (!this.tree[flatRowKey][flatColKey]) {
				this.tree[flatRowKey][flatColKey] = this.aggregator();
			}

			this.tree[flatRowKey][flatColKey].push(record);
		}
	}

	getAggregator(rowKey, colKey) {
		const flatRowKey = rowKey.join(' ');
		const flatColKey = colKey.join(' ');

		if (rowKey.length === 0 && colKey.length === 0) {

			return this.aggregator().push(this.inputData);
		} else if (rowKey.length === 0) {

			return this.colKeysMap[flatColKey];
		} else if (colKey.length === 0) {

			return this.rowKeysMap[flatRowKey];
		} else {

			const branch = this.tree[flatRowKey];

			const Aggregator = branch ? branch[flatColKey] : null;

			return Aggregator || this.defoliate;
		}
	}

	sortColKeys() {
		this.colKeys = this.colKeys.sort(PivotData._comparearray);
	}

	sortRowKeys() {
		this.rowKeys = this.rowKeys.sort(PivotData._comparearray);
	}
}

// Autosearch function 
// As seen at https://github.com/kraaden/autocomplete but modified

function autosearch(settings) {
	let doc = document;
	let container = doc.createElement('div');
	let containerStyle = container.style;
	let userAgent = navigator.userAgent;
	let mobileFirefox = userAgent.indexOf('Firefox') !== -1 && userAgent.indexOf('Mobile') !== -1;
	let debounceWaitMs = settings.debounceWaitMs || 0;
	let keyUpEventName = mobileFirefox ? 'input' : 'keyup';
	let items = [];
	let inputValue = '';
	let minLen = settings.minLength || 2;
	let selected;
	let keypressCounter = 0;
	let debounceTimer;
	if (!settings.input) {
		throw new AppError('input undefined');
	}
	let input = settings.input;
	container.className = 'autosearch' + ((' ' + settings.className) || '');
	containerStyle.position = 'fixed';

	function detach() {
		let parent = container.parentNode;
		if (parent) {
			parent.removeChild(container);
		}
	}

	function clearDebounceTimer() {
		if (debounceTimer) {
			window.clearTimeout(debounceTimer);
		}
	}

	function attach() {
		if (!container.parentNode) {
			doc.body.appendChild(container);
		}
	}

	function containerDisplayed() {
		return !!container.parentNode;
	}

	function clear() {
		keypressCounter++;
		items = [];
		inputValue = '';
		selected = undefined;
		detach();
	}

	function updatePosition() {
		if (!containerDisplayed()) {
			return;
		}
		containerStyle.height = '400px'; // original: auto
		containerStyle.width = input.offsetWidth + 'px';
		let inputRect = input.getBoundingClientRect();
		let top = inputRect.top + input.offsetHeight;
		let maxHeight = window.innerHeight - top;
		if (maxHeight < 0) {
			maxHeight = 0;
		}
		containerStyle.top = top + 'px';
		containerStyle.bottom = '';
		containerStyle.left = inputRect.left + 'px';
		containerStyle.maxHeight = maxHeight + 'px';
		if (settings.customize) {
			settings.customize(input, inputRect, container, maxHeight);
		}
	}

	function update() {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		let render = function(item, currentValue) {
			let itemElement = doc.createElement('div');
			itemElement.textContent = item.label || '';
			return itemElement;
		};
		if (settings.render) {
			render = settings.render;
		}
		let renderGroup = function(groupName, currentValue) {
			let groupDiv = doc.createElement('div');
			groupDiv.textContent = groupName;
			return groupDiv;
		};
		if (settings.renderGroup) {
			renderGroup = settings.renderGroup;
		}
		let fragment = doc.createDocumentFragment();
		let prevGroup = '#9?$';
		items.forEach(function(item) {
			if (item.group && item.group !== prevGroup) {
				prevGroup = item.group;
				let groupDiv = renderGroup(item.group, inputValue);
				if (groupDiv) {
					groupDiv.className += ' group';
					fragment.appendChild(groupDiv);
				}
			}
			let div = render(item, inputValue);
			if (div) {
				div.addEventListener('click', function(ev) {
					settings.onSelect(item, input);
					clear();
					ev.preventDefault();
					ev.stopPropagation();
				});
				if (item === selected) {
					div.className += ' selected';
				}
				fragment.appendChild(div);
			}
		});
		container.appendChild(fragment);
		if (items.length < 1) {
			if (settings.emptyMsg) {
				let empty = doc.createElement('div');
				empty.className = 'empty';
				empty.textContent = settings.emptyMsg;
				container.appendChild(empty);
			} else {
				clear();
				return;
			}
		}
		attach();
		updatePosition();
		updateScroll();
	}

	function updateIfDisplayed() {
		if (containerDisplayed()) {
			update();
		}
	}

	function resizeEventHandler() {
		updateIfDisplayed();
	}

	function scrollEventHandler(e) {
		if (e.target !== container) {
			updateIfDisplayed();
		} else {
			e.preventDefault();
		}
	}

	function keyup(ev) {
		// keyCode: 38 = Up, 13 = Enter, 27 = Esc, 39 = Right, 37 = Left, 16 = Shift, 
		// 17 = Ctrl, 18 = Alt, 20 = CapsLock, 91 = WindowsKey, 9 = Tab, 40 = Down
		let keyCode = ev.which || ev.keyCode || 0;
		let ignore = [38, 13, 27, 39, 37, 16, 17, 18, 20, 91, 9];
		for (let _i = 0, ignore_1 = ignore; _i < ignore_1.length; _i++) {
			let key = ignore_1[_i];
			if (keyCode === key) {
				return;
			}
		}
		// the down key is used to open autosearch
		if (keyCode === 40 && containerDisplayed()) {
			return;
		}
		// if multiple keys were pressed, before we get update from server,
		// this may cause redrawing our autosearch multiple times after the last key press.
		// to avoid this, the number of times keyboard was pressed will be
		// saved and checked before redraw our autosearch box.
		let savedKeypressCounter = ++keypressCounter;
		let val = input.value;
		if (val.length >= minLen) {
			clearDebounceTimer();
			debounceTimer = window.setTimeout(function() {
				settings.fetch(val, function(elements) {
					if (keypressCounter === savedKeypressCounter && elements) {
						items = elements;
						inputValue = val;
						selected = items.length > 0 ? items[0] : undefined;
						update();
					}
				});
			}, debounceWaitMs);
		} else {
			clear();
		}
	}
	/**
	 * Automatically move scroll bar if selected item is not visible
	 */
	function updateScroll() {
		let elements = container.getElementsByClassName('selected');
		if (elements.length > 0) {
			let element = elements[0];
			// make group visible
			let previous = element.previousElementSibling;
			if (previous && previous.className.indexOf('group') !== -1 && !previous.previousElementSibling) {
				element = previous;
			}
			if (element.offsetTop < container.scrollTop) {
				container.scrollTop = element.offsetTop;
			} else {
				let selectBottom = element.offsetTop + element.offsetHeight;
				let containerBottom = container.scrollTop + container.offsetHeight;
				if (selectBottom > containerBottom) {
					container.scrollTop += selectBottom - containerBottom;
				}
			}
		}
	}
	/**
	 * Select the previous item in suggestions
	 */
	function selectPrev() {
		if (items.length < 1) {
			selected = undefined;
		} else {
			if (selected === items[0]) {
				selected = items[items.length - 1];
			} else {
				for (let i = items.length - 1; i > 0; i--) {
					if (selected === items[i] || i === 1) {
						selected = items[i - 1];
						break;
					}
				}
			}
		}
	}
	/**
	 * Select the next item in suggestions
	 */
	function selectNext() {
		if (items.length < 1) {
			selected = undefined;
		}
		if (!selected || selected === items[items.length - 1]) {
			selected = items[0];
			return;
		}
		for (let i = 0; i < (items.length - 1); i++) {
			if (selected === items[i]) {
				selected = items[i + 1];
				break;
			}
		}
	}
	/**
	 * keydown keyboard event handler
	 */
	function keydown(ev) {
		let keyCode = ev.which || ev.keyCode || 0;
		if (keyCode === 38 || keyCode === 40 || keyCode === 27) {
			let containerIsDisplayed = containerDisplayed();
			if (keyCode === 27) {
				clear();
			} else {
				if (!containerDisplayed || items.length < 1) {
					return;
				}
				keyCode === 38 ?
					selectPrev() :
					selectNext();
				update();
			}
			ev.preventDefault();
			if (containerIsDisplayed) {
				ev.stopPropagation();
			}
			return;
		}
		if (keyCode === 13 && selected) {
			settings.onSelect(selected, input);
			clear();
		}
	}
	/**
	 * Blur keyboard event handler
	 */
	function blur() {
		// we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
		setTimeout(function() {
			if (doc.activeElement !== input) {
				clear();
			}
		}, 200);
	}
	/**
	 * This function will remove DOM elements and clear event handlers
	 */
	function destroy() {
		input.removeEventListener('keydown', keydown);
		input.removeEventListener(keyUpEventName, keyup);
		input.removeEventListener('blur', blur);
		window.removeEventListener('resize', resizeEventHandler);
		doc.removeEventListener('scroll', scrollEventHandler, true);
		clearDebounceTimer();
		clear();
		// prevent the update call if there are pending AJAX requests
		keypressCounter++;
	}
	// setup event handlers
	input.addEventListener('keydown', keydown);
	input.addEventListener(keyUpEventName, keyup);
	input.addEventListener('blur', blur);
	window.addEventListener('resize', resizeEventHandler);
	doc.addEventListener('scroll', scrollEventHandler, true);
	return {
		destroy: destroy
	};
}

/* TEST */
// DAG Class
// as seen at https://github.com/cjongseok/dag.js but not so seriously modified
class Dag {
	constructor() {
		this.edges = [];
		this.tagObjs = {};
		this.tagInvertedIndex = {};
	}

	get T() {
		return Object.keys(this.tagObjs)
			.reduce((previous, tag) => previous.concat([tag]), []);
	}

	get E() {
		const edges = [];
		Object.keys(this.edges).forEach((to) => {
			this.edges[to].forEach(edge => edges.push(this.edge(edge.f, to)));
		});
		return edges;
	}

	get V() {
		const verticies = Object.keys(this.edges).reduce((previous, key) => {
			if (this.edges[key].length > 0) {
				if (!previous.includes(key)) {
					previous.push(key);
				}
				this.edges[key].forEach((e) => {
					if (!previous.includes(e.f)) {
						previous.push(e.f);
					}
				});
			}
			return previous;
		}, []);
		return verticies;
	}

	get kind() {
		const tags = this.T;
		return tags.length;
	}

	get order() {
		const verticies = this.V;
		return verticies.length;
	}

	get size() {
		return Object.keys(this.edges).reduce((previous, key) => previous + this.edges[key].length, 0);
	}

	edge(from, to) {
		if (this.edges[to] !== undefined) {
			const edge = this.edges[to].find(e => e.f === from);
			if (edge !== undefined) {
				return {
					from: edge.f,
					to,
					weight: edge.w,
					tags: edge.ts.reduce((previous, tagObject) => previous.concat([tagObject.name]), []),
				};
			}
		}
		return undefined;
	}

	includes(from, to) {
		return this.edge(from, to) !== undefined;
	}

	add(from, to, tags, weight) {
		if (this.testCycle(from, to)) {
			throw new AppError(c`cycle` + ': ' + from + ' -> ' + to);
		}

		let tagArray = tags;
		if (!Array.isArray(tags)) {
			tagArray = [tags];
		}
		tagArray.forEach((tag) => {
			if (!(tag in this.tagObjs)) {
				this.tagObjs[tag] = {
					name: tag
				};
			}
		});

		const edge = {
			f: from,
			w: weight,
			ts: tagArray.reduce((previous, tag) => previous.concat([this.tagObjs[tag]]), []),
		};

		if (this.edges[to] === undefined) {
			this.edges[to] = [];
		}
		this.edges[to].push(edge);
		tagArray.forEach((tag) => {
			if (!(tag in this.tagInvertedIndex)) {
				this.tagInvertedIndex[tag] = {};
			}
			if (!(to in this.tagInvertedIndex[tag])) {
				this.tagInvertedIndex[tag][to] = [];
			}
			this.tagInvertedIndex[tag][to].push(edge);
		});

		return this;
	}

	reverseBFS(start, hitCondition, callback) {
		const q = [start];
		while (q.length > 0) {
			const visit = q.shift();
			if (hitCondition !== undefined && hitCondition(visit)) {
				return visit;
			}
			if (callback !== undefined) {
				callback(visit);
			}
			if (this.edges[visit] !== undefined) {
				this.edges[visit].forEach(e => q.push(e.f));
			}
		}
		return undefined;
	}

	testCycle(from, to) {
		if (from === to) {
			return true;
		}
		const hit = this.reverseBFS(from, v => v === to);
		if (hit === undefined) {
			return false;
		}
		return true;
	}

	clone() {
		const newDag = new Dag();
		Object.keys(this.edges).forEach((key) => {
			newDag.edges[key] = this.edges[key];
		});
		Object.keys(this.tagObjs).forEach((tag) => {
			newDag.tagObjs[tag] = this.tagObjs[tag];
		});
		Object.keys(this.tagInvertedIndex)
			.forEach((tag) => {
				newDag.tagInvertedIndex[tag] = this.tagInvertedIndex[tag];
			});
		return newDag;
	}

	deepClone() {
		const newDag = new Dag();
		Object.keys(this.edges).forEach((to) => {
			this.edges[to].forEach((e) => {
				const tags = e.ts.reduce((previous, tagObj) => previous.concat([tagObj.name]), []);
				newDag.add(e.f, to, tags, e.w);
			});
		});

		return newDag;
	}

	edgesFrom(from) {
		const dag = new Dag();
		Object.keys(this.edges).forEach((key) => {
			this.edges[key].forEach((e) => {
				if (e.f === from) {
					const cloned = {
						from: e.f,
						to: key,
						weight: e.w
					};
					cloned.tags = e.ts.reduce((previous, tagObject) => previous.concat([tagObject.name]), []);
					dag.add(cloned.from, cloned.to, cloned.tags, cloned.weight);
				}
			});
		});
		return dag;
	}

	edgesTo(to) {
		if (undefined === this.edges[to]) {
			return new Dag();
		}
		const dag = new Dag();
		this.edges[to].forEach((e) => {
			const cloned = {
				from: e.f,
				to,
				weight: e.w
			};
			cloned.tags = e.ts.reduce((previous, tagObject) => previous.concat([tagObject.name]), []);
			dag.add(cloned.from, cloned.to, cloned.tags, cloned.weight);
		});
		return dag;
	}

	neighbourhood(vertex) {
		const dag = this.edgesFrom(vertex);
		if (undefined === this.edges[vertex]) {
			return dag;
		}
		this.edges[vertex].forEach((e) => {
			const cloned = {
				from: e.f,
				to: vertex,
				weight: e.w
			};
			cloned.tags = e.ts.reduce((previous, tagObject) => previous.concat([tagObject.name]), []);
			dag.add(cloned.from, cloned.to, cloned.tags, cloned.weight);
		});
		return dag;
	}

	tagOrder(tag) {
		if (!(tag in this.tagInvertedIndex)) {
			return 0;
		}

		const verticies = Object.keys(this.tagInvertedIndex[tag]).reduce((previous, to) => {
			if (this.tagInvertedIndex[tag][to].length > 0) {
				if (!previous.includes(to)) {
					previous.push(to);
				}
				this.tagInvertedIndex[tag][to].forEach((e) => {
					if (!previous.includes(e.f)) {
						previous.push(e.f);
					}
				});
			}
			return previous;
		}, []);

		return verticies.length;
	}

	tagSize(tag) {
		if (!(tag in this.tagInvertedIndex)) {
			return 0;
		}

		return Object.keys(this.tagInvertedIndex[tag])
			.reduce((count, to) => count + this.tagInvertedIndex[tag][to].length, 0);
	}

	tagKind(tag) {
		if (!(tag in this.tagInvertedIndex)) {
			return 0;
		}

		const tags = Object.keys(this.tagInvertedIndex[tag]).reduce((previous, to) => {
			if (this.tagInvertedIndex[tag][to].length > 0) {
				this.tagInvertedIndex[tag][to].forEach((e) => {
					e.ts.forEach((tagObj) => {
						if (!previous.includes(tagObj.name)) {
							previous.push(tagObj.name);
						}
					});
				});
			}
			return previous;
		}, [tag]);

		return tags.length;
	}

	filterByTag(tag) {
		if (!(tag in this.tagInvertedIndex)) {
			return undefined;
		}
		const filteredEdges = this.tagInvertedIndex[tag];

		const filtered = new Dag();
		Object.keys(filteredEdges).forEach((to) => {
			filteredEdges[to].forEach((edge) => {
				const cloned = {
					from: edge.f,
					to,
					tags: [],
					weight: undefined
				};
				cloned.tags = edge.ts.reduce((previous, tagObj) => previous.concat([tagObj.name]), []);
				filtered.add(cloned.from, cloned.to, cloned.tags, cloned.weight);
			});
		});

		return filtered;
	}

	removeEdge(from, to) {
		if (!(to in this.edges)) {
			return this;
		}

		const targetIndex = this.edges[to].findIndex(e => e.f === from);
		if (targetIndex === -1) {
			return this;
		}
		const removed = this.edges[to].splice(targetIndex, 1)[0];
		if (this.edges[to].length === 0) {
			delete this.edges[to];
		}

		removed.ts.forEach((tagObj) => {
			this.tagInvertedIndex[tagObj.name][to] =
				this.tagInvertedIndex[tagObj.name][to].filter(edge => edge.f !== from);
			if (this.tagInvertedIndex[tagObj.name][to].length === 0) {
				delete this.tagInvertedIndex[tagObj.name][to];
			}
		});

		removed.ts.forEach((tagObj) => {
			if (this.tagSize(tagObj.name) === 0) {
				delete this.tagObjs[tagObj.name];
				delete this.tagInvertedIndex[tagObj.name];
			}
		});

		return this;
	}

	removeVertex(vertex) {
		if (vertex in this.edges) {
			delete this.edges[vertex];

			Object.keys(this.tagInvertedIndex).forEach((tag) => {
				delete this.tagInvertedIndex[tag][vertex];
			});
		}

		Object.keys(this.edges).forEach((to) => {
			const tagsToRemove = [];
			this.edges[to] = this.edges[to].filter((e) => {
				e.ts.forEach((tagObj) => {
					if (!tagsToRemove.includes(tagObj.name)) {
						tagsToRemove.push(tagObj.name);
					}
				});
				return e.f !== vertex;
			});
			if (this.edges[to].length === 0) {
				delete this.edges[to];
			}

			tagsToRemove.forEach((tag) => {
				this.tagInvertedIndex[tag][to] = this.tagInvertedIndex[tag][to].filter(e => e.f !== vertex);
				if (this.tagInvertedIndex[tag][to].length === 0) {
					delete this.tagInvertedIndex[tag][to];
				}
			});
		});

		Object.keys(this.tagObjs).forEach((tag) => {
			if (this.tagSize(tag) === 0) {
				delete this.tagObjs[tag];
				delete this.tagInvertedIndex[tag];
			}
		});

		return this;
	}
}

function graphToDAG(vertices, incoming, outgoing, getFrom, getTo) {
	getFrom = getFrom || function(edge) { return edge[0]; }
	getTo = getTo || function(edge) { return edge[1]; }

	vertices = new Set(vertices)
	const toFlip = new Set()
	const lhs = new Set()
	const rhs = new Set()

	function removeSourceOrSink(vertices, incoming, into, getAttr) {
		for (var vertex of vertices) {
			var edges = incoming.get(vertex)
			if (!edges) {
				vertices.delete(vertex)
				into.add(vertex)
				continue
			}
			var ok = false
			for (var edge of edges) {
				if (vertices.has(getAttr(edge))) {
					ok = true
					break
				}
			}
			if (!ok) {
				vertices.delete(vertex)
				into.add(vertex)
				continue
			}
		}
	}
	
	while (vertices.size) {
		removeSourceOrSink(vertices, outgoing, rhs, getTo)
		removeSourceOrSink(vertices, incoming, lhs, getFrom)
		if (vertices.size) {
			var max = -Infinity
			var maxVertex = null
			for (let vertex of vertices) {
				var diff = outgoing.get(vertex).size - incoming.get(vertex).size
				if (diff > max) {
					max = diff
					maxVertex = vertex
				}
			}
			vertices.delete(maxVertex)
			lhs.add(maxVertex)
		}
	}
	for (let vertex of lhs) {
		for (let edge of outgoing.get(vertex)) {
			if (rhs.has(getTo(edge))) {
				toFlip.add(edge)
			}
		}
	}

	return toFlip
}


