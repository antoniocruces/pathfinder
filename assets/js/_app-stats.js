'use strict';

/* global _, AppError, AppWarning, arraygroup, arraymax, arraymin, autocomplete, byId, c, charts, d, dbe, dbhelper, dbm, dbq, dl, dbs, echarts, fc, file, gscreen, isBlank, isNumber, isObject, joinobjects, k, l, objectunique, PivotData, removekey, sleep, Stats, toolkit, ui */
/* exported stats */

// stats functions
const stats = {
	schema: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false, calculate = false) => {
		if(!dbe._filterids()) return;
		gscreen.siteoverlay(true);
		toolkit.timer('stats.schema');
		toolkit.statustext(true);

		sleep(50).then(() => {
			if(document.getElementById('schema-listing')) {
				let sel = [];
				let tgl = `javascript:toolkit.toggleelement('schema');`;
				let tgp = [
					`javascript:`,
					`if(d.schemapivot.visible){`,
					`d.schemapivot.visible=false;stats.schema();`,
					`}else{`,
					`d.schemapivot.visible=true;stats.showpivotalert();`,
					`}`,
				].join('');
				sel.push([
					`<div class="group group-xs margin-bottom-s">`,
					`<ul>`,
					
					`<li>`,
					
					`<div class="autocomplete">`,
					
					`<div class="input-group">`,
					`<input id="schema-input" type="text" class="autocomplete-input" `,
					`data-field="" `,
					`placeholde="${c`query-selector-info`}"/>`,
					`<a id="schema-query-trigger" `,
					`class="button info button-square button-border disabled" `,
					`onclick="byId('schema-input').dispatchEvent(new KeyboardEvent('keyup',{key:'Enter'}));" `,
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

					`<li `,
					`${d.schemacols.length ? '' : 'class="hide" '} `,
					`id="schema-showhidepivot-wp">`,

					`<a class="button info button-border" `,
					`id="schema-showhidepivot" href="${tgp}">`,
					`${d.schemapivot.visible ? c`table`.uf() : c`pivot`.uf()}`,
					`</a>`,
					
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
					gscreen.siteoverlay(false);
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
					d.schemapivot = {cols: [], rows: [], result: [], visible: false};
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
					byId('schema-showhidepivot-wp').classList.add('hide');
					return;	
				}

				let t0 = performance.now();
				if(d.schemaresults.length < 1 || calculate) {
					let pcols = d.schemacols.filter(o => !isBlank(o));
					d.schemaresults = stats.unfoldedlist(pcols, 'schema-table-performance'); 
					pcols = undefined;
				}
				
				if(d.schemaresults.length) {
					stats.descriptivestats('schema', d.schemaresults);
					
					sleep(50).then(() => {
						let validrecord = (obj, txt) => Object.values(obj).filter(o => dbe._operation('li', o, txt)).length;
						let oonly = d.schemaoutliersonly;
						let oresults = d.schemaresults.filter(o => !isBlank(text) ? validrecord(o, text) : true);
						let fresults = oonly ? oresults.filter(o => d.schemaoutliers.includes(o.count)) : oresults;
						
						if(!fresults.length) return false;
						
						let rowsfields = Object.keys(fresults[0]);
						let descending = srt < 0 ? '-' : ''; 
						
						let sortedlist = fresults
							.sortBy([descending + rowsfields[Math.abs(srt) - 1]]);
						
						rowsfields = descending = validrecord = undefined;
									
						if(xprt) {
							file.exportdatatocsv(stats.localstats(sortedlist));
							gscreen.siteoverlay(false);
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
							`<a href="javascript:charts.showplot('schema', false, false, '${text}');">${c`sorted`}</a> `, 
							`${c`or`}  `, 
							`<a href="javascript:charts.showplot('schema', true, false, '${text}');">${c`normalized`}</a>.`, 							
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

								let statslist = ['count', 'zscore', 'outlier', 'level', 'scale', 'bin', 'from', 'to'];
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
											case 'bin':
											case 'from':
											case 'to':
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
									toolkit.msg(
										'schema-page-current', 
										Number(byId('schema-pg3').dataset.value).toLocaleString(l)
									);
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

						byId('schema-showhidepivot-wp').classList.remove('hide');

						if(d.schemapivot.visible) {
							gscreen.siteoverlay(true);
							sleep(50).then(() => {
								let pvtable = ui.makepivottable(d.schemapivot.result, {
									isShowCount: true,
									isShowAttr: true
								});
							
								pvtable.setAttribute('border', 1);
								pvtable.setAttribute('cellspacing', 0);
								pvtable.setAttribute('cellpadding', 0);

								toolkit.cleardomelement('#schema-listing');
								byId('schema-listing').appendChild(pvtable);

								toolkit.drawicons();
								pvtable = undefined;
								gscreen.siteoverlay(false);
							});
						} else {
							ui.maketable(opts);
							opts = undefined;
						}
						
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
						stats.schema,
					);

					autocomplete(
						byId('schema-input'), 
						[].concat(...k.keys.sort(toolkit.sortlocale).map(o => dbe._fieldname(o)))
					);
					
					window.storecurrentsize = toolkit.currentmemory();
					toolkit.showmemory('app-memory');
				} else {
					gscreen.siteoverlay(false);
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
					d.schemapivot = {cols: [], rows: [], result: [], visible: false};
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
					
					byId('schema-showhidepivot-wp').classList.add('hide');
					
					return;
				}
			}
			
			gscreen.siteoverlay(false);
			toolkit.timer('stats.schema');
			toolkit.statustext();
		});
	},
	cooccurrences: (cid = '', page = 1, row = '', text = '', srt = 1, xprt = false, calculate = false) => {
		if(!dbe._filterids()) return;

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

		let dropmetas = () => {
			let out = [];
			let array = [].concat(...k.metadata.map(o => dbe._fieldname(o)));
			let sorter = (a, b) => {
				let stra = fc(String(a));
				let strb = fc(String(b));
				return stra.localeCompare(strb, l, {sensitivity: 'base', numeric: true});
			};
			array.sort(sorter).forEach(o => { 
				out.push([
					`<p class="no-margin-bottom">`,
					`<label class="control control-checkbox control-xs">`,
					`<input type="checkbox" `,
					`id="subf-lnk-${o}"${d.cooccurrencesfeatures.includes(o) ? ' checked' : ''} `, 
					`onclick="if(this.checked){d.cooccurrencesfeatures.push('${o}');}`,
					`else{d.cooccurrencesfeatures.remove('${o}');}"`,
					`>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${fc(o)}</span>`,
					`</label>`,
					`</p>`,
				].join('')); 
			});
			return out.join('\n');
		};
		
		d.cooccurrencesoutliersonly = isBlank(d.cooccurrencesoutliersonly) ? 
			false : d.cooccurrencesoutliersonly;
		
		gscreen.siteoverlay(true);
		toolkit.timer('stats.cooccurrences');
		toolkit.statustext(true);
		if(byId('app-overlay-txt')) toolkit.msg('app-overlay-txt', c`working`.uf() + '&hellip;');
		
		sleep(50).then(() => {
			let sel = [];
			let tgl = `javascript:toolkit.toggleelement('cooccurrences');`;
			sel.push([
				`<div class="group group-xs group-stretch margin-bottom-xs">`,
				`<ul>`,
				
				`<li>`,
				`${drops('source')}`,
				`</li>`,
				
				`<li>`,
				`${drops('target')}`,
				`</li>`,
				
				`</ul>`,
				`</div>`,
													
				`<div class="group group-xs margin-bottom-s">`,
				`<ul>`,
				
				`<li>`,
				`<div id="stats-cooccurrences-features" class="ddown">`,
				`<button class="button info button-border">${c`filter`.uf()}</button>`,
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

				`<button class="button info button-border" `,
				`id="cooccurrences-showhidestats" onclick="${tgl}">${c`stats`.uf()}</button>`,
				
				`</li>`,

				`<li>`,
				`<div class="ddown">`,
				`<button class="button info button-border">${c`include`.uf()}</button>`,
				`<div class="ddown-content padding-xs box-shadow-xxl background-white no-margin-top">`,
				`${dropmetas()}`,
				`</div>`,
				`</div>	`,
				`</li>`,
				
				`<li id="cooccurrences-routeset1" class="hide">`,
				`<a class="button button-info button-border" `,
				`href="javascript:stats.cooccurrences(null, 1, null, '', 1, false, true);">`,
				`${c`recalculate`.uf()}`,
				`</a>`,
				`</li>`,
				`<li id="cooccurrences-routeset2" class="hide">`,
				`<a class="button button-info button-border" `,
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
					gscreen.siteoverlay(false);
					toolkit.timer('stats.cooccurrences');
					toolkit.statustext();
					toolkit.msg(
						'cooccurrences-listing', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
					);
					drops = sel = tgl = t0 = undefined;
					return;
				}

				let object = stats.generatecooccurrences(calculate);
				
				if(object.length < 1) {
					gscreen.siteoverlay(false);
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
					byId('cooccurrences-routeset1').classList.add('hide');
					byId('cooccurrences-routeset2').classList.add('hide');
					drops = sel = tgl = t0 = undefined;
					return;
				}

				let oarray = stats.prepare(object, Object.keys(object[0]), true);
				let dstats = dbs.stats(oarray.map(o => o.count));
				
				d.cooccurrencesoutliers = dstats.outliers;

				d.cooccurrencesresults = oarray;
				object = oarray = dstats = undefined;
				
				if(!d.cooccurrencesresults.length) {
					gscreen.siteoverlay(false);
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
					byId('cooccurrences-routeset1').classList.add('hide');
					byId('cooccurrences-routeset2').classList.add('hide');
					drops = sel = tgl = t0 = undefined;
					return;
				} else {
					sleep(100).then(() => {
						stats.descriptivestats('cooccurrences', d.cooccurrencesresults);
						let validrecord = (obj, txt) => Object.values(obj).filter(o => dbe._operation('li', o, txt)).length;
						let oonly = d.cooccurrencesoutliersonly;
						let oresults = d.cooccurrencesresults.filter(o => 
							!isBlank(text) ? validrecord(o, text) : true
						);
						let fresults = oonly ? 
							oresults.filter(o => d.cooccurrencesoutliers.includes(o.count)) : 
							oresults;
						
						if(!fresults.length) {
							gscreen.siteoverlay(false);
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
							byId('cooccurrences-routeset1').classList.add('hide');
							byId('cooccurrences-routeset2').classList.add('hide');
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
							file.exportdatatocsv(stats.localstats(sortedlist));
							gscreen.siteoverlay(false);
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
								let formattit = tit => {
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
									stats.cooccurrences(
										null, 
										numpager, 
										null, 
										byId('cooccurrences-text-search').value, 
										srt, 
										false
									);
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
						gscreen.siteoverlay(false);
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
			
			gscreen.siteoverlay(false);
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
			
			tmp = undefined;
			/* 
				Because:
				Maximum entropy is achieved when all signals are equally likely.
				No ability to guess; maximum surprise.
				Hmax = lg N
				Minimum entropy occurs when one symbol is certain and the others are impossible.
				No uncertainty; no surprise
				Hmin = 0				
			*/
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
				${c`entropy`.uf()} (${c`current`}/${c`max`}): 
				<strong>${entropy.toLocaleString(l)}/${maxresentropy.toLocaleString(l)}</strong>. 
				${c`homogeneity`.uf()}: <strong>${(homogeneity * 100).toLocaleString(l)}%, 
				${homogeneity >= 0.5 ? c`high` : c`low`}</strong>. 
				${c`meaningful-values`.uf()}: 
				<strong>${outliers.toLocaleString(l)} (${outlierspercent.toLocaleString(l)}%)</strong>. 
				${c`median`.uf()}: <strong>${dresults.median ? dresults.median.toLocaleString(l) : ''}</strong>. 
				${c`q1`.uf()}: <strong>${isNaN(dresults.q1) ? c`n-a` : dresults.q1.toLocaleString(l)}</strong>. 
				${c`q3`.uf()}: <strong>${isNaN(dresults.q3) ? c`n-a` : dresults.q3.toLocaleString(l)}</strong>. 
				</p>
				</div>
				<h4>${c`histogram`.uf()}</h4>
				<div id="${cid}-pareto-table" class="margin-top-s" style="width:100%;"></div>
				<div id="${cid}-pareto" class="margin-top-s" style="width: 100%; height: 700px;"></div>
				<h4>${c`relevance`.uf()}</h4>
				<div id="${cid}-relevance-table" class="margin-top-s" style="width:100%;"></div>
				<div id="${cid}-relevance" class="margin-top-s" style="width: 100%; height: 700px;"></div>
				<div id="${cid}-relevancescatter" class="margin-top-s" style="width: 100%; height: 700px;"></div>
			`;
		};
		let makehistogram = (arr = []) => {
			let out = {table: [], data: []};
			let his = dl.histogram(arr, {maxbins: 10});
			let bin = his.bins;
			delete his.bins;
			let total = his.map(o => o.count).reduce(function(a, b) { return a += b; }, 0);
			let percval = 0;
			Object.keys(his).forEach(o => {
				percval += his[o].count;
				out.table[o] = Object.assign({}, {
					range: [`${c`bt`} ${his[o].value.toLocaleString(l)} `,
						`${c`and`} ${(his[o].value + bin.step - 1).toLocaleString(l)}`].join(''), 
					values: his[o].count.toLocaleString(l), 
					percent: ((his[o].count / total) * 100).toLocaleString(l),
					cummulative: ((percval / total) * 100).toLocaleString(l),
				});
			});
			percval = 0;
			Object.keys(his).forEach(o => {
				percval += his[o].count;
				out.data[o] = Object.assign({}, {
					chartlabel: [`${c`bt`} ${his[o].value.toLocaleString(l)} `,
						`${c`and`} `,
						`${(his[o].value + bin.step - 1).toLocaleString(l)}`].join(''),
					chartbar: his[o].count,
					chartline: (percval / total) * 100
				});
			});
			his = bin = total = percval = undefined;
			return out;
		};

		let makerelevance = (arr = [], cols = []) => {
			let dat = stats.localstats(arr);
			let lastcol = cols[cols.length - 1];
			let cleanobj = obj => {
				let blacklist = ['outlier', 'zscore', 'level', 'scale', 'count', 'bin', 'from', 'to'];
				let tmp = {
					value: Object.keys(obj).filter(k => !blacklist.includes(k)).map(k => obj[k]).join(' > '),					 
					firstvalue: Object.keys(obj)
						.filter(k => !blacklist.includes(k))
						.filter((k, i) => i === 0)
						.map(k => obj[k]).join(''), 
					qualifier: Object.keys(obj)
						.filter(k => !blacklist.includes(k))
						.filter(k => k === lastcol)
						.map(k => obj[k]).join(''),
					bin: obj.bin,
					from: obj.from,
					to: obj.to,
					count: obj.count,
					zscore: obj.zscore,
				};
				return tmp;
			};
			function sorter(fields) {
				let dir = [];
				let i;
				let l = fields.length;
				fields = fields.map(function(o, i) {
					if (o[0] === '-') {
						dir[i] = -1;
						o = o.substring(1);
					} else {
						dir[i] = 1;
					}
					return o;
				});
				return function (a, b) {
					for (i = 0; i < l; i++) {
						let o = fields[i];
						if (a[o] > b[o]) return dir[i];
						if (a[o] < b[o]) return -(dir[i]);
					}
					return 0;
				};
			}
			return dat
				.map(o => cleanobj(o))
				.sort(sorter(['-bin', 'value']));
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
		
		let his = makehistogram(sta.map(o => o.count));
		let rlv = makerelevance(sta, d[cid + 'cols']).filter(o => o.bin > 0);
		
		d[cid + 'relevance'] = rlv;
		
		toolkit.msg(cid + '-pareto-table', toolkit.simpletable(his.table));
		
		let pchart = echarts.init(byId(cid + '-pareto'));
		let options = charts.paretooptions(
			his.data, 
			cid + '-pareto'
		);
		pchart.setOption(options);

		toolkit.msg(cid + '-relevance-table', toolkit.simpletable(rlv));

		let rchart = echarts.init(byId(cid + '-relevance'), {width: '100%'});
		options = charts.relevanceoptions(
			rlv, 
			d[cid + 'results'].map(o => o.count).sum(),
			c`relevance-groups`.uf(),
			`${c`funnel`.uf()}. ${c`nightingale-rose`.uf()}`,
			cid + '-relevance'
		);
		rchart.setOption(options);

		let rschart = echarts.init(byId(cid + '-relevancescatter'), {width: '100%'});
		options = charts.scatterrelevanceoptions(
			rlv, 
			c`relevance`.uf(),
			c`four-quarters-map`.uf(),
			cid + '-relevancescatter'
		);
		rschart.setOption(options);
		
		dresults = sortobject = topvalues = makesample = undefined;
		his = rlv = makehistogram = makerelevance = sta = sum = sma = undefined;
		formatentropy = topvals = rslt = jaccard = undefined;
		pchart = rchart = rschart = options = undefined;
	},
	calculate: (res, pcols, strict = true) => {
		let grp = arr => Object.values(arr.reduce((r, c) => (
			r[c.ID] = Object.assign((r[c.ID] || {}), c), r
		), {}));
		let tmx = new Set([...res.map(o => o.ID)]);
		let tmz = dbe.hashrecord(res, 'ID');
		let rel = dbe.hashrecord(dbm.relations(false)
			.filter(o => o.bound === '>')
			.filter(o => tmx.has(o.ID) && tmx.has(o.RID))
			.map(o => Object.assign({}, o, {related: tmz[o.RID]})), 
		'ID');
		let tmf = res.map(o => rel[o.ID] ? {...rel[o.ID].related, ...o} : o);
		
		let tmw = grp(tmf);
		
		let tmp = arraygroup(tmw, pcols, 'results', strict);

		tmf = rel = tmz = tmx = tmw = undefined;
		return tmp.map(o => removekey(Object.assign({}, o, {count: o.results.length || 0}), 'results'));
	},
	prepare: (res, pcols, strict = true) => {
		let tmp = arraygroup(res, pcols, 'results', strict);
		return tmp.map(o => removekey(Object.assign({}, o, {count: o.results.length || 0}), 'results'));
	},
	mutatedlist: (cols, filtered = false) => {
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
		
		let doc = dbe._documents(false, filtered).filter(o => set.has(o.ID)).map(o => {
			let obj = {};
			obj.ID = o.ID;
			obj[o.rkey + '|string'] = toolkit.titleformat(o.value);
			return obj;
		});
		
		let joi = joinobjects(res, doc);

		prepare = group = lis = mut = nor = undefined;
		return joi;
	},
	unfoldedlist: (cols, cid = 'schema-table-performance') => {
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
			out.ID = isrel && obj.hasOwnProperty('rid') ? obj.rid : out.ID;
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
		let adjustfield = (obj, field, facet) => {
			let flist = [].concat(d.relatives, d.record_types).map(o => `${o}|${facet}`);
			let out = {};
			Object.keys(obj).forEach(k => {
				if(!flist.includes(k)) {
					out[k] = obj[k];
				} else {
					if(k === `${field}|${facet}`) out[k] = obj[k];
				}
			});
			flist = undefined;
			return out;
		};
		
		let fields = cols.map((o, i) => ({
			fid: i,
			field: o.split('|')[0], 
			facet: o.split('|')[1],
			isrel: d.relatives.includes(o.split('|')[0]) || i === 0,
			ispos: d.record_types.includes(o.split('|')[0]),
			result: [],
		}));
			
		let tree = {};
		let result = [];
		
		if(cols.length) {
			let list = [];
			let setfil = new Set();
			let ages = [];
			let keys = new Set(fields.map(o => o.field));
			
			setfil = new Set(dbe._filterids());
			ages = dbm.ages(false);

			list = objectunique([].concat(
				dbe._mutate(Object.values(d.store.pos).flatten()), 
				dbe._mutate(Object.values(d.store.met).flatten()),  
				dbe._mutate(Object.values(d.store.tax).flatten()),
				dbe._mutate(ages).flatten()
			).filter(o => setfil.has(o.ID)).filter(o => keys.has(o.rkey)));

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

			fields.filter((f, i) => f.isrel || f.ispos).forEach((f, i) => {
				if(i === 0) {
					f.result.forEach(o => {
						let idt = adjustfield(tree[o.ID], f.field, f.facet);
						result.push(normalize(Object.assign({}, {RID: o.RID}, idt), i));
						idt = undefined;
					});
	 			} else {
					if(result.length) {
						let last = Math.max.apply(null, Object.keys(result[0]).map(o => Number(o.split('|')[0])));
						let pid = `${last}|ID`;
						let prid = `${last}|RID`;
						let tmp = [];
						//result.filter(o => o[pid] !== o[prid]).forEach(o => {
						result.forEach(o => {
							f.result.filter(r => r.RID === o[prid]).forEach(r => {
								let idt = adjustfield(tree[r.ID], f.field, f.facet);
								let idr = Object.assign({}, o, normalize(Object.assign({}, {RID: r.RID}, idt), i));
								tmp.push(idr);
								idt = idr = undefined;
							});
						});
						result = tmp.slice();
						pid = prid = tmp = undefined;
					}
				}
			});		
			
			setfil = ages = list = keys = undefined;
		}
	
		result = result.map(o => sanitize(o));
		
		let out = [];
		if(result.length) {
			let outcols = [];
			let count = -1;
			fields.forEach(f => {
				if(f.isrel || f.ispos) count++;
				outcols.push(`${count}|${f.field}|${f.facet}`);
			});
			
			out = Object.entries(flatten(result.countByMultiple(outcols))).map(o => {
				let obj = {};
				let values = o[0].split('|');
				outcols.forEach((k, i) => obj[k] = c(values[i]));
				obj.count = o[1];
				values = undefined;
				return obj;
			});
			outcols = count = undefined;
		}
	
		prepare = clearobj = normalize = sanitize = undefined;
		flatten = adjustfield = undefined;
		result = fields = tree = undefined;
		
		return out
	},	
	localstats: arr => {
		let stats = dbs.stats(arr.map(o => o.count || o));
		let throwput = obj => stats.zscoresmap[obj.count || obj];
		let outlier = obj => stats.outliers.includes(obj.count || obj) ? 
			c`yes` : 
			c`no` ;
		let zscoreratio = thr => thr ? thr.zscoreratio.toFixed(5) : -1;
		let slevel = obj => (obj.count || obj) < stats.mean ? 
			`&darr;` : 
			obj.count > stats.mean ? 
				`&uarr;` : 
				`&#8597;`;
		let tmp = arr.map(o => Object.assign({}, o, {
			outlier: outlier(o),
			zscore: zscoreratio(throwput(o)),
			level: slevel(o),
			scale: ((o.count || o) - stats.min) / (stats.max - stats.min),
		}));
		let bins = dl.bins({
			min: arraymin(tmp.map(o => o.scale || o)), 
			max: arraymax(tmp.map(o => o.scale || o)), 
			maxbins: 10
		});
		stats = throwput = outlier = slevel = undefined;
		tmp = tmp.map(o => Object.assign({}, o, {
			bin: isNaN(bins.index(o.scale || o)) ? 0 : bins.index(o.scale || o),
			from: 0,
			to: 0
		}));
		return tmp.map(o => Object.assign({}, o, {
			from: o.bin * bins.step,
			to: (o.bin + 1) * bins.step,
			count: o.count || o,
			zscore: o.zscore ? parseFloat(o.zscore, 10) : o,
		}));
	},
	generatecooccurrences: (rebuild = false) => {
		let out = [];
		let fea = dbm.features(true);
		let set = d.cooccurrencesfeatures.length ? new Set(d.cooccurrencesfeatures) : null;
		let coo = dbq.cooccurrences(rebuild, true);
		let removenids = obj => {
			let tmp = {};
			Object.keys(obj).forEach(k => {
				if(k.substr(-4) !== '_NID') tmp[k] = obj[k];
			});
			return tmp;
		};
		coo.forEach(o => {
			let obj = o;
			let nws = [];
			Object.keys(o).filter(k => k.substr(-4) === '_NID').forEach(k => {
				let nam = k.substr(0, k.length - 4);
				let nid = o[k];
				let xtm = set ? fea[o[k]] : null;
				if(xtm) {
					let tmp = set ? xtm.filter(v => Object.keys(v).filter(w => set.has(w)).length).map(v => {
						let tmp2 = {};
						Object.keys(v).filter(w => set.has(w)).forEach(w => tmp2[w] = v[w]);
						return tmp2;
					}) : [];
					if(tmp.length) {
						let tmp3 = {};
						tmp3[nam + '_NID'] = nid;
						tmp.forEach(v => {
							Object.keys(v).forEach(w => {
								tmp3[w] = tmp3[w] || [];
								tmp3[w].push(v[w]);
								tmp3[w].sort();
							});
						});
						Object.keys(tmp3).forEach(v => {
							if(Array.isArray(tmp3[v])) tmp3[v] = tmp3[v].join('. ');
							if(!isNaN(tmp3[v])) tmp3[v] = Number(tmp3[v]);
						});
						nws.push(tmp3);
					}
					tmp = undefined;
				}
				nam = nid = xtm = undefined;
			});
			if(nws.length) {
				let tmpobj = {};
				Object.keys(obj).forEach(k => {
					if(k.substr(-4) === '_NID') {
						let nam = k.substr(0, k.length - 4);
						nws.filter(n => n[k]).forEach(n => {
							Object.keys(n).forEach(v => tmpobj[nam + '|' + v] = n[v]);
						});
						tmpobj[k] = obj[k];
						nam = undefined;
					} else {
						tmpobj[k] = obj[k];
					}
				});
				out.push(removenids(tmpobj));
				tmpobj = undefined;
			} else {
				out.push(removenids(obj));
			}
			obj = nws = undefined;
		});
		fea = set = coo = removenids = undefined;
		return out;		
	},
	generatepivotdata: () => {
		if(!d.schemaresults.length) {
			throw new AppWarning(c`no-data`.uf());
		}

		let opts = {
			rowAttrs: d.schemapivot.rows,
			colAttrs: d.schemapivot.cols,
			aggregator: function(argument) {
				argument = undefined;
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
						return this.data.map(o => o.count).sum().toLocaleString(l);
					},
				};
			}
		};
	
		d.schemapivot.result = new PivotData(d.schemaresults, opts);

		d.schemapivot.visible = true;
		
		toolkit.msg('schema-showhidepivot', c`table`.uf());
		
		stats.schema();
	},
	showpivotalert: () => {
		if(!d.schemacols.length) {
			d.schemapivot.visible = false;
			throw new AppError(c`insufficient-data-warning`);
		}
		if(d.schemacols.length < 2) {
			d.schemapivot.visible = false;
			throw new AppError(c`insufficient-data-warning`);
		}
		
		if(!d.schemapivot.cols.length) {
			let outcols = [];
			let count = -1;
			d.schemacols.forEach((o, i) => {
				let field = o.split('|')[0];
				let facet = o.split('|')[1];
				if(d.relatives.includes(field) || d.record_types.includes(field) || i === 0) count++;
				outcols.push(`${count}|${field}|${facet}`);
				field = facet = undefined;
			});
			d.schemapivot.rows = outcols.slice();
			outcols = count = undefined;
		}
		
		let hidden = (d.schemapivot.cols.length && d.schemapivot.cols.length <= d.schemacols.length) ? '' : ' hide';
		let res = [
			`<div class="group group-m group-stretch">`,
			`<ul>`,
			
			`<li>`,
			`<p class="form-message">`,
			`${c`rows`}`,
			`</p>`,
			`<select class="min-height-25vh" id="pivot-a" size="10" multiple>`,
			d.schemapivot.rows.map(o => `<option value="${o}">${fc(o)}</option>`).join('\n'),
			`</select>`,
			`<p class="form-message text-align-center">`,
			`<a href="javascript:toolkit.listbox_move('pivot-a', 'up');">${c`up`}</a> `,
			`<a href="javascript:toolkit.listbox_move('pivot-a', 'down');">${c`down`}</a> `,
			`<a href="javascript:toolkit.listbox_selectall('pivot-a', true);">${c`all`}</a> `,
			`<a href="javascript:toolkit.listbox_selectall('pivot-a', false);">${c`none`}</a>`,
			`</p>`,
			`</li>`,
			
			`<li>`,
			`<p class="text-align-center">`,
			`<a class="button button-square" `,
			`href="javascript:`,
			`toolkit.listbox_moveacross('pivot-b', 'pivot-a', 'pivot-b', 'pivot-activate');`,
			`">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="arrowleft" d=""></path>`,
			`</svg>`,
			`</a> `,
			`<a class="button button-square" `,
			`href="javascript:`,
			`toolkit.listbox_moveacross('pivot-a', 'pivot-b', 'pivot-b', 'pivot-activate');`,
			`">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="arrowright" d=""></path>`,
			`</svg>`,
			`</a>`,
			`</p>`,
			`</li>`,

			`<li>`,
			`<p class="form-message">`,
			`${c`columns`}`,
			`</p>`,
			`<select class="min-height-25vh" id="pivot-b" size="10" multiple>`,
			d.schemapivot.cols.map(o => `<option value="${o}">${fc(o)}</option>`).join('\n'),
			`</select>`,
			`<p class="form-message text-align-center">`,
			`<a href="javascript:toolkit.listbox_move('pivot-b', 'up');">${c`up`}</a> `,
			`<a href="javascript:toolkit.listbox_move('pivot-b', 'down');">${c`down`}</a> `,
			`<a href="javascript:toolkit.listbox_selectall('pivot-b', true);">${c`all`}</a> `,
			`<a href="javascript:toolkit.listbox_selectall('pivot-b', false);">${c`none`}</a>`,
			`</p>`,
			`</li>`,

			`</ul>`,
			`</div>`,
		].join('\n');
		
		let features = {
			progress: false,
			title: c`pivot`.uf(),
			content: res,
			action: [
				`<a id="pivot-activate" `,
				`class="button button-primary margin-right-s{hidden} margin-right-xs" `,
				`href="javascript:;`,
				`d.schemapivot.rows=Array.from(byId('pivot-a').options).map(o => o.value);`,
				`d.schemapivot.cols=Array.from(byId('pivot-b').options).map(o => o.value);`,
				`d.schemapivot.visible=true;`,
				`stats.generatepivotdata();`,
				`if(gscreen.alert){gscreen.alert.remove();gscreen.alert=undefined;}`,
				`">${c`calculate`.uf()}</a>`,
			].join(''),
			cancel: true,
			canceltitle: c`close`.uf()
		};
		gscreen.alert = gscreen.displayalert(features);
		toolkit.drawicons();
		features = res = hidden = undefined;
	},
	tableheatmap: (col, target) => {
		let cleanformat = str => parseFloat(str.replace(/([%,$,\,,.])+/g,''));
		let columntoarray = (col, target) => document.querySelector(`#${target} td:nth-child(${col})`)
			.map(o => cleanformat(o.text));
		let maxposition = (columndata) => Array.inArray(Math.max.apply(Math, columndata), columndata);
		let generate_opacities = (columndata, max) => {
			let opacities = [];
			let increment = max / (columndata.length);
			for(let i = columndata.length; i >= 1; i--) {
				opacities.push(i * increment / 100);
			}
			increment = undefined;
			return opacities;
		}
	
		let columndata = columntoarray(col, target);
		let opacities = generate_opacities(columndata, 50);
		let row_count = columndata.length; 
		
		for (let i = 1; i <= row_count; i++) {    
			document.querySelector(`#${target} tr:nth-child(${maxposition(columndata)+1}) td:nth-child(${col})`)
				.style.background =`rgba(0,0,255,${opacities[0]})`;
			columndata[maxposition(columndata)] = null;
			opacities.splice(0, 1);
		}
	},
};
