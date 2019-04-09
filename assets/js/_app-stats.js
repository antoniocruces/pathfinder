'use strict';

/* global _, AppError, arrayflatten, byId, c, charts, d, dbe, dbq, dl, dbs, echarts, FastTable, fc, isBlank, isObject, k, l, plural, sleep, sortobjectbykey, Stats, toolkit */
/* exported stats */

// stats functions
const stats = {
	schema: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false, calculate = false) => {
		if(!d.filterids) return;
		screen.siteoverlay(true);
		toolkit.timer('stats.schema');
		toolkit.statustext(true);

		sleep(50).then(() => {
			if(document.getElementById('schema-listing')) {
				let sel = [];
				let tgl = `javascript:toolkit.toggleelement('schema');`;
				sel.push([
					`<div class="group group-xs margin-bottom-s">`,
					`<ul>`,
					
					`<li>`,
					
					`<div class="autocomplete">`,
					
					`<div class="input-group">`,
					`<input id="schema-input" type="text" class="autocomplete-input" `,
					`data-field="" `,
					`placeholder="${c`query-selector-info`}"/>`,
					`<a id="schema-query-trigger" `,
					`class="button info button-square button-border disabled" `,
					`href="javascript:byId('schema-input').dispatchEvent(new KeyboardEvent('keyup',{key:'Enter'}));" `,
					`data-tooltip="${c`add`}"`,
					`>`,
					`<svg width="24" height="24" viewBox="0 0 24 24" `,
					`class="svgicon">`,
					`<path class="pluscircle" d=""></path></svg>`,
					`</a>`,
					`</div>`,

					`</li>`,
					`<li>`,
					
					`<div id="stats-schema-features" class="ddown">`,
					`<a class="button info button-border" href="javascript:;">${c`filter`.uf()}</a>`,
					`<div class="ddown-content padding-xs box-shadow-xxl background-white">`,
					
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox"`, 
					`id="a-chk1" name="account-und" `,
					`onclick="javascript:`,
					`d.schemastrict=this.checked;`,
					`"${d.schemastrict ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">`,
					`<a class="text-decoration-none" href="javascript:info.help('outliers');">`,
					`${c`strict`}`,
					`</a>`,
					`</span>`,
					`</label>`,
					`</p>`,
					
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox"`, 
					`id="a-chk2" name="account-bln" `,
					`onclick="javascript:`,
					`d.schemaoutliersonly=this.checked;`,
					`"${d.schemaoutliersonly ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">`,
					`<a class="text-decoration-none" href="javascript:info.help('outliers');">`,
					`${c`meaningful-only`}`,
					`</a>`,
					`</span>`,
					`</label>`,
					`</p>`,

					`</div>`,					
					`</div>`,					

					`</li>`,
					`<li>`,

					`<a class="button info button-border" `,
					`id="schema-showhidestats" href="${tgl}">${c`stats`.uf()}</a>`,
					
					`</li>`,
					`<li>`,

					`<a class="button info" `,
					`href="javascript:stats.schema(`,
					`null, 1, `,
					`null, '', `,
					`${srt}, false, true);"`,
					`>`,
					`${c`calculate`.uf()}`,
					`</a>`,
					
					`</li>`,
					`<li>`,
					
					`<p id="schema-table-performance"></p>`,

					`</li>`,
					
					`</ul>`,
					`</div>`,
					
					`<div class="group group-xs margin-top-s">`,
					`<ul class="tags-list" id="schema-query"></ul>`,
					`</div>`,

					`<div class="hide margin-vertical-l" id="schema-stats-info">`, 
					`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`, 
					`</div>`,
				].join(''));
				
				toolkit.msg('schema-selectors', sel.join(''));
				toolkit.drawicons();
				
				if(d.schemacols.filter(o => !isBlank(o)).length < 1) {
					screen.siteoverlay(false);
					toolkit.timer('stats.schema');
					toolkit.statustext();
					toolkit.msg(
						'schema-listing', 
						[
							`<p class="color-error text-align-center vertical-center">`,
							`${c`no-data`.uf()}`,
							`</p>`
						].join('')
					);
					d.schemarectype = null;
					d.schemacols = [];
					d.schemaresults = [];
					d.schemastats = [];
					d.schemaoutliers = [];
					sel = tgl = undefined;
					
					toolkit.tagfield(
						'schema-input', 
						'schema-query', 
						d.schemacols, 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o))),
						stats.schema
					);
					autocomplete(
						byId('schema-input'), 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o)))
					);
					return;	
				}

				let t0 = performance.now();
				if(d.schemaresults.length < 1 || calculate) {
					let pcols = d.schemacols.filter(o => !isBlank(o));
					let res = stats.mutatedlist(pcols, true, true); 
					d.schemaresults = stats.calculate(res, pcols, d.schemastrict);
					pcols = res = undefined;
				}
				
				if(d.schemaresults.length) {
					stats.descriptivestats('schema', d.schemaresults);
					
					sleep(100).then(() => {
						let validrecord = (obj, txt) => {
							let ret = false;
							Object.values(obj).forEach(o => {
								if(dbe._operation('li', o, txt)) ret = true;
							});
							return ret;
						}
						let oonly = d.schemaoutliersonly;
						let oresults = d.schemaresults.filter(o => !isBlank(text) ? validrecord(o, text) : true);
						let fresults = oonly ? oresults.filter(o => d.schemaoutliers.includes(o.count)) : oresults;
						
						let rowsfields = Object.keys(fresults[0]);
						let descending = srt < 0 ? '-' : ''; 
						
						let sortedlist = fresults
							.sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
						
						rowsfields = descending = validrecord = undefined;
									
						if(xprt) {
							file.exportdatatocsv(sortedlist);
							screen.siteoverlay(false);
							toolkit.timer('stats.schema');
							toolkit.statustext();
							return;
						}

						let lstats = ui.makestats(sortedlist.map(o => o.count));
						let statstext = [
							`${c`rows`.uf()}: <strong>${lstats.rows.toLocaleString(l)}</strong>. `,
							`${c`sum`.uf()}: <strong>${lstats.total.toLocaleString(l)}</strong>. `,
							`${c`average`.uf()}: <strong>${lstats.average.toLocaleString(l)}</strong>. `,
							`${c`outliers`.uf()}: `, 
							`<strong>x &isin; `,
							`(&minus;&infin;,${lstats.lowlimit}) `,
							`&cup; `,
							`(${lstats.highlimit},&infin;) = `, 
							`${lstats.meaningful.toLocaleString(l)} `,
							`(${lstats.rowmeaning.toLocaleString(l)} ${c`rows`})</strong>. `,
							`${c`chart`.uf()}: `, 
							`<a href="javascript:charts.showplot('schema', false);">${c`sorted`}</a> `, 
							`${c`or`}  `, 
							`<a href="javascript:charts.showplot('schema', true);">${c`normalized`}</a>.`, 							
						].join('');
						lstats = undefined; 
						
						let opts = {
							cid: 'schema-listing',
							type: 'schema',
							page: Number(page) || d.currentpages.schema,
							items: stats.localstats(sortedlist), 
							stats: statstext, 
							searchtext: text,
							pgfunction: 'stats.schema',
							pgparams: {
								cid: '',
								row: '',
								srt: srt,
							},
							generatorfn: function(obj) {
								let cellcolor = toolkit.colorscale(obj.scale, window.settings.scalecolorbase, true);
								let bgcolor = cellcolor.split(';')[0];
								let focolor = cellcolor.split(';')[1];
								let stars = window.settings.zscoreassstars === 1 ? 
									toolkit.showstars(Number(obj.zscore)) : 
									toolkit.shownumericlevel(Number(obj.zscore));
								let formatnum = num => isNumber(num) ? num.toLocaleString(l) : num;
								let xscale = isNaN(obj.scale) ? `<span data-format="square" class="square"></span>` : 
									[
										`<span data-format="square" class="empty-square" `,
										`style="${bgcolor};${focolor}"></span>`
									].join('');
								cellcolor = undefined;

								let statslist = ['count', 'zscore', 'outlier', 'level', 'scale'];
								let isfield = nam => !statslist.includes(nam);
								let out = {};
								Object.keys(obj).forEach(o => {
									if(isfield(o)) {
										out[o] = [
											`<a href="javascript:`,
											`ui.filtersearch('${obj[o]}', '${o}', true);">`,
											isBlank(text) ? obj[o] : toolkit.highlight(obj[o], text), 
											`</a>`,
										].join('');
									} else {
										switch(o) {
											case 'zscore':
												out.z = `<span data-format="square">${stars}</span>`;
												break;
											case 'level':
											case 'outlier':
												out[o.substr(0, 1)] = `<span data-format="square">${formatnum(obj[o])}</span>`;
												break;
											case 'scale':
												out.s= `<span data-format="square">${xscale}</span>`;
												break;
											default: 
												out[o] = obj[o];
										}
									}
								});
								cellcolor = bgcolor = focolor = isfield = stars = undefined;
								statslist = formatnum = xscale = undefined;
								return out;
							},
							selectorfn: function(sel) {
								let nodata = !byId('schema-page-selector') || 
									!byId('schema-page-range') || 
									!byId('schema-page-size') || 
									!byId('schema-page-current') || 
									!byId('schema-pg3');
								if(nodata) {
									stats.schema(null, 1, null, byId('schema-text-search').value, srt, true);
									nodata = undefined;
								} else {
									window.settings.listrowsperpage = Number(byId('schema-page-size').value);
									let numpager = ['schema-page-selector', 'schema-page-range'].includes(sel.target.id) ? 
										Number(sel.target.value) : 
										Number(byId('schema-page-selector').value);
									stats.schema(null, numpager, null, byId('schema-text-search').value, srt, false);
									toolkit.msg('schema-page-current', Number(byId('schema-pg3').dataset.value).toLocaleString(l));
									numpager = nodata = undefined;
								}
							},
							updatepagefn: function(sel) {
								toolkit.msg('schema-page-current', Number(sel.target.value).toLocaleString(l));
								byId('schema-pg3').dataset.value = Number(sel.target.value);
							},
							exportfn: function() {
								stats.schema(cid, page, row, text, srt, true, false);
							},
						};
						ui.maketable(opts);

						sel = tgl = undefined;
						oonly = oresults = fresults = sortedlist = undefined;
					});

					toolkit.msg(
						'schema-table-performance', 
						[
							`${((performance.now() - t0) / 1000).toLocaleString(l)}s, `, 
							`${d.schemaresults.length.toLocaleString(l)} ${c`rows`}`
						].join('')
					);

					byId('schema-listing').classList.remove('hide');
					byId('schema-listing').classList.add('visible');

					toolkit.tagfield(
						'schema-input', 
						'schema-query', 
						d.schemacols, 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o))),
						stats.schema
					);
					autocomplete(
						byId('schema-input'), 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o)))
					);
					
					window.storecurrentsize = toolkit.currentmemory();
					toolkit.showmemory('app-memory');
				} else {
					screen.siteoverlay(false);
					toolkit.timer('stats.schema');
					toolkit.statustext();
					toolkit.msg(
						'schema-listing', 
						[
							`<p class="color-error text-align-center vertical-center">`,
							`${c`no-data`.uf()}`,
							`</p>`
						].join('')
					);
					toolkit.msg(
						'schema-stats-info', 
						[
							`<p class="color-error text-align-center vertical-center">`,
							`${c`no-data`.uf()}`,
							`</p>`
						].join('')
					);
					d.schemarectype = null;
					d.schemacols = [];
					d.schemaresults = [];
					d.schemastats = [];
					d.schemaoutliers = [];
					toolkit.tagfield(
						'schema-input', 
						'schema-query', 
						d.schemacols, 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o))),
						stats.schema
					);
					autocomplete(
						byId('schema-input'), 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o)))
					);
					return;
				}
			} else {
				res = undefined;
			}
			
			screen.siteoverlay(false);
			toolkit.timer('stats.schema');
			toolkit.statustext();
		});
	},
	relations: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false, calculate = false) => {
		if(!d.filterids) return;

		let dropfields = cid => {
			let out = [];
			let col = d.relationscols[cid] ? d.relationscols[cid] : null;			
			k.keys.sort(toolkit.sortlocale).forEach(o => { 
				let nam = dbe._fieldname(o);
				nam.forEach(n => {
					out.push(`<option value="${n}"${col === n ? ' selected' : ''}>${fc(n)}</option>`);
				});
				nam = undefined; 
			});
			col = undefined;
			return [
				`<label class="select info" for="acc-col${cid}">`,
				`<select `,
				`id="acc-col${cid}" `,
				`onchange="javascript:`,
				`d.relationscols[${cid}]=this.options[this.selectedIndex].value;`,
				`">`,
				`<option value="" disabled selected hidden>${cid === 0 ? c`source` : c`target`}</option>`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropbounds = () => {
			let out = [];
			out.push([
				`<option value=""${d.relationsbound === '' ? ' selected' : ''}>`,
				`${c`any-relationship`}`,
				`</option>`,
			].join(''));
			['<', '>'].forEach(o => { 
				out.push(`<option value="${o}"${d.relationsbound === o ? ' selected' : ''}>${c(o)}</option>`); 
			});
			return [
				`<label class="select info" for="acc-bound">`,
				`<select `,
				`id="acc-bound" `,
				`onchange="javascript:`,
				`d.relationsbound=this.options[this.selectedIndex].value;`,
				`">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};

		screen.siteoverlay(true);
		toolkit.timer('stats.links');
		toolkit.statustext(true);
		if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', c`working`.uf() + '&hellip;');
		
		sleep(50).then(() => {			
			if(byId('relations-listing')) {			
				let sel = [];
				let tgl = `javascript:toolkit.toggleelement('relations');`;
				sel.push([
					`<div class="group group-xs margin-bottom-s">`,
					`<ul>`,
					
					`<li style="width:25%">`,
					
					`${dropfields(0)}`,

					`</li>`,
					`<li style="width:15%">`,
					
					`${dropbounds()}`,
					
					`</li>`,
					`<li style="width:25%">`,
					
					`${dropfields(1)}`,

					`</li>`,
					`<li>`,
										
					`<div id="stats-relations-features" class="ddown">`,
					`<a class="button info button-border" href="javascript:;">${c`filter`.uf()}</a>`,
					`<div class="ddown-content padding-xs box-shadow-xxl background-white">`,
					
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox"`, 
					`id="a-chk1" name="account-und" `,
					`onclick="javascript:`,
					`d.relationsstrict=this.checked;`,
					`"${d.relationsstrict ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">`,
					`<a class="text-decoration-none" href="javascript:info.help('outliers');">`,
					`${c`strict`}`,
					`</a>`,
					`</span>`,
					`</label>`,
					`</p>`,
					
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox"`, 
					`id="a-chk2" name="account-bln" `,
					`onclick="javascript:`,
					`d.relationsoutliersonly=this.checked;`,
					`"${d.relationsoutliersonly ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">`,
					`<a class="text-decoration-none" href="javascript:info.help('outliers');">`,
					`${c`meaningful-only`}`,
					`</a>`,
					`</span>`,
					`</label>`,
					`</p>`,

					`</div>`,					
					`</div>`,					

					`</li>`,
					`<li>`,

					`<a class="button info button-border" `,
					`id="relations-showhidestats" href="${tgl}">${c`stats`.uf()}</a>`,
					
					`</li>`,
					`<li>`,

					`<a class="button info" `,
					`href="javascript:stats.relations(`,
					`null, 1, `,
					`null, '', `,
					`${srt}, false, true);"`,
					`>`,
					`${c`calculate`.uf()}`,
					`</a>`,
					
					`</li>`,
					`<li>`,
					
					`<p>`,
					`${c`relations-date-warning`.uf()}`,
					`<span id="relations-table-performance"></span>`,
					`</p>`,

					`</li>`,
					
					`</ul>`,
					`</div>`,

					`<div class="hide margin-vertical-l" id="relations-stats-info">`, 
					`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`, 
					`</div>`,
				].join(''));
				
				toolkit.msg('relations-selectors', sel.join(''));
				toolkit.drawicons();
				
				if(isBlank(d.relationscols[0])) d.relationscols[0] = byId('acc-col0').value;
				if(isBlank(d.relationscols[1])) d.relationscols[1] = byId('acc-col1').value;
				if(isBlank(d.relationsbound)) d.relationsbound = byId('acc-bound').value;

				let t0 = performance.now();

				let datapresent = d.relationsresults.length > 0;
				
				if(calculate || datapresent) {
					if(!datapresent || calculate) {
						let rel = dbm.relations(false, false);
						let tre = dbe.hashrecord(stats.mutatedlist(d.relationscols, true, true), 'ID');
						let mut = Object.values(tre).flatten();
						
						let idslist = rel.map(o => o.ID).unique();
						let ridslist = rel.map(o => o.RID).unique();
						
						let col1set = new Set(mut.filter(o => o[d.relationscols[0]] !== undefined).map(o => o.ID));
						let col2set = new Set(mut.filter(o => o[d.relationscols[1].replace('rel|', '')] !== undefined).map(o => o.ID));
						
						let sel = rel.filter(o => 
							(isBlank(d.relationsbound) ? true : o.bound === d.relationsbound) && 
								col1set.has(o.ID) && 
								col2set.has(o.RID)
						);
						let res = sel
							.map(o => Object.assign({}, o, {field: tre[o.ID] ? tre[o.ID][d.relationscols[0]] : null}))
							.map(o => Object.assign({}, o, {
								relfield: tre[o.RID] ? tre[o.RID][d.relationscols[1].replace('rel|', '')] : null
							}));
						rel = tre = mut = idslist = ridslist = col1set = col2set = sel = undefined;

						if(!res.length) {
							screen.siteoverlay(false);
							toolkit.timer('stats.links');
							toolkit.statustext();
							toolkit.msg(
								'relations-listing', 
								`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
							);
							d.relationsresults = [];
							d.relationsstats = [];
							d.relationsoutliers = [];
							return;
						}
						let pcols = ['field', 'bound', 'relfield', 'rkey'];
						let oarray = stats.calculate(res, pcols, d.relationsstrict)
							.map(o => {
								let obj = {};
								obj[c`source` + ': ' + fc(d.relationscols[0])] = o.field;
								obj.bound = o.bound;
								obj.rkey = o.rkey;
								obj[c`target` + ': ' + fc(d.relationscols[1])] = o.relfield;
								obj.count = o.count;
								return obj;
							});
							
						let isempty = oarray.length < 1;
						let istoolong = !isempty && oarray.length > window.settings.querylengthlimit;
	
						if(isempty) {
							screen.siteoverlay(false);
							toolkit.timer('stats.links');
							toolkit.statustext();
							toolkit.msg(
								'relations-listing', 
								`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
							);
							d.relationscols = ['', ''];
							d.relationsbound = '<';
							d.relationsresults = [];
							d.relationsstats = [];
							d.relationsoutliers = [];
							res = pcols = oarray = undefined;
							isempty = istoolong = undefined;
							return;
						} else if(istoolong) {
							screen.siteoverlay(false);
							toolkit.timer('stats.links');
							toolkit.statustext();
							toolkit.msg(
								'relations-listing', 
								`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
							);
							let len = oarray.length;
							d.relationscols = ['', ''];
							d.relationsbound = '<';
							d.relationsresults = [];
							d.relationsstats = [];
							d.relationsoutliers = [];
							res = pcols = oarray = undefined;
							isempty = istoolong = undefined;
							throw new AppError([
								c`relations` + ': ',
								c`out-of-limits` + '; ',
								c`result-too-long`, 
								`(`,
								len.toLocaleString(l),
								`/`,
								window.settings.querylengthlimit.toLocaleString(l),
								`)`
							].join(''));
						} else {
							d.relationsresults = oarray;
						}
						dropfields = dropbounds = undefined;
						res = sel = tgl = undefined;
						isempty = istoolong = pcols = oarray = undefined;
					}
					if(d.relationsresults.length > 0) {
						sleep(100).then(() => {
							stats.descriptivestats('relations', d.relationsresults);
							let validrecord = (obj, txt) => {
								let ret = false;
								Object.values(obj).forEach(o => {
									if(dbe._operation('li', o, txt)) ret = true;
								});
								return ret;
							}
							let oonly = d.relationsoutliersonly;
							let oresults = d.relationsresults.filter(o => !isBlank(text) ? validrecord(o, text) : true);
							let fresults = oonly ? 
								oresults.filter(o => d.relationsoutliers.includes(o.count)) : 
								oresults;
							
							let rowsfields = Object.keys(fresults[0]);
							let descending = srt < 0 ? '-' : ''; 
							
							let sortedlist = fresults
								.sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
							
							rowsfields = descending = validrecord = undefined;
										
							if(xprt) {
								file.exportdatatocsv(sortedlist);
								screen.siteoverlay(false);
								toolkit.timer('stats.relations');
								toolkit.statustext();
								return;
							}

							let lstats = ui.makestats(sortedlist.map(o => o.count));
							let statstext = [
								`${c`rows`.uf()}: <strong>${lstats.rows.toLocaleString(l)}</strong>. `,
								`${c`sum`.uf()}: <strong>${lstats.total.toLocaleString(l)}</strong>. `,
								`${c`average`.uf()}: <strong>${lstats.average.toLocaleString(l)}</strong>. `,
								`${c`outliers`.uf()}: `, 
								`<strong>x &isin; `,
								`(&minus;&infin;,${lstats.lowlimit}) `,
								`&cup; `,
								`(${lstats.highlimit},&infin;) = `, 
								`${lstats.meaningful.toLocaleString(l)} `,
								`(${lstats.rowmeaning.toLocaleString(l)} ${c`rows`})</strong>. `,
								`${c`chart`.uf()}: `, 
								`<a href="javascript:charts.showplot('relations', false);">${c`sorted`}</a> `, 
								`${c`or`}  `, 
								`<a href="javascript:charts.showplot('relations', true);">${c`normalized`}</a>.`, 							
							].join('');
							lstats = undefined; 
	
							let opts = {
								cid: 'relations-listing',
								type: 'relations',
								page: Number(page) || d.currentpages.relations,
								/* caption: true, */
								items: stats.localstats(sortedlist), 
								stats: statstext, 
								searchtext: text,
								pgfunction: 'stats.relations',
								pgparams: {
									cid: '',
									row: '',
									srt: srt,
								},
								generatorfn: function(obj) {
									let cellcolor = toolkit.colorscale(obj.scale, window.settings.scalecolorbase, true);
									let bgcolor = cellcolor.split(';')[0];
									let focolor = cellcolor.split(';')[1];
									let stars = window.settings.zscoreassstars === 1 ? 
										toolkit.showstars(Number(obj.zscore)) : 
										toolkit.shownumericlevel(Number(obj.zscore));
									let formatnum = num => isNumber(num) ? num.toLocaleString(l) : num;
									let xscale = isNaN(obj.scale) ? `<span data-format="square" class="square"></span>` : 
										[
											`<span data-format="square" class="empty-square" `,
											`style="${bgcolor};${focolor}"></span>`
										].join('');
									cellcolor = undefined;

									let statslist = ['count', 'zscore', 'outlier', 'level', 'scale'];
									let isfield = nam => !statslist.includes(nam);
									let out = {};
									Object.keys(obj).forEach(o => {
										if(isfield(o)) {
											let xfld = isNumber(obj[o]) ? 
												obj[o] : 
												isBlank(text) ? fc(obj[o]) : toolkit.highlight(fc(obj[o]), text);
											out[o] = [
												`<a href="javascript:`,
												`ui.filtersearch('${obj[o]}', '${o}', true);">`,
												xfld, 
												`</a>`,
											].join('');
											xfld = undefined;
										} else {
											switch(o) {
												case 'zscore':
													out.z = `<span data-format="square">${stars}</span>`;
													break;
												case 'level':
												case 'outlier':
													out[o.substr(0, 1)] = [
														`<span data-format="square">`,
														`${formatnum(obj[o])}</span>`
													].join('');
													break;
												case 'scale':
													out.s= `<span data-format="square">${xscale}</span>`;
													break;
												default: 
													out[o] = obj[o];
											}
										}
									});
									cellcolor = bgcolor = focolor = isfield = stars = undefined;
									statslist = formatnum = xscale = undefined;
									return out;
								},
								selectorfn: function(sel) {
									let nodata = !byId('relations-page-selector') || 
										!byId('relations-page-range') || 
										!byId('relations-page-size') || 
										!byId('relations-page-current') || 
										!byId('relations-pg3');
									if(nodata) {
										stats.relations(null, 1, null, byId('relations-text-search').value, srt, true);
										nodata = undefined;
									} else {
										window.settings.listrowsperpage = Number(byId('relations-page-size').value);
										let numpager = [
											'relations-page-selector', 
											'relations-page-range'
										].includes(sel.target.id) ? 
											Number(sel.target.value) : 
											Number(byId('relations-page-selector').value);
										stats.relations(null, numpager, null, byId('relations-text-search').value, srt, false);
										toolkit.msg(
											'relations-page-current', 
											Number(byId('relations-pg3').dataset.value).toLocaleString(l)
										);
										numpager = nodata = undefined;
									}
								},
								updatepagefn: function(sel) {
									toolkit.msg('relations-page-current', Number(sel.target.value).toLocaleString(l));
									byId('relations-pg3').dataset.value = Number(sel.target.value);
								},
								exportfn: function() {
									stats.relations(cid, page, row, text, srt, true, false);
								},
							};
							ui.maketable(opts);
							screen.siteoverlay(false);
							toolkit.timer('stats.relations');
							toolkit.statustext();
	
							sel = tgl = undefined;
							oonly = oresults = fresults = sortedlist = undefined;
							datapresent = undefined;
						});
	
						toolkit.msg(
							'relations-table-performance', 
							[
								`. `,
								`${((performance.now() - t0) / 1000).toLocaleString(l)}s, `, 
								`${d.relationsresults.length.toLocaleString(l)} ${c`rows`}`
							].join('')
						);
						t0 = undefined;
						
						byId('relations-listing').classList.remove('hide');
						byId('relations-listing').classList.add('visible');
						
						window.storecurrentsize = toolkit.currentmemory();
						toolkit.showmemory('app-memory');
					}
				} else {
					screen.siteoverlay(false);
					toolkit.timer('stats.relations');
					toolkit.statustext();
					toolkit.msg(
						'relations-listing', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
					);
					toolkit.msg(
						'relations-stats-info', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
					);
					
					d.relationscols[0] = byId('acc-col0').value;
					d.relationscols[1] = byId('acc-col1').value;
					d.relationsbound = byId('acc-bound').value;

					d.relationsresults = [];
					d.relationsstats = [];
					d.relationsoutliers = [];
					dropfields = dropbounds = undefined;
					sel = tgl = t0 = datapresent = undefined;
					return;
				}
			}

			screen.siteoverlay(false);
			toolkit.timer('stats.relations');
			toolkit.statustext();
		});
	},
	cooccurrences: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false, calculate = false) => {
		if(!d.filterids) return;

		let drops = suffix => {
			let out = [];
			let bound = suffix === 'source' ? '<' : '>';
			let array = d.chains.filter(o => o.bound === bound);
			let sorter = (a, b) => {
				let stra = fc(String(a.tin)) + fc(String(a.link)) + fc(String(a.tout));
				let strb = fc(String(b.tin)) + fc(String(b.link)) + fc(String(b.tout));
				return stra.localeCompare(strb, l, {sensitivity: 'base', numeric: true});
			};
			out.push(`<option value="">[${c`none`}]</option>`);
			array.sort(sorter).forEach(o => { 
				out.push([
					`<option value="`,
					`${o.tin}|${o.link}|${o.tout}"`,
					`${d['cooccurrences' + suffix] === `${o.tin}|${o.link}|${o.tout}` ? ' selected' : ''}`,
					`>${c(o.tin)} &rarr; ${c(o.link)} &rarr; ${c(o.tout)}</option>`
				].join('')); 
			});
			array = bound = sorter = undefined;
			let indicator = ['source', 'target'].includes(suffix) && d['cooccurrences' + suffix] === '' ? 
				'error' : '';
			return [
				`<p class="form-message">${c(suffix).uf()}</p>`,
				`<label class="select${! isBlank(indicator) ? ' ' + indicator : indicator}" for="cooccurrences${suffix}">`,
				`<select `,
				`id="cooccurrences${suffix}" `,
				`onchange="javascript:`,
				`d.cooccurrences${suffix}=this.options[this.selectedIndex].value;`,
				`toolkit.required(this, ${['source', 'target'].includes(suffix)});`,
				`stats.cooccurrences(null, 1, null, '', 1, false, true);`,
				`"`,
				`${! isBlank(indicator) ? ' class="' + indicator + '"' : indicator}`,
				`>`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};

		d.cooccurrencesoutliersonly = isBlank(d.cooccurrencesoutliersonly) ? 
			false : d.cooccurrencesoutliersonly;
		
		screen.siteoverlay(true);
		toolkit.timer('stats.cooccurrences');
		toolkit.statustext(true);
		if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', c`working`.uf() + '&hellip;');
		
		sleep(50).then(() => {
			let sel = [];
			let tgl = `javascript:toolkit.toggleelement('cooccurrences');`;
			sel.push([
				`<div class="group group-xs margin-bottom-s">`,
				`<ul>`,
				
				`<li style="width:35%">`,
				
				`${drops('source')}`,
				
				`</li>`,
				`<li style="width:35%">`,
				
				`${drops('target')}`,
				
				`</li>`,
				`<li>`,
									
				`<p class="form-message">&nbsp;</p>`,
				`<div id="stats-cooccurrences-features" class="ddown">`,
				`<a class="button info button-border" href="javascript:;">${c`filter`.uf()}</a>`,
				`<div class="ddown-content padding-xs box-shadow-xxl background-white">`,
				
				`<p class="no-margin-bottom">`,
				`<label class="control switch">`,
				`<input type="checkbox"`, 
				`id="a-chk1" name="account-und" `,
				`onclick="javascript:`,
				`d.cooccurrencesoutliersonly=this.checked;`,
				`stats.cooccurrences(${!cid ? 'null' : "'" + cid + "'"},`,
				`${page}, ${!row ? 'null' : "'" + row + "'"},`,
				`'${text}',${srt},${xprt},${calculate});"`,
				`${d.cooccurrencesoutliersonly ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">`,
				`<a class="text-decoration-none" href="javascript:info.help('outliers');">`,
				`${c`meaningful-only`}`,
				`</a>`,
				`</span>`,
				`</label>`,
				`</p>`,

				`</div>`,					
				`</div>`,					

				`</li>`,
				`<li>`,

				`<p class="form-message">&nbsp;</p>`,
				`<a class="button info button-border" `,
				`id="cooccurrences-showhidestats" href="${tgl}">${c`stats`.uf()}</a>`,
				
				`</li>`,
				
				`</ul>`,
				`</div>`,

				`<div id="cooccurrences-routeset" class="hide margin-top-s">`,
				`<div class="group group-xs">`,
				`<ul>`,
				`<li>`,
				`<a class="button button-info button-s button-border" `,
				`href="javascript:stats.cooccurrences(null, 1, null, '', 1, false, true);">`,
				`${c`recalculate`.uf()}`,
				`</a>`,
				`</li>`,
				`<li>`,
				`<a class="button button-info button-s button-border" `,
				`href="javascript:info.route();">`,
				`${c`route-graph`.uf()}</a>`,
				`</li>`,
				`</ul>`,
				`</div>`,

				`<p id="cooccurrences-legend" class="hide">`,
				`<span id="cooccurrences-table-performance"></span>. `,
				`${dbhelper.routedescription()}. ${c`cooccurrences-route-warning`.uf()}.`,
				`</p>`,
				
				`<div id="cooccurrences-route" style="margin-top:.5em"></div>`,
				`</div>`,

				`<div class="hide margin-vertical-l" id="cooccurrences-stats-info">`,
				`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`,
				`</div>`,
			].join(''));
					
			toolkit.msg('cooccurrences-selectors', sel.join('\n'));
			toolkit.drawicons();
			
			let t0 = performance.now();
			
			if(calculate || d.cooccurrencesresults.length) {
				if(isBlank(d.cooccurrencessource) || isBlank(d.cooccurrencestarget)) {
					screen.siteoverlay(false);
					toolkit.timer('stats.cooccurrences');
					toolkit.statustext();
					toolkit.msg(
						'cooccurrences-listing', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
					);
					drops = sel = tgl = t0 = undefined;
					return;
				}

				let object = dbq.cooccurrences(calculate, false);
				if(object.length < 1) {
					screen.siteoverlay(false);
					toolkit.timer('stats.cooccurrences');
					toolkit.statustext();
					toolkit.msg(
						'cooccurrences-listing', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
					);
					d.cooccurrencesresults = [];
					d.cooccurrencesstats = [];
					d.cooccurrencesoutliers = [];
					byId('cooccurrences-legend').classList.add('hide');
					byId('cooccurrences-routeset').classList.add('hide');
					drops = sel = tgl = t0 = undefined;
					return;
				}

				let oarray = stats.prepare(object, Object.keys(object[0]), true);
				let dstats = dbs.stats(oarray.map(o => o.count));
				
				d.cooccurrencesoutliers = dstats.outliers;

				d.cooccurrencesresults = oarray;
				object = oarray = dstats = undefined;
				
				if(!d.cooccurrencesresults.length) {
					screen.siteoverlay(false);
					toolkit.timer('stats.cooccurrences');
					toolkit.statustext();
					toolkit.msg(
						'cooccurrences-listing', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
					);
					d.cooccurrencesresults = [];
					d.cooccurrencesstats = [];
					d.cooccurrencesoutliers = [];
					byId('cooccurrences-legend').classList.add('hide');
					byId('cooccurrences-routeset').classList.add('hide');
					drops = sel = tgl = t0 = undefined;
					return;
				} else {
					sleep(100).then(() => {
						stats.descriptivestats('cooccurrences', d.cooccurrencesresults);
						let validrecord = (obj, txt) => {
							let ret = false;
							Object.keys(obj).filter(o => o !== 'count').forEach(o => {
								if(dbe._operation('li', d.store.pos[obj[o]].value, txt)) ret = true;
							});
							return ret;
						}
						let oonly = d.cooccurrencesoutliersonly;
						let oresults = d.cooccurrencesresults.filter(o => 
							!isBlank(text) ? validrecord(o, text) : true
						);
						let fresults = oonly ? 
							oresults.filter(o => d.cooccurrencesoutliers.includes(o.count)) : 
							oresults;
						
						if(!fresults.length) {
							screen.siteoverlay(false);
							toolkit.timer('stats.cooccurrences');
							toolkit.statustext();
							toolkit.msg(
								'cooccurrences-listing', 
								`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
							);
							d.cooccurrencesresults = [];
							d.cooccurrencesstats = [];
							d.cooccurrencesoutliers = [];
							byId('cooccurrences-legend').classList.add('hide');
							byId('cooccurrences-routeset').classList.add('hide');
							drops = sel = tgl = t0 = undefined;
							validrecord = oonly = oresults = fresults = undefined;
							return;
						}
						
						let rowsfields = Object.keys(fresults[0]);
						let descending = srt < 0 ? '-' : ''; 
						
						let sortedlist = fresults
							.sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
						
						rowsfields = descending = validrecord = undefined;
									
						if(xprt) {
							file.exportdatatocsv(sortedlist);
							screen.siteoverlay(false);
							toolkit.timer('stats.relations');
							toolkit.statustext();
							return;
						}

						let lstats = ui.makestats(sortedlist.map(o => o.count));
						let statstext = [
							`${c`rows`.uf()}: <strong>${lstats.rows.toLocaleString(l)}</strong>. `,
							`${c`sum`.uf()}: <strong>${lstats.total.toLocaleString(l)}</strong>. `,
							`${c`average`.uf()}: <strong>${lstats.average.toLocaleString(l)}</strong>. `,
							`${c`outliers`.uf()}: `, 
							`<strong>x &isin; `,
							`(&minus;&infin;,${lstats.lowlimit}) `,
							`&cup; `,
							`(${lstats.highlimit},&infin;) = `, 
							`${lstats.meaningful.toLocaleString(l)} `,
							`(${lstats.rowmeaning.toLocaleString(l)} ${c`rows`})</strong>. `,
							`${c`chart`.uf()}: `, 
							`<a href="javascript:charts.showplot('cooccurrences', false);">${c`sorted`}</a> `, 
							`${c`or`}  `, 
							`<a href="javascript:charts.showplot('cooccurrences', true);">${c`normalized`}</a>.`, 							
						].join('');
						lstats = undefined; 
						
						let tsource = d.cooccurrencessource.split('|');
						let ttarget = d.cooccurrencestarget.split('|');
						let opts = {
							cid: 'cooccurrences-listing',
							type: 'cooccurrences',
							page: Number(page) || d.currentpages.cooccurrences,
							items: stats.localstats(sortedlist), 
							stats: statstext, 
							searchtext: text,
							pgfunction: 'stats.cooccurrences',
							pgparams: {
								cid: '',
								row: '',
								srt: srt,
							},
							generatorfn: function(obj) {
								let cellcolor = toolkit.colorscale(obj.scale, window.settings.scalecolorbase, true);
								let bgcolor = cellcolor.split(';')[0];
								let focolor = cellcolor.split(';')[1];
								let stars = window.settings.zscoreassstars === 1 ? 
									toolkit.showstars(Number(obj.zscore)) : 
									toolkit.shownumericlevel(Number(obj.zscore));
								let formatnum = num => isNumber(num) ? num.toLocaleString(l) : num;
								let formattit = (tit, nam) => {
									let xfld = isNumber(tit) ? tit : 
										isBlank(text) ? tit : toolkit.highlight(tit, text);
									return xfld;
								};
								let xscale = isNaN(obj.scale) ? 
									`<span data-format="square" class="square"></span>` : 
									[
										`<span data-format="square" class="empty-square" `,
										`style="${bgcolor};${focolor}"></span>`
									].join('');
								cellcolor = undefined;

								let statslist = ['count', 'zscore', 'outlier', 'level', 'scale', 'bound'];
								let isfield = nam => !statslist.includes(nam);
								let validfld = nam => nam.substring(2) !== 'bound' && nam.substr(-4) !== '_NID';
								let out = {};
								if(obj.bound === '>') [obj.ID, obj.RID] = [obj.RID, obj.ID];
								Object.keys(obj).filter(o => validfld(o)).forEach(o => {
									if(isfield(o)) {
										let iscolor = o.substr(0, 5) === 'color';
										if(!iscolor) {
											let xfld = formattit(obj[o], o);
											out[o] = [
												`<a href="javascript:`,
												`ui.filtersearch('${obj[o]}', '', true);">`,
												xfld, 
												`</a>`,
											].join('');
											xfld = undefined;
										}
										iscolor = undefined;
									} else {
										switch(o) {
											case 'zscore':
												out.z = `<span data-format="square">${stars}</span>`;
												break;
											case 'level':
											case 'outlier':
												out[o.substr(0, 1)] = [
													`<span data-format="square">`,
													`${formatnum(obj[o])}</span>`
												].join('');
												break;
											case 'scale':
												out.s= `<span data-format="square">${xscale}</span>`;
												break;
											default: 
												out[o] = obj[o];
										}
									}
								});
								cellcolor = bgcolor = focolor = isfield = stars = undefined;
								statslist = formatnum = formattit = xscale = validfld = undefined;
								return out;
							},
							selectorfn: function(sel) {
								let nodata = !byId('cooccurrences-page-selector') || 
									!byId('cooccurrences-page-range') || 
									!byId('cooccurrences-page-size') || 
									!byId('cooccurrences-page-current') || 
									!byId('cooccurrences-pg3');
								if(nodata) {
									stats.cooccurrences(null, 1, null, byId('cooccurrences-text-search').value, srt, true);
									nodata = undefined;
								} else {
									window.settings.listrowsperpage = Number(byId('cooccurrences-page-size').value);
									let numpager = [
										'cooccurrences-page-selector', 
										'cooccurrences-page-range'
									].includes(sel.target.id) ? 
										Number(sel.target.value) : 
										Number(byId('cooccurrences-page-selector').value);
									stats.cooccurrences(null, numpager, null, byId('cooccurrences-text-search').value, srt, false);
									toolkit.msg(
										'cooccurrences-page-current', 
										Number(byId('cooccurrences-pg3').dataset.value).toLocaleString(l)
									);
									numpager = nodata = undefined;
								}
							},
							updatepagefn: function(sel) {
								toolkit.msg('cooccurrences-page-current', Number(sel.target.value).toLocaleString(l));
								byId('cooccurrences-pg3').dataset.value = Number(sel.target.value);
							},
							exportfn: function() {
								stats.cooccurrences(cid, page, row, text, srt, true, false);
							},
						};
						tsource = ttarget = undefined;
						ui.maketable(opts);
						screen.siteoverlay(false);
						toolkit.timer('stats.cooccurrences');
						toolkit.statustext();
					});
		
					toolkit.msg(
						'cooccurrences-table-performance', 
						[
							`${((performance.now() - t0) / 1000).toLocaleString(l)}s, `, 
							`${d.cooccurrencesresults.length.toLocaleString(l)} ${c`rows`}`
						].join('')
					);
	
					byId('cooccurrences-listing').classList.remove('hide');
					byId('cooccurrences-listing').classList.add('visible');
					
					window.storecurrentsize = toolkit.currentmemory();
					toolkit.showmemory('app-memory');
				}
			}
			
			screen.siteoverlay(false);
			toolkit.timer('stats.cooccurrences');
			toolkit.statustext();
		});
	},
	objecttoarray: (obj, cols) => {
		let out = [];
		Object.keys(obj).forEach(o => {
			let array = o.substr(2).split('|');
			let tmp = {};
			cols.forEach((c, i) => tmp[c] = array[i]);
			tmp.count = obj[o];
			array = undefined;
			out.push(tmp);
		});
		return out;	
	},
	descriptivestats: (cid, out) => {
		let dresults = {};
		let sortobject = obj => {
			let sortable = [];
			for(let key in obj) {
				if(obj.hasOwnProperty(key)) sortable.push([key, obj[key]]);
			}
			sortable.sort((a, b) => Number(b[1]) - Number(a[1]));
			return sortable; 
		};
		let topvalues = (fld, obj, top = 5) => {
			let xobj = sortobject(obj)
				.filter((x, i) => i < top)
				.map(o => {
					let nobj = {};
					nobj[fld] = o[0];
					nobj.count = o[1];
					return nobj;
				});
			return toolkit.simpletable(xobj);
		};
		let makesample = (entropy, arr) => {
			let tmp = new Stats(arr);
			let mode = tmp.modes().map(o => Number(o).toLocaleString(l)).join(', ');
			let mad = Number(tmp.meanabsolutedeviation()).toLocaleString(l);
			let maxmin = `${Number(tmp.min()).toLocaleString(l)} / ${Number(tmp.max()).toLocaleString(l)}`;

			let outliers = dresults.outliers.length;
			let outlierspercent = (~~outliers / (arr.length || 1)) * 100;
			let his = makehistogram(arr);
			
			tmp = undefined;
			let maxresentropy = Math.log2(dresults.results.length);
			let homogeneity = entropy / maxresentropy;
			return `
				<h4>
				${c`sample`.uf()}
				</h4>
				<div class="aside background-light-50">
				<p>
				${c`total`.uf()}: <strong>${dresults.results.length.toLocaleString(l)}</strong>. 
				${c`distinct`.uf()}: <strong>${arr.length.toLocaleString(l)}</strong>. 
				${c`mode`.uf()}: <strong>${mode}</strong>. 
				${c`meanabsolutedeviation`.uf()}: <strong>${mad}</strong>. 
				${c`range`.uf()}: <strong>${mode} (${maxmin})</strong>
				${c`entropy`.uf()}: <strong>${entropy.toLocaleString(l)}/${maxresentropy.toLocaleString(l)}</strong>. 
				${c`homogeneity`.uf()}: <strong>${((1 - homogeneity) * 100).toLocaleString(l)}%, 
				${homogeneity >= 0.5 ? c`low` : c`high`}</strong>. 
				${c`meaningful-values`.uf()}: 
				<strong>${outliers.toLocaleString(l)} (${outlierspercent.toLocaleString(l)}%)</strong>. 
				${c`median`.uf()}: <strong>${dresults.median ? dresults.median.toLocaleString(l) : ''}</strong>. 
				${c`q1`.uf()}: <strong>${isNaN(dresults.q1) ? c`n-a` : dresults.q1.toLocaleString(l)}</strong>. 
				${c`q3`.uf()}: <strong>${isNaN(dresults.q3) ? c`n-a` : dresults.q3.toLocaleString(l)}</strong>. 
				</p>
				</div>
				<h4>${c`histogram`.uf()}</h4>
				${!his.length ? c`n-a` : toolkit.simpletable(his)}
				<div id="${cid}-pareto" class="margin-top-s" style="width: 100%; height: 400px;"></div>
			`;
		};
		let makehistogram = (arr, fortable = true) => {
			let his = dl.histogram(arr);
			let bin = his.bins;
			delete his.bins;
			let total = his.map(o => o.count).reduce(function(a, b) { return a += b; }, 0);
			let percval = 0;
			if(fortable) {
				Object.keys(his).forEach(o => {
					percval += his[o].count;
					his[o] = Object.assign({}, {
						range: [`${c`bt`} ${his[o].value.toLocaleString(l)} `,
							`${c`and`} ${(his[o].value + bin.step - 1).toLocaleString(l)}`].join(''), 
						values: his[o].count.toLocaleString(l), 
						percent: ((his[o].count / total) * 100).toLocaleString(l),
						cummulative: ((percval / total) * 100).toLocaleString(l),
					});
				});
			} else {
				Object.keys(his).forEach(o => {
					percval += his[o].count;
					his[o] = Object.assign({}, {
						chartlabel: [`${c`bt`} ${his[o].value.toLocaleString(l)} `,
							`${c`and`} `,
							`${(his[o].value + bin.step - 1).toLocaleString(l)}`].join(''),
						chartbar: his[o].count,
						chartline: (percval / total) * 100
					});
				});
			}
			bin = total = percval = undefined;
			return his;
		};

		let sta = dl.read(out, {type: 'json', parse: 'auto'});

		let tmx = dbs.stats(isObject(out) ? Object.values(out).map(o => o.count) : out.map(o => o.count));
		dresults.results = isObject(out) ? Object.values(out).map(o => o.count) : out.map(o => o.count);
		dresults.outliers = tmx.outliers;
		dresults.modes = tmx.modes;
		dresults.mad = tmx.meanabsolutedeviation;
		dresults.range = tmx.range;
		dresults.q1 = tmx.q1;
		dresults.q3 = tmx.q3;
		dresults.resmin = tmx.min;
		dresults.resmax = tmx.max;
		dresults.lowlimit = tmx.lowlimit;
		dresults.highlimit = tmx.highlimit;
		dresults.iqr = tmx.iqr;
		dresults.median = tmx.median;
		dresults.mean = tmx.mean;
		tmx = undefined;

		d[cid + 'outliers'] = dresults.outliers;
		
		let sum = dl.summary(sta);
		let sma = [];
		let formatentropy = ent => {
			let sent = dl.entropy(Object.values(ent));
			let ment = Math.log2(Object.values(ent).length);
			let qent = 1 - (sent / ment);
			let hent = Math.round(qent * 100);
			let tent = toolkit.chartpercent(qent, 1, true);
			sent = ment = undefined;
			return !isNaN(hent) ? 
				`<div class="is-text-center">${hent.toLocaleString(l)}% ${tent}</div>` : 
				`<div class="is-text-center">${c`n-a`}</div>`;
		};
		sum.forEach(o => sma.push({
			FLD: o.field,
			TYP: o.type,
			FRQ: `VAL ${o.valid.toLocaleString(l)}, DST ${o.distinct.toLocaleString(l)}, MIS ${o.missing.toLocaleString(l)}`,
			RNG: `MIN ${o.min.toLocaleString(l)}, MAX ${o.max.toLocaleString(l)} (${(o.max - o.min).toLocaleString(l)})`,
			AVG: `MEA ${o.mean.toLocaleString(l)}, MED ${o.median.toLocaleString(l)}, STD ${o.stdev.toLocaleString(l)}`,
			QRT: `Q1 ${o.q1.toLocaleString(l)}, Q3 ${o.q3.toLocaleString(l)}, MSK ${o.modeskew.toLocaleString(l)}`,
			entropy: formatentropy(o.unique),
		}));
		d[`${cid}stats`] = sum.map(o => Object.assign({}, o, {
			field: o.field, 
			unique: o.unique, 
			entropy: dl.entropy(Object.values(o.unique))
		}));
		let topvals = d[`${cid}stats`]
			.filter(o => !d.accountnumericfields.includes(o.field))
			.map(o => `
				${topvalues(o.field, o.unique, window.settings.statstopvalues)}
			`);

		let rslt = [];
		let jaccard = (ca, cb) => {
			let intersection = _.intersection(ca, cb);
			let union = _.union(ca, cb);
			return intersection.length / union.length;
		};

		if(sta.length) {
			let base = sta[0];
			if(Object.keys(base).length > 2) {
				let flds = [];
				Object.keys(base).forEach(k => {
					if(k !== 'count') flds.push(k);
				});
				flds.forEach(f => {
					let row = {field: f};
					flds.forEach(r => {
						if(f !== r) {
							let mutual = dl.mutual.dist(sta, r, f, 'count');
							let percent = Math.round((mutual / 2) * 100);
							let jac = jaccard(sta.map(o => o[f]).unique(), sta.map(o => o[r]).unique());
							row[r] = `M: ${percent}%<br />
								${toolkit.showstars(mutual, 2)}<br />
								J: ${jac.toLocaleString(l)}`;
							mutual = percent = jac = undefined;
						} else {
							row[r] = c`n-a`;
						}
					});
					rslt.push(row);
					row = undefined;
				});
				flds = undefined;
			}
			base = undefined;
		}

		toolkit.msg(cid + '-stats-info', [
			makesample(dl.entropy(out, 'count'), sta.map(o => o.count)),
			`<h4 class="margin-top">${c`fields`.uf()}</h4>`,
			toolkit.simpletable(sma.filter(o => !d.accountnumericfields.includes(o.FLD)), 'descrip-table'), 
			`<h4 class="margin-top">${c`affinity`.uf()}</h4>`,
			rslt.length ? 
				toolkit.simpletable(rslt, 'mutual-table') : 
				`<p class="color-error text-align-center">${c`no-data`.uf()}</p>`,
			`<h4 class="margin-top">${window.settings.statstopvalues + ' ' + c`topvalues`.uf()}</h4>`,
			topvals.join(''),
		].join(''));
		toolkit.drawicons();
							
		let pchart = echarts.init(byId(cid + '-pareto'));
		let options = charts.paretooptions(makehistogram(sta.map(o => o.count), false), cid + '-pareto');
		pchart.setOption(options);

		dresults = sortobject = topvalues = makesample = undefined;
		makehistogram = sta = sum = sma = formatentropy = topvals = rslt = jaccard = undefined;
		pchart = options = undefined;
	},
	calculate: (res, pcols, strict = true) => {
		let tmx = new Set([...res.map(o => o.ID)]);
		let tmz = dbe.hashrecord(res, 'ID');
		let rel = dbe.hashrecord(dbm.relations(false)
			.filter(o => tmx.has(o.ID) && tmx.has(o.RID))
			.map(o => Object.assign({}, o, {related: tmz[o.RID]})), 
		'ID');
		let tmf = res.map(o => rel[o.ID] ? {...rel[o.ID].related, ...o} : o);
		let tmp = arraygroup(tmf, pcols, 'results', strict);
		tmf = rel = tmz = tmx = undefined;
		return tmp.map(o => removekey(Object.assign({}, o, {count: o.results.length || 0}), 'results'));
	},
	prepare: (res, pcols, strict = true) => {
		let tmp = arraygroup(res, pcols, 'results', strict);
		return tmp.map(o => removekey(Object.assign({}, o, {count: o.results.length || 0}), 'results'));
	},
	mutatedlist: (cols, filtered = false, strict = true) => {
		let prepare = obj => {
			let rkey = obj.rkey;
			let blacklist = new Set(['rtype', 'rkey', 'value']);
			let out = {};
			Object.keys(obj).filter(o => !blacklist.has(o)).forEach(o => out[o === 'ID' ? o : rkey + '|' + o] = obj[o]);
			rkey = blacklist = undefined;
			return out;
		};
		let group = (arr, fid) => {
			return arr.reduce((a, c) => {
				if(!a.hasOwnProperty(c[fid])) {
					a[c[fid]] = Object.assign({}, c);
				} else {
					a[c[fid]].value = [a[c[fid]].value, c.value].join('. ');
				}
				return a;
			}, {});
		};
		let lis = dbe.list(filtered, true).filter(o => k.dates.includes(o.rkey) ? dbe._validyear(o.value) : true);
		let mut = new Set(cols.filter(o => o.includes('|')).map(o => o.split('|')[0]));
		let nor = new Set(cols.filter(o => !o.includes('|')));
		let res = lis.filter(o => mut.has(o.rkey) || nor.has(o.rkey)).map(o => prepare(dbe._mutate(o, false))).flatten();
		let set = new Set(res.map(o => o.ID));
		
		let doc = dbm.documents(false, filtered, toolkit.randomstring()).filter(o => set.has(o.ID)).map(o => ({
			ID: o.ID,
			ptype: o.rkey, 
			color: o.color,
			title: toolkit.titleformat(o.value)
		}));
		let joi = joinobjects(doc, res);

		prepare = lis = mut = nor = res = doc = undefined;
		return joi;
	},	
	localstats: arr => {
		let stats = dbs.stats(arr.map(o => o.count));
		let throwput = obj => stats.zscoresmap[obj.count];
		let outlier = obj => stats.outliers.includes(obj.count) ? 
			c`yes` : 
			c`no` ;
		let soutlier = obj => stats.outliers.includes(obj.count) ? 1 : 0;
		let zscoreratio = (obj, thr) => thr ? thr.zscoreratio.toFixed(5) : -1;
		let slevel = obj => obj.count < stats.mean ? 
			`&darr;` : 
			obj.count > stats.mean ? 
				`&uarr;` : 
				`&#8597;`;
		return arr.map(o => Object.assign({}, o, {
			outlier: outlier(o),
			zscore: zscoreratio(o, throwput(o)),
			level: slevel(o),
			scale: (o.count - stats.min) / (stats.max - stats.min),
		}));
	},
};
