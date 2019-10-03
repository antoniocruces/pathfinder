'use strict';

/* global ajax, AppError, AppWarning, byId, c, cfetch, charts, d, dbe, dbm, dbq, dbs, echarts, fc, file, gscreen, ic, isBlank, isNil, isNumber, isVisible, k, l, maps, PivotData, sleep, stats, toolkit */
/* exported ui */

// user interface
const ui = {
	maketable: (options, useoverlay = false) => {
		let oover = byId('siteoverlay');
		let otext = byId('siteoverlaytext');
		oover = otext = undefined;
		if(useoverlay) {
			gscreen.siteoverlay(true);
		}
		sleep(50).then(() => {
			if(!dbe.verifytables()) {
				if(useoverlay) gscreen.siteoverlay(false);
				throw new AppError(c`no-data`);
			}
			let paginate = (array, page_size, page_number) => {
				let totalpages = Math.ceil(array.length / page_size);
				let currentpage = page_number.clamp(1, totalpages);
				d.currentpages[options.type] = currentpage;
				--currentpage; 
				return {
					totalpages: totalpages,
					subset: array.slice(currentpage * page_size, (currentpage + 1) * page_size),
					firstindex: (currentpage * page_size) + 1,
					currentpage: currentpage + 1,
					previouspage: currentpage === 0 ? 0 : currentpage - 1,
					nextpage: currentpage === totalpages ? currentpage : currentpage + 1,
				};
			};
			let pageselector = (lastnumber, current) => {
				current = undefined;
				let selectlabel = document.createElement('label'); 
				selectlabel.classList.add('select');
				selectlabel.setAttribute('for', options.type + '-page-selector');
				let selectlist = document.createElement('select');
				selectlist.id = options.type + '-page-selector';
				let array = Array.from({length: lastnumber}, (v, k) => k + 1);
				for(let i = 0, len = array.length; i < len; i++) {
					let option = document.createElement('option');
					option.setAttribute('value', array[i]);
					option.text = `${c`page`} ${Number(array[i]).toLocaleString(l)}`;
					option.selected = array[i] === d.currentpages[options.type];
					selectlist.appendChild(option);
					option = undefined;
				}
				selectlist.classList.add('plain-select');
				selectlabel.appendChild(selectlist);
				array = selectlist = undefined;
				
				return selectlabel;
			};
			let pagerange = (lastnumber, current) => {
				let range = document.createElement('input');
				range.id = options.type + '-page-range';
				range.type = 'range';
				range.min = 1;
				range.max = lastnumber;
				range.value = current;
				range.step = 1;
				range.classList.add('info');
				return range;
			};
			let pagesize = () => {
				let selectlabel = document.createElement('label'); 
				selectlabel.classList.add('select');
				selectlabel.setAttribute('for', options.type + '-page-size');
				let selectlist = document.createElement('select');
				selectlist.id = options.type + '-page-size';
				let array = Array.from(Array(10).keys()).map(i => 10 + i * 10);
				for(let i = 0, len = array.length; i < len; i++) {
					let option = document.createElement('option');
					option.setAttribute('value', array[i]);
					option.text = `${Number(array[i]).toLocaleString(l)} ${c`per-page`}`;
					option.selected = array[i] === window.settings.listrowsperpage;
					selectlist.appendChild(option);
					option = undefined;
				}
				selectlist.classList.add('plain-select');
				selectlabel.appendChild(selectlist);
				array = selectlist = undefined;
				
				return selectlabel;
			};
			let align = (typ, txt) => {
				let statslist = [c`count`.uf(), 'Z', 'O', 'L', 'S', 'B', 'F', 'T'];
				if(typ === 'th') {
					return `text-align-center${statslist.includes(txt) ? ' color-info' : ''}`;
				} else {
					return isNumber(txt) ? 'text-align-right' : 
						String(txt).includes('"empty-square"') || String(txt).includes('"square"') ? 'text-align-center' : 'text-align-left';
				}
			};
			let makecelltext = (typ, txt, pag = 1, cll = null, opt = null) => {
				if(typ === 'th') {
					let iscol = Math.abs(opt.pgparams.srt) === (cll + 1);
					let isneg = opt.pgparams.srt < 0;
					let srt = isneg ? cll + 1 : (cll + 1) * -1;
					let color = srt < 0 ? 'error' : 'success';
					let blacklist = d.statscolumns.map(o => c(o).uf());
					return blacklist.includes(txt) ? txt : [
						`<a `, 
						`href="javascript:${opt.pgfunction}(`,
						`'${opt.pgparams.cid}',`,
						`${pag},`,
						`'${opt.pgparams.row}',`,
						`'${opt.searchtext}',`,
						`${srt}`,
						`)">${txt}</a>`,
						`&nbsp;`, 
						`${iscol ? 
							'<span class="no-print color-' + color + '">' : 
							'<span class="no-print color-orange">'}`,
						`${iscol ? ([-1, -0].includes(Math.sign(srt)) ? '&#8648;' : '&#8650;') : '&#8645;'}`,
						`</span>`,
					].join('');
				} else {
					return txt;
				}
			};
			let pagedata = paginate(options.items, window.settings.listrowsperpage, options.page);
			d.currentpages[options.type] = pagedata.currentpage;
			
			if(pagedata.subset.length) {
				let subset = pagedata.subset.map(o => Object.values(options.generatorfn(o)));
				let headings = Object.keys(options.generatorfn(pagedata.subset[0])).map(o => fc(o).uf());
				let getCells = (data, type, opt) => data.map((cell, cellid) => [
					`<${type} class="${align(type, cell)}">`,
					`${makecelltext(type, cell, pagedata.currentpage, cellid, opt)}`,
					`</${type}>`
				].join('')).join('');
				let createBody = data => data.map(row => `<tr>${getCells(row, 'td')}</tr>`).join('');
				let createTable = data => {
					const [headings, ...rows] = data;
					return [
						`<p id="${options.type + '-'}page-stats"></p>`,
						
						`<ul class="boxes boxes-three-cols margin-top-l">`,
						`<li>`,
						`<div class="ddown">`,
						`<span id="${options.type + '-'}pg4"></span>`,
						`<div class="ddown-content padding-xs box-shadow-xxl background-white">`, 
						`<p class="no-margin-bottom">`,
						`<span id="${options.type + '-'}pg1"></span>`, 
						`</p>`,
						`<p class="no-margin-bottom">`,
						`<span id="${options.type + '-'}pg2"></span>`, 
						`</p>`,
						`<p class="no-margin-bottom" id="${options.type + '-'}pg6"></p>`, 
						`<p class="no-margin-bottom">`,
						`${c`scale`.uf()}:<br>0% `,
						`<small>${toolkit.colormicrolegend(window.settings.scalecolorbase)}</small> 100%`,
						`</p>`,						
						`<p class="no-margin-bottom" id="${options.type + '-'}pgx"></p>`, 
						`<p class="no-margin-bottom" id="${options.type + '-'}pgp"></p>`, 
						`</div>`,
						`</div>`,
						`<span id="${options.type + '-'}pg5"></span>`,
						`</li>`,
						
						`<li class="text-align-center">`,
						`<div class="button-group">`,
						`<button class="button" ${pagedata.currentpage === 1 ? ' disabled' : ''} `,
						`onclick="javascript:${options.pgfunction}(`,
						`'${options.pgparams.cid}',`,
						`${pagedata.previouspage + 1}, `,
						`'${options.pgparams.row}',`,
						`'${options.searchtext}', `,
						`${options.pgparams.srt}`,
						`)">`, 
						`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
						`<path class="arrowleft" d=""></path>`,
						`</svg>`,
						`</button>`,
						`<button class="button" disabled>`,
						`<span id="${options.type + '-'}pg3"></span> `,
						`</button>`,
						`<button class="button"${pagedata.nextpage === pagedata.totalpages ? ' disabled' : ''} `,
						`onclick="javascript:${options.pgfunction}(`,
						`'${options.pgparams.cid}',`,
						`${pagedata.nextpage + 1}, `,
						`'${options.pgparams.row}',`,
						`'${options.searchtext}', `,
						`${options.pgparams.srt}`,
						`)">`, 
						`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
						`<path class="arrowright" d=""></path>`,
						`</svg>`,
						`</button>`,
						`</div>`,
						`</li>`,
						
						`<li class="text-align-right">`,
						`<div class="input-group pull-right">`,
						`<input id="${options.type + '-'}text-search" name="text-search" `,
						`class="input-s pull-right plain-search" type="search" `,
						`placeholder="${c`intro-to-search`}..." value="${options.searchtext}" />`,
						`<button class="button button-s" type="submit">···</button>`,
						`</div>`,
						`</li>`,
						
						`</ul>`,

						`<div id="${options.type + '-'}tablecontainer" class="table-responsive">`, 
						`<table id="${options.type + '-'}table"`,
						headings.length > 4 ? ' class="font-size-s">' : '>',
						`<caption id="${options.type + '-'}page-caption"></caption>`, 
						`<thead>${getCells(headings, 'th', options)}</thead>`,
						`<tbody>${createBody(rows)}</tbody>`,
						`</table>`,
						`</div>`,
					].join('');
				};
		
				toolkit.cleardomelement(options.cid);

				let tmptbl = createTable([headings, ...subset]);

				toolkit.msg(options.cid, '');
				
				byId(options.cid).insertAdjacentHTML('beforeend', tmptbl);
				
				let poslabel = [
					`${c`records`.uf()}: ${options.items.length.toLocaleString(l)}. `,
					`(<span id="${options.type + '-'}page-firstindex">${pagedata.firstindex.toLocaleString(l)}</span> `, 
					`${c`to`} `, 
					`<span id="${options.type + '-'}page-lastindex">`,
					`${(pagedata.firstindex + pagedata.subset.length - 1).toLocaleString(l)}`,
					`</span>)`,
				].join('');
				
				toolkit.msg(
					options.type + '-pg3', 
					`<span id="${options.type + '-'}page-current">${pagedata.currentpage.toLocaleString(l)}</span>`
				);
				toolkit.msg(options.type + '-pg5', ` ${pagedata.totalpages.toLocaleString(l)}`);
				toolkit.msg(
					options.type + '-pgx', 
					[
						`<a id="${options.type}-pgxbutton" `,
						`class="button button-tertiary button-block button-icon" `,
						`href="javascript:;">`,
						`<span> `,
						`${c`export`.uf() + '&hellip;'}`,
						`</span>`,
						`<svg width="22" height="22" viewBox="0 0 24 24" class="svgicon">`,
						`<path class="download" d=""></path>`,
						`</svg>`,
						`</a>`,
					].join('')
				);
				toolkit.msg(
					options.type + '-pgp', 
					[
						`<a id="${options.type}-pgxbutton" `,
						`class="button button-grey button-block button-icon" `,
						`href="javascript:toolkit.printfast('${options.type + '-'}tablecontainer');">`,
						`<span>`,
						`${c`print`.uf() + '&hellip;'}`,
						`</span>`,
						`<svg width="22" height="22" viewBox="0 0 24 24" class="svgicon">`,
						`<path class="printer" d=""></path>`,
						`</svg>`,
						`</a>`,
					].join('')
				);
				byId(options.type + '-pg3').dataset.value = pagedata.currentpage;
				byId(options.type + '-pg5').dataset.value = pagedata.totalpages;
				toolkit.msg(options.type + '-pg6', poslabel);
				byId(options.type + '-pg1').appendChild(pagesize());
				byId(options.type + '-pg2').appendChild(pageselector(pagedata.totalpages, d.currentpages[options.type]));
				byId(options.type + '-pg4').appendChild(pagerange(pagedata.totalpages, d.currentpages[options.type]));
	
				byId(options.type + '-page-size').addEventListener(
					'change', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				byId(options.type + '-page-selector').addEventListener(
					'change', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				byId(options.type + '-page-range').addEventListener(
					'change', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				byId(options.type + '-page-range').addEventListener(
					'input', 
					options.updatepagefn, 
					{capture: false, passive: true}
				);

				byId(options.type + '-text-search').addEventListener(
					'search', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				
				byId(options.type + '-text-search').addEventListener(
					'blur', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				
				byId(options.type + '-pgxbutton').addEventListener(
					'click', 
					options.exportfn, 
					{capture: false, passive: true}
				);
				
				if(!isBlank(options.caption)) {
					toolkit.msg(options.type + '-page-caption', options.caption);
				}
				
				if(!isBlank(options.stats)) {
					toolkit.msg(options.type + '-page-stats', options.stats);
				}
				
				toolkit.drawicons();		
				subset = headings = getCells = createBody = createTable = undefined;
			} else {
				toolkit.msg(
					options.cid, 
					[
						`<ul class="boxes boxes-three-cols margin-top-l">`,
						
						`<li>&nbsp;</li>`,
						`<li>&nbsp;</li>`,
						
						`<li class="text-align-right">`,
						`<input type="search" name="text-search" class="pull-right plain-search" `,
						`id="${options.type + '-'}text-search" `,
						`placeholder="${c`intro-to-search`}..." value="${options.searchtext}">`,
						`</li>`,

						`</ul>`,
						
						`<div id="${options.type + '-'}tablecontainer" class="table-responsive">`, 
						`<p class="text-align-center color-error">${c`no-data`.uf()}</p>`,
						`</div>`,
					].join('')
				);

				byId(options.type + '-text-search').addEventListener(
					'search', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				
				byId(options.type + '-text-search').addEventListener(
					'blur', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				
				if(!isBlank(options.caption)) {
					toolkit.msg(options.type + '-page-caption', options.caption);
				}
			}
			if(useoverlay) gscreen.siteoverlay(false);
			
			paginate = pageselector = pagesize = pagerange = pagedata = undefined;
			align = makecelltext = undefined;
		});
	},

	makepivottable: (pivotData, opts) => {
		let renderOptions = {
			isShowAttr: true,
			isShowCount: false,
		};
		renderOptions = Object.assign(renderOptions, opts);
	
		let colAttrs = pivotData.colAttrs;
		let rowAttrs = pivotData.rowAttrs;
		let colKeys = pivotData.colKeys;
		let rowKeys = pivotData.rowKeys;
	
		let pivotWrapper = document.createElement('div');
		pivotWrapper.setAttribute('class', 'table-responsive');

		let pivotTable = document.createElement('table');
		pivotTable.setAttribute('class', 'font-size-s');
		pivotTable.setAttribute('id', 'pivot-table');
		
		let tcaption = document.createElement('caption');
		tcaption.innerHTML = [
			`<p class="text-align-right">`,
			`<a id="pivot-table-export" `,
			`class="button button-tertiary button-icon button-border" `,
			`href="javascript:`,
			`file.exportdatatocsv(file.tabletoarray(byId(\'pivot-table\')),\'\\t\',false);`,
			`">`,
			`<span> `,
			`${c`export`.uf() + '&hellip;'}`,
			`</span>`,
			`<svg width="22" height="22" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="download" d=""></path>`,
			`</svg>`,
			`</a>`,
			`</p>`,
		].join('');

		pivotTable.appendChild(tcaption);

		let thead = document.createElement('thead');
		thead.setAttribute('class', 'font-weight-semibold');
	
		for (let iColAttrs = 0, lenColAttrs = colAttrs.length; iColAttrs < lenColAttrs; iColAttrs++) {
			let tr = document.createElement('tr');
			
			if (iColAttrs === 0) {
				if (rowAttrs.length > 0) {
					let th = document.createElement('th');
					th.setAttribute('colspan', rowAttrs.length);
					th.setAttribute('rowspan', colAttrs.length);
					tr.appendChild(th);
				}
				if (rowAttrs.length === 0 && renderOptions.isShowCount && !renderOptions.isShowAttr) {
					let th = document.createElement('th');
					th.setAttribute('rowspan', colAttrs.length);
					tr.appendChild(th);
				}
			}
	
			if (renderOptions.isShowAttr) {
				let th = document.createElement('th');
				th.textContent = fc(String(colAttrs[iColAttrs]));
				tr.appendChild(th);
			}
	
			for (let i = 0, len = colKeys.length; i < len; i++) {
				let colSpan = PivotData._spansize(colKeys, i, iColAttrs);
				if (colSpan !== -1) {
					let th = document.createElement('th');
					th.textContent = fc(String(colKeys[i][iColAttrs]));
					th.setAttribute('colspan', colSpan);
					if (renderOptions.isShowAttr && rowAttrs.length > 0 && iColAttrs === lenColAttrs - 1) {
						th.setAttribute('rowspan', 2);
					}
					tr.appendChild(th);
				}
			}
	
			if (iColAttrs === 0 && renderOptions.isShowCount) {
				let th = document.createElement('th');
				th.textContent = c`total`.uf();
				th.setAttribute('rowspan', colAttrs.length + (rowAttrs.length === 0 ? 0 : 1));
				tr.appendChild(th);
			}
	
			thead.appendChild(tr);
		}
	
		if (renderOptions.isShowAttr && rowAttrs.length > 0) {
			let tr = document.createElement('tr');
			for (let i = 0, len = rowAttrs.length; i <= len; i++) {
				let th = document.createElement('th');
				th.textContent = rowAttrs[i] ? fc(String(rowAttrs[i])) : '/';
				if(!rowAttrs[i]) th.setAttribute('class', 'text-align-center');
				tr.appendChild(th);
			}
	
			if (colAttrs.length === 0 && renderOptions.isShowCount) {
				let th = document.createElement('th');
				th.textContent = c`total`.uf();
				tr.appendChild(th);
			}
	
			thead.appendChild(tr);
		}
	
		pivotTable.appendChild(thead);
	
		let tbody = document.createElement('tbody');
	
		for (let iRowKeys = 0, lenRowKeys = rowKeys.length; iRowKeys < lenRowKeys; iRowKeys++) {
			let tr = document.createElement('tr');
			for (let i = 0, len = rowKeys[iRowKeys].length; i < len; i++) {
				let rowSpan = PivotData._spansize(rowKeys, iRowKeys, i);
				if (rowSpan !== -1) {
					let th = document.createElement('th');
					th.textContent = rowKeys[iRowKeys][i];
					th.setAttribute('rowspan', rowSpan);
	
					if (renderOptions.isShowAttr && colAttrs.length > 0 && i === len - 1) {
						th.setAttribute('colspan', 2);
					}
	
					tr.appendChild(th);
				}
			}
	
			for (let i = 0, len = colKeys.length; i < len; i++) {
				let td = document.createElement('td');
				td.setAttribute('class', 'text-align-right');
				td.innerHTML = pivotData.getAggregator(rowKeys[iRowKeys], colKeys[i]).format();
	
				tr.appendChild(td);
			}
	
			if (renderOptions.isShowCount) {
				let td = document.createElement('td');
				td.setAttribute('class', 'text-align-right');
				td.innerHTML = pivotData.getAggregator(rowKeys[iRowKeys], []).format();
				tr.appendChild(td);
			}
	
			tbody.appendChild(tr);
		}
	
		pivotTable.appendChild(tbody);
	
		if (renderOptions.isShowCount) {
			let tr = document.createElement('tr');
			let th = document.createElement('th');
			th.textContent = c`total`;
			th.setAttribute('colspan', rowAttrs.length + (colAttrs.length === 0 || !renderOptions.isShowAttr ? 0 : 1));
			tr.appendChild(th);
	
			for (let i = 0, len = colKeys.length; i < len; i++) {
				let td = document.createElement('td');
				td.innerHTML = pivotData.getAggregator([], colKeys[i]).format();
				td.setAttribute('class', 'text-align-right');
				tr.appendChild(td);
			}
	
			let td = document.createElement('td');
			td.setAttribute('class', 'text-align-right');
			td.innerHTML = pivotData.getAggregator([], []).format();
			tr.appendChild(td);
	
			pivotTable.appendChild(tr);
		}
	
		pivotWrapper.appendChild(pivotTable);
		return pivotWrapper;
	},

	makestats: arr => {
		let stats = dbs.stats(arr) || {};
		let len = Object.keys(stats).length;
		return {
			total: len ? stats.sum : null,
			rows: len ? stats.size : null,
			average: len ? stats.mean : null,
			min: len ? stats.min : null,
			max: len ? stats.max : null,
			meaningful: len ? stats.outliers.length : null,
			lowlimit: len ? stats.lowlimit : null,
			highlimit: len ? stats.highlimit : null,
			range: len ? stats.range : null,
			midrange: len ? stats.midrange : null,
			rowmeaning: len ? arr._intersection(stats.outliers).length : null,
			outliers: len ? stats.outliers : [],
			zscores: len ? stats.zscores : [],
			zscoresmap: len ? stats.zscoresmap : [],
			modes: len ? stats.modes : [],
			scb: window.settings.scalecolorbase,
		};
	},
	datalist: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false) => {
		if(!dbe.verifytables()) return;
		if(!gscreen.siteoverlayisset) {
			gscreen.siteoverlay(true);
		}
		sleep(50).then(() => {
			let posfilter;
			let taxfilter;
			let result = null;
			if(!isBlank(text)) {
				posfilter = Object.values(d.store.pos)
					.filter(o => dbe._operation('li', o.value, text))
					.map(o => o.ID);
				taxfilter = Object.values(d.store.tax)
					.filter(o => dbe._operation('li', o.value, text))
					.map(o => o.ID);
				result = Array.from(new Set([...posfilter, ...taxfilter]));
			} else {
				result = dbe._filterids();
			}
			let setresult = new Set(result);
			posfilter = taxfilter = result = undefined;
			
			let rowsfields = ['type', 'title', 'taxonomies'];
			let descending = srt < 0 ? '-' : ''; 
			let tmp = dbe._filterids();
			let sortedlist = tmp.map(o => ({
				ID: o,
				type: c(d.store.pos[o].rkey).uf(),
				title: toolkit.titleformat(d.store.pos[o].value),
				taxonomies: d.store.tax[o] ? 
					d.store.tax[o].sortBy(['value']).map(m => m.value).join('. ') : 
					'',
			})).sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
			
			rowsfields = descending = tmp = undefined;
			
			if(xprt) {
				file.exportdatatocsv(sortedlist.filter(o => setresult.has(o.ID)));
				if(gscreen.siteoverlayisset) {
					gscreen.siteoverlay(false);
				}
				return;
			}

			let opts = {
				cid: 'data-listing',
				type: 'list',
				page: Number(page) || d.currentpages.list,
				items: sortedlist.map(o => o.ID).filter(o => setresult.has(o)), 
				searchtext: text,
				pgfunction: 'ui.datalist',
				pgparams: {
					cid: '',
					row: '',
					srt: srt,
				},
				generatorfn: function(id) {
					let str1 = !isBlank(text) ? 
						toolkit.highlight(toolkit.titleformat(d.store.pos[id].value), text) : 
						toolkit.titleformat(d.store.pos[id].value);
					let str2 = d.store.tax[id] ? 
						d.store.tax[id].sortBy(['value']).map(m => m.value).join('. ') : 
						'';
					if(!isBlank(text)) str2 = toolkit.highlight(str2, text);
					return {
						type: [
							`<span style="color:${d.store.pos[id].color}">`, 
							`${c(d.store.pos[id].rkey).uf()}`,
							`</span>`,
						].join(''),
						title: [
							`<a href="javascript:ui.singlerecord(${id},${id},true);">`,
							`${str1}</a>`,
						].join(''),
						taxonomies: str2,
					};
				},
				selectorfn: function(sel) {
					let nodata = !byId('list-page-selector') || 
						!byId('list-page-range') || 
						!byId('list-page-size') || 
						!byId('list-page-current') || 
						!byId('list-pg3');
					if(nodata) {
						ui.datalist(null, 1, null, byId('list-text-search').value, srt);
						nodata = undefined;
					} else {
						window.settings.listrowsperpage = Number(byId('list-page-size').value);
						let numpager = ['list-page-selector', 'list-page-range'].includes(sel.target.id) ? 
							Number(sel.target.value) : 
							Number(byId('list-page-selector').value);
						ui.datalist(null, numpager, null, byId('list-text-search').value, srt);
						toolkit.msg('list-page-current', Number(byId('list-pg3').dataset.value).toLocaleString(l));
						numpager = nodata = undefined;
					}
				},
				updatepagefn: function(sel) {
					toolkit.msg('list-page-current', Number(sel.target.value).toLocaleString(l));
					byId('list-pg3').dataset.value = Number(sel.target.value);
				},
				exportfn: function() {
					ui.datalist(cid, page, row, text, srt, true);
				},
			};
			if(gscreen.siteoverlayisset) gscreen.siteoverlay(false);	
			ui.maketable(opts, true);
			opts = sortedlist = undefined;
		});
	},
	singlerecord: (cid, trail, clearchain) => {
		gscreen.siteoverlay(true);
		toolkit.timer('ui.singlerecord');
		toolkit.statustext(true);
		sleep(50).then(() => {
			cid = parseInt(cid, 10);
			clearchain = clearchain || false;
			if(clearchain) d.singlechain = [];
			if(typeof trail === 'undefined') {
				d.singlechain.pop();
			} else {				
				if(parseInt(cid, 10) !== parseInt(trail, 10)) d.singlechain.push(parseInt(trail, 10));
			}
			let prv = d.singlechain[d.singlechain.length - 1] || null;

			let pos = d.store.pos[cid];
			let tax = d.store.tax[cid] ? d.store.tax[cid]
				.sort((a, b) => String(a.value).localeCompare(String(b.value)))
				.groupBy('rkey') : 
				[];
			let met = d.store.met[cid] ? d.store.met[cid]
				.filter(o => !d.relatives.includes(o.rkey))
				.sort((a, b) => dbe._comparable(a).localeCompare(dbe._comparable(b)))
				.groupBy('rkey') : 
				[];
			let rel = (dbm.relations(true)[cid] || [])
				.map(o => Object.assign({}, o, {
					rname: d.store.pos[o.RID] ? toolkit.titleformat(d.store.pos[o.RID].value) : null,
					rptype: d.store.pos[o.RID] ? d.store.pos[o.RID].rkey : null,
					rpcolor: d.store.pos[o.RID] ? d.store.pos[o.RID].color : null
				}))
				.sort((a, b) => String(a.rname).localeCompare(String(b.rname)))
				.groupBy('rkey');
			let tit = [c`tax`, c`met`, c`rel`];
			let out = [];

			out.push('<div class="group group-xs margin-top-s margin-bottom-s no-print">');
			out.push('<ul>');

			let net = (dbm.relations(true)[cid] || []);

			out.push([
				`<li>`,
				`<a id="s-stab-zero" class="button button-s button-light" `,
				`href="javascript:toolkit.selecttab('stab', 'zero');">`,
				`${c`record`.uf()}</a>`,
				`</li>`,
				`<li>`,
				`<div class="ddown">`,
				`<a href="javascript:;" id="menuLink1"  class="button button-s button-light">${c`analysis`.uf()}</a>`,
				`<div class="ddown-content padding-xs box-shadow-xxl background-white no-margin-top">`,
			].join(''));
			if(net.length) {
				out.push([
					`<p class="no-margin-bottom">`,
					`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
					`<path class="piechart" d=""></path>`,
					`</svg>`,
					`<a class="text-decoration-none" id="s-stab-one" href="javascript:toolkit.selecttab('stab', 'one');`,
					`ui.singletimeline(${cid})">`,
					`${c`timeline`.uf()}</a>`,
					`</p>`,
					`<p class="no-margin-bottom">`,
					`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
					`<path class="piechart" d=""></path>`,
					`</svg>`,
					`<a class="text-decoration-none" id="s-stab-two" href="javascript:toolkit.selecttab('stab', 'two');`,
					`ui.singlegeogram(${cid})">`,
					`${c`geoline`.uf()}</a>`,
					`</p>`,
					`<p class="no-margin-bottom">`,
					`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
					`<path class="share2" d=""></path>`,
					`</svg>`,
					`<a class="text-decoration-none" id="s-stab-three" href="javascript:toolkit.selecttab('stab', 'three');`,
					`ui.singlenetwork(${cid})">`,
					`${c`network`.uf()}</a>`,
					`</p>`,
					`<p class="no-margin-bottom">`,
					`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
					`<path class="piechart" d=""></path>`,
					`</svg>`,
					`<a class="text-decoration-none" id="s-stab-four" href="javascript:toolkit.selecttab('stab', 'four');`,
					`ui.singletaxogram(${cid})">`,
					`${c`taxogram`.uf()}</a>`,
					`</p>`,
				].join(''));
			}
			out.push([
				`<p class="no-margin-bottom">`,
				`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
				`<path class="percent" d=""></path>`,
				`</svg>`,
				`<a class="text-decoration-none" id="s-stab-five" href="javascript:toolkit.selecttab('stab', 'five');`,
				`ui.singlestats(${cid})">${c`stats`.uf()}</a>`,
				`</p>`,
			].join(''));
			if(dbm.points(true)[cid]) {
				out.push([
					`<p class="no-margin-bottom">`,
					`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
					`<path class="globe" d=""></path>`,
					`</svg>`,
					`<a class="text-decoration-none" id="s-stab-six" href="javascript:toolkit.selecttab('stab', 'six');`,
					`ui.singlemap(${cid})">${c`maps`.uf()}</a>`,
					`</p>`,
				].join(''));
			}
			out.push([
				`</div>`,
				`</div>`,
				`</li>`,
			].join(''));
			out.push([
				`<li>`,
				`<div class="ddown">`,
				`<a href="javascript:;" id="menuLink1" class="button button-s button-light">${c`legend`.uf()}</a>`,
				`<div class="ddown-content padding-xs box-shadow-xxl background-white">`,
				`<p class="no-margin-bottom">`,
				`${c`ID`.uf()}: `,
				`<span class="empty-square background-${dbe.getbcolorfromslug(pos.rkey)}"></span> ${cid}, `,
				`${c(pos.rkey)}`,
				`</p>`,
				`<fieldset>`,
				`<legend class="no-margin-vertical">`,
				`${c`record-type`.uf()}`,
				`</legend>`,
				`<p class="no-margin-vertical">`,
				`${toolkit.posttypelegend().join('<br />')}`,
				`</p>`, 
				`</fieldset>`,

				`</div>`,
				`</div>`,
				`</li>`,
			].join(''));

			if(prv) {
				out.push([
					`<li>`,
					`<a class="button button-s button-grey" href="javascript:ui.singlerecord(${prv});">`,
					`&larr;&nbsp;ID ${prv}: ${toolkit.titleformat(d.store.pos[prv].value).shorten(20)}</a>`,
					`</li>`,
				].join(''));
			}
			out.push('</ul></div>');
						
			out.push('<div id="c-stab-zero" class="tabcontent visible margin-bottom-l">');

			[tax, met, rel].forEach((a, ix) => {
				if(Object.keys(a).length > 0) out.push(`<h4>${tit[ix].uf()}</h4>`);
				out.push(ix < 2 ? `<ol>` : `<ol class="upper-alpha">`);
				Object.keys(a).forEach(o => {
					if(ix < 2) {
						out.push(`<li>`);
						out.push([c(o).uf(), a[o].map(x => toolkit.formatfield(x).trim()).join(', ')].join(': '));
						out.push(`</li>`);
					} else {
						let reltyp = a[o] ? toolkit.relationtypeformat(a[o][0].bound).uf() : `[c${`unknown`.uf()}]`;
						let relicon = `
							<span class="empty-square background-${dbe.getbcolorfromslug(a[o][0].rptype)};">
							</span>`;
						let relcount = a[o].length ? 
							' ' + 
							toolkit.posttypeformat(a[o][0].rptype, a[o].length) : '';
						out.push(`<li>`);
						out.push(`<span style="color:${a[o][0].rpcolor};">`);
						out.push([
							relicon, 
							' ', 
							reltyp, 
							' ', 
							relcount, 
							' ',	
							c`as`,
							' ',						
							'<strong>',
							c(o), 
							'</strong>', 
						].join(''));
						out.push(`</span>`);
						out.push(`<ol>`);
						a[o].forEach(e => {
							out.push(`
								<li>
								<a href="javascript:ui.singlerecord(${e.RID},${cid});">${e.rname}</a>
								</li>
							`);
						}) ;
						out.push(`</ol>`);
						out.push(`</li>`);
						reltyp = relicon = relcount = undefined;
					}
				});
				out.push(`</ol>`);
			});

			out.push('</div>');

			out.push('<div id="c-stab-one" class="tabcontent hide"></div>');
			out.push('<div id="c-stab-two" class="tabcontent hide"></div>');
			out.push('<div id="c-stab-three" class="tabcontent hide"></div>');
			out.push('<div id="c-stab-four" class="tabcontent hide"></div>');
			out.push('<div id="c-stab-five" class="tabcontent hide"></div>');
			out.push('<div id="c-stab-six" class="tabcontent hide"></div>');
			
			if(gscreen.modal !== undefined) {
				toolkit.modalclose();
			}
			let icon = [
				`<span class="empty-square margin-right-s `,
				`background-${dbe.getbcolorfromslug(pos.rkey)}">`,
				`</span>`,
			].join('');
			let features = {
				progress: false,
				title: toolkit.titleformat(pos.value),
				content: out.join(''),
				action: '',
				cancel: true,
				canceltitle: c`close`.uf(),
				help: 'single',
				icon: icon,
			};
			gscreen.modal = gscreen.displaymodal(features);
			features = icon = undefined;

			if(!d.maptransformations.single.maintainqueries) {
				d.mapsearch.single.id = null;
				d.mapsearch.single.text = null;
				d.maplayers.single.queries = {};
			}

			toolkit.statustext();
			toolkit.timer('ui.singlerecord');
			gscreen.siteoverlay(false);
			prv = pos = tax = met = rel = tit = out = net = undefined;
		});
	},
	filterscreen: (reset = false, xfid = false, defaultpanel = 'zero') => {		
		if(!gscreen.siteoverlayisset) {
			toolkit.statustext(true);
			gscreen.siteoverlay(true);
		}		
		sleep(50).then(() => {
			if(dbe.verifytables()) {
				reset = reset || false;
				xfid = xfid || false;
				if(reset) dbq.clearfilter(Object.assign({}, d.filterrecord));
				if(d.filter.length === 0) dbq.clearfilter(Object.assign({}, d.filterrecord));
				// NLP Search Terms
				let trm = [];
				let tmp = [];
				trm.push(`<h4 class="margin-vertical-s">${c`key`.uf()}</h4>`);
				trm.push(`<ul style="columns:2;-webkit-columns:2;-moz-columns:2;">`);
				k.keys.map(o => c(o)).sort(toolkit.sortlocale).unique().forEach(o => tmp.push(`<li>${o}</li>`));
				trm = [...trm, ...tmp.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))];
				tmp = [];
				trm.push(`</ul>`);
				trm.push(`<h4 class="margin-vertical-s">${c`operator`.uf()}</h4>`);
				trm.push(`<ul style="columns:2;-webkit-columns:2;-moz-columns:2;">`);
				d.operators.map(o => c(o)).sort(toolkit.sortlocale).unique().forEach(o => tmp.push(`<li>${o}</li>`));
				trm = [...trm, ...tmp.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))];
				tmp = [];
				trm.push(`</ul>`);
				trm.push(`<h4 class="margin-vertical-s">${c`modifier`.uf()}</h4>`);
				trm.push(`<ul style="columns:2;-webkit-columns:2;-moz-columns:2;">`);
				d.modifiers.map(o => c(o)).sort(toolkit.sortlocale).unique().forEach(o => tmp.push(`<li>${o}</li>`));
				trm = [...trm, ...tmp.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))];
				tmp = null;
				trm.push(`</ul>`);
				// Advanced filter
				let out = [];
				let makenode = (nid, ndi) => {
					nid = nid || 0;
					ndi = ndi || 0;
					let bgc = ndi === 0 ? 'background-error-50' : 'background-success-50';
					return [
						`<button `,
						`class="button ${bgc} filter-search-result" `,
						`onclick="javascript:ui.filtercondition(${nid});">`,
						`${ndi.toLocaleString(l)}</button>`,
					].join('');
				};
				
				let makesubfilter = () => {
					let pinc = [];
					let pres = [];
					d.record_types.forEach(o => {
						pinc.push([
							`<p class="no-margin-bottom">`,
							`<label class="control control-checkbox control-xs">`,
							`<input type="checkbox" id="subf-${o}"${d.filtersubfilter[o] ? ' checked' : ''} `,
							`onclick="d.filtersubfilter['${o}']=this.checked"`,
							`>`,
							`<span class="control-indicator"></span>`,
							`<span class="control-label">${c(o)}</span>`,
							`</label>`,
							`</p>`,
						].join(''));
					});
					d.chains.map(o => o.link).unique().sort(toolkit.sortlocale).forEach(o => {
						pres.push([
							`<p class="no-margin-bottom">`,
							`<label class="control control-checkbox control-xs">`,
							`<input type="checkbox" `,
							`id="subf-lnk-${o}"${d.filtersublinks.includes(o) ? ' checked' : ''} `, 
							`onclick="if(this.checked){d.filtersublinks.push('${o}');}`,
							`else{d.filtersublinks.remove('${o}');}"`,
							`>`,
							`<span class="control-indicator"></span>`,
							`<span class="control-label">${c(o)}</span>`,
							`</label>`,
							`</p>`,
						].join(''));
					});
					
					let refinesignal = d.filterrefine ? [
						`<li>`,
						`<a class="button button-border button-error button-icon" `,
						`href="javascript:ui.clearfilterrefine();">`,
						`${c`clear-filter-refine`.uf()} `,
						`(${d.filterrefine ? d.filterrefine.size.toLocaleString(l) : ''})`,
						`</a>`,
						`</li>`,
					].join('\n') : '';
					
					let sub = [
						`<div class="group group-xs">`,
						`<ul>`,
						
						`<li>`,
						`<div class="ddown">`,
						`<button class="button button-border">${c`include`.uf()}</button>`,
						`<div class="ddown-content padding-xs box-shadow-xxl background-white no-margin-top">`,
						`${pinc.join('')}`,
						`</div>`,
						`</div>	`,
						`</li>`,
						
						`<li>`,
						`<div class="ddown">`,
						`<button class="button button-border">${c`restrictions`.uf()}</button>`,
						`<div class="ddown-content padding-xs box-shadow-xxl background-white no-margin-top">`,
						`${pres.join('')}`,
						`</div>`,
						`</div>	`,
						`</li>`,
						
						`<li>`,
						`<a class="button button-border" `,
						`data-tooltip="${c`filter-description`}" `,
						`href="javascript:toolkit.generictab('xstab1', 'xc-atab-one', 'xstabcontent', 'xstablinks');">`,
						`<span>`,
						`${c`filtered`.uf()}: `,
						dbe._filtered().toLocaleString(l),
						`</span>`,
						`</li>`,

						`<li>`,
						`</a>`,
						`<a class="button button-light button-border button-icon" `,
						`href="javascript:info.filterstats();">`,
						`<span id="flt-microchart">`,
						`</span>`,						
						`</a>`,
						`</li>`,

						`${refinesignal}`,

						`<li>`,
						`<span id="fltwarning" class="color-error margin-right-l"></span>`,
						`</li>`,
						
						`</ul>`,
						`</div>`,			
					].join('');
					
					refinesignal = undefined;
					
					return sub;	
				};
				
				let makematchesbutton = () => {
					return Object.keys(d.filtermatches).length ? [
						`<li>`,
						`<a class="operator button button-info button-border" id="flticon_matches" `,
						`href="javascript:info.filtermatches();">`,
						`${c`filter-matches`.uf()}`,
						`</a>`,
						`</li>`,
					].join('') : '';
				};
										
				let url = 'assets/views/' + l.toLowerCase() + '/filtertext.html';
				cfetch(url).then(txt => txt.text()).then(txt => { 
					let features = {
						progress: false,
						title: c`filter`.uf(),
						content: txt,
						action: [
							`<input class="hide" type="file" id="load-col" `,
							`onchange="file.loadcollection(this);this.value=null;" />`,
							
							`<div class="group group-xs">`,
							`<ul class="pull-right">`,
							
							`<li>`,
							`<span>${c`collection`.uf()}:</span>`,
							`</li>`,

							`<li>`,
							`<a `,
							`class="button button-warning button-border" `,
							`href="javascript:byId('load-col').click();">`, 
							`${c`load`.uf()}`,
							`</a>`,
							`</li>`,
							
							`<li>`,
							`<a class="button button-tertiary button-border" id="flticon-save" `,
							`href="javascript:ajax.savecollection();">`,
							`${c`save`.uf()}`,
							`</a>`,
							`</li>`,
							
							`<li>`,
							`<span>${c`filter`.uf()}:</span>`,
							`</li>`,

							`${makematchesbutton()}`,

							`<li>`,
							`<a class="operator button button-info button-border" id="flticon_recalc" `,
							`href="javascript:ui.recalculatefilter();">`,
							`${c`calculate`.uf()}`,
							`</a>`,
							`</li>`,

							`<li>`,
							`<a class="operator button button-info button-border" id="flticon_strict" `,
							`href="javascript:ui.setfilter('_strict');">`,
							`${c`set-filter`.uf()}`,
							`</a>`,
							`</li>`,
							
							`<li>`,
							`<a class="button button-error button-border" `,
							`id="flticon-clear" href="javascript:ui.clearfilter();">`,
							`${c`clear`.uf()}`,
							`</a>`,
							`</li>`,
							
							`<li>`,
							`<a id="modal-close" class="button button-light" `,
							`href="javascript:;">${c`close`.uf()}</a>`,
							`</li>`,

							`</ul>`,
							`</div>`,
						].join(''),
						cancel: false,
					};
					gscreen.modal = gscreen.displaymodal(features);
					features = undefined;
					
					d.filter.forEach((o, ix) => {
						out.push(
							`
							<ul class="boxes boxes-12-5rem" id="fnode${ix}" data-fid="${ix}" style="margin-bottom:.5em!important">
							<li>
							<label class="select" for="filter-modifier${ix}">
							<select class="filter-modifier" id="filter-modifier${ix}" 
							onchange="dbq.updatefiltercondition(${ix}, this);ui.filtercondisok(${ix})">
							<option value=""${o.modifier === '' ? ' selected' : ''}>${c`no-modifier`}</option>
							${d.modifiers.sort((a, b) => c(a).localeCompare(c(b), l)).map(x => 
							`<option value="${x}"${o.modifier === x ? ' selected' : ''}>${c(x)}</option>`)}
							</select>
							</label>
							</li>
							
							<li>
							<label class="select" for="filter-rkey${ix}">
							<select class="filter-rkey" id="filter-rkey${ix}" 
							onchange="dbq.updatefiltercondition(${ix}, this);ui.filtercondisok(${ix})">
							<option value=""${o.rkey === '' ? ' selected' : ''}>${c`any-metainfo`}</option>
							${k.keys.sort((a, b) => toolkit.rkeytranslate(a).localeCompare(toolkit.rkeytranslate(b), l)).map(x => 
							`<option value="${x}"${o.rkey === x ? ' selected' : ''}>
							${toolkit.rkeytranslate(x)}</option>`)}
							</select>
							</label>
							</li>
							
							<li>
							<label class="select" for="filter-operator${ix}">
							<select class="filter-operator" id="filter-operator${ix}" 
							onchange="dbq.updatefiltercondition(${ix}, this);ui.filtercondisok(${ix})">
							${d.operators.sort((a, b) => c(a).localeCompare(c(b), l)).map(x => 
							`<option value="${x}"${o.operator === x ? ' selected' : ''}>${c(x)}</option>`)}
							</select>
							</label>
							</li>
							
							<li>
							<div class="input-group">
							<input type="text" placeholder="${c`search`}..." 
							class="filter-value" 
							value="${o.value}"
							onkeyup="dbq.updatefiltercondition(${ix}, this);ui.filtercondisok(${ix})" />
							<button class="button button-border button-icon" 
							onclick="javascript:ui.listvalues(${ix});">
							<svg width="24" height="18" viewBox="0 0 24 24" class="svgicon">
							<path class="search" d=""></path>
							</svg> 
							</button>
							</div>
							</li>	
							
							<li>
							<div class="button-group">
							${makenode(ix, o.results.length, o.isok, o.matches)}
							<button class="button" 
							onclick="javascript:ui.removecondition(${ix});">
							${c`remove`.uf()}
							</button>
							</div>
							</li>
							
							</ul>
							`				
						);
					});
	
					toolkit.msg('flt-main', out.join(''));
					toolkit.drawicons();
					toolkit.msg('flt-terms', trm.join('\n'));		
		
					toolkit.msg('filter-info-stats', c`working`.uf() + '&hellip;');
					sleep(50).then(() => {
						if(byId('filter-info-stats')) {
							ui.filterstats()
							.then(res => { 
								toolkit.msg('filter-info-stats', res); 
							})
							.catch(err => { 
								throw new AppError('filter-info-stats ' +  err); 
							});
						}
					});
	
					toolkit.msg('flt-incsubf', makesubfilter());
					toolkit.microchart('flt-microchart', Math.round((dbe._filtered() / d.poslength) * 100), 'filterchart');
					toolkit.msg('flt-filterlength', d.filter.length.toLocaleString(l));
					
					if(xfid) {
						for(let i = 0, len = d.filter.length; i < len; i++) {
							ui.filtercondition(i);
						}
					}
	
					let tabs = [
						{tab: '0', pad: 'zero'},
						{tab: '1', pad: 'one'},
						{tab: '2', pad: 'two'},
						{tab: '3', pad: 'three'},
					].find(o => o.pad === defaultpanel);
					toolkit.generictab(`xstab${tabs.tab}`, `xc-atab-${tabs.pad}`, 'xstabcontent', 'xstablinks');
					tabs = undefined;
					
					if(gscreen.siteoverlayisset) {
						toolkit.statustext();
						gscreen.siteoverlay(false);
					}
					trm = tmp = out = url = makenode = makesubfilter = undefined;
				}).catch(err => { 
					if(gscreen.siteoverlayisset) {
						toolkit.statustext();
						gscreen.siteoverlay(false);
					}
					trm = tmp = out = url = makenode = makesubfilter = undefined;
					throw new AppError(c`filter` + ': ' + err); 
				});
			} else {
				let url = 'assets/views/' + l.toLowerCase() + '/nodata.html';
				cfetch(url).then(txt => txt.text()).then(txt => { 
					let features = {
						progress: false,
						title: c`info`.uf(),
						content: txt,
						action: '',
						cancel: true,
						canceltitle: c`close`.uf()
					};
					gscreen.alert = gscreen.displayalert(features);
					if(gscreen.siteoverlayisset) {
						toolkit.statustext();
						gscreen.siteoverlay(false);
					}
					features = undefined;
					url = undefined;
				})
				.catch(err => { 
					url = undefined;
					throw new AppError(c`database-info` + ': ' + err); 
				});
			}
		});
	},
	filtercondisok: ix => {
		let row = document.getElementById('fnode' + ix);
		let ope = row.getElementsByClassName('filter-operator')[0];
		let val = row.getElementsByClassName('filter-value')[0];
		let err = ope.options[ope.selectedIndex].value === 'bt' && !val.value.includes('/');
		if(err) {
			val.classList.add('error');
			byId('fltwarning').innerHTML = `#${(ix + 1).toLocaleString(l)}: ${c`filter-between-warning`.uf()}`;
		} else {
			val.classList.remove('error');
			byId('fltwarning').innerHTML = '';
		}
		row = ope = val = err = undefined;
	},
	filtercondition: fid => {
		let idx = parseInt(fid, 10);
		let elm = document.querySelector('[data-fid="' + fid + '"]');
		let nod = document.getElementById('fnode' + fid);
		['value', 'rkey', 'operator', 'modifier'].forEach(o => {
			d.filter[idx][o] = elm.querySelector('.filter-' + o).value || '';
		});
		let isvalidquery = (opr, val) => {
			let out = true;
			if(!['nu', 'nn'].includes(opr) && val.trim() === '') out = false;
			if(['bt'].includes(opr) && !val.trim().includes('/')) out = false;
			return out;
		};
		
		if(!isvalidquery(d.filter[idx].operator, d.filter[idx].value)) {
			throw new AppError(c`filter-condition` + ': ' + c`invalid-value`); 
		}
		
		gscreen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.search(d.filter[idx].operator,
				d.filter[idx].modifier,
				d.filter[idx].value,
				d.filter[idx].rkey
			)
			.then(ret => {
				d.filter[idx].results = ret.results;
				
				nod.querySelector('.filter-search-result').innerHTML = d.filter[idx].results.length.toLocaleString(l);
				nod.querySelector('.filter-search-result').classList.remove('background-success-50');
				nod.querySelector('.filter-search-result').classList.remove('background-error-50');
				nod.querySelector('.filter-search-result').classList.add(d.filter[idx].results.length ? 
					'background-success-50' : 
					'background-error-50'
				);
				
				if(document.getElementById('flt-description')) {
					toolkit.msg('flt-description', ui.describefilter());
				}
				gscreen.siteoverlay(false);
				idx = elm = nod = isvalidquery = ret = undefined;
			})
			.catch(err => { 
				idx = elm = nod = isvalidquery = undefined;
				gscreen.siteoverlay(false);
				throw new AppError(c`filter-condition` + ': ' + err); 
			});
		});
	},
	filtersearch: (val, met, immediate = false, defaulttab = 'zero') => {
		gscreen.siteoverlay(true);
		sleep(50).then(() => {
			let idx = 0;
			if(!d.filter.length || immediate) {
				dbq.clearfilter(Object.assign({}, d.filterrecord));
			} else {
				dbq.clearfilter();
			}
			met = met || '';
			let marray = met.split('|');
			let isfield = marray.length > 1 && k.keys.includes(marray[0]);
			let xmet = marray[0];
			let xmod = isfield ? marray[1] : '';
			d.filter[idx].value = val || '';
			d.filter[idx].rkey = xmet;
			d.filter[idx].operator = 'li';
			d.filter[idx].modifier = xmod;
			marray = isfield = xmet = xmod = undefined;

			dbq.search(d.filter[idx].operator,
				d.filter[idx].modifier,
				d.filter[idx].value,
				d.filter[idx].rkey)
			.then(ret => {
				d.filter[idx].results = ret.results;
				
				if(immediate) {
					ui.setfilter('_intersection');
					if(isVisible(byId('modal-content'))) {
						toolkit.modalclose();
					}
					ui.filterscreen(false, false, defaulttab);
				} else {
					if(byId('search-results')) {
						byId('search-results').innerHTML = d.filter[idx].results.length.toLocaleString(l);
					}				
					if(byId('search-description')) {
						toolkit.msg('search-description', ui.describefilter());
					}
				}
				gscreen.siteoverlay(false);
				idx = ret = undefined;
			})
			.catch(err => { 
				idx = undefined;
				gscreen.siteoverlay(false);
				throw new AppError(c`filter-condition` + ': ' + err); 
			});
		});
	},
	filterbyterm: (term, launchfilter = true, direct = false, reset = false) => {
		if(direct) term = `"${term}"`;
		let src = term.split('+').map(o => String(o).trim());
		let trn = [];
		if(reset) dbq.clearfilter();
		let isvalid = false;
		src.forEach(o => {
			isvalid = false;
			let parsed = dbe.parsequery(o);
			if(parsed.isok) {
				isvalid = true;
				let opr = 'li';
				let mdf = '';
				let rky = '';
				parsed.validtags.forEach(t => {
					let rsp = ic(t);
					if(k.keys.indexOf(rsp) > -1) rky = rsp;
					if(d.operators.indexOf(rsp) > -1) opr = rsp;
					if(d.modifiers.indexOf(rsp) > -1) mdf = rsp;
					rsp = undefined;
				});
				if(launchfilter) d.filter.push(Object.assign({}, d.filterrecord, {
					value: parsed.value, 
					rkey: rky, 
					operator: opr, 
					modifier: mdf
				}));
				trn.push(`${c(mdf)} ${c(rky)} ${c(opr)} "${parsed.value}"`.trim());
				opr = mdf = rky = undefined;
			}
			parsed = undefined;
		});
		if(isvalid) {
			if(launchfilter) ui.filterscreen(false, true);
			if(document.getElementById('flt-parsednlp')) {
				toolkit.msg('flt-parsednlp', trn.join(' + '));
			}
		} else {
			if(document.getElementById('flt-parsednlp')) {
				toolkit.msg('flt-parsednlp', `<span class="text-error">${c`invalid-query`.uf()}</span>`);
			}
		}
		src = trn = isvalid = undefined;
	},
	setfilter: (opr, activatetimer = true, cid = 'base') => {
		activatetimer = undefined;
		if(!dbq.readytosetfilter()) {
			let url = 'assets/views/' + l.toLowerCase() + '/filternotready.html';
			cfetch(url).then(txt => txt.text()).then(txt => { 
				url = undefined;
				throw new AppError(c`filter` + ': ' + txt); 
			});
			return;
		}
		if(!gscreen.siteoverlayisset) {
			gscreen.siteoverlay(true);
		}
		sleep(50).then(() => {
			dbq.setfilter(opr === '_strict')
			.then(() => {
				d.currentfilterlink = opr;
				if(document.getElementById('filter-info-stats')) {
					toolkit.statustext();
					if(gscreen.siteoverlayisset) {
						gscreen.siteoverlay(false);
					}
					ui.filterscreen();
				}
						
				d.currentpages.list = 0;

				if(isVisible(byId('schema-listing'))) stats.schema();
				if(isVisible(byId('stats-charts'))) {
					charts.chart();
				}
				if(isVisible(byId('stats-network'))) {
					charts.relations();
				}
				if(isVisible(byId('base-map'))) {
					d.mapdata = {};
					maps.basemap(cid);
				}
				if(isVisible(byId('single-map'))) {
					maps.basemap(cid);
				}

				toolkit.statustext();
				toolkit.showactivecollection();
				ui.datalist(d.currentpages.list);
				if(gscreen.siteoverlayisset) {
					gscreen.siteoverlay(false);
				}
				if(!dbe._filterids().length) {
					throw new AppWarning(c`no-data`.uf());
				}
			})
			.catch(err => { 
				toolkit.statustext();
				if(gscreen.siteoverlayisset) {
					gscreen.siteoverlay(false);
				}
				ui.datalist(d.currentpages.list);
				throw new AppError(c`filter` + ': ' + err); 
			});
		});
	},
	describefilter: () => {
		let out = {terms: '', include: '', restrictions: ''};
		out.terms = d.filter.map(o => [
			o.modifier !== '' ? c(o.modifier) : '',
			o.rkey !== '' ? c(o.rkey) : c`any-metainfo`,
			c(o.operator),
			o.value !== '' ? '"' + o.value + '"' : '',
		].join(' ').trim()).join(` ${c`and`} `);
		out.include = Object.keys(d.filtersubfilter)
			.filter(o => d.filtersubfilter[o]).map(o => c(o)).join(', ');
		out.restrictions = d.filtersublinks.map(o => fc(o)).join(', ');
				
		return [
			`<p class="aside margin-top margin-bottom background-light-100">`, 
			Object.keys(out).map(o => c(o).uf() + ': ' + (isBlank(out[o]) ? c('none') : out[o])).join('. '),
			`</p>`,
		].join('');
	},
	describecondition: (fid = 0) => {
		let o = d.filter[fid];
		return [
			o.modifier !== '' ? c(o.modifier) : '',
			o.rkey !== '' ? '[' + c(o.rkey) + ']' : '[' + c`any-metainfo` + ']',
			c(o.operator),
			o.value !== '' ? '"' + o.value + '"' : '',
		].join(' ').trim();
	},
	addcondition: () => {
		d.filter.push(Object.assign({}, d.filterrecord));
		ui.filterscreen();
	},
	removecondition: fid => {
		d.filter.splice(fid, 1);
		if(d.filter.length === 0) {
			ui.addcondition();
		} else {
			ui.filterscreen();
		}
	},
	clearfilter: (showfilter = true) => {
		gscreen.siteoverlay(true);
		toolkit.statustext(true);
		toolkit.timer('ui.clearfilter');
		sleep(50).then(() => {
			dbq.clearfilter(Object.assign({}, d.filterrecord))
			.then(() => {
				// Collections reset
				file.unloadremotecollection();
				
				if(isVisible(byId('modal-content'))) {
					toolkit.modalclose();
				}
				toolkit.timer('ui.clearfilter');
				toolkit.statustext(false);
				gscreen.siteoverlay(false);
				if(showfilter) ui.filterscreen();
				ui.datalist();
			})
			.catch(err => { 
				toolkit.timer('ui.clearfilter');
				toolkit.statustext(false);
				gscreen.siteoverlay(false);
				throw new AppError(c`filter` + ': ' + err); 
			});
		});
	},
	clearfilterrefine: () => {
		d.filterrefine = null;
		if(byId('base-map')) maps.datamap('base');
		if(byId('schema-listing')) stats.schema();
		if(byId('cooccurrences-listing')) stats.cooccurrences();
		ui.datalist();
		ui.filterscreen();
		toolkit.statustext(false);
		toolkit.timer('ui.clearfilterrefine');
		gscreen.siteoverlay(true);
	},
	setfiltervalue: (fid, val) => {
		let row = document.querySelector('[data-fid="' + fid + '"]');
		row.querySelector('.filter-value').value = decodeURI(val);
		d.filter[fid].value = decodeURI(val);
		row = undefined;
	},
	recalculatefilter: () => {
		for(let i = 0, len = d.filter.length; i < len; i++) {
			ui.filtercondition(i);		
		}
	},
	filterstats: () => new Promise((resolve, reject) => {	
		dbq.filterinfo('rkey')
		.then(res => {
			let flt = [];
			let tot = {ids: 0, count: 0};
			flt.push([
				`<h4 class="margin-top-s margin-bottom-s">`,
				`${c`filter-stats-by-record-type`.uf()}`,
				`</h4>`,
			].join(''));
			flt.push(`
				<div class="table-responsive">
				<table>
				<thead>
				<tr>
				<th colspan="2">${c`type`.uf()}</th>
				<th colspan="2">${c`filtered`.uf()}</th>
				<th>${c`total`.uf()}</th>
				</tr>
				</thead>
				<tbody>
			`);
			Object.keys(res).forEach(o => {
				let pids = Math.round((res[o].ids / res[o].count) * 100);
				let tids = isNaN(pids) ? c`n-a`.toUpperCase() : pids + '%';
				tot.ids += res[o].ids;
				tot.count += res[o].count;
				flt.push(`
					<tr>
					<td class="text-align-center">
					<button class="button button-square button-${dbe.getbcolorfromslug(ic(o))}">
					${dbe.getnamefromslug(ic(o)).toUpperCase()}</button>
					</td>
					<td>
					<span style="color: ${dbe.getcolorfromslug(o)};">
					${c(o)}
					</span>
					</td>
					<td class="text-align-right">
					<span style="color: ${dbe.getcolorfromslug(o)};">
					${res[o].ids.toLocaleString(l)}
					</span>
					</td>
					<td class="text-align-right">
					<span style="color: ${dbe.getcolorfromslug(o)};">
					${tids}
					</span>
					</td>
					<td class="text-align-right">
					<span style="color: ${dbe.getcolorfromslug(o)};">
					${res[o].count.toLocaleString(l)}
					</span>
					</td>
					</tr>
				`);
				pids = tids = undefined;
			});
			flt.push(`
				<td></td>
				<td></td>
				<td class="text-align-right"><strong>${tot.ids.toLocaleString(l)}</strong></td>
				<td class="text-align-right"></td>
				<td class="text-align-right"><strong>${tot.count.toLocaleString(l)}</strong></td>
			`);
			flt.push(`
				</tbody>
				</table>
				</div>
			`);
			if(d.filter.length > 0) {
				if(d.filter[0].results.length > 0) {
					flt.push(`<h4 class="margin-top-s">${c`description`.uf()}</h4>`);
					flt.push(ui.describefilter());
				}
			}
			res = tot = undefined;
			resolve(flt.join(''));
		})
		.catch(err => {
			reject(c`filter` + ': ' + err);
		});
	}),
	listvalues: fid => {
		gscreen.siteoverlay(true);
		sleep(50).then(() => {
			if(isNil(d.filter[fid].rkey) || d.filter[fid].rkey.toString() === '') {
				gscreen.siteoverlay(false);
				throw new AppError(c`values-list` + ': ' + c`mandatory-field-empty` + ' [' + c`met` + ']');
			}
			dbq.listvalues(fid)
			.then(ret => {
				let out = [];

				out.push([
					`<h4 class="margin-top">${c`field`.uf()} `,
					`<em>${fc(d.filter[fid].rkey)}</em> ${c`li`} `,
					`"${d.filter[fid].value}"`,
					`</h4>`
				].join(''));
	
				out.push(`<ol>`);
				ret.forEach(o => {
					out.push(`<a href="javascript:ui.setfiltervalue(${fid},'${encodeURI(o)}');toolkit.alertclose();">`);
					out.push(`<li>${toolkit.highlight((o || '').toString(), d.filter[fid].value.toString())}</li>`);
					out.push(`</a>`);
				});
				out.push(`</ol>`);
				sleep(50).then(() => {
					if(gscreen.alert !== undefined) {
						toolkit.alertclose();
					}
					let features = {
						progress: false,
						title: c`values-list`.uf(),
						content: out.join(''),
						action: false,
						cancel: true,
						canceltitle: c`close`.uf()
					};
					gscreen.alert = gscreen.displayalert(features);
					features = undefined;
		
					ret = out = undefined;
					gscreen.siteoverlay(false);
				});
			})
			.catch(err => { 
				gscreen.siteoverlay(false);
				throw new AppError(c`list-values` + ': ' + err); 
			});
		});
	}, 
	collectionselector: dom => {
		if(!gscreen.siteoverlayisset) {
			gscreen.siteoverlay(true);
		}
		toolkit.statustext(true);
		let makeselector = res => {
			let out = [];
			let opr = [
				`file.loadremotecollection(byId('dc-select').options[byId('dc-select').selectedIndex].value,`, 
				`byId('dc-select').options[byId('dc-select').selectedIndex].getAttribute('data'))`
			].join('');
			
			if(!Array.isArray(res)) return;
			
			out.push(`
				<label class="select" for="dc-select">
				<select id="dc-select" 
				onchange="toolkit.msg('dc-desc', this.options[this.selectedIndex].getAttribute('data'))">
			`);
			d.collections = res.sortBy(['title']);
			d.collections.forEach((o, i) => { 
				out.push(
					`<option data="${o.description}" value="${i}"${o.active === 1 ? ' selected' : ''}>${o.title}</option>`
				); 
			});
			out.push(`</select></label>`);
		
			toolkit.msg(dom, out.join('\n'));
			
			let sel = byId('dc-select');
			toolkit.msg('dc-desc', sel.options[sel.selectedIndex].getAttribute('data'));
			byId('dc-button').href = `javascript:${opr}`;
			out = opr = sel = undefined;
		};
		
		sleep(50).then(() => {
			if(d.collections.length) {
				makeselector(d.collections);
			} else {
				ajax.fetchjson('assets/data/collections/index.json')
				.then(res => {
					makeselector(res[l]);
					makeselector = undefined;
				})
				.catch(err => {
					if(gscreen.siteoverlayisset) {
						gscreen.siteoverlay(false);
					}
					toolkit.statustext();
					throw new AppError(c`collection-load` + ': ' + err);
				});
			}
			if(gscreen.siteoverlayisset) {
				gscreen.siteoverlay(false);
			}
				toolkit.statustext();
		})
		.catch(err => {
			if(gscreen.siteoverlayisset) {
				gscreen.siteoverlay(false);
			}
			toolkit.statustext();
			makeselector = undefined;
			throw new AppError(c`collection-load` + ': ' + err);
		});
	},
	reportselector: () => {
		let out0 = [];
		let out1 = [];
		let ana = 'javascript:file.makereport(document.getElementById(\'' + 
			'data-report-selector\').options[document.getElementById(\'' + 
			'data-report-selector\').selectedIndex].value,\'c\',' + 
			'document.getElementById(\'' + 
			'data-ffilter-selector\').options[document.getElementById(\'' + 
			'data-ffilter-selector\').selectedIndex].value);';
		let tex = 'javascript:file.makereport(document.getElementById(\'' + 
			'data-report-selector\').options[document.getElementById(\'' + 
			'data-report-selector\').selectedIndex].value,\'t\',' + 
			'document.getElementById(\'' + 
			'data-ffilter-selector\').options[document.getElementById(\'' + 
			'data-ffilter-selector\').selectedIndex].value);';
			
		out0.push(`<label class="select" for="data-report-selector">`);
		out0.push(`<select id="data-report-selector" onchange="ui.reportdescriptor();">`);
		d.record_types.forEach(o => { out0.push(`<option value="${o}">${c(o)}</option>`); });
		out0.push(`</select></label>`);

		out1.push(`<label class="select" for="data-ffilter-selector">`);
		out1.push(`<select id="data-ffilter-selector" onchange="ui.reportdescriptor();">`);
		out1.push(`<option value="">${c`relational-field`}: ${c`anyone`}</option>`);
		out1.push(d.relatives
			.sort((a, b) => toolkit.rkeytranslate(a).localeCompare(toolkit.rkeytranslate(b), l))
			.map(x => `<option value="${x}">${c(x)}</option>`)
		);
		out1.push(`</select></label>`);
		return [out0.join('\n'), out1.join('\n'), ana, tex];
	},
	reportdescriptor: () => {
		let sela = byId('data-report-selector');
		let selb = byId('data-ffilter-selector');
		let txt = [
			sela.options[sela.selectedIndex].text,
			selb.options[selb.selectedIndex].text,
		].join(': ');
		sela = selb = undefined;
		toolkit.msg('dr-desc', txt);
	},
	singlenetwork: (nid, bou, ctp) => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 
		if(!bou) bou = '';
		if(!ctp) ctp = '';

		let droptype = did => {
			let out = [];
			let elm = ['none|none', 'force|none', 'circular|none', 'sankey|none'];
			elm.forEach(o => {
				out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c(o)}</option>`);
			});
			elm = undefined;
			return `
				<label class="select">
				<select id="net-selectlay"  class="fc-2" 
				onchange="javascript:ui.singlenetwork('${nid}', '${bou}', this.options[this.selectedIndex].value);">
				${out.join('\n')}
				</select>
				</label>
			`;
		};
		let dropbound = (dar, did) => {
			let out = [];
			dar.forEach(o => {
				out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c`bound`}: ${c(o)}</option>`);
			});
			return `
				<label class="select">
				<select id="net-selectbou" class="fc-2 margin-right" 
				onchange="javascript:ui.singlenetwork('${nid}', this.options[this.selectedIndex].value);">
				${out.join('\n')}
				</select>
				</label>
			`;
		};
		let txtdata = (ct, ln, en) => `
			${ct.toLocaleString(l)} ${ct === 1 ? c`type` : c`types`}, 
			${ln.toLocaleString(l)} ${ln === 1 ? c`record` : c`records`}, 
			${en.toLocaleString(l)} ${en === 1 ? c`relation` : c`relations`}.
		`;
		
		gscreen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.singlenetwork()
			.then(res => {
				if(res) {
					let out = [];
					out.push(`
						<div id="singlenet-selectors"></div>
						<div id="netchart" class="single-charts margin-top-l margin-bottom-l"></div>
					`);
						
					toolkit.msg('c-stab-three', out.join(''));
					out = undefined;
	
					let cha = byId('netchart');
					let pchart = echarts.init(cha);		
					pchart.showLoading({text: c`working`});
	
					let net = res;
					let xctp = isBlank(ctp) ? 'none|none' : ctp;
					let ncats = net.categories;
	
					let nbous = net.bounds;
					if(!Array.isArray(nbous) || !nbous.length) {
						gscreen.siteoverlay(false);
						throw new AppError(c`charts` + ': ' + c`no-data`); 
					}
					let xbou = isBlank(bou) ? nbous[0] : bou;
			
					let xid = Number(nid);
					let sid = toolkit.titleformat(String(d.store.pos[xid].value)).shorten(50);
					let elist = net.edges
						.filter(o => [Number(o.source), Number(o.target)].includes(xid))
						.filter(o => o.bound === xbou);
					let avals = [...elist.map(o => o.source), ...elist.map(o => o.target), ...[xid]].unique();
					let nnods = net.nodes.filter(o => avals.includes(Number(o.id))); 
	
					let nmax = Math.max.apply(null, nnods.map(o => o.symbolSize));
					let nsize = sz => (Math.round((sz / nmax) * 100) < 10 ? 10 : Math.round((sz / nmax) * 100));
					let rnd = a => Math.floor(Math.random() * a);
					
					let gw = pchart.getWidth();
					let gh = pchart.getHeight();
					
					nnods.forEach(node => {
						node.id = String(node.id);
						node.itemStyle = null;
						node.value = node.symbolSize;
						node.symbolSize = nsize(node.symbolSize);
						node.label = {
							normal: {show: node.symbolSize > 25}
						};
						node.ptype = c(node.category);
						node.category = ncats.indexOf(node.category);
						node.itemStyle = {color: node.color};
	
						if(xctp === 'none|none') node.x = rnd(gw);
						if(xctp === 'none|none') node.y = rnd(gh);
					});
					elist.forEach(edge => {
						edge.source = String(edge.source);
						edge.target = String(edge.target);
						edge.nvalue = edge.value;
						edge.value = c(edge.rkey).shorten(50);
					});
	
					toolkit.msg('singlenet-selectors', 
						[
							`<div class="group group-xs margin-top-s margin-bottom-s">`,
							`<ul>`,
							`<li>`,
							droptype(xctp),
							`</li>`,							  
							`<li>`,
							dropbound(nbous, xbou),
							`</li>`,							  
							`<li>`,
							txtdata(ncats.length, nnods.length, elist.length),
							`</li>`,							  
							`</ul>`,							  
							`</div>`,							  
						].join('')
					);
	
					let options = charts.graphoptions('netchart', ncats, nnods, elist, xctp, sid);
					pchart.setOption(options);
					pchart.hideLoading();
					gscreen.siteoverlay(false);
	
					droptype = dropbound = txtdata = undefined;
					res = cha = pchart = net = xctp = ncats = nbous = xbou = xid = sid = undefined; 
					elist = avals = nnods = nmax = nsize = rnd = gw = gh = options = undefined;
				} else {
					let out = [];					
					out.push(`<p><span class="text-error">${c`no-results`.uf()}</span></p>`);
					toolkit.msg('c-stab-three', out.join(''));
					gscreen.siteoverlay(false);
					droptype = dropbound = txtdata = res = undefined;
				}
			})
			.catch(err => {
				gscreen.siteoverlay(false);
				droptype = dropbound = txtdata = undefined;
				throw new AppError(c`network` + ': ' + err);
			});
		});
	},
	singlestats: (cid, page = 1, row = 'relrkey', text = '', srt = 1, xprt = false) => {
		let droprows = (rows, selected) => {
			let out = [];
			rows.sort(toolkit.sortlocale).forEach(o => { 
				out.push(`<option value="${o}"${selected === o ? ' selected' : ''}>${c(o)}</option>`); 
			});
			return [
				`<label class="select">`,
				`<select class="margin-right" id="row" `,
				`onchange="javascript:ui.singlestats(${cid},1,this.value,'');">`,
				`${out.join('\n')}</select>`,
				`</label>`,
			].join('');
		};
		gscreen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.singlestats(cid, row)
			.then(res => {
				let out = [];
				if(res && Object.keys(res).length) {
					let blacklist = ['ID', 'RID', 'relstartstring', 'relendstring', 'relpoint', 'relkey'];
					let rowlist = Object.keys(res).filter(o => !blacklist.includes(o));
	
					let rowsfields = ['field', 'count'];
					let descending = srt < 0 ? '-' : ''; 
					let rows = Object.entries(res[row]._data)
						.map(o => Object.assign({}, {field: o[0], count: o[1]}))
						.sortBy([descending + rowsfields[Math.abs(srt) - 1]]);

					let lstats = ui.makestats(rows.map(o => o.count));
					let statstext = [
						`<p>`,
						`${c`rows`.uf()}: <strong>${lstats.rows.toLocaleString(l)}</strong>. `,
						`${c`sum`.uf()}: <strong>${lstats.total.toLocaleString(l)}</strong>. `,
						`${c`average`.uf()}: <strong>${lstats.average.toLocaleString(l)}</strong>. `,
						`${c`outliers`.uf()}: `, 
						`<strong>x &isin; `,
						`(&minus;&infin;,${lstats.lowlimit}) `,
						`&cup; `,
						`(${lstats.highlimit},&infin;) = `, 
						`${lstats.meaningful.toLocaleString(l)} (${lstats.rowmeaning.toLocaleString(l)} `,
						`${c`rows`})</strong>. `,
						`<a `,
						`class="button button-success button-s" `,
						`href="javascript:info.help('tablelegend');">${c`legend`.uf()}</a>`,
						`</p>`,
					].join('');

					rows = stats.localstats(rows)
						.filter(o => !isBlank(text) ? dbe._operation('li', o.field, text) : true);
					
					let word = rowlist.length === 1 ? c`item`.uf() : c`items`.uf();

					if(xprt) {
						file.exportdatatocsv(rows);
						gscreen.siteoverlay(false);
						return;
					}
					
					toolkit.msg(
						'c-stab-five', 
						[
							`<div class="group group-xs margin-top-s margin-bottom-s">`,
							`<ul>`,
							`<li>`,
							`${droprows(rowlist, row)}`,
							`</li>`,
							`<li>`,
							`${word}: ${rowlist.length.toLocaleString(l)}`,
							`</li>`,
							`</ul>`,
							`</div>`,
							`<div id="pivot-table" class="margin-vertical-s"></div>`,
						].join('')
					);
					
					blacklist = rowlist = word = rowsfields = descending = undefined;

					let opts = {
						cid: 'pivot-table',
						type: 'pivot',
						page: Number(page) || d.currentpages.pivot,
						items: stats.localstats(rows),
						stats: statstext,
						searchtext: text,
						pgfunction: 'ui.singlestats',
						pgparams: {
							cid: cid,
							row: row,
							srt: srt,
						},
						generatorfn: function(obj) {
							let cellcolor = toolkit.colorscale(obj.scale, window.settings.scalecolorbase, true);
							let bgcolor = cellcolor.split(';')[0];
							let focolor = cellcolor.split(';')[1];
							let stars = window.settings.zscoreassstars === 1 ? 
								toolkit.showstars(Number(obj.zscore)) : 
								toolkit.shownumericlevel(Number(obj.zscore));
							let str1 = !isBlank(text) ? 
								toolkit.highlight(obj.field, text) : 
								obj.field;
							let str2 = isNumber(obj.count) ? obj.count.toLocaleString(l) : obj.count;
							let xscale = isNaN(obj.scale) ? `<span data-format="square" class="empty-square"></span>` : 
								[
									`<span data-format="square" class="empty-square" `,
									`style="${bgcolor};${focolor}"></span>`
								].join('');
							cellcolor = undefined;
							return {
								field: str1,
								count: str2,
								z: `<span data-format="square">${stars}</span>`,
								l: `<span data-format="square">${obj.level}</span>`,
								o: `<span data-format="square">${obj.outlier}</span>`,
								s: `<span data-format="square">${xscale}</span>`,
							};
						},
						selectorfn: function(sel) {
							let nodata = !byId('pivot-page-selector') || 
								!byId('pivot-page-range') || 
								!byId('pivot-page-size') || 
								!byId('pivot-page-current') || 
								!byId('pivot-pg3');
							if(nodata) {
								ui.singlestats(cid, 1, byId('row').value, byId('pivot-text-search').value, srt);
								nodata = undefined;
							} else {
								window.settings.listrowsperpage = Number(byId('pivot-page-size').value);
								let numpager = ['pivot-page-selector', 'pivot-page-range'].includes(sel.target.id) ? 
									Number(sel.target.value) : 
									Number(byId('pivot-page-selector').value);
								ui.singlestats(cid, numpager, byId('row').value, byId('pivot-text-search').value, srt);
								toolkit.msg(
									'pivot-page-current', 
									Number(byId('pivot-pg3').dataset.value).toLocaleString(l)
								);
								numpager = nodata = undefined;
							}
						},
						updatepagefn: function(sel) {
							toolkit.msg('pivot-page-current', Number(sel.target.value).toLocaleString(l));
							byId('pivot-pg3').dataset.value = Number(sel.target.value);
						},
						exportfn: function() {
							ui.singlestats(cid, page, row, text, srt, true);
						},
					};
					ui.maketable(opts);
					opts = rows = lstats = undefined;
				} else {
					out.push(`<p><span class="text-error">${c`no-results`.uf()}</span></p>`);
					toolkit.msg('c-stab-five', out.join(''));
				}
				droprows = out = undefined;
				gscreen.siteoverlay(false);
			})
			.catch(err => {
				droprows = undefined;
				gscreen.siteoverlay(false);
				throw new AppError(c`stats` + ': ' + err);
			});
		});
	},
	singletimeline: (cid, typ = 'year') => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 
		dbq.singletimeline(cid)
		.then(res => {
			let net = res;
			let out = [];
			let droptype = did => {
				let out = [];
				let elm = ['year', 'month', 'day', 'weekday'];
				elm.forEach(o => {
					out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c(o)}</option>`);
				});
				elm = undefined;
				return `
					<label class="select">
					<select id="net-selectlay"  class="margin-right" 
					onchange="javascript:ui.singletimeline('${cid}',this.options[this.selectedIndex].value);">
					${out.join('\n')}
					</select>
					</label>
				`;
			};

			out.push([
				`<div class="group group-xs margin-top-s margin-bottom-s">`,
				`<ul>`,
				`<li>`,
				`${droptype(typ)}`,
				`</li>`,
				`<li>`,
				`${c`valid-dates`.uf()}: ${net.nodes.length.toLocaleString(l)}.`,
				`</li>`,
				`</ul>`,
				`</div>`,
				`<div id="single-timeline" class="single-charts margin-vertical-s"></div>`,
			].join(''));
			toolkit.msg('c-stab-one', out.join(''));
			
			let pchart = echarts.init(byId('single-timeline'));
			pchart.showLoading({text: c`working`});
			sleep(50).then(() => {
				let data = net.nodes.filter(o => o[typ]);
				let sid = toolkit.titleformat(String(d.store.pos[cid].value)).shorten(50);
					
				let options = charts.timelineoptions('single-timeline', data, sid, typ);
				
				pchart.setOption(options);
				pchart.hideLoading();
				
				pchart = options = res = net = out = droptype = data = sid = undefined;
			});						
		})
		.catch(err => {
			throw new AppError(c`timeline` + ': ' + err);
		});
	},
	singlegeogram: (cid, typ = 'country') => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 
		dbq.singlegeogram(cid)
		.then(res => {
			let net = res;
			let out = [];
			let droptype = did => {
				let out = [];
				let elm = ['country', 'region', 'town'];
				elm.forEach(o => {
					out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c(o)}</option>`);
				});
				elm = undefined;
				return `
					<label class="select">
					<select id="net-selectlay"  class="fc-2 margin-right" 
					onchange="javascript:ui.singlegeogram('${cid}', this.options[this.selectedIndex].value);">
					${out.join('\n')}
					</select>
					</label>
				`;
			};
			out.push([
				`<div class="group group-xs margin-top-s margin-bottom-s">`,
				`<ul>`,
				`<li>`,
				`${droptype(typ)}`,
				`</li>`,
				`<li>`,
				`${c`valid-places`.uf()}: ${net.nodes.length.toLocaleString(l)}.`,
				`</li>`,
				`</ul>`,
				`</div>`,
				`<div id="single-geoline" class="single-charts margin-vertical-s"></div>`,
			].join(''));
			
			toolkit.msg('c-stab-two', out.join(''));
			
			let pchart = echarts.init(byId('single-geoline'));		
			pchart.showLoading({text: c`working`});
			sleep(50).then(() => {
				let data = net.nodes;
				let sid = toolkit.titleformat(String(d.store.pos[cid].value)).shorten(50);
					
				let options = charts.geolineoptions('single-geoline', data, sid, typ);
				
				pchart.setOption(options);
				pchart.hideLoading();
				
				pchart = data = sid = options = res = net = out = droptype = undefined;
			});						
		})
		.catch(err => {
			throw new AppError(c`timeline` + ': ' + err);
		});
	},
	singletaxogram: (cid, typ = 'rkey', mod = 'scatter') => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 
		dbq.singletaxogram(cid)
		.then(res => {
			let net = res;
			let out = [];
			let droptype = did => {
				let out = [];
				out.push(`
					<option value="rkey"${did === 'rkey' ? ' selected' : ''}>${c`taxonomy-type`}</option>
				`);
				out.push(`
					<option value="taxonomy"${did === 'taxonomy' ? ' selected' : ''}>${c`taxonomy-value`}</option>
				`);
				return `
					<label class="select">
					<select id="net-selectlay"  class="fc-2 margin-right" 
					onchange="javascript:ui.singletaxogram('${cid}', this.options[this.selectedIndex].value), '${mod}';">
					${out.join('\n')}
					</select>
					</label>
				`;
			};
			let dropmodel = did => {
				let out = [];
				out.push(`
					<option value="scatter"${did === 'scatter' ? ' selected' : ''}>${c`scatter`}</option>
				`);
				out.push(`
					<option value="radar"${did === 'radar' ? ' selected' : ''}>${c`radar`}</option>
				`);
				return `
					<label class="select">
					<select id="net-selectlay"  class="fc-2 margin-right" 
					onchange="javascript:ui.singletaxogram('${cid}', '${typ}', this.options[this.selectedIndex].value);">
					${out.join('\n')}
					</select>
					</label>
				`;
			};
			
			out.push([
				`<div class="group group-xs margin-top-s margin-bottom-s">`,
				`<ul>`,
				`<li>`,
				`${droptype(typ)}`,
				`</li>`,
				`<li>`,
				`${dropmodel(mod)}`,
				`</li>`,
				`<li>`,
				`${c`valid-taxonomies`.uf()}: ${net.nodes.length.toLocaleString(l)}.`,
				`</li>`,
				`<li>`,
				`${mod === 'scatter' ? c`logarithmic-scale`.uf() + '.' : ''}`,
				`</li>`,
				`</ul>`,
				`</div>`,
				`<div id="single-taxoline" class="single-charts margin-vertical-s"></div>`,
			].join(''));

			toolkit.msg('c-stab-four', out.join(''));
			
			let pchart = echarts.init(byId('single-taxoline'));		
			pchart.showLoading({text: c`working`});
			sleep(50).then(() => {
				let data = net.nodes;
				let sid = toolkit.titleformat(String(d.store.pos[cid].value)).shorten(50);
					
				let options = charts.taxoscatteroptions('single-taxoline', data, sid, typ, mod);
				pchart.setOption(options);
				pchart.hideLoading();
				
				data = sid = pchart = options = net = out = droptype = dropmodel = res = undefined;
			});						
		})
		.catch(err => {
			throw new AppError(c`taxogram` + ': ' + err);
		});
	},
	singlemap: (cid, typ = '') => maps.singlemap(cid, typ),
	directsearch: e => {
		e.preventDefault();
		let str = byId('search-input').value || '';
		str = String(str.trim());
		byId('search-results').innerHTML = '';
		if(byId('search-results-count')) {
			toolkit.msg('search-results-count', c`search` + '...');
			byId('search-results-count').classList.remove('visible');
			byId('search-results-count').classList.add('hide');
		}
		if(str.length > 3) {
			let result = Object.values(d.store.pos)
				.filter(o => dbe._operation('li', o.value, str))
				.sortBy(['value']);
			if(result.length) {
				byId('search-results').innerHTML = result.map(m => [
						`<li class="border-bottom border-color-light-600 `,
						`background-${dbe.getbcolorfromslug(m.rkey)}-50">`,
						`<a `,
						`href="javascript:ui.singlerecord(${m.ID},${m.ID},true);">${m.value}</a>`,
						`</li>`,
					].join('')
				).join('\n');
				if(byId('search-results-count')) {
					byId('search-results-count').classList.remove('hide');
					byId('search-results-count').classList.add('visible');
					toolkit.msg('search-results-count', `${c`items`.uf()}: ${result.length.toLocaleString(l)}`);
				}
			}
			result = undefined;
		}
		str = undefined;
	}
};
