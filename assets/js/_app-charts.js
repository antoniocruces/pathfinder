'use strict';

/* global AppError, autocomplete, arraymin, arraymax, byId, c, Circular, d, dbe, dbm, dbq, dbs, echarts, ecStat, fc, gscreen, icons, isBlank, k, l, plural, sleep, times, toolkit */
/* eslint no-confusing-arrow: ["error", {"allowParens": true}] */
/* eslint-env es6 */
/* exported charts, chartshelper */

// charts functions
const charts = {
	chart: (name, filter = '', facet = '', serie = '') => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 
		if(!dbe._filterids()) return;

		name = name || d.charttables.filter(o => o.model === 'qry').map(o => o.name).sort(toolkit.sortlocale)[0];

		let basetable = d.charttables.find(o => o.name === name);
		if(!basetable) throw new AppError(c`charts` + ': ' + c`invalid-query`);
		
		d.chartselectedmodel = basetable.model;
		d.chartselectedname = basetable.name;
		
		let droptables = () => {
			let out = [];
			d.charttables.sort(toolkit.sortlocale).forEach(o => { 
				out.push([
					`<option value="${o.name}"${name === o.name && d.chartselectedmodel === o.model ? ' selected' : ''}>`, 
					`${fc(o.model)}`, 
					`; `, 
					`${fc(o.name)}`,  
					`</option>`
				].join('')); 
			});
			return [
				`<p class="form-message">${c`table`.uf()}</p>`,
				`<label class="select">`,
				`<select id="acc-chartname" `,
				`onchange="javascript:`,
				`d.chartselectedtable=this.options[this.selectedIndex].value;`,
				`charts.chart(`,
				`this.options[this.selectedIndex].value,`,
				`'',`,
				`'',`,
				`''`,
				`)">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropfilters = arr => {
			let out = [];
			out.push(`<option value=""${isBlank(filter) ? ' selected' : ''}>[${c`all`}]</option>`); 
			arr.forEach(o => { 
				out.push(`<option value="${o}"${filter === o ? ' selected' : ''}>${fc(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`filter`.uf()}</p>`,
				`<label class="select">`,
				`<select id="acc-chartfilter" `,
				`onchange="javascript:`,
				`d.chartselectedfilter=this.options[this.selectedIndex].value;`,
				`charts.chart(`,
				`byId('acc-chartname').value,`,
				`this.options[this.selectedIndex].value,`,
				`byId('acc-chartfacet').value,`,
				`)">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropfacets = arr => {
			let out = [];
			arr.forEach(o => { 
				out.push(`<option value="${o}"${facet === o ? ' selected' : ''}>${fc(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`facet`.uf()}</p>`,
				`<label class="select">`,
				`<select id="acc-chartfacet" `,
				`onchange="javascript:`,
				`d.chartselectedfacet=this.options[this.selectedIndex].value;`,
				`charts.chart(`,
				`byId('acc-chartname').value,`,
				`byId('acc-chartfilter').value,`,
				`this.options[this.selectedIndex].value, `,
				`)">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropseries = arr => {
			let out = [];
			let splitter = txt => txt.includes('/') ? 
				fc(txt.split('/')[0]) + ' > ' + fc(txt.split('/')[1]) : txt;
			arr.forEach(o => { 
				out.push(`<option value="${o}"${serie === o ? ' selected' : ''}>${splitter(o)}</option>`); 
			});
			splitter = undefined;
			return [
				`<p class="form-message">${c`serie`.uf()}</p>`,
				`<label class="select">`,
				`<select id="acc-chartserie" `,
				`onchange="javascript:`,
				`d.chartselectedserie=this.options[this.selectedIndex].value;`,
				`charts.chart(`,
				`byId('acc-chartname').value,`,
				`'',`,
				`'',`,
				`this.options[this.selectedIndex].value`,
				`)">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropclayouts = () => {
			let out = [];
			let layouts = [
				'scatter',
				'radialtree',
				'hierarchicaltree',
				'sunburst',
				'treemap',
				'wordcloud',
			].sort(toolkit.sortlocale);
			d.chartcooccurrenceslayout = d.chartcooccurrenceslayout || layouts[0];
			layouts.forEach(o => { 
				out.push(`<option value="${o}"${d.chartcooccurrenceslayout === o ? ' selected' : ''}>${fc(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`layout`.uf()}</p>`,
				`<label class="select">`,
				`<select id="acc-chartlayout" `,
				`onchange="javascript:`,
				`d.chartcooccurrenceslayout=this.options[this.selectedIndex].value;`,
				`charts.chart(`,
				`byId('acc-chartname').value,`,
				`'',`,
				`'',`,
				`byId('acc-chartserie').value`,
				`)">`,
				`${out.join('\n')}`,
				`</select>`,
				`</label>`,
			].join('');
		};
		let splitkey = (k, v) => {
			let tmp = k.split('|');
			return [tmp[0], tmp[1], tmp[2], v];
		};
		let splittablerow = obj => {
			let iscoocurrences = d.chartselectedmodel === 'tbl' && d.chartselectedname === 'cooccurrences';
			let color = iscoocurrences ? 
				'#eeff00' : 
				dbe.getcolorfromtip(Object.keys(obj)[0].substr(5, 3));
			iscoocurrences = undefined;
			let keys = Object.keys(obj).filter(o => o !== 'count').map(o => fc(String(o))).join(' > ');
			let values = Object.keys(obj).filter(o => o !== 'count').map(o => fc(String(obj[o]))).join(' > ');
			return [keys, color, values, obj.count];
		};
		let valuesforcheck = () => [
			d.chartselectedmodel === 'qry' ? `byId('acc-chartfilter').value` : `''`,
			d.chartselectedmodel === 'qry' ? `byId('acc-chartfacet').value` : `''`,
		].join(',');

		let xseries = () => d.cooccurrencesroute
			.filter(o => o.showtout)
			.map(o => d.cooccurrencesroute.filter(o => o.showtin)[0].tin + '/' + o.rkey);

		if(isBlank(facet)) {
			if(d.chartselectedmodel === 'qry') {
				facet = basetable.facets[0];
			} else {
				facet = '';
			}
		}
		d.chartselectedfilter = filter;
		d.chartselectedfacet = facet;
		d.chartselectedserie = serie;

		let xmodel = d.chartselectedmodel;
		let xname = d.chartselectedname;
		let xfilter = d.chartselectedfilter;
		let xfacet = d.chartselectedfacet;
		
		gscreen.siteoverlay(true);
		toolkit.timer('charts.chart');
		toolkit.statustext(true);

		let instance = echarts.getInstanceByDom(byId('stats-charts'));
		if(instance) instance.clear();
		toolkit.cleardomelement('#stats-charts');
		if(instance) instance.dispose();
		instance = undefined;

		let pchart = echarts.init(byId('stats-charts'), d.chartselectedtheme);		
		pchart.showLoading({text: c`working`});
		sleep(50).then(() => {
			if(document.getElementById('stats-charts')) {
				let sel = [];

				sel.push(`
					<div class="group group-xs margin-bottom-s">
					<ul>
				`);				
				sel.push([
					`<li>`,
					`${droptables()}`,
					`</li>`,
				].join(''));

				if(xmodel === 'qry') {
					sel.push([
						`<li>`,
						`${dropfilters(d[basetable.filters])}`,
						`</li>`,
					].join(''));
					sel.push([
						`<li>`,
						`${dropfacets(basetable.facets)}`,
						`</li>`,
					].join(''));
				}
				if(xmodel === 'tbl' && xname === 'cooccurrences') {
					sel.push([
						`<li>`,
						`${dropclayouts()}`,
						`</l>`,
					].join(''));
					sel.push([
						`<li>`,
						`${dropseries(xseries())}`,
						`</li>`,
					].join(''));
				}
				sel.push(`<li>`);
				sel.push(`<div id="stats-charts-features" class="ddown">`);
				sel.push(`<p class="form-message">&nbsp;</p>`);
				sel.push(`<a class="button button-info" href="javascript:;">${c`show`.uf()}</a>`);
				sel.push(`<div class="ddown-content padding-xs box-shadow-xxl background-white">`);
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox"`, 
					`id="a-chk1" name="account-lin" `,
					`onclick="javascript:`,
					`d.chartselectedlines=this.checked;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartselectedlines ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`lines`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox" `, 
					`id="a-chk2" name="account-mrk" `,
					`onclick="javascript:d.chartselectedmarks=this.checked;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartselectedmarks ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`marks`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox" `, 
					`id="a-chk4" name="account-leg" `,
					`onclick="javascript:`,
					`d.chartselectedlegend=this.checked;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartselectedlegend ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`legend`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox" `, 
					`id="a-chk5" name="account-gau" `,
					`onclick="javascript:`,
					`d.chartgaussiansort=this.checked;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartgaussiansort ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`normalized`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				// Linear regression line
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox" `, 
					`id="a-chk6" name="account-rlinear" `,
					`onclick="javascript:`,
					`d.chartregression=this.checked?'linear':null;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartregression === 'linear' ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`linear-regression`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				// Exclude nulls
				sel.push([
					`<p class="no-margin-bottom">`,
					`<label class="control switch">`,
					`<input type="checkbox" `, 
					`id="a-chk6" name="account-excludenulls" `,
					`onclick="javascript:`,
					`d.chartexcludenulls=this.checked;`,
					`charts.chart(`,
					`byId('acc-chartname').value,`,
					valuesforcheck(),
					`)"${d.chartexcludenulls ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`exclude-nulls`}</span>`,
					`</label>`,
					`</p>`,
				].join(''));
				
				sel.push(`</div>`);								
				sel.push(`</div>`);								
				sel.push(`</li>`);

				sel.push([
					`<li>`,
					`<p class="form-message">`,
					`${c`do-not-include`.uf()}`,
					`</p>`,
					`<input type="search" id="sch-exclude" class="no-margin-bottom warning" `,
					`onkeyup="javascript:d.filterexclude=cleartext(this.value);" `,
					`onchange="javascript:d.filterexclude=cleartext(this.value);" `,
					`onsearch="javascript:d.filterexclude=cleartext(this.value);`,
					`charts.chart(`,
					`byId('acc-chartname')?byId('acc-chartname').value:null,`,
					`byId('acc-chartfilter')?byId('acc-chartfilter').value:null,`,
					`byId('acc-chartfacet')?byId('acc-chartfacet').value:null`,
					`);" `,
					`placeholder="${c`separate-by-semicolon`}" `,
					`value="${isBlank(d.filterexclude) ? '' : d.filterexclude}"`,
					`>`,
					`</li>`,
				].join(''));
				
				sel.push(`
					</ul>
					</div>
				`);				

				toolkit.msg('charts-selectors', sel.join(''));
				
				if(xmodel === 'tbl' && xname === 'cooccurrences') {
					byId('stats-charts-features').classList.add('hide');
				} else {
					byId('stats-charts-features').classList.remove('hide');
				}
				//table and filter selector
				let res;
				let tmpqry;
				switch(xmodel) {
					case 'qry':
						tmpqry = dbs[xname](xfilter, xfacet);
						let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
						if(d.chartgaussiansort) {
							res = Object.keys(tmpqry).map(o => splitkey(o, tmpqry[o])).gaussiansort(3);
						} else {
							res = Object.keys(tmpqry).map(o => splitkey(o, tmpqry[o])).sort(collator.compare);
						}
						collator = undefined;
						break;
					case 'tax':
						res = dbs.taxonomies();
						break;
					case 'tbl':
						if(!d[xname + 'results'].length) {
							gscreen.siteoverlay(false);
							toolkit.timer('charts.chart');
							toolkit.statustext();
							pchart.hideLoading();
							toolkit.msg(
								'stats-charts', 
								`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
							);
							return;	
						}
						tmpqry = d[xname + 'results'];
						if(xname !== 'cooccurrences') {
							if(d.chartgaussiansort) {
								res = tmpqry.map(o => splittablerow(o)).gaussiansort(3);
							} else {
								res = tmpqry.map(o => splittablerow(o))
									.sort((a, b) => a[0].localeCompare(b[0]) || a[2].localeCompare(b[2]));
							}
						}
						break;
					default:
						gscreen.siteoverlay(false);
						toolkit.timer('charts.chart');
						toolkit.statustext();
						pchart.hideLoading();
						throw new AppError(c`charts` + ': ' + c`invalid-model`);
				}

				if(xname !== 'cooccurrences') {
					let series = [];
					let rkeys = res.map(o => o[0]).unique();
					rkeys.forEach(o => {
						let lst = res.filter(r => r[0] === o);
						let xcl = lst[0][1] !== 'undefined' ? lst[0][1] : '#777';
						let dat = lst
							.filter(r => d.chartexcludenulls ? !isBlank(r[2]) && r[2] !== 'null' : true)
							.map(r => [r[2], r[3]]);
						let sta = dbs.stats(lst.map(r => r[3]));
						let set = new Set(sta.outliers);

						let ser = {
							name: c(o),
							type: !d.chartregression ? 'line' : 'scatter',
							smooth: true,
							lineStyle: {
								color: xcl
							},
							data: dat.map(r => ({
								name: r[0],
								value: r[1],
								symbol: set.has(r[1]) ? 'triangle' : 'circle',
							})),
							label: {
								normal: {
									show: true,
									formatter: (params) => {
										return params.data.symbol === 'triangle' ? params.name : '';
									},
									rotate: 45,
									color: (params) => {
										return params.data.color || '#000';
									},
									fontSize: 20
								},
							},
							emphasis: {
								label: {
									show: true,
									formatter: '{b}: {c}',
									rotate: 45,
									color: (params) => {
										return params.data.color || '#000';
									},
									fontSize: 22
								},
							},
						};
						if(!d.chartregression) {
							ser.areaStyle = {
								normal: {
									color: xcl,
									opacity: 0.4,
								}
							};
						} else {
							ser.symbolSize = data => data.clamp(8, 40);
							ser.itemStyle = {
								normal: {
									shadowBlur: 10,
									shadowColor: 'rgba(0, 0, 0, 0.8)',
									shadowOffsetY: 5,
									color: xcl,
									opacity: 0.4
								}
							};
						}
						if(d.chartselectedlines) {
							let mklstats = dbs.stats(d.schemaresults.map(o => o.count));
							ser.markLine = {
								lineStyle: {
									normal: {
										type: 'dotted'
									}
								},
								data: [
									{
										type: 'average', 
										name: c`average`,
										label: {
											normal: {
												formatter: '{b}: {c}',
												position: 'middle'
											}
										}
									},
									{
										name: c`high-limit`,
										yAxis: mklstats.highlimit,
										label: {
											normal: {
												formatter: '{b}: {c}',
												position: 'right'
											}
										},
										lineStyle: {
											normal: {
												type: 'dashed',
												color: 'green',
											}
										}
									},
									{
										name: c`low-limit`,
										yAxis: mklstats.lowlimit,
										label: {
											normal: {
												formatter: '{b}: {c}',
												position: 'left'
											}
										},
										lineStyle: {
											normal: {
												type: 'dashed',
												color: 'blue',
											}
										}
									},
								]
							};					
						} else {
							ser.markLine = {
								lineStyle: {
									normal: {
										type: 'dotted'
									}
								},
								data: []
							};					
						}
						if(d.chartselectedmarks) {
							ser.markPoint = {
								symbol: 'rect',
								symbolSize: [40, 20],
								label: {
									color: '#000',
									fontFamily: 'Dosis',
									fontWeight: 'bolder',
									formatter: '{b}: {c}',
								},
								itemStyle: {
									opacity: 0.5,
								},
								data: [
									{
										type: 'max', 
										name: c`max`
									},
									{
										type: 'min', 
										name: c`min`
									}
								]
							};
						} else {
							ser.markPoint = {
								symbol: 'rect',
								symbolSize: [40, 20],
								label: {
									color: '#000',
									fontFamily: 'Dosis',
									fontWeight: 'bolder',
								},
								itemStyle: {
									opacity: 0.5,
								},
								data: []
							};
						}

						series.push(ser);
						
						if(d.chartregression) {
							let reg = chartshelper.regression(lst.map(o => o[3]), 'linear');
							//let stx = dbs.stats(reg.points.map(p => p[1]));
							let clr = lst[0][1];
							ser = {
								name: c(o) + ': ' + c`linear-regression`,
								type: 'line',
								lineStyle: {
									normal: {
										color: clr
									}
								},
								smooth: true,
								showSymbol: false,
								data: reg.points,
								markPoint: {
									itemStyle: {
										normal: {
											color: 'transparent'
										}
									},
									label: {
										normal: {
											show: true,
											position: 'left',
											formatter: reg.expression,
											textStyle: {
												color: '#333',
												fontSize: 14
											}
										}
									},
									data: [
										{
											coord: reg.points[reg.points.length - 1]
										}
									],
								},
							};
							clr = reg = undefined;
							series.push(ser);
						}
						
						lst = sta = dat = ser = xcl = set = undefined;
					});
	
					let prefix = c(d.chartselectedname).uf();
					let maintit = d.chartselectedmodel === 'qry' ? 
						(isBlank(d.chartselectedfilter) ? c`all`.uf() : fc(d.chartselectedfilter).uf()) : 
						(isBlank(d.chartselectedname) ? c`all`.uf() : c(d.chartselectedname).uf());
					let title = d.chartselectedmodel === 'qry' ? 
						[prefix, `${c(d.chartselectedfacet).uf()}`, `${maintit}`].join('. ') : 
						[prefix, `${c(d.chartselectedmodel).uf()}`, `${maintit}`].join('. ');
					byId('stats-charts').style.overflowY = 'auto';
					pchart.setOption(charts.tablechartoptions(res, series, rkeys.map(o => c(o)), title, 'stats-charts'));
					
					basetable = droptables = dropfilters = dropfacets = xseries = dropclayouts = undefined;
					splitkey = valuesforcheck = undefined;
					xmodel = xname = xfilter = xfacet = sel = res = undefined;
					tmpqry = series = rkeys = undefined;
					prefix = maintit = title = undefined;
				} else {
					let title = [`${c(d.chartselectedmodel).uf()}`, `${c(d.chartselectedname).uf()}`].join('. ');
					byId('stats-charts').style.overflowY = 'auto';
					if(isBlank(d.chartselectedserie)) d.chartselectedserie = byId('acc-chartserie').value;
					let record = {
						skey: d.chartselectedserie.split('/')[0],
						tkey: d.chartselectedserie.split('/')[1],
					};

					let dataset = d.cooccurrencesresults
						.map(o => {
							let tmp = {};
							tmp[record.skey] = o[record.skey];
							tmp[record.tkey] = o[record.tkey];
							tmp.count = o.count;
							return tmp;
						});
					
					pchart.setOption(charts[d.chartcooccurrenceslayout + 'options'](dataset, title, 'stats-charts'));
					basetable = droptables = dropfilters = dropfacets = xseries = dropclayouts = undefined;
					splitkey = valuesforcheck = undefined;
					xmodel = xname = xfilter = xfacet = sel = res = undefined;
					dataset = record = undefined;
				}

				gscreen.siteoverlay(false);
				toolkit.timer('charts.chart');
				toolkit.statustext();
				pchart.hideLoading();			
			}
		});		
	},
	relations: (type = 'none|none', bound = '>', ptype = '', rtype = '', relfield = '', singlerec = null, calculate = false) => {
		if(typeof echarts === 'undefined') throw new AppError(c`library-error` + ': ECHARTS'); 

		if(isBlank(ptype)) ptype = d.record_types[0];
		if(isBlank(rtype)) rtype = ptype;
		
		let pchart;

		let droptype = did => {
			let out = [];
			let elm = [
				'none|none', 'force|none', 'circular|none', 
				'sankey|none', 'table|none', 'tree|none'
			];
			elm.forEach(o => {
				out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c(o)}</option>`);
			});
			elm = undefined;
			return [
				`<p class="form-message">${c`type`.uf()}</p>`,
				`<label class="select">`,
				`<select id="charts-stype">`,
				`${out.join('\n')}`, 
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropptypes = () => {
			let out = [];
			out.push(`<option value=""${ptype === '' ? ' selected' : ''}>${c`anyone`}</option>`);
			d.record_types.forEach(o => { 
				out.push(`<option value="${o}"${ptype === o ? ' selected' : ''}>${c(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`post_type`.uf()}</p>`,
				`<label class="select">`,
				`<select id="charts-ptype">`,
				`${out.join('\n')}`, 
				`</select>`,
				`</label>`,
			].join('');
		};
		let droprtypes = () => {
			let out = [];
			out.push(`<option value=""${ptype === '' ? ' selected' : ''}>${c`anyone`}</option>`);
			d.record_types.forEach(o => { 
				out.push(`<option value="${o}"${rtype === o ? ' selected' : ''}>${c(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`post_type`.uf()}</p>`,
				`<label class="select">`,
				`<select id="charts-rtype">`,
				`${out.join('\n')}`, 
				`</select>`,
				`</label>`,
			].join('');
		};
		let droprelfields = () => {
			let out = [];
			out.push(`<option value=""${relfield === '' ? ' selected' : ''}>${c`anyone`}</option>`);
			d.relatives.forEach(o => { 
				out.push(`<option value="${o}"${relfield === o ? ' selected' : ''}>${c(o)}</option>`); 
			});
			return [
				`<p class="form-message">${c`rkey`.uf()}</p>`,
				`<label class="select">`,
				`<select id="charts-relfield">`,
				`${out.join('\n')}`, 
				`</select>`,
				`</label>`,
			].join('');
		};
		let dropbound = did => {
			let out = [];
			let elm = ['>', '<'];
			elm.forEach(o => {
				out.push(`<option value="${o}"${did === o ? ' selected' : ''}>${c(o)}</option>`);
			});
			elm = undefined;
			return [
				`<p class="form-message">${c`bound`.uf()}</p>`,
				`<label class="select">`,
				`<select id="charts-sbound">`,
				`${out.join('\n')}`, 
				`</select>`,
				`</label>`,
			].join('');
		};
		let outoflimits = (nodes, edges) => 
			nodes > window.settings.graphnodemax || 
			edges > window.settings.graphedgemax;
			
		if(!byId('stats-network')) return;
		
		gscreen.siteoverlay(true);
		toolkit.timer('charts.relations');
		toolkit.statustext(true);

		sleep(50).then(() => {
			let sel = [];
			sel.push([
				`<div class="group group-xs margin-bottom-s">`,
				`<ul>`,
				
				`<li>`,
				`${droptype(type)}`,
				`</li>`,
				`<li>`,
				`${dropptypes()}`,
				`</li>`,
				`<li>`,
				`${dropbound(bound)}`,
				`</li>`,
				`<li>`,
				`${droprtypes()}`,
				`</li>`,
				`<li>`,
				`${droprelfields()}`,
				`</li>`,

				`<li>`,
				`<p class="form-message">`,
				`${c`do-not-include`.uf()}`,
				`</p>`,
				`<input type="text" id="flt-exclude" class="no-margin-bottom warning" `,
				`onkeyup="javascript:d.filterexclude=cleartext(this.value);" `,
				`onchange="javascript:d.filterexclude=cleartext(this.value);" `,
				`onsearch="javascript:d.filterexclude=cleartext(this.value);" `,
				`placeholder="${c`separate-by-semicolon`}" `,
				`value="${isBlank(d.filterexclude) ? '' : d.filterexclude}"`,
				`>`,
				`</li>`,

				`</ul>`,
				`</div>`,
				
				`<div class="group group-xs margin-bottom-s">`,
				`<ul>`,
				
				`<li>`,
				`<span class="autocomplete">`, 
				`<input `,
				`value="${singlerec ? singlerec : ''}" `,
				`type="search" class="autocomplete-input" `, 
				`placeholder="${c`filter`}" `,
				`style="width:97%"`,
				`id="charts-nid" />`,
				`<p class="form-message">${c`relations-date-warning`}</p>`,				
				`</li>`,

				`<li>`,
				`<a `,
				`id="charts-opr" `,
				`class="button button-info" `,
				`href="javascript:charts.relations(`, 
				`byId('charts-stype').value, `,
				`byId('charts-sbound').value, `, 
				`byId('charts-ptype').value, `, 
				`byId('charts-rtype').value, `, 
				`byId('charts-relfield').value, `, 
				`byId('charts-nid').value, `, 
				`true`, 
				`);">`, 
				`${c`relations`.uf()}`,
				`</a> `,
				`<p class="form-message info">${c`long-time-op-warning`}</p>`,				
				`</li>`,
				
				`</ul>`,
								
				`</div>`,
			].join(''));
		
			toolkit.msg('network-selectors', sel.join('\n'));
			
			if(calculate) {
				let json = dbq.globalnetwork(ptype, rtype, relfield, bound, singlerec);
				if(json.nodes !== undefined) {
					autocomplete(byId('charts-nid'), json.nodes.map(o => o.label));
					let rnode = document.createElement('p');
					rnode.textContent = [
						`${c`vertex`}: ${json.nodes.length.toLocaleString(l)}`,
						`${c`edge`}:  ${json.edges.length.toLocaleString(l)}`,
					].join('; ');
					byId('network-selectors').appendChild(rnode);
					rnode = undefined;
					if(type === 'table|none') {
						byId('stats-network').classList.remove('page-charts');
						byId('stats-network').classList.add('table-responsive');
						byId('stats-network').style.border = '0';
				
						sleep(100).then(() => {
							gscreen.siteoverlay(true);
							let dataset = [];
							let edg = [];
							let nod = dbe.hashrecord(json.nodes, 'id');
							json.edges.forEach(o => edg.push({
								sourcetype: nod[o.source] ? nod[o.source].category : c(ptype),
								sourcetitle: d.store.pos[o.source] ? 
									toolkit.titleformat(d.store.pos[o.source].value).shorten(50) : 
									'',
								sourcecount: nod[o.source] ? nod[o.source].value : -1,
								bound: c(bound),
								rkey: c(o.rkey),
								targettype: nod[o.target] ? nod[o.target].category : c(rtype),
								targettitle: d.store.pos[o.target] ? 
									toolkit.titleformat(d.store.pos[o.target].value).shorten(50) : 
									'',
								targetcount: nod[o.target] ? nod[o.target].value : -1,
								count: (nod[o.source] ? nod[o.source].value : -1) + 
									(nod[o.target] ? nod[o.target].value : -1)
							}));
							dataset.push(...edg);
							
							sleep(50).then(() => {
								toolkit.msg(
									'stats-network', 
									[
										`<table id="charts-ftable">`,
										`</table>`,
									].join('')
								);
								
								let oldtable = byId('charts-ftable');
								let newtable = oldtable.cloneNode();
								let thead = document.createElement('thead');
								let tbody = document.createElement('tbody');
								let tr = document.createElement('tr');
								Object.keys(dataset[0]).forEach(o => {
									let th = document.createElement('th');
									th.appendChild(document.createTextNode(fc(o)));
									tr.appendChild(th);
									th = undefined;
								});
								tbody.appendChild(tr);
								tr = undefined;
								for(let i = 0, len = dataset.length; i < len; i++) {
									let tr = document.createElement('tr');
									for(let j = 0, jlen = Object.values(dataset[i]).length; j < jlen; j++) {
										let td = document.createElement('td');
										td.appendChild(document.createTextNode(c(Object.values(dataset[i])[j])));
										tr.appendChild(td);
										td = undefined;
									}
									tbody.appendChild(tr);
									tr = undefined;
								}
								newtable.appendChild(tbody);
								oldtable.parentNode.replaceChild(newtable, oldtable);
								thead = tbody = oldtable = newtable = undefined;
															
								gscreen.siteoverlay(false);
								d.networkresults = dataset;
								dataset = nod = edg = undefined;
								json = undefined;
							});
						});					
					} else if(type === 'tree|none') {
						byId('stats-network').classList.remove('table-responsive');
						let compare = (a, b) => a.localeCompare(b, l, {sensitivity: 'base'});
						let tout = [];
						tout.push(`<ul class="tree">`);
						tout.push(`<li class="root">${c(ptype)} ${c(bound)} ${c(rtype)}</li>`);
						let list = json.edges.map(o => ({
							sourcetitle: d.store.pos[o.source] ? toolkit.titleformat(d.store.pos[o.source].value) : '',
							targettitle: d.store.pos[o.target] ? toolkit.titleformat(d.store.pos[o.target].value) : '',
							rkey: c(o.rkey)
						}));
						let tree = list.groupByMultiple(['sourcetitle', 'rkey']);
						Object.keys(tree).sort(compare).forEach(o => {
							tout.push(`<li>`);
							tout.push(o);
							tout.push(`<ul class="internalntree">`);
							Object.keys(tree[o]).sort(compare).forEach(k => {
								tout.push(`<li>`);
								tout.push(`${k} (${tree[o][k].length.toLocaleString(l)} ${c`items`})`);
								tout.push(`<ul class="internalntree">`);
								tree[o][k].map(r => r.targettitle).sort(compare).forEach(r => {
									tout.push(`<li>${r}</li>`);
								});
								tout.push(`</ul>`);							
								tout.push(`</li>`);
							});
							tout.push(`</ul>`);
							tout.push(`</li>`);
						});
						tout.push(`</ul>`);
						byId('stats-network').classList.remove('page-charts');
						byId('stats-network').style.border = '0';
						toolkit.msg('stats-network', tout.join('\n'));
						compare = tout = list = tree = json = undefined;
					} else {
						byId('stats-network').classList.add('table-responsive');
						if(outoflimits(json.nodes.length, json.edges.length)) {
							if(!confirm(c`nodes-edges-warning`.uf())) {
								toolkit.statustext();
								toolkit.timer('charts.relations');
								gscreen.siteoverlay(false);
								byId('stats-network').style.border = '0';
								throw new AppError(c`relations` + ': ' + c`out-of-limits`); 
							}
						}
						let existinstance = echarts.getInstanceByDom(byId('stats-network'));
						if (existinstance) {
							echarts.dispose(existinstance);
						}
						existinstance = undefined;
						let deadtbl = byId('stats-network-table');
						if(deadtbl) deadtbl.parentNode.removeChild(deadtbl);
						deadtbl = undefined;
						let graphtitle = `${c(ptype)} ${c(rtype)} ${c(relfield)}`.trim();
	
						byId('stats-network').style.height = '750px';					
						pchart = echarts.init(byId('stats-network'), d.chartselectedtheme);		
						pchart.showLoading({text: c`working`});
						byId('stats-network').classList.add('page-charts');
						let options = charts.globalgraphoptions(json, graphtitle, 'stats-network', type);
						pchart.setOption(options, true);
						pchart.resize();
						graphtitle = options = json = undefined;
					}
				} else {
					byId('stats-network').classList.add('table-responsive');
					toolkit.msg(
						'stats-network', 
						`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
					);
				}
			} else {
				byId('stats-network').classList.add('table-responsive');
				toolkit.msg(
					'stats-network', 
					`<p class="color-error text-align-center vertical-center">${c`no-data`.uf()}</p>`
				);
			}

			gscreen.siteoverlay(false);
			toolkit.timer('charts.relations');
			toolkit.statustext();
			if(!['table|none', 'tree|none'].includes(type)) {
				if(pchart) pchart.hideLoading();
			}
			sel = undefined;
			pchart = droptype = dropptypes = droprtypes = undefined;
			droprelfields = dropbound = outoflimits = undefined;
		});
	},
	doughnutoptions: (json, percent, jsonname, percentname, dom) => {
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: false,
				dom: dom
			}),
			tooltip: {
				trigger: 'item',
				formatter: '{a} <br/>{b}: {c} ({d}%)'
			},
			legend: {
				orient: 'vertical',
				x: 'left',
				data: json.map(o => c(o.name))
			},
			series: [
				{
					name: percentname,
					type: 'pie',
					selectedMode: 'single',
					radius: [0, '30%'],
					label: {
						normal: {
							position: 'inner'
						}
					},
					labelLine: {
						normal: {
							show: false
						}
					},
					data:[
						{
							value: percent, 
							name: percentname, 
							selected: true,
							itemStyle: {
								normal: {
									color: '#c5cbd7',
								}
							}
						},
						{
							value: 100 - percent, 
							name: c`total`,
							itemStyle: {
								normal: {
									color: '#697181',
								}
							}
						},
					]
				},
				{
					name: jsonname,
					type: 'pie',
					radius: ['40%', '55%'],
					label: {
						normal: {
							formatter: '{a}\n{b}：{c}\n{d}%',
						}
					},
					data: json.map(o => ({
						name: c(o.name), 
						value: o.value, 
						itemStyle: {
							normal: {
								color: dbe.getcolorfromslug(o.name)
							}
						}
					}))
				}
		    ]
		};
		return options;
	},
	wordcloudoptions: (json, title, dom) => {
		let data = chartshelper.preparetreedata();
		let series = [];
		let xdata = data; 
		let tmp = xdata.map(o => o.value).scalebetween(15, 55);
		let minvalue = arraymin(tmp);
		let maxvalue = arraymax(tmp);

		series.push({
			type: 'wordCloud',
			sizeRange: [minvalue, maxvalue],
			rotationRange: [-90, 90],
			rotationStep: 90,
			gridSize: 8,
			shape: 'circle', /* circle, square, cardioid, diamond, triangle-forward, triangle, pentagon, star */
			left: 'center',
			top: 'center',
			drawOutOfBound: true,
			textStyle: {
				normal: {
					color: 'red',
				},
				emphasis: {
					color: '#60ACFC',
					shadowBlur: 6,
					shadowColor: '#dddddd'
				}
			},
			data: data.sort(function (a, b) {
				return b.value  - a.value;
			}),
			name: d.chartselectedserie,
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title,
				subtext: d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
				left: 'center'
			},
			series: series,
		};
		json = data = xdata = series = tmp = minvalue = maxvalue = undefined;
		return options;
	},
	sunburstoptions: (json, title, dom) => {
		let data = chartshelper.preparetreedata();
		let series = [];
		let xdata = data; 

		series.push({
			type: 'sunburst',
			data: xdata,
			radius: [0, '90%'],
			label: {
				rotate: 'radial'
			},
			name: d.chartselectedserie,
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title,
				subtext: d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
				left: 'center'
			},
			series: series,
		};
		json = data = xdata = series = undefined;
		return options;
	},
	hierarchicaltreeoptions: (json, title, dom) => {
		let data = chartshelper.preparetreedata();
		let series = [];
		let xdata = {name: c`cooccurrences`.uf(), children: data};
		echarts.util.each(xdata.children, function (datum, index) {
			//index % 2 === 0 && (datum.collapsed = true);
			if(index % 2 === 0) datum.collapsed = true;
		});

		series.push({
			type: 'tree',
			data: [xdata],
			top: '1%',
			left: '7%',
			bottom: '1%',
			right: '20%',
			label: {
				normal: {
					position: 'left',
					verticalAlign: 'middle',
					align: 'right',
					fontSize: 12
				}
			},
			leaves: {
				label: {
					normal: {
						position: 'right',
						verticalAlign: 'middle',
						align: 'left'
					}
				}
			},
			expandAndCollapse: true,
			animationDuration: 550,
			symbol: 'emptyCircle',
			symbolSize: 7,
			initialTreeDepth: 1,
			animationDurationUpdate: 750,
			name: d.chartselectedserie,
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title,
				subtext: d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
				left: 'center'
			},
			series: series,
		};
		json = data = xdata = series = undefined;
		return options;
	},
	radialtreeoptions: (json, title, dom) => {
		let data = chartshelper.preparetreedata();
		let series = [];
		let xdata = {name: c`cooccurrences`.uf(), children: data};

		series.push({
			type: 'tree',
			data: [xdata],
			top: '18%',
			bottom: '14%',
			layout: 'radial',
			symbol: 'emptyCircle',
			symbolSize: 7,
			initialTreeDepth: 1,
			animationDurationUpdate: 750,
			name: d.chartselectedserie,
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title,
				subtext: d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
				left: 'center'
			},
			series: series,
		};
		json = data = xdata = series = undefined;
		return options;
	},
	treemapoptions: (json, title, dom) => {
		let blacklist = [c`count`];
		let keys = Object.keys(json[0]).filter(o => !blacklist.includes(o));
		let source = keys[0]; 
		let target = keys[1]; 

		let tree = d.cooccurrencesresults.map(o => ({source: o[source], target: o[target], value: o.count})).groupBy(['source']);
		let data = [];
		let series = [];
		Object.keys(tree).forEach(o => {
			let tmp = tree[o];
			let val = tmp.map(t => t.value).sum();
			data.push({
				name: o,
				value: val,
				children: tmp.map(t => ({name: t.target, value: t.value}))
			});
			tmp = val = undefined;
		});

		let formatUtil = echarts.format;

		let getLevelOption = () => {
			return [
				{
					itemStyle: {
						normal: {
							borderColor: '#777',
							borderWidth: 0,
							gapWidth: 1
						}
					},
					upperLabel: {
						normal: {
							show: false
						}
					}
				},
				{
					itemStyle: {
						normal: {
							borderColor: '#555',
							borderWidth: 5,
							gapWidth: 1
						},
						emphasis: {
							borderColor: '#ddd'
						}
					}
				},
				{
					colorSaturation: [0.35, 0.5],
					itemStyle: {
						normal: {
							borderWidth: 5,
							gapWidth: 1,
							borderColorSaturation: 0.6
						}
					}
				},
			];
		};

		series.push({
			name: d.chartselectedserie,
			type: 'treemap',
			visibleMin: 300,
			label: {
				show: true,
				formatter: '{b}'
			},
			upperLabel: {
				normal: {
					show: true,
					height: 30
				}
			},
			itemStyle: {
				normal: {
					borderColor: '#fff'
				}
			},
			levels: getLevelOption(),
			data: data
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title,
				subtext: d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
				left: 'center'
			},
			tooltip: {
				formatter: function (info) {
					let value = info.value;
					let treePathInfo = info.treePathInfo;
					let treePath = [];
					for (let i = 1; i < treePathInfo.length; i++) {
						treePath.push(treePathInfo[i].name);
					}
					return [
						'<div class="tooltip-title">' + formatUtil.encodeHTML(treePath.join(' / ')) + '</div>',
						d.chartselectedserie.split('/').map(o => c(o)).join(' > '),
						': ' + formatUtil.addCommas(value) + ' ' + c`cooccurrences`,
					].join('');
				}
			},
			series: series,
		};
		source = target = tree = data = series = getLevelOption = undefined;
		return options;
	},
	scatteroptions: (json, title, dom) => {
		let colors = [
			toolkit.hsl2hex(d.scales[window.settings.scalecolorbase].start, 100, 50),
			toolkit.hsl2hex(d.scales[window.settings.scalecolorbase].end, 100, 50),
		];
		let blacklist = [c`count`];
		let keys = Object.keys(json[0]).filter(o => !blacklist.includes(o));
		let sname = c(keys[0]); 
		let tname = c(keys[1]); 

		let yaxis = json.map(o => o[keys[0]]).unique().sort(toolkit.sortlocale);
		let xaxis = json.map(o => o[keys[1]]).unique().sort(toolkit.sortlocale);
		let maxcount = arraymax(json.map(o => o.count));
		let sections = json.map(o => c(o[sname]) + ' > ' + c(o[tname])).unique().sort(toolkit.sortlocale);
		
		let series = [];
		sections.forEach(s => {
			let tmp = json
				.filter(f => c(f[sname]) + ' > ' + c(f[tname]) === s).sort((a, b) => a[0] > b[0] || a[1] > b[1])
				.filter(f => d.cooccurrencesoutliersonly ? d.cooccurrencesoutliers.includes(f.count) : true);
			series.push({
				name: s,
				type: 'scatter',
				data: tmp
					.map(f => [f[keys[0]], f[keys[1]], f.count])
					.sort((a, b) => a[0] > b[0] || a[1] > b[1]),
				encode: {
					x: [1],
					y: [0],
					tooltip: [0, 1, 2]
				},
				itemStyle: {
					normal: {
						opacity: 0.6,
						shadowBlur: 10,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				},
				symbolSize: function (data) {
					return Math.sqrt(data[2]) / 5e2;
				},
			});
			tmp = undefined;
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			title: {
				top: 'top',
				text: title,
				left: 'center'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			grid: {
				x: '20%',
				x2: '10%',
				y: '7%',
				y2: '25%'
			},
			tooltip: {
				padding: 10,
				backgroundColor: '#222',
				borderColor: '#777',
				borderWidth: 1,
				formatter: function(o) {
					let index = byId('acc-chartserie').selectedIndex;
					let serie = d.cooccurrencesroute.filter(o => o.showtout)[index];
					return [
						`<span class="dot margin-right" `,
						`style="background-color:${dbe.getcolorfromslug(serie.tin)}"></span>`,
						`${o.data[0]}<br />`,
						`<span class="dot margin-right" `,
						`style="background-color:${dbe.getcolorfromslug(serie.tout)}"></span>`,
						`${o.data[1]}<br />`,
						`${c`count`.uf()} = ${Number(o.data[2]).toLocaleString(l)}`,
					].join('');
				},
				axisPointer: {
					show: true,
					type: 'cross',
					lineStyle: {
						type: 'dashed',
						width: 1
					}
				}
			},
			xAxis: {
				type: 'category',
				name: c(keys[1]),
				data: xaxis,
				nameLocation: 'center',
				nameGap: 110,
				nameTextStyle: {
					color: 'red',
				},
				splitLine: {
					show: false
				},
				axisTick: {
					show: false,
				},
				axisLine: {
					show: false,
					lineStyle: {
						color: '#000'
					}
				},
				axisLabel: {
					rotate: 50, 
					formatter: function (value) {
						return String(value).shorten(15);
					}
				},
			},
			yAxis: {
				type: 'category',
				name: c(keys[0]),
				data: yaxis,
				nameLocation: 'end',
				nameGap: 10,
				nameTextStyle: {
					color: 'red',
				},
				axisTick: {
					show: false,
				},
				axisLine: {
					show: false,
					lineStyle: {
						color: '#000'
					}
				},
				splitLine: {
					show: false,
				},
				splitArea: {
					show: true
				}
			},
			visualMap: [
				{
					left: 'left',
					bottom: 'bottom',
					dimension: 2,
					min: 0,
					max: maxcount,
					itemWidth: 30,
					itemHeight: 120,
					calculable: true,
					precision: 0.1,
					text: [c`count`],
					textStyle: {
						color: '#fff'
					},
					inRange: {
						symbolSize: [10, 100]
					},
					outOfRange: {
						symbolSize: [10, 100],
						color: ['rgba(255,255,255,.2)']
					},
					controller: {
						inRange: {
							color: ['#c23531']
						},
						outOfRange: {
							color: ['#444']
						}
					},
				},
			],
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'empty'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'empty'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'empty'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'empty'
				}
			],
			series: series
		};

		colors = sname = tname = blacklist = keys = undefined;
		yaxis = xaxis = maxcount = sections = series = undefined;
		return options;
	},
	globalgraphoptions: (json, title, dom, type) => {
		let layout = type.split('|')[0];
		if(layout === 'sankey') return charts.sankeyoptions(dom, json.nodes, json.edges, title, false);
		let rnd = a => Math.floor(Math.random() * a);
		let instance = echarts.getInstanceByDom(byId(dom));
		let gw = instance ? instance.getWidth() : 0;
		let gh = instance ? instance.getHeight() : 0;
		let maxsize = Math.max.apply(null, json.nodes.map(o => o.value));
		let itemsize = val => Math.max(2, Math.round((val / maxsize) * 100));
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			title: {
				text: title,
				subtext: c(type),
				left: 'center'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			tooltip: {
				trigger: 'item',
				triggerOn: 'mousemove'
			},
			legend: [{
				data: json.categories.map(o => c(o.name)),
				orient: 'vertical',
				top: 'top',
				left: 'left'
			}],
			series: [
				{
					name: title,
					type: 'graph',
					layout: layout,
					data: json.nodes.map(function (node) {
						return {
							x: rnd(gw),
							y: rnd(gh),
							id: String(node.id),
							category: json.categories.map(o => c(o.name)).indexOf(c(node.category)),
							name: node.label,
							symbolSize: itemsize(node.value),
							value: itemsize(node.value),
							draggable: true,
							color: node.color,
							itemStyle: {
								normal: {
									color: node.color,
									borderColor: '#fff',
									borderWidth: 1,
									shadowBlur: 10,
									shadowColor: 'rgba(0,0,0,0.3)'
								}
							},
							label: {
								formatter: '{b} {c}',
								normal: {
									color: '#000',
									show: node.value > 20
								},
								emphasis: {
									position: 'right',
									show: true
								}
							}
						};
					}),
					links: json.edges.map(function (edge) {
						return {
							source: String(edge.source),
							target: String(edge.target),
							label: {
								normal: {
									show: false,
									position: 'middle',
									formatter: c(edge.rkey)
								},
								emphasis: {
									show: true,
									position: 'middle',
									formatter: c(edge.rkey)
								}
							}
						};
					}),
					categories: json.categories.map(o => ({
						name: c(o.name),
						itemStyle: {
							color: o.color
						}
					})),
					edgeLabel: {
						normal: {
							show: false,
							position: 'middle',
							formatter: function (edge) { return c(edge.rkey); }
						},
						emphasis: {
							show: true,
							position: 'middle',
							formatter: function (edge) { return c(edge.rkey); }
						}
					},
					lineStyle: {
						color: 'source',
						curveness: 0.3
					},
					emphasis: {
						lineStyle: {
							width: 10
						}
					},
					focusNodeAdjacency: true,
					draggable: true,
					roam: true,
				}
			]
		};
		if(layout === 'force') {
			options.animation = false;
			options.series[0].force = {
				edgeLength: 5,
				repulsion: 200,
				gravity: 0.2,
				initLayout: 'circular'
			};
			options.series[0].lineStyle.curveness = 0.2;
		}
		layout = rnd = gw = gh = maxsize = itemsize = instance = undefined;
		return options;
	},
	graphoptions: (dom, leg, nod, edg, typ, tit) => {
		let layout = typ.split('|')[0];
		if(layout === 'sankey') return charts.sankeyoptions(dom, nod, edg, tit);
		nod.forEach(o => {
			o.name = o.id + ': ' + o.name;
			if(layout === 'force') {
				o.x = o.y = null;
				o.draggable = true;
			}
		});
		edg.forEach(o => {
			let sou = Number(o.source) || -1;
			let tar = Number(o.target) || -1;
			let ssou = d.store.pos[sou] ? sou + ': ' + String(d.store.pos[sou].value || '').shorten(50) : '';
			let star = d.store.pos[tar] ? tar + ': ' + String(d.store.pos[tar].value || '').shorten(50) : '';
			o.source = ssou;
			o.target = star;
			sou = tar = ssou = star = undefined;
		});
		nod.forEach(o => {
			o.id = o.name;
		});
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			title: {
				text: tit,
				subtext: c(typ),
				left: 'center'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			tooltip: {
				trigger: 'item',
				triggerOn: 'mousemove'
			},
			legend: [{
				data: leg
			}],
			series: [
				{
					name: c`graph`,
					type: 'graph',
					layout: layout,
					data: nod,
					links: edg,
					categories: leg,
					itemStyle: {
						normal: {
							borderColor: '#fff',
							borderWidth: 1,
							shadowBlur: 10,
							shadowColor: 'rgba(0, 0, 0, 0.3)'
						}
					},
					label: {
						position: 'right',
						formatter: '{b}: {c}',
						emphasis: {
							position: 'right',
							show: true
						}
					},
					edgeLabel: {
						show: true,
						formatter: '{@value}'
					},
					lineStyle: {
						color: 'source',
						curveness: 0.3
					},
					emphasis: {
						lineStyle: {
							width: 10
						}
					},
					focusNodeAdjacency: true,
					draggable: true,
					roam: true,
				}
			]
		};
		if(layout === 'force') {
			options.animation = false;
			options.series[0].force = {
				edgeLength: 5,
				repulsion: 200,
				gravity: 0.2,
				initLayout: 'circular'
			};
			options.series[0].lineStyle.curveness = 0.2;
		}
		layout = undefined;
		return options;
	},
	sankeyoptions: (dom, nod, edg, tit) => {
		let maxsize = arraymax(nod.map(o => o.value));
		let itemsize = val => Math.max(2, Math.round((val / maxsize) * 100));
		nod.forEach(o => {
			let label = {normal: {formatter: d.store[o.id] ? String(d.store[o.id].value || '').shorten(50) : ''}};
			o.id = String(o.id);
			o.name = String(o.id);
			o.value = itemsize(Number(o.value)); 
			o.label = label;
			label = undefined;
		});
		edg.forEach(o => {
			let sou = Number(o.source) || -1;
			let tar = Number(o.target) || -1;
			o.source = String(sou); 
			o.target = String(tar); 
			o.value = o.nvalue;
			sou = tar = undefined;
		});
		
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			title: {
				text: tit,
				subtext: c`sankey|none`,
				left: 'center'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			tooltip: {
				trigger: 'item',
				triggerOn: 'mousemove',
				formatter: function (params) {
					let dat = params.data;
					if(dat.source !== undefined) {
						return [
							`${c`source`}: `,
							`${toolkit.titleformat(d.store.pos[Number(dat.source)].value)}; `,
							`${c`target`}: `,
							`${toolkit.titleformat(d.store.pos[Number(dat.target)].value)}; `,
							`${c`rkey`}: `,
							`${fc(dat.rkey)}`,
						].join('');
					} else {
						return [
							`<span class="dot" style="background-color:${dat.color}"></span> `,
							`${c(dat.category)}: `,
							`${toolkit.titleformat(d.store.pos[Number(dat.id)].value)} = `,
							`${Number(dat.value).toLocaleString(l)}; `,
						].join('');
					}
				},
			},
			series: [{
				type: 'sankey',
				layout: 'none',
				data: nod,
				links: edg,
				itemStyle: {
					normal: {
						borderWidth: 1,
						borderColor: '#aaa'
					}
				},
				lineStyle: {
					normal: {
						color: 'source',
						curveness: 0.5
					}
				}
			}]
		};
		maxsize = itemsize = undefined;
		return options;
	},
	timelineoptions: (dom, dat, tit, typ = 'year') => {
		let series = [];
		
		let maxyear = Math.max.apply(null, dat.map(o => o[typ]));
		let minyear = Math.min.apply(null, dat.map(o => o[typ]));
		let years = Array.apply(null, {length: maxyear + 1}).map(Number.call, Number).slice(minyear);
		let categories = dat.map(o => c(o.category)).unique();
		let colors = dat.map(o => o.color).unique();

		categories.forEach((category, ind) => {
			let temp = dat.filter(o => c(o.category) === category);
			let tcolor = colors[ind];
			let tdata = [];
			let tcount = temp.countBy(typ);
			years.forEach(year => {
				let tvl = tcount[year];
				if(tvl) {
					tdata.push([
						year,
						tvl.count
					]);
				}
				tvl = undefined;
			});
			let taverage = tdata.map(o => o[1]).reduce((p, c) => p + c, 0) / tdata.map(o => o[1]).length;
			series.push({
				name: category,
				type: 'line',
				data: tdata,
				itemStyle: {
					normal: {
						color: tcolor,
					}
				},
				markArea: {
					silent: true,
					itemStyle: {
						normal: {
							color: 'transparent',
							borderWidth: 1,
							borderType: 'dashed'
						}
					},
					data: [
						[{
							name: `${c`coverage-area`}: ${category}`,
							xAxis: 'min',
							yAxis: 'min'
						}, {
							xAxis: 'max',
							yAxis: 'max'
						}]
					]
				},
				markPoint: {
					data: [
						{type: 'max'},
						{type: 'min'}
					]
				},
				markLine: {
					lineStyle: {
						normal: {
							type: 'solid'
						}
					},
					data: [
						{type: 'average'},
						{xAxis: taverage}
					]
				}
			});
			temp = tcolor = tdata = tcount = taverage = undefined;
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			grid: {
				left: '3%',
				right: '7%',
				bottom: '3%',
				containLabel: true
			},
			tooltip: {
				showDelay: 0,
				formatter: function (params) {
					if (params.value.length > 1) {
						return `${params.seriesName}:<br/>${params.value[0]} / ${params.value[1]}`;
					} else {
						return `${params.seriesName}:<br/>${params.value}`;
					}
				},
				axisPointer: {
					show: true,
					type: 'cross',
					lineStyle: {
						type: 'dashed',
						width: 1
					}
				}
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			brush: {},
			legend: {
				data: categories,
				left: 'left'
			},
			xAxis: [
				{
					type: 'value',
					scale: true,
					axisLabel: {
						formatter: function (value) {
							return typ === 'month' ? times[l].month[value] : typ === 'weekday' ? times[l].weekday[value] : value;
						}
					},
					splitLine: {
						show: false
					}
				}
			],
			yAxis: [
				{
					type: 'category',
					scale: true,
					min: 0,
					axisLabel: {
						formatter: '{value}'
					},
					splitLine: {
						show: false
					}
				}
			],
			series: series
		};
		tit = series = maxyear = minyear = years = categories = colors = undefined;
		return options;
	},
	geolineoptions: (dom, dat, tit, pla = 'country') => {
		let series = [];
		
		let places = dat.map(o => o[pla]).unique();
		let categories = dat.map(o => c(o.category)).unique();
		let colors = dat.map(o => o.color).unique();

		categories.forEach((category, ind) => {
			let temp = dat.filter(o => c(o.category) === category);
			let tcolor = colors[ind];
			let tdata = [];
			let tcount = temp.countBy(pla);
			places.forEach(place => {
				let tvl = tcount[place];
				if(tvl) {
					tdata.push([
						place,
						tvl.count
					]);
				}
				tvl = undefined;
			});
			let taverage = tdata.map(o => o[1]).reduce((p, c) => p + c, 0) / tdata.map(o => o[1]).length;
			series.push({
				name: category,
				type: 'line',
				data: tdata,
				itemStyle: {
					normal: {
						color: tcolor,
					}
				},
				markArea: {
					silent: true,
					itemStyle: {
						normal: {
							color: 'transparent',
							borderWidth: 1,
							borderType: 'dashed'
						}
					},
					data: [
						[{
							name: `${c`coverage-area`}: ${category}`,
							xAxis: 'min',
							yAxis: 'min'
						}, {
							xAxis: 'max',
							yAxis: 'max'
						}]
					]
				},
				markPoint: {
					data: [
						{type: 'max'},
						{type: 'min'}
					]
				},
				markLine: {
					lineStyle: {
						normal: {
							type: 'solid'
						}
					},
					data: [
						{type: 'average'},
						{xAxis: taverage}
					]
				}
			});
			temp = tcolor = tdata = tcount = taverage = undefined;
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			grid: {
				left: '3%',
				right: '7%',
				bottom: '3%',
				containLabel: true
			},
			tooltip: {
				showDelay: 0,
				formatter: function (params) {
					if (params.value.length > 1) {
						return `${params.seriesName}:<br/>${params.value[0]} / ${params.value[1]}`;
					} else {
						return `${params.seriesName}:<br/>${params.value}`;
					}
				},
				axisPointer: {
					show: true,
					type: 'cross',
					lineStyle: {
						type: 'dashed',
						width: 1
					}
				}
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			brush: {},
			legend: {
				data: categories,
				left: 'left'
			},
			xAxis: [
				{
					type: 'category',
					scale: true, 
					axisLabel: {
						formatter: function (value) {
							return value;
						}
					},
					splitLine: {
						show: false
					}
				}
			],
			yAxis: [
				{
					type: 'value',
					scale: true,
					min: 0,
					axisLabel: {
						formatter: '{value}'
					},
					splitLine: {
						show: false
					}
				}
			],
			series: series
		};
		tit = series = places = categories = colors = undefined;
		return options;
	},
	taxoscatteroptions: (dom, dat, tit, pla = 'rkey', mod = 'scatter') => {
		if(mod === 'radar') return charts.taxoradaroptions(dom, dat, tit, pla);
		let series = [];
		
		let places = dat.map(o => o[pla]).unique();
		let categories = dat.map(o => c(o.category)).unique();
		let colors = dat.map(o => o.color).unique();

		categories.forEach((category, ind) => {
			let temp = dat.filter(o => c(o.category) === category);
			let tcolor = colors[ind];
			let tdata = [];
			let tcount = temp.countBy(pla);
			places.forEach(place => {
				let tvl = tcount[place];
				if(tvl) {
					tdata.push([
						c(place),
						tvl.count
					]);
				}
				tvl = undefined;
			});
			let taverage = tdata.map(o => o[1]).reduce((p, c) => p + c, 0) / tdata.map(o => o[1]).length;
			series.push({
				name: category,
				type: 'line',
				data: tdata,
				itemStyle: {
					normal: {
						color: tcolor,
					}
				},
				markArea: {
					silent: true,
					itemStyle: {
						normal: {
							color: 'transparent',
							borderWidth: 1,
							borderType: 'dashed'
						}
					},
					data: [
						[{
							name: `${c`coverage-area`}: ${category}`,
							xAxis: 'min',
							yAxis: 'min'
						}, {
							xAxis: 'max',
							yAxis: 'max'
						}]
					]
				},
				markPoint: {
					data: [
						{type: 'max'},
						{type: 'min'}
					]
				},
				markLine: {
					lineStyle: {
						normal: {
							type: 'solid'
						}
					},
					data: [
						{type: 'average'},
						{xAxis: taverage}
					]
				}
			});
			temp = tcolor = tdata = tcount = taverage = undefined;
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			grid: {
				left: '3%',
				right: '7%',
				bottom: '3%',
				containLabel: true
			},
			tooltip: {
				showDelay: 0,
				formatter: function (params) {
					if (params.value.length > 1) {
						return `${params.seriesName}:<br/>${params.value[0]} / ${params.value[1]}`;
					} else {
						return `${params.seriesName}:<br/>${params.value}`;
					}
				},
				axisPointer: {
					show: true,
					type: 'cross',
					lineStyle: {
						type: 'dashed',
						width: 1
					}
				}
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			brush: {},
			legend: {
				data: categories,
				left: 'left'
			},
			xAxis: [
				{
					type: 'category',
					scale: true, 
					axisLabel: {
						formatter: function (value) {
							return value;
						}
					},
					splitLine: {
						show: false
					}
				}
			],
			yAxis: [
				{
					type: 'log',
					scale: true,
					min: 0,
					axisLabel: {
						formatter: '{value}'
					},
					splitLine: {
						show: false
					}
				}
			],
			series: series
		};
		series = places = categories = colors = undefined;
		return options;
	},
	taxoradaroptions: (dom, dat, tit, key = 'rkey') => {
		let indicators = [];
		let categories = {};
		
		let keys = dat.map(o => o[key]).unique();
		let cats = dat.map(o => c(o.category)).unique();
		let colors = dat.map(o => o.color).unique();

		cats.forEach((cat, ix) => { 
			categories[c(cat)] = {
				name: c(cat), 
				lineStyle: {color: colors[ix]},
				value: []
			}; 
		});
		keys.forEach(k => {
			let temp = dat.filter(o => o[key] === k);
			indicators.push({
				name: c(k), 
			});
			let tcount = temp.map(m => Object.assign({}, m, {category: c(m.category)})).countBy('category');
			Object.keys(cats).forEach(t => {
				let ccat = cats[t];
				categories[ccat].value.push(typeof tcount[ccat] !== 'undefined' ? tcount[ccat].count : 0);
				ccat = undefined;
			});
			temp = tcount = undefined;
		});
		
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			tooltip: {},
			radar: {
				shape: 'circle',
				name: {
					textStyle: {
						color: '#000',
					}
				},
				indicator: indicators
			},
			series: [{
				name: tit,
				type: 'radar',
				data: Object.keys(categories).map(o => categories[o])
			}]
		};
		indicators = categories = keys = cats = colors = undefined;
		return options;
	},
	tablechartoptions: (res, series, legend, title, dom) => {
		let options = {
			tooltip: {
				showDelay: 0,
				formatter: function (params) {
					let unit = byId('acc-chartfacet') ? ' ' + c(byId('acc-chartfacet').value) : '';
					return `${params[0].seriesName}:<br/>${params[0].name}${unit} = ${Number(params[0].value).toLocaleString(l)}`;
				},
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					crossStyle: {
						color: '#999'
					}
				}
			},
			title: {
				left: 'center',
				text: title,
			},
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: true, 
				save: true, 
				table: true, 
				full: true,
				dom: dom
			}),
			xAxis: {
				data: res.map(r => r[2]),
				type: 'category',
				splitLine: {
					lineStyle: {
						type: 'dashed'
					}
				},
			},
			yAxis: {
				type: 'log',
				splitLine: {
					lineStyle: {
						type: 'dashed'
					}
				},
			},
			dataZoom: [{
				type: 'inside',
				start: 0,
				end: 100
			}, {
				start: 0,
				end: 100,
				handleSize: '100%',
				handleStyle: {
					color: '#fff',
					shadowBlur: 3,
					shadowColor: 'rgba(0, 0, 0, 0.6)',
					shadowOffsetX: 2,
					shadowOffsetY: 2
				}
			}],
			grid: {
				containLabel: true
			},
			series: series,
		};
		if(d.chartselectedlegend) {
			options.legend = {
				data: legend,
				orient: 'vertical',
				top: 'top',
				left: 'left'
			};
		}
		if(d.chartgaussiansort) {
			let cline = options.xAxis.data[Math.round(options.xAxis.data.length / 2)];
			options.series.forEach(s => {
				if(s.markLine) {
					s.markLine.data.push({
						symbol: 'none',
						name: c`center`,
						xAxis: cline,
						itemStyle: {
							color: 'blue',
							type: 'dotted'
						}
					});
				}
			});
		}		
		return options;
	},
	paretooptions: (paretodata, dom) => {
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					crossStyle: {
						color: '#999'
					}
				}
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: true, 
				save: true, 
				table: true, 
				full: true,
				dom: dom
			}),
			legend: {
				data: [c`histogram`.uf(), c`percent`.uf()]
			},
			xAxis: [
				{
					type: 'category',
					data: paretodata.map(o => o.chartlabel),
					axisPointer: {
						type: 'shadow'
					}
				}
			],
			yAxis: [
				{
					type: 'value',
					name: c`frequencies`.uf(),
					axisLabel: {
						formatter: '{value}'
					}
				},
				{
					type: 'value',
					name: c`cummulative`.uf(),
					min: 0,
					max: 100,
					interval: 10,
					axisLabel: {
						formatter: '{value}%'
					}
				}
			],
			series: [
				{
					name: c`histogram`.uf(),
					type: 'bar',
					data: paretodata.map(o => o.chartbar)
				},
				{
					name: c`percent`.uf(),
					type: 'line',
					yAxisIndex: 1,
					data: paretodata.map(o => o.chartline)
				}
			]
		};
		return options;
	},
	relevanceoptions: (json, ctotal, title, subtitle, dom) => {
		let tdata = [...Array(11).keys()]
			.map(o => ({
				name: o, 
				cmax: 0, 
				cmin: 0, 
				value: 0
			}));
		let bins = json.groupBy(['bin']);
		tdata.forEach(o => {
			let elm = bins[o.name];
			if(elm) {
				o.cmax = arraymax(elm.map(b => b.count));
				o.cmin = arraymin(elm.map(b => b.count));
				o.value = elm.length;
				o.name = `${c`from`} ${o.cmin} ${c`to`} ${o.cmax}`;
			} else {
				o.name = `${c`n-a`}`;
			}
			elm = undefined;
		});
		let lim = tdata.find(o => o.value > 0);
		if(lim) {
			tdata[0].name = `< ${lim.cmin}`;
			tdata[0].cmax = lim.cmin - 1;
			tdata[0].cmin = 1;
			tdata[0].ccount = ctotal - d.schemarelevance.map(o => o.count).sum();
		} else {
			tdata[0].name = `${c`from`} ${tdata[0].cmin} ${c`to`} ${tdata[0].cmax}`;
			tdata[0].cmax = 1;
			tdata[0].cmin = 1;
			tdata[0].ccount = ctotal;
		}
		tdata = tdata.filter(o => o.name !== c`n-a`);
		
		bins = lim = undefined;
	
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title || c`relevance`.uf(),
				subtext: subtitle || c`slide-for-data-zoom`.uf(),
			},
			tooltip: {
				trigger: 'item',
				formatter: '{a}<br/>{b}: {c} ({d}%)',
			},
			legend: {
				x: 'center',
				y: 'bottom',
				data: tdata.map(o => o.name),
			},
			calculable: true,
			series: [{
					name: c`funnel`,
					type: 'funnel',
					center: ['25%', '50%'],
					width: '40%',
					min: 0,
					max: 100,
					minSize: '0%',
					maxSize: '100%',
					sort: 'descending',
					gap: 2,
					label: {
						show: true,
						position: 'inside'
					},
					labelLine: {
						length: 10,
						lineStyle: {
							width: 1,
							type: 'solid'
						}
					},
					itemStyle: {
						borderColor: '#fff',
						borderWidth: 1
					},
					emphasis: {
						label: {
							fontSize: 20
						}
					},
					data: tdata
				},
				{
					name: c`nightingale-rose`,
					type: 'pie',
					radius: [30, 110],
					center: ['75%', '50%'],
					roseType: 'radius',
					data: tdata
				}
			]
		};
		return options;
	},
	scatterrelevanceoptions: (json, title, subtitle, dom) => {
		let getsymbols = () => {
			/*
			let col = d[cid + 'cols'] ? 
				d[cid + 'cols'][d[cid + 'cols'].length - 1] : 
				d[cid + 'route'][d[cid + 'route'].length - 1].rkey;
			*/
			let ring = new Circular(d.chartsymbols);
			let set = new Set(k.qualifiers);
			let out = [];
			let candidates = Object.values(dbm.metadata(false))
				.filter(o => set.has(o.rkey))
				.map(o => o.value)
				.unique();
			candidates.forEach(o => {
				out.push({name: o, symbol: ring.next()});
			});
			if(out.length) {
				return out;
			} else {
				return d.chartsymbols[0];
			}
		};
		let symbols = getsymbols();
		let getsymbol = qua => {
			if(Array.isArray(symbols)) {
				let sym = symbols.find(o => o.name === qua);
				if(sym) {
					return sym.symbol;
				} else {
					return d.chartsymbols[0];
				}
			} else {
				return symbols;
			}
		};
		
		let data = {
			axis: {
				xAxis: c `bin`,
				yAxis: c `count`
			},
			json: [].concat(
				[{
					name: c `average`,
					rate: json.map(o => o.bin).avg(),
					ratio: json.map(o => o.count).avg(),
					value: json.map(o => o.zscore).avg(),
					symbol: d.chartsymbols[0]
				}],
				json.map(item => ({
					name: item.value, /* `${item.firstvalue} > ${item.qualifier}`, */
					rate: item.bin,
					ratio: item.count,
					value: item.zscore,
					symbol: getsymbol(item.qualifier),
				}))
			)
		};
		let minRate = 0;
		let maxRate = 0;
		let minRatio = 0;
		let maxRatio = 0;
		data.json.forEach((jsonitem, index) => {
			if (index > 0) {
				if (parseFloat(jsonitem.rate) < minRate) {
					minRate = jsonitem.rate;
				} else if (parseFloat(jsonitem.rate) > maxRate) {
					maxRate = jsonitem.rate;
				}
		
				if (parseFloat(jsonitem.ratio) < minRatio) {
					minRatio = jsonitem.ratio;
				} else if (parseFloat(jsonitem.ratio) > maxRatio) {
					maxRatio = jsonitem.ratio;
				}
			} else {
				minRate = maxRate = jsonitem.rate;
				minRatio = maxRatio = jsonitem.ratio;
			}
		});
		
		//let minValue = Math.min(minRate, minRatio);
		//let maxValue = Math.max(maxRate, maxRatio);
		let xValue = 0,
			yValue = 0;
		data.json.forEach(item => {
			if (item.name === c `average`) {
				xValue = item.rate;
				yValue = item.ratio;
			}
		});
		
		let seriesData = [];
		data.json.map(item => {
			seriesData.push({
				name: item.name,
				value: [Math.abs(item.rate), Math.abs(item.ratio), Math.abs(item.value)],
				symbolSize: item.value * 30,
				symbol: item.symbol,
			});
		});
		
		let logreg = ecStat.regression('logarithmic', json.map(o => [o.bin, o.count]));
		let polreg = ecStat.regression('polynomial', json.map(o => [o.bin, o.count]), 3);
		polreg.points.sort((a, b) => a[0] - b[0]);
				
		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			title: {
				text: title || c`relevance`.uf(),
				subtext: subtitle || c`four-quarters-map`,
			},
			grid: {
				left: '3%',
				right: '20%',
				bottom: '3%',
				width: '82%',
				containLabel: true
			},
			tooltip: {
				trigger: 'axis',
				showDelay: 0,
				formatter: function(params) {
					let str = '';
					params.filter(o => !isBlank(o.name)).forEach(param => {
						str += [
							`<p class="no-vertical-margin">`,
							`<strong>${param.name}</strong>. `,
							`${param.value[1].toLocaleString(l)}`,
							`</p>`
						].join('');
					});
					return str;
				},
				axisPointer: {
					show: true,
					type: 'cross',
					lineStyle: {
						type: 'dashed',
						width: 1
					}
				},
			},
			xAxis: [{
				name: data.axis.xAxis,
				type: 'value',
				zlevel: 3,
				scale: true,
				axisLabel: {
					formatter: '{value}'
				},
				splitLine: {
					show: false
				},
				axisTick: {
					show: false
				},
				axisLine: {
					show: false,
					symbol: ['none', 'none']
				},
			}],
			yAxis: [{
				name: data.axis.yAxis,
				nameLocation: 'middle',
				nameRotate: 90,
				type: 'value',
				scale: true,
				zlevel: 3,
				axisLabel: {
					formatter: '{value}',
					show: true,
				},
				splitLine: {
					show: false
				},
				axisTick: {
					show: false
				},
				axisLine: {
					show: false,
					symbol: ['none', 'none']
				},
			}],
			series: [{
				name: c`data`,
				type: 'scatter',
				data: seriesData,
				zlevel: 2,
				label: {
					normal: {
						show: true,
						formatter: function(param) {
							return param.value[0] > 5 ? param.name : '';
						},
						position: 'top',
						color: '#000',
						fontSize: 18
					}
				},

				labelLine: {
					length: 10,
					lineStyle: {
						width: 1,
						type: 'solid',
					}
				},
				emphasis: {
					label: {
						fontSize: 20
					}
				},

				itemStyle: {
					normal: {
						color: function(param) {
							if (param.name === c `average`) {
								return 'red';
							} else {
								return d.chartsymbolcolors[d.chartsymbols.indexOf(param.data.symbol)];
							}
						},
						borderColor: '#fff',
						borderWidth: 1
					}
				},
				markArea: {
					zlevel: 0,
					silent: true,
					data: [
						[{
								name: c`unusual`,
								itemStyle: {
									color: '#ffeee5'
								},
								label: {
									show: true,
									position: ['30%', '50%'],
									fontStyle: 'normal',
									color: '#f50',
									fontSize: 17
								},
								coord: [xValue, yValue]
							},
							{
								coord: [Number.MAX_VALUE, 0]
							}
						],
						[{
								name: c`irrelevant`,
								itemStyle: {
									color: '#fce3e3'
								},
								label: {
									show: true,
									position: ['10%', '50%'],
									fontStyle: 'normal',
									color: '#c00',
									fontSize: 17
								},
								xAxis: 0,
								yAxis: 0
							},
							{
								xAxis: xValue,
								yAxis: yValue
							}
						],
						[{
								name: c`meaningful`,
								itemStyle: {
									color: '#e3f9e3'
								},
								label: {
									show: true,
									position: ['30%', '10%'],
									fontStyle: 'bold',
									color: '#00b300',
									fontSize: 17
								},
								xAxis: xValue,
								yAxis: yValue
							},
							{
								xAxis: Number.MAX_VALUE,
								yAxis: Number.MAX_VALUE
							}
						],
						[{
								name: c`relevant`,
								itemStyle: {
									color: '#f2e6fe'
								},
								label: {
									show: true,
									position: ['10%', '10%'],
									fontStyle: 'normal',
									color: '#7f19e6',
									fontSize: 17
								},
								xAxis: 0,
								yAxis: Number.MAX_VALUE
							},
							{
								xAxis: xValue,
								yAxis: yValue
							}
						]
					]
				},
			}, {
				name: c`logarithmic-regression`,
				type: 'line',
				lineStyle: {
					normal: {
						color: '#009800',
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10,
						width: 1,
						type: 'dotted'
					}
				},
				smooth: true,
				showSymbol: false,
				data: logreg.points,
				markPoint: {
					itemStyle: {
						normal: {
							color: 'transparent',
						}
					},
					label: {
						normal: {
							show: true,
							position: 'left',
							formatter: () => c`logarithmic-regression`,
							textStyle: {
								color: '#007900',
								fontSize: 10
							}
						}
					},
					data: [
						{
							coord: logreg.points[logreg.points.length - 1]
						}
					]
				}
			}, {
				name: c`polynomial-regression`,
				type: 'line',
				lineStyle: {
					normal: {
						color: '#08c',
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10,
						width: 1,
						type: 'dotted'
					}
				},
				smooth: true,
				showSymbol: false,
				data: polreg.points,
				markPoint: {
					itemStyle: {
						normal: {
							color: 'transparent'
						}
					},
					label: {
						normal: {
							show: true,
							position: 'left',
							formatter: () => c`polynomial-regression`,
							textStyle: {
								color: '#0074ad',
								fontSize: 10
							}
						}
					},
					data: [
						{
							coord: polreg.points[polreg.points.length - 1]
						}
					]
				}
			}]
		};		
		return options;
	},
	gaussianoptions: (gaussiandata, q1, q3, highlimit, median, dom) => {
		let olines = [];
		let alines = [
			{name: c`median`, yaxis: median, color: 'orange', type: 'solid'},
			{name: c`q1`, yaxis: q1, color: 'red', type: 'dotted'},
			{name: c`q3`, yaxis: q3, color: 'green', type: 'dotted'},
			{name: c`highlimit`, yaxis: highlimit, color: 'purple', type: 'dashed'},
		];
		alines.forEach(o => olines.push({
			symbol: 'none',
			name: o.name,
			yAxis: o.yaxis,
			xAxis: 'max',
			itemStyle: {
				color: o.color,
				type: o.type
			}
		}));
		
		let gdata = gaussiandata.map(o => {
			let clone = Object.assign({}, o);
			delete clone.count;
			return [Object.values(clone).join(' ').shorten(50), o.count];
		});

		let options = {
			textStyle: {
				fontFamily: 'Dosis'
			},
			xAxis: {
				data: gdata.map(o => o[0]),
				axisLabel: {
					formatter: function(val) { return val; }
				}
			},
			yAxis: {
				type: 'log',
				axisLabel: {
					formatter: function(val) { return Number(val).toLocaleString(l); }
				}
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					crossStyle: {
						color: '#999'
					}
				}
			},
			toolbox: chartshelper.toolbox({
				orient: 'vertical', 
				mtype: false, 
				save: true, 
				table: false, 
				full: true,
				dom: dom
			}),
			series: [{
				symbol: 'none',
				data: gdata.map(o => o[1]), 
				type: 'line',
				areaStyle: {},
				color: '#ccc',
				smooth: true,
				markLine: {
					data: olines
				},
				markPoint: {
					data: [
						{
							type: 'max', 
							name: c`max`,
							itemStyle: {
								color: 'red'
							}
						},
						{
							type: 'min', 
							name: c`min`,
							itemStyle: {
								color: 'navy'
							}
						},
					],
				},
			}]
		};
		let cline = options.xAxis.data[Math.round(options.xAxis.data.length / 2)];
		options.series.forEach(s => {
			s.markLine.data.push({
				symbol: 'none',
				name: c`center`,
				xAxis: cline,
				itemStyle: {
					color: 'blue',
					type: 'dotted'
				}
			});
		});
		olines = alines = gdata = cline = undefined;
		return options;
	},
	showplot: (cid, gaussian = true, isoption = false, stext = '') => {
		let features = {
			title: `${c`plot`.uf()}. ${gaussian ? c`gaussian`.uf() : c`sorted`.uf()}`,
			content: '',
			cancel: true,
			canceltitle: c`close`.uf(),
			extended: true,
		};
		gscreen.alert = gscreen.displayalert(features);

		let filterbytext = (o, txt) => {
			if(isBlank(txt)) return true;
			return Object.values(o).map(v => dbe._operation('li', v, txt)).filter(v => v).length > 0;
		};
		let out = [];
		let res = d[`${cid}results`];
		let dat = dbs.stats(res.filter(o => filterbytext(o, stext)).map(o => o.count));
		let otl = res.filter(o => dat.outliers.includes(o.count)).length;
		let prc = Math.round((otl / res.length) * 100);
		out.push(`
			<p class="no-margin-bottom">
			${c`meaningfuls`.uf()}: 
			${dat.outliers.length.toLocaleString(l)}, 
			${otl.toLocaleString(l)}/${dat.size.toLocaleString(l)} ${plural(dat.size, c`row`, c`rows`)} 
			(${prc}%).
			</p>
			<p class="no-margin-bottom">
			<span class="empty-square" style="background-color: orange;"></span>
			${c`median`.uf()} 
			<span class="empty-square" style="background-color: red;"></span>
			${c`q1`.uf()} 
			<span class="empty-square" style="background-color: green;"></span>
			${c`q3`.uf()}
			<span class="empty-square" style="background-color: purple;"></span>
			${c`highlimit`.uf()}. 
			${c`scale`.uf()}: 0%
			<small>${toolkit.colormicrolegend(window.settings.scalecolorbase)}</small> 100%
			</p>
			<div id="${cid}-plot" style="width: 100%; height: 300px;"></div>
		`);
		toolkit.msg('alert-content', out.join(''));
		
		let pchart = echarts.init(byId(isoption ? cid : cid + '-plot'), d.chartselectedtheme);
		let rfields = Object.keys(res[0]);
		pchart.setOption(
			charts.gaussianoptions(
				gaussian ? 
					res.filter(o => filterbytext(o, stext)).gaussiansort('count') : 
					res.filter(o => filterbytext(o, stext)).sortBy(rfields), 
				dat.q1,
				dat.q3,
				dat.highlimit,
				dat.median,
				isoption ? cid : cid + '-plot'
			)
		);
		features = filterbytext = pchart = out = res = dat = otl = prc = undefined;
	},
	sizechart: (cid, ishome = true) => {
		if(!cid) return;
		let overlayactive = gscreen.siteoverlayisset;
		if(!overlayactive) gscreen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.sizechart(ishome).then(res => {
				let prefix = ishome ? 'home-' : 'data-';
				let dmessage = ishome ? (
					!d.appelements.map(m => m.name).includes(Object.keys(res)[0]) ? 
						'data-server-system-status' : 'app-server-system-status'
					) : 'database-system-status';
				let dunit = ishome ? (
					!d.appelements.map(m => m.name).includes(Object.keys(res)[0]) ? 
						c`items` : c`bytes`
					) : c`items`;
				let dicon = ishome ? (
					!d.appelements.map(m => m.name).includes(Object.keys(res)[0]) ? 
						'<img src="./assets/img/svg/download-cloud.svg" style="height:1rem" />' : 
						'<img src="./assets/img/svg/server.svg" style="height:1rem" />'
					) : '<img src="./assets/img/svg/database.svg"" style="height:1rem" />';
				let tmp = [];
				
				tmp.push(`<p class="no-margin-bottom" id="${prefix}system-status">`);
				tmp.push(`${dicon} `);
				tmp.push(`${c(dmessage).uf()}. ${c`weighted-scale`.uf()}. `);
				tmp.push(`<span class="font-weight-semibold pull-right" id="${prefix}sizes-mouseover"></span>`);
				tmp.push(`</p>`);

				tmp.push(`<svg width="100%" height="65px" viewBox="0 0 ${byId(cid).offsetWidth} 65">`);
				tmp.push(`<g class="bars">`);
				tmp.push(`<rect class="bg" fill="#ccc" width="100%" height="25"></rect>`);
				let position = 0;
				Object.keys(res).sort(toolkit.sortlocale).forEach(o => {
					tmp.push([
						`<rect class="data" `,
						`width="${res[o].size}%" `,
						`x="${position}%" `,
						`fill="${res[o].color}" `,
						`height="25" `,
						`data-tooltip="${c(res[o].name).uf()}: `,
						`${res[o].count.toLocaleString(l)} ${dunit}" `,
						`onmouseover="toolkit.msg('${prefix}sizes-mouseover', this.dataset.tooltip);" `,
						`onmouseout="toolkit.msg('${prefix}sizes-mouseover', '');"`,
						`>`,
						`</rect>`,
						`<text `,
						`data-tooltip="${c(res[o].name).uf()}: `,
						`${res[o].count.toLocaleString(l)} ${c`items`}" `,						
						`x="${position + 0.5}%" y="17" fill="#ffffff">`,
						`${res[o].shortname.toUpperCase()}`,
						`</text>`,
					].join(''));
					position += res[o].size;
				});
				tmp.push(`</g>`);
				
				tmp.push([
					`<g class="markers">`,
					`<rect fill="#777" x="0%" y="25" width="2px" fill-opacity="0.7" height="10"></rect>`,
					`<rect fill="#777" x="25%" y="25" width="2px" fill-opacity="0.7" height="10"></rect>`,
					`<rect fill="#777" x="50%" y="25" width="2px" fill-opacity="0.7" height="10"></rect>`,
					`<rect fill="#777" x="75%" y="25" width="2px" fill-opacity="0.7" height="10"></rect>`,
					`<rect text-anchor="" fill="#777" `,
					`x="${byId(cid).offsetWidth - 2}" y="25" width="2px" fill-opacity="0.7" height="10"></rect>`,
					`</g>`,
					`<g text-anchor="middle">`,
					`<text text-anchor="start" fill="#777" x="0" y="50">0%</text>`,
					`<text fill="#777" x="25%" y="50">25%</text>`,
					`<text fill="#777" x="50%" y="50">50%</text>`,
					`<text fill="#777" x="75%" y="50">75%</text>`,
					`<text text-anchor="end" fill="#777" x="100%" y="50">100%</text>`,
					`</g>`,
				].join(''));
				
				tmp.push(`</svg>`);
				
				toolkit.msg(cid, tmp.join(''));

				if(!overlayactive) gscreen.siteoverlay(false);
				
				prefix = dmessage = dicon = dunit = res = tmp = overlayactive = undefined;
			});
		});
	},	
};

const chartshelper = {
	fullscreen: dom => {
		let elm = byId(dom);
		let ech = echarts.getInstanceByDom(elm);
		if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			chartshelper.changechartstyle(elm);
			sleep(1000).then(() => {				
				ech.resize({width: 'auto', height: 'auto', silent: false});
				elm = ech = undefined;
			});
		} else {
			if (elm.requestFullscreen) {
				elm.requestFullscreen();
			} else if (elm.webkitRequestFullscreen) {
				elm.webkitRequestFullscreen();
			} else if (elm.mozRequestFullScreen) {
				elm.mozRequestFullScreen();
			}
			ech.showLoading({text: c`working`});
			chartshelper.changechartstyle(elm);
			sleep(1000).then(() => {
				ech.resize({width: 'auto', height: 'auto', silent: false});
				ech.hideLoading();
				elm = ech = undefined;
			});
		}
	},
	changechartstyle: elm => {
		if(elm.classList.contains('single-charts')) {
			elm.classList.remove('single-charts');
			elm.classList.add('chart-fullscreen');
			elm.classList.add('void-single');
		} else if(elm.classList.contains('page-charts')) {
			elm.classList.remove('page-charts');
			elm.classList.add('chart-fullscreen');
			elm.classList.add('void-page');
		} else {
			elm.classList.remove('chart-fullscreen');
			if(elm.classList.contains('void-page')) {
				elm.classList.add('page-charts');
			} else {
				elm.classList.add('single-charts');
			}
		}
	},
	makedatatable: opt => {
		let cid = 'tbl-' + toolkit.randomstring();
		let facet = c(byId('acc-chartfacet').value);
		let headerrow = [
			`<th class="highlight">#</th>`,
			`<th class="highlight">${c`serie`}</th>`,
			`<th class="highlight">${c`facet`}</th>`,
			`<th class="highlight">${c`name`}</th>`,
			`<th class="highlight">${c`count`}</th>`,
		];
		let formatter = (o, s, n) => [
			n + 1, 
			s, 
			facet, 
			o.name, 
			o.value,
		];
		let out = [].concat(
			...opt.series
				.filter(o => !o.name.includes(c`linear-regression`))
				.map((o, i) => o.data.map(r => formatter(r, o.name, i)))
		);		
		return [
			`<p class="text-align-right">`,
			`<a class="button button-info" `,
			`href="javascript:file.exporttabletocsv('${cid}');">`,
			c`export`.uf(),
			`&hellip;`,
			`</a>`,	
			`</p>`,
			`<div class="table-responsive">`,
			`<table id="${cid}">`,
			`<thead><tr>${headerrow.join('')}</tr></thead>`,
			`<tbody>`,
			out.map(o => `<tr><td>${o.join('</td><td>')}</td></tr>`).join('\n'),
			`</tbody>`,
			`</table>`,
			`</div>`,
		].join('');
	},
	preparetreedata: () => {
		let blacklist = [c`count`];
		let keys = Object.keys(d.cooccurrencesresults[0]).filter(o => !blacklist.includes(o));
		let source = keys[0]; 
		let target = keys[1]; 
		
		let tree = d.cooccurrencesresults.map(o => ({source: o[source], target: o[target], value: o.count})).groupBy(['source']);
		let data = [];
		Object.keys(tree).forEach(o => {
			let tmp = tree[o];
			let val = tmp.map(t => t.value).sum();
			data.push({
				name: o,
				value: val,
				children: tmp.map(t => ({name: t.target, value: t.value}))
			});
			tmp = val = undefined;
		});
		blacklist = keys = source = target = tree = undefined;
		return data;
	},
	// Regression types: 'linear', 'exponential', 'linear', 'polynomial'
	regression: (data = [], type = 'linear') => !data.length ? 
		null : 
		ecStat.regression(type, data.map((o, i) => [i, o])),
	chartthemeselector: (caller = 'stats-charts') => {
		let url = `./assets/views/${l}/chartthemeselector.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let pholder = '#f#';
			let replace = caller === 'stats-charts' ? 'chart' : 'relations';
			txt = txt.replace(new RegExp(pholder, 'g'), replace);
			let features = {
				progress: false,
				title: c`chart-theme-selector`.uf(),
				content: txt,
				action: false,
				cancel: true,
				canceltitle: c`close`.uf()
			};
			gscreen.alert = gscreen.displayalert(features);
			pholder = replace = features = url = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`chart-theme-selector` + ': ' + err); 
		});
	},
	toolbox: (features = {
		orient: 'vertical', 
		mtype: false, 
		save: false, 
		table: false, 
		full: true,
		dom: null,
	}) => ({
		orient: features.orient,
		feature: {
			myTheme: {
				show: true,
				title: c`theme`,
				icon: `path://${icons.charts.theme()}`,
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
				onclick: function() { chartshelper.chartthemeselector(features.dom); }
			},
			magicType: {
				show: features.mtype, 
				title: {
					line: c`line`, 
					bar: c`bar`,
				},
				icon: {
					line: `path://${icons.charts.linecharticon()}`,
					bar: `path://${icons.charts.barcharticon()}`,
				},
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
				type: ['line', 'bar'],
			},
			saveAsImage: {
				show: features.save,
				title: c`saveasimage`, 
				icon: `path://${icons.charts.downloadicon()}`,
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
				pixelRatio: 2,
			},
			/*
			dataZoom: {
				visible: false,
				lang: [c`data-view`.uf(), c`turn-off`.uf(), c`refresh`.uf()],
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
			},
			*/
			dataView: {
				show: features.table,
				title: c`data-view`,
				readOnly: true,
				lang: [c`data-view`.uf(), c`turn-off`.uf(), c`refresh`.uf()],
				buttonColor: '#ccc',
				buttonTextColor: '#777',
				optionToContent: function(opt) { 
					return chartshelper.makedatatable(opt); 
				},
				icon: `path://${icons.charts.tableicon()}`,
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
			},
			myFullScreen: {
				show: features.full && features.dom,
				title: c`full-screen`,
				icon: `path://${icons.charts.fullscreenicon()}`,
				iconStyle: {
					color: d.chartselectedtheme === 'dark' ? '#fff' : '#000',
					borderWidth: 0,
				},
				onclick: function() { chartshelper.fullscreen(features.dom); },
			}
		}
	}),
};
