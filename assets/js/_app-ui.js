'use strict';

/* global ajax, AppError, byId, c, cfetch, charts, d, dbe, dbq, echarts, file, ic, isBlank, isNil, isVisible, k, l, L, maps, pg, sleep, stats, toolkit, w */
/* exported ui */

// user interface
const ui = {
	maketable: (options, useoverlay = false) => {
		let oover = byId('siteoverlay');
		let otext = byId('siteoverlaytext');
		oover = otext = undefined;
		if(useoverlay) {
			screen.siteoverlay(true);
		}
		sleep(50).then(() => {
			if(!dbe.verifytables()) {
				if(useoverlay) screen.siteoverlay(false);
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
				let array = Array.from(Array(10).keys()).map(i => 10 + i * 10);;
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
			}
			let align = (typ, txt) => {
				let statslist = [c`count`.uf(), 'Z', 'O', 'L', 'S'];
				if(typ === 'th') {
					return `text-align-center${statslist.includes(txt) ? ' color-info' : ''}`;
				} else {
					return isNumber(txt) ? 'text-align-right' : 
						txt.includes('"empty-square"') || txt.includes('"square"') ? 'text-align-center' : 'text-align-left';
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
						`<input type="search" name="text-search" class="pull-right plain-search" `,
						`id="${options.type + '-'}text-search" `,
						`placeholder="${c`search`.uf()}..." value="${options.searchtext}">`,
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
				}
		
				toolkit.cleardomelement(options.cid);

				//byId(options.cid).classList.add('vertical-center');
				toolkit.msg(
					'relations-listing', 
					`<p class="color-blue text-align-center vertical-center">${c`working`.uf()}</p>`,
				);
				
				let tmptbl = createTable([headings, ...subset]);

				toolkit.msg(options.cid, '');
				//byId(options.cid).classList.remove('vertical-center');
				
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
					'keyup', 
					options.selectorfn, 
					{capture: false, passive: true}
				);
				byId(options.type + '-text-search').addEventListener(
					'search', 
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
				
				byId(options.type + '-text-search').focus();
				let endindex = byId(options.type + '-text-search').value.length
				if(byId(options.type + '-text-search').setSelectionRange) {
					byId(options.type + '-text-search').setSelectionRange(endindex, endindex);
				}
						
				toolkit.drawicons();		
				subset = headings = getCells = createBody = createTable = endindex = undefined;
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
						`placeholder="${c`search`.uf()}..." value="${options.searchtext}">`,
						`</li>`,

						`</ul>`,
						
						`<div id="${options.type + '-'}tablecontainer" class="table-responsive">`, 
						`<p class="text-align-center color-error">${c`no-data`.uf()}</p>`,
						`</div>`,
					].join('')
				);

				byId(options.type + '-text-search').addEventListener('keyup', options.selectorfn, {capture: false, passive: true});
				byId(options.type + '-text-search').addEventListener('search', options.selectorfn, {capture: false, passive: true});
				
				if(!isBlank(options.caption)) {
					toolkit.msg(options.type + '-page-caption', options.caption);
				}
				
				byId(options.type + '-text-search').focus();
				var endindex = byId(options.type + '-text-search').value.length
				if(byId(options.type + '-text-search').setSelectionRange) {
					byId(options.type + '-text-search').setSelectionRange(endindex, endindex);
				}
				
				endindex = undefined;
			}
			if(useoverlay) screen.siteoverlay(false);
			
			paginate = pageselector = pagesize = pagerange = pagedata = undefined;
			align = makecelltext = undefined;
		});
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
		if(!screen.siteoverlayisset) {
			screen.siteoverlay(true);
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
				result = d.filterids;
			}
			let setresult = new Set(result);
			posfilter = taxfilter = result = undefined;
			
			let rowsfields = ['type', 'title', 'taxonomies'];
			let descending = srt < 0 ? '-' : ''; 
			let sortedlist = d.filterids.map(o => ({
				ID: o,
				type: c(d.store.pos[o].rkey).uf(),
				title: toolkit.titleformat(d.store.pos[o].value),
				taxonomies: d.store.tax[o] ? 
					d.store.tax[o].sortBy(['value']).map(m => m.value).join('. ') : 
					'',
			})).sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
			
			rowsfields = descending = undefined;
			
			if(xprt) {
				file.exportdatatocsv(sortedlist.filter(o => setresult.has(o.ID)));
				if(screen.siteoverlayisset) {
					screen.siteoverlay(false);
				}
				return;
			}

			let opts = {
				cid: 'data-listing',
				type: 'list',
				page: Number(page) || d.currentpages.list,
				/* caption: true, */
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
							/* `</a>`, */
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
			ui.maketable(opts);
			if(screen.siteoverlayisset) screen.siteoverlay(false);	
			opts = sortedlist = undefined;
		});
	},
	singlerecord: (cid, trail, clearchain) => {
		screen.siteoverlay(true);
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

			out.push('<div class="group group-xs margin-top-s margin-bottom-s">');
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
			out.push([
				`<p class="no-margin-bottom">`,
				`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon margin-right-xs">`,
				`<path class="globe" d=""></path>`,
				`</svg>`,
				`<a class="text-decoration-none" id="s-stab-six" href="javascript:toolkit.selecttab('stab', 'six');`,
				`ui.singlemap(${cid})">${c`maps`.uf()}</a>`,
				`</p>`,
			].join(''));
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
			
			if(screen.modal !== undefined) {
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
			}
			screen.modal = screen.displaymodal(features);
			features = icon = undefined;

			toolkit.statustext();
			toolkit.timer('ui.singlerecord');
			screen.siteoverlay(false);
			prv = pos = tax = met = rel = tit = out = net = undefined;
		});
	},
	filterscreen: (reset = false, xfid = false, defaultpanel = 'zero') => {		
		if(!screen.siteoverlayisset) {
			toolkit.statustext(true);
			screen.siteoverlay(true);
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
						`data-tooltip="${c`calculate`} + ${c`result`}" `,
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
						`href="javascript:toolkit.generictab('xstab1', 'xc-atab-two', 'xstabcontent', 'xstablinks');">`,
						`<span>`,
						`${c`filtered`.uf()}: `,
						d.filtered.toLocaleString(l),
						`</span>`,
						`<span id="flt-microchart" class="margin-left-s">`,
						`</span>`,						
						`</a>`,
						`</li>`,

						`<li>`,
						`<span id="fltwarning" class="color-error margin-right-l"></span>`,
						`</li>`,
						
						`</ul>`,
						`</div>`,			
					].join('');
					
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
					}
					screen.modal = screen.displaymodal(features);
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
							data-tooltip="${c`values-list`}" 
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
							data-tooltip="${c`remove-condition`}" 
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
					toolkit.microchart('flt-microchart', Math.round((d.filtered / d.poslength) * 100), 'filterchart');
					toolkit.msg('flt-filterlength', d.filter.length.toLocaleString(l));
					
					/*
					if(document.getElementById('search-main')) {
						let srh = [];
						srh.push(`
							<div class="group group-xs">
							<ul>
							<li>
							<label class="select" for="search-rkey">
							<select id="search-rkey" 
							onchange="dbq.updatefiltercondition(0, this);ui.filtercondisok(0)">
							<option value=""${d.filter[0].rkey === '' ? ' selected' : ''}>${c`any-metainfo`}</option>
							${k.keys.sort((a, b) => toolkit.rkeytranslate(a).localeCompare(toolkit.rkeytranslate(b), l)).map(x => 
							`<option value="${x}"${d.filter[0].rkey === x ? ' selected' : ''}>
							${toolkit.rkeytranslate(x)}</option>`)}
							</select>
							</label>
							</li>
							<li>
							<input id="search-val" type="search" placeholder="${c`search`}..." 
							class="filter-value" value="${d.filter[0].value}" 
							onkeyup="dbq.updatesearchcondition(this.value)">
							</li>
							<li>	
							<a class="button button-border button-icon button-info" 
							data-tooltip="${c`search`}" 
							href="javascript:ui.filtersearch(byId('search-val').value,byId('search-rkey').value, true, 'one');">
							<svg width="24" height="18" viewBox="0 0 24 24" class="svgicon">
							<path class="search" d=""></path>
							</svg> 
							</a>
							</li>
							<li>
							<span id="search-results"></span>
							</li>
							</ul>
							</div>
							<p id="search-description"></p>
						`);
						toolkit.msg('search-main', srh.join(''));
						srh = undefined;
					}
					*/
					
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
						/*
						{tab: '4', pad: 'four'},
						*/
					].find(o => o.pad === defaultpanel);
					toolkit.generictab(`xstab${tabs.tab}`, `xc-atab-${tabs.pad}`, 'xstabcontent', 'xstablinks');
					tabs = undefined;
					
					if(screen.siteoverlayisset) {
						toolkit.statustext();
						screen.siteoverlay(false);
					}
					trm = tmp = out = url = makenode = makesubfilter = undefined;
				}).catch(err => { 
					if(screen.siteoverlayisset) {
						toolkit.statustext();
						screen.siteoverlay(false);
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
					}
					
					screen.alert = screen.displayalert(features);
					if(screen.siteoverlayisset) {
						toolkit.statustext();
						screen.siteoverlay(false);
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
		
		screen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.search(d.filter[idx].operator,
				d.filter[idx].modifier,
				d.filter[idx].value,
				d.filter[idx].rkey
			)
			.then(ret => {
				d.filter[idx].results = ret.results;
				
				nod.querySelector('.filter-search-result').innerHTML = d.filter[idx].results.length.toLocaleString(l);
				nod.querySelector('.filter-search-result').classList.remove('bg-success');
				nod.querySelector('.filter-search-result').classList.remove('bg-error');
				nod.querySelector('.filter-search-result').classList.add(d.filter[idx].results.length ? 'bg-success' : 'bg-error');
				
				if(document.getElementById('flt-description')) {
					toolkit.msg('flt-description', ui.describefilter());
				}
				screen.siteoverlay(false);
				idx = elm = nod = isvalidquery = ret = undefined;
			})
			.catch(err => { 
				idx = elm = nod = isvalidquery = undefined;
				screen.siteoverlay(false);
				throw new AppError(c`filter-condition` + ': ' + err); 
			});
		});
	},
	filtersearch: (val, met, immediate = false, defaulttab = 'zero') => {
		screen.siteoverlay(true);
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
				screen.siteoverlay(false);
				idx = ret = undefined;
			})
			.catch(err => { 
				idx = undefined;
				screen.siteoverlay(false);
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
	setfilter: (opr, activatetimer = true) => {
		if(!dbq.readytosetfilter()) {
			let url = 'assets/views/' + l.toLowerCase() + '/filternotready.html';
			cfetch(url).then(txt => txt.text()).then(txt => { 
				url = undefined;
				throw new AppError(c`filter` + ': ' + txt); 
			});
			return;
		}
		if(!screen.siteoverlayisset) {
			screen.siteoverlay(true);
		}
		sleep(50).then(() => {
			dbq.setfilter(opr === '_strict')
			.then(() => {
				d.currentfilterlink = opr;
				if(document.getElementById('filter-info-stats')) {
					toolkit.statustext();
					if(screen.siteoverlayisset) {
						screen.siteoverlay(false);
					}
					ui.filterscreen();
				}
						
				d.currentpages.list = 0;

				if(isVisible(byId('schema-listing'))) stats.schema();
				if(isVisible(byId('relations-listing'))) stats.relations();
				if(isVisible(byId('stats-charts'))) {
					charts.chart();
				}
				if(isVisible(byId('stats-network'))) {
					charts.relations();
				}
				if(isVisible(byId('stats-map'))) {
					d.mapdata = {};
					maps.basemap();
				}

				toolkit.statustext();
				toolkit.showactivecollection();
				ui.datalist(d.currentpages.list);
				if(screen.siteoverlayisset) {
					screen.siteoverlay(false);
				}
				if(!d.filterids.length) {
					throw new AppWarning(c`no-data`.uf());
				}
			})
			.catch(err => { 
				toolkit.statustext();
				if(screen.siteoverlayisset) {
					screen.siteoverlay(false);
				}
				ui.datalist(d.currentpages.list);
				throw new AppError(c`filter` + ': ' + err); 
			});
		});
	},
	describefilter: () => {
		let out = [];
		d.filter.forEach(o => {
			out.push(
				[
					o.modifier !== '' ? c(o.modifier) : '',
					o.rkey !== '' ? '[' + c(o.rkey) + ']' : '[' + c`any-metainfo` + ']',
					c(o.operator),
					o.value !== '' ? '"' + o.value + '"' : '',
				].join(' ').trim()
			);
		});
		let sub = [];
		Object.keys(d.filtersubfilter).forEach(o => {
			if(d.filtersubfilter[o]) sub.push(c(o));
		});
		return [
			`<p class="margin-top margin-bottom">`, 
			out.join(d.currentfilterlink ? ' ' + c(d.currentfilterlink) + ' ' : ', '),
			`.</p>`, 
			sub.length ? `<p class="margin-bottom">${c`include`.uf()} ${sub.join(', ')}.</p>` : ``,
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
		dbq.clearfilter(Object.assign({}, d.filterrecord))
		.then(() => {
			// Collections reset
			file.unloadremotecollection();
			
			if(isVisible(byId('modal-content'))) {
				toolkit.modalclose();
			}
			if(showfilter) ui.filterscreen();
			ui.datalist();
		})
		.catch(err => { 
			throw new AppError(c`filter` + ': ' + err); 
		});
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
				<th colspan="2">${c('type').uf()}</th>
				<th colspan="2">${c('filtered').uf()}</th>
				<th>${c('total').uf()}</th>
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
					${c(o).uf()}
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
		screen.siteoverlay(true);
		sleep(50).then(() => {
			if(isNil(d.filter[fid].rkey) || d.filter[fid].rkey.toString() === '') {
				screen.siteoverlay(false);
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
					if(screen.alert !== undefined) {
						toolkit.alertclose();
					}
					let features = {
						progress: false,
						title: c`values-list`.uf(),
						content: out.join(''),
						action: false,
						cancel: true,
						canceltitle: c`close`.uf()
					}
					screen.alert = screen.displayalert(features);
					features = undefined;
		
					ret = out = undefined;
					screen.siteoverlay(false);
				});
			})
			.catch(err => { 
				screen.siteoverlay(false);
				throw new AppError(c`list-values` + ': ' + err); 
			});
		});
	}, 
	collectionselector: (dom, setoverlay = true) => {
		if(!screen.siteoverlayisset) {
			screen.siteoverlay(true);
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
					if(screen.siteoverlayisset) {
						screen.siteoverlay(false);
					}
					toolkit.statustext();
					throw new AppError(c`collection-load` + ': ' + err);
				});
			}
			if(screen.siteoverlayisset) {
				screen.siteoverlay(false);
			}
				toolkit.statustext();
		})
		.catch(err => {
			if(screen.siteoverlayisset) {
				screen.siteoverlay(false);
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
		
		screen.siteoverlay(true);
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
						screen.siteoverlay(false);
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
					screen.siteoverlay(false);
	
					droptype = dropbound = txtdata = undefined;
					res = cha = pchart = net = xctp = ncats = nbous = xbou = xid = sid = undefined; 
					elist = avals = nnods = nmax = nsize = rnd = gw = gh = options = undefined;
				} else {
					let out = [];					
					out.push(`<p><span class="text-error">${c`no-results`.uf()}</span></p>`);
					toolkit.msg('c-stab-three', out.join(''));
					screen.siteoverlay(false);
					droptype = dropbound = txtdata = res = undefined;
				}
			})
			.catch(err => {
				screen.siteoverlay(false);
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
		screen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.singlestats(cid, row)
			.then(res => {
				let out = [];
				if(res && res.length) {
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
						screen.siteoverlay(false);
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
				screen.siteoverlay(false);
			})
			/*
			.catch(err => {
				droprows = undefined;
				screen.siteoverlay(false);
				throw new AppError(c`stats` + ': ' + err);
			});
			*/
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
	singlemap: (cid, typ = '') => {
		// BE CAREFUL: Modified leaflet-src.js, v1.3.1, line 5780.
		// ORIGINAL: var first = e.touches ? e.touches[0] : e;
		// MODIFIED: var first = e.touches.length ? e.touches[0] : e;
		// "e.touches" is ever an array, so original value is ever true, too
		
		if (!window.L || !L.GeoJSON) throw new AppError(c`invalid-map-library`);
		dbq.singlemap(cid)
		.then(res => {
			let isvalidflowpoint = f => (
				f.origin_id && f.origin_lat && f.origin_lon && f.destination_id && f.destination_lat && f.destination_lon
			);
			let makepopupinfo = (nid, rkey) => {
				let rec = dbe.getposbyid(nid) || null;
				return !rec ? 
					`ID: ${nid}` : 
					`ID: ${nid}. <a href="javascript:ui.singlerecord(${nid},${cid})">${toolkit.titleformat(rec.value)}</a>
					<br />${c(rkey)}						
					`;
			};
			let mai = res.main.length ? dbe.makegeojson(res.main) : null;
			let rel = dbe.makegeojson(res.related);
			let nei = dbe.makegeojson(res.neighbourhood);
			let flo = dbe.makegeojson([...res.related, ...res.neighbourhood].filter(o => isvalidflowpoint(o)));

			let out = [];
			out.push(`
				<div class="group group-xs margin-top-s margin-bottom-s">
				<ul>
				<li>
				${c`related`.uf()}: &#9711; ${rel.features.length.toLocaleString(l)}.
				${c`neighbourhood`.uf()}: &#9634; ${nei.features.length.toLocaleString(l)}.
				</li>
				</ul>
				</div>
				<style>
				.leaflet-control-layers-toggle {
					background-image:url(${'./assets/js/vendor/leaflet/'}images/layers.png);
				}
				</style>
				<div id="single-map" class="margin-vertical-s" 
				style="width: 100%; height: 500px; border: 1px solid lightgray;"></div>
			`);
			
			toolkit.msg('c-stab-six', out.join(''));
			
			let baselayers = {};
			let overlays = {};
			
			baselayers['OSM Color'] = L.tileLayer.provider('OpenStreetMap.Mapnik');
			baselayers['OSM B&W'] = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');
			baselayers['OSM HOT'] = L.tileLayer.provider('OpenStreetMap.HOT');
			baselayers['OpenTopoMap'] = L.tileLayer.provider('OpenTopoMap');
			baselayers['ESRI World Imagery'] = L.tileLayer.provider('Esri.WorldImagery');
			baselayers['CartoDB DarkMatter'] = L.tileLayer.provider('CartoDB.DarkMatter');
			baselayers['Wikimedia'] = L.tileLayer.provider('Wikimedia');

			let smap = L.map('single-map', {
				zoom: 3,
			});

			L.Icon.Default.imagePath = './assets/js/vendor/leaflet/images/';	
			
			baselayers['OSM Color'].addTo(smap);

			if(mai) {
				overlays[c`main`.uf()] = L.geoJSON(mai, {
					pointToLayer: (feature, latlng) => new L.ShapeMarker(latlng, {
						shape: feature.properties.shape,
						radius: feature.properties.radius,
						fillOpacity: 0.85,
						color: feature.properties.color,
						draggable: false,
						title: feature.properties.title
					}),
					onEachFeature: (feature, layer) => {
						layer.bindPopup(makepopupinfo(feature.properties.id, feature.properties.rkey));
					}
				}).addTo(smap);
			}
			
			let clsrel = L.markerClusterGroup();
			let clsnei = L.markerClusterGroup();
			
			let tmplay = L.geoJSON(rel, {
				pointToLayer: (feature, latlng) => new L.ShapeMarker(latlng, {
					shape: feature.properties.shape,
					radius: feature.properties.radius,
					fillOpacity: 0.85,
					color: feature.properties.color,
					draggable: false,
					title: feature.properties.title
				}),
				onEachFeature: function (feature, layer) {
					layer.bindPopup([(c(feature.properties.rkey) || `[${c`unknown`}]`.uf()), feature.properties.title].join('. '));
					layer.on('dragend', function(e) {
						e.preventDefault();
						document.getElementById("lat1").value = layer.getLatLng().lat;
						document.getElementById("lng1").value = layer.getLatLng().lng;
					});
				}
			});
			clsrel.addLayer(tmplay);
			tmplay = L.geoJSON(nei, {
				pointToLayer: (feature, latlng) => new L.ShapeMarker(latlng, {
					shape: feature.properties.shape,
					radius: feature.properties.radius,
					fillOpacity: 0.85,
					color: feature.properties.color,
					draggable: false,
					title: feature.properties.title
				}),
				onEachFeature: function (feature, layer) {
					layer.bindPopup([(c(feature.properties.rkey) || `[${c`unknown`}]`.uf()), feature.properties.title].join('. '));
					layer.on('dragend', function(e) {
						e.preventDefault();
						document.getElementById("lat1").value = layer.getLatLng().lat;
						document.getElementById("lng1").value = layer.getLatLng().lng;
					});
				}
			});
			clsnei.addLayer(tmplay);
			tmplay = null;

			overlays[c`clusters`.uf() + '. ' + c`related`.uf()] = clsrel;
			overlays[c`clusters`.uf() + '. ' + c`neighbourhood`.uf()] = clsnei;
			overlays[c`density-related`.uf()] = L.heatLayer(
				rel.features
					.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
					.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
				{minOpacity: 0.5, gradient: {1: 'blue'}}
			);
			overlays[c`density-neighbourhood`.uf()] = L.heatLayer(
				nei.features
					.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
					.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
				{minOpacity: 0.5, gradient: {1: 'red'}}
			);
			overlays[c`flow`.uf()] = L.canvasFlowmapLayer(flo, {				
					originAndDestinationFieldIds: {
						originUniqueIdField: 'origin_id',
						originGeometry: {
							x: 'origin_lon',
							y: 'origin_lat'
						},
						destinationUniqueIdField: 'destination_id',
						destinationGeometry: {
							x: 'destination_lon',
							y: 'destination_lat'
						}
					},
					pathDisplayMode: 'all',
					wrapAroundCanvas: true,
					animationStarted: false,
					style: function(feature) {
						if (feature.properties.isOrigin) {
							return {
								radius: 10,
								weight: 1,
								color: 'rgb(195, 255, 62)',
								fillColor: feature.properties.color,
								fillOpacity: 0.6
							};
						} else {
							return {
								radius: 5,
								weight: 0.25,
								color: 'rgb(17, 142, 170)',
								fillColor: feature.properties.color,
								fillOpacity: 0.7
							};
						}
					},
					pathProperties: function(feature) {
						return {
							type: 'dashed',
							symbol: {
								strokeStyle: feature.properties.color,
								shadowBlur: 1.5,
								lineWidth: 0.5,
								shadowColor: 'rgb(207, 241, 17)',
								lineCap: 'round'
							}
						};
					}							
				}
			);
		
			L.control.layers(baselayers, overlays).addTo(smap);

			if(typ === 'c') {
				smap.fitWorld().zoomIn();
				smap.setView([50.00, 14.44], 3);
			} else {
				let bound = overlays[c`clusters`.uf() + '. ' + c`related`.uf()].getBounds();
				if(bound.isValid()) {
					smap.fitBounds(overlays[c`clusters`.uf() + '. ' + c`related`.uf()].getBounds(), {
						padding: [50, 50]
					});
				} else {
					smap.fitWorld().zoomIn();
					smap.setView([50.00, 14.44], 3);
				}
			}
			
			let shownLayer, polygon;

			function removePolygon() {
				if (shownLayer) {
					shownLayer.setOpacity(1);
					shownLayer = null;
				}
				if (polygon) {
					smap.removeLayer(polygon);
					polygon = null;
				}
			}

			clsrel.on('clustermouseover', function (a) {
				removePolygon();
				a.layer.setOpacity(0.2);
				shownLayer = a.layer;
				polygon = L.polygon(a.layer.getConvexHull());
				smap.addLayer(polygon);
			});
			clsrel.on('clustermouseout', removePolygon);
			clsnei.on('clustermouseover', function (a) {
				removePolygon();
				a.layer.setOpacity(0.2);
				shownLayer = a.layer;
				polygon = L.polygon(a.layer.getConvexHull());
				smap.addLayer(polygon);
			});
			clsnei.on('clustermouseout', removePolygon);
			smap.on('zoomend', removePolygon);

			isvalidflowpoint = makepopupinfo = mai = rel = nei = flo = undefined;
			res = out = baselayers = overlays = smap = clsrel = clsnei = undefined;
		})
		.catch(err => {
			throw new AppError(c`maps` + ': ' + err);
		});
	},
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
