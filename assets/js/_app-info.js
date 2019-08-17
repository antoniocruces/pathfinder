'use strict';

/* global ajax, AppError, byId, c, charts, chartshelper, cfetch, d, dbe, dbq, echarts, fetchtextasync, gscreen, ic, k, l, sleep, toolkit, ui */
/* exported info */

// info operations
const info = {
	app: () => {
		gscreen.siteoverlay(true);
		toolkit.timer('info.app');
		toolkit.statustext(true);
		sleep(50).then(() => {
			toolkit.runinsequence(
				[
					ajax.networkinfo(window.servers.appserver),
					ajax.networkinfo(window.servers.dataserver, true),
					toolkit.performanceinfo(),
					fetchtextasync(`./assets/data/dirsize.php`)
				]		
			)
			.then(res => {
				let appinfo = 
					[
						window.version.appname, 
						[window.version.version, window.version.subversion, window.version.release].join('.'),
						window.version.date.toLocaleDateString(l, {year: 'numeric'}),
						window.version.license,
						window.version.author,
						window.version.organization,
						window.version.suborganization,
						window.version.workgroup,
						window.version.country,
					];
				let perf = res[2];
				let perfinfo = [];
				let brinfo = toolkit.browserinfo();				
				if(perf) {
					perfinfo.push('<h4>' + c`performance`.uf() + '</h4>');
					perfinfo.push('<ul>');
					perfinfo.push(`<li>${c`browser`.uf()}: ${brinfo.sName} v${brinfo.sVersion}</li>`);
					Object.keys(perf).forEach(o => {
						if(o === 'loadtype') {
							perfinfo.push('<li>' + c(o).uf() + ': ' + [c`useraction`, c`reload`, c`historymove`][perf[o]] + '</li>');
						} else {
							perfinfo.push('<li>' + c(o).uf() + ': ' + perf[o] + (o !== 'redirectcount' ? c`ms` : '') + '</li>');
						}
					});
					perfinfo.push('</ul>');
				}
				if(res[0] && res[1]) {
					let atim = Math.round(res[0].tim);
					let dtim = Math.round(res[0].tim + res[1].tim);
					let asta = res[0].sta === 200 ? 
						`<span class="color-success">${c`ready`}</span>` : 
						`<span class="color-error">${c`error`}</span>`;
					let dsta = res[1].sta === 200 ? 
						`<span class="color-success">${c`ready`}</span>` : 
						`<span class="color-error">${c`error`}</span>`;
					perfinfo.push('<h4>' + c`network-status`.uf() + '</h4>');
					perfinfo.push('<ul>');
					perfinfo.push('<li>' + c`app-server`.uf() + ': ' + atim + c`ms` + ', ' + asta + '</li>');
					perfinfo.push('<li>' + c`data-server`.uf() + ': ' + dtim + c`ms` + ', ' + dsta + '</li>');
					perfinfo.push('</ul>');
					atim = dtim = asta = dsta = undefined;
				}
				gscreen.siteoverlay(false);
				toolkit.timer('info.app');
				toolkit.statustext();

				let types = d.appelements.map(o => o.name);
				let sizes = res[3].split(',').map(o => Number(o));
				let appsize = [
					`<h4>${c`code-status`.uf()}</h4>`,
					`<p>`,
					types.map((o, i) => [
							`<a class="button button-square button-xxs margin-right-xs color-white" `,
							`style="background:${d.appelements.find(f => f.name === o).color}">`,
							`${d.appelements.find(f => f.name === o).shortname.toUpperCase()}`,
							`</a>`,
							`${c(o).uf()}: `,
							`${toolkit.humansize(sizes[i])}`,
						].join(''),
					).join('<br>\n'),
					`</p>`
				].join('\n');
				types = sizes = undefined;
				let txt =  '<div class="force-two-columns">' + 
					'<p>' + appinfo.join('; ') + '</p>' + 
					'<p class="margin-top">' + window.version.DOIbadge + 
					'&nbsp;' + 
					window.version.GitHubbadge + 
					'</p>' + 
					perfinfo.join('') + 
					'<p>' + appsize + '</p></div>';
				let features = {
					progress: false,
					title: c`app-info`.uf(),
					content: txt,
					action: false,
					cancel: true,
					canceltitle: c`close`.uf()
				};
				gscreen.alert = gscreen.displayalert(features);
				features = txt = undefined;
				appinfo = perf = perfinfo = brinfo = appsize = undefined;
			})
			.catch(err => {
				gscreen.siteoverlay(false);
				toolkit.timer('info.app');
				toolkit.statustext();
				throw new AppError(c`app-info` + ': ' + err);
			});
		});
	},
	filter: () => {
		if(dbe.verifytables()) {
			ui.filterstats()
			.then(res => { 
				let features = {
					progress: false,
					title: c`filter-info`.uf(),
					content: res,
					action: [
						`<a class="button button-primary margin-right-s" `,
						`href="javascript:ui.filterscreen()">${c`advanced`.uf()}</a>`,
						`<a class="button button-error margin-right-s" `,
						`href="javascript:ui.clearfilter(false)">${c`clear`.uf()}</a>`,
					].join(''),
					cancel: true,
					canceltitle: c`close`.uf()
				};
				gscreen.alert = gscreen.displayalert(features);
				features = undefined;
			})
			.catch(err => { toolkit.msg('filter-info-stats', err); });
		} else {
			let url = 'assets/views/' + l.toLowerCase() + '/nodata.html';
			cfetch(url).then(txt => txt.text()).then(txt => { 
				let features = {
					progress: false,
					title: c`info`.uf(),
					content: txt,
					action: false,
					cancel: true,
					canceltitle: c`close`.uf()
				};
				gscreen.alert = gscreen.displayalert(features);
				features = undefined;
				url = undefined;
			})
			.catch(err => { 
				url = undefined;
				throw new AppError(c`database-info` + ': ' + err); 
			});
		}
	},
	export: () => {
		gscreen.siteoverlay(true);
		let url = `./assets/views/${l}/export.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				title: c`export`.uf(),
				content: txt,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			gscreen.siteoverlay(false);
			url = features = undefined;
		})
		.catch(err => { 
			gscreen.siteoverlay(false);
			url = undefined;
			throw new AppError(c`export` + ': ' + err); 
		});
	},
	settings: (element, value) => {
		window.settings[element] = value;		
		if(document.querySelectorAll('[data-' + element + ']').length > 0) {
			document.querySelectorAll('[data-' + element + ']').forEach(elm => {
				if(elm.dataset[element] === value.toString()) {
					if(!elm.classList.contains('legend-link')) {
						elm.classList.add('single-value-highlight');	
					} else {
						elm.classList.add('scale-value-highlight');
					}
				} else {
					if(!elm.classList.contains('legend-link')) {
						elm.classList.remove('single-value-highlight');
					} else {
						elm.classList.remove('scale-value-highlight');
					}
				}
			});
		}
		try {
			localStorage.removeItem(window.version.appname);
			localStorage.setItem(window.version.appname, JSON.stringify(window.settings));
		} catch(e) {
			throw new AppError([c`local-storage-error`, ': ', e].join(''));	
		}
	},
	settingsreset: () => {
		if(localStorage) {
			localStorage.clear();
		}
		window.settings = {
			errorcatching: 1,
			debugconsole: 0,
			verboseerror: 0,
			reloadwarning: 0,
			listrowsperpage: 10,
			listpagelinks: 9,
			matchrelated: 1,
			statstopvalues: 10,
			timeout: 5000,
			minentropy: 3,
			graphnodemax: 10000,
			graphedgemax: 50000,
			scalecolorbase: 0,
			zscoreassstars: 0,
			querylengthlimit: 30000,
			themecolor: '#000000',
			themebackgroundcolor: '#ffffff',
			themefontfamily: 'Ubuntu Mono',
			themefontsize: '1.8rem',
		};
		try {
			localStorage.setItem(window.version.appname, JSON.stringify(window.settings));
			if(localStorage.pfdata) window.storeddata = true;
		} catch(error) {
			throw new AppError([c`local-storage-error`, ': ', error].join(''));	
		}
	},
	database: () => {
		if(dbe.verifytables()) {
			gscreen.siteoverlay(true);
			toolkit.timer('info.database');
			toolkit.statustext(true);
			sleep(50).then(() => {
				toolkit.runinsequence([dbq.dbinfo(), dbq.filterinfo()])
				.then(res => {
					if(res[1]) {
						let url = 'assets/views/' + l.toLowerCase() + '/dbinfo.html';
						let rec = [];
						Object.keys(res[1]).sort((a, b) => a.localeCompare(b)).forEach(o => {
							rec.push(
								`<span class="empty-square background-${dbe.getbcolorfromslug(ic(o))}"></span>
								${o}: <span class="margin-right-s">${res[1][o].count.toLocaleString(l)}
								</span>`
							);
						});

						let out = [];
						
						out.push(`<h4 class="margin-top-s margin-bottom-s">${c`file`.uf()}</h4>`);
						out.push(`<p>${dbe.datafileinfo()}</p>`);
						out.push(`<p>${dbe.tablesinfo()}</p>`);
						
						out.push(`<h4 class="margin-bottom-s">${c`records`.uf()}</h4>`);
						out.push(`<p>${rec.join(' ')}</p>`);

						out.push([
							`<h4 class="margin-bottom-s">`,
							`${c`metadata`.uf()}`,
							`<button class="button button-info button-icon button-text pull-right" `,
							`onclick="info.dbinfochart()"`,
							`><span>${c`chart`.uf()}</span>`,
							`<svg width="18" height="18" viewBox="0 0 24 24" class="svgicon" `,
							`style="fill: rgb(0, 136, 204);">`,
							`<path class="piechart" d=""></path></svg>`,
							`</button>`,
							`</h4>`
						].join(''));

						out.push(`<div class="table-responsive" style="margin-bottom:1em!important">`);
						out.push(`<table>`);
						out.push(`<thead>`);
						out.push(`<tr>`);
						out.push(`<th>${c`record-type`}</th>`);
						out.push(`<th>${c`metadata`}</th>`);
						out.push(`<th class="text-align-right">${c`count`}</th>`);
						out.push(`<th class="text-align-right">${c`percentage`}</th>`);
						out.push(`</tr>`);
						out.push(`</thead>`);
						out.push(`<tbody>`);
						Object.keys(res[0]).sort((a, b) => a.localeCompare(b)).forEach(o => {
							let rectype = ic(String(o)).substr(0, 1) === '_' ? ic(String(o)).substr(5, 3) : 'tax';
							let tot = rectype === 'tax' ? d.taxlength : d.metlength;
							out.push(`
								<tr>
								<td>
								<span class="empty-square background-${dbe.getbcolorfromtip(rectype)}"></span>
								${c(rectype)}</span>
								</td>
								<td>
								${o}
								</td>
								<td class="text-align-right">
								${res[0][o].count.toLocaleString(l)}
								</td>
								<td class="text-align-right">
								${((res[0][o].count / tot) * 100).toLocaleString(l).padStart(12, ' ')}%
								</td>
								</tr>
							`);
							rectype = tot = undefined;
						});
						out.push(`</tbody>`);
						out.push(`</table>`);
						out.push(`</div>`);

						let features = {
							progress: false,
							title: c`database-info`.uf(),
							content: out.join(''),
							action: false,
							cancel: true,
							canceltitle: c`close`.uf()
						};
						gscreen.modal = gscreen.displaymodal(features);

						gscreen.siteoverlay(false);
						toolkit.timer('info.database');
						toolkit.statustext();

						features = undefined;
						out = url = rec = res = undefined;
					} else {
						gscreen.siteoverlay(false);
						toolkit.timer('info.database');
						toolkit.statustext();
						res = undefined;
						throw new AppError(c`database-info` + ': ' + c`no-data`);
					}
				})
				.catch(err => {
					gscreen.siteoverlay(false);
					toolkit.timer('info.database');
					toolkit.statustext();
					throw new AppError(c`database-info` + ': ' + err);
				});
			});
		}
	},
	route: () => {
		let url = `./assets/views/${l}/routeinfo.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				title: [
					`${c`route`.uf()}: `,
					`${d.cooccurrencessource.split('|').map(o => c(o)).join(' &#8651; ')} `,
					`&#8649; `,
					`${d.cooccurrencestarget.split('|').map(o => c(o)).join(' &#8651; ')}`
				].join(''),
				content: txt,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			
			dbq.sizechart(true).then(res => {
				let route = d.cooccurrencesroute.map(o => d.chains.find(f => f.link === o.rkey));
				let nodes = [];
				let edges = [];

				Object.values(res).forEach(o => nodes.push(
					{
						name: c(o.name),
						value: o.count,
						symbolSize: o.size * 3,
						draggable: true,
						tooltip: {
							formatter: `${c`items`}: {c}`,
						},
						itemStyle: {
							normal: {
								color: o.color
							}
						}
					}
				));

				route.forEach(o => edges.push({
					source: c(o.tin),
					value: c(o.link),
					target: c(o.tout),
				}));
				
				let pchart = echarts.init(byId('route-chart'));		
				pchart.showLoading({text: c`working`});
				let options = {
					textStyle: {
						fontFamily: 'Dosis'
					},
					itemStyle: {
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10
					},
					tooltip: {},
					animation: false,
					toolbox: chartshelper.toolbox({
						orient: 'vertical', 
						mtype: false, 
						save: true, 
						table: false, 
						full: true,
						dom: 'route-chart'
					}),
					series: [{
						type: 'graph',
						ribbonType: true,
						layout: 'circular',
						roam: true,
						focusNodeAdjacency: true,
						legendHoverLink: true,
						edgeSymbol: ['circle', 'arrow'],
						edgeSymbolSize: [2, 15],
						edgeLabel: {
							show: false,
							normal: {
								show: true,
								position: 'middle',
								textStyle: {
									fontSize: 12
								},
								formatter: '{c}'
							}
						},
						itemStyle: {
							shadowColor: 'rgba(0, 0, 0, 0.5)',
							shadowBlur: 10
						},
						data: nodes,
						links: edges,
						label: {
							normal: {
								position: 'inside',
								show: true,
								textStyle: {
									fontSize: 12
								},
							}
						},
						lineStyle: {
							normal: {
								opacity: 0.9,
								width: 2,
								curveness: 0.2,
								color: '#000',
							}
						}
					}]
				};
	
				pchart.setOption(options);
				pchart.hideLoading();
				
				route = nodes = edges = url = features = pchart = options = undefined;
			})
			.catch(err => { 
				url = undefined;
				throw new AppError(c`route` + ': ' + err); 
			});
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`route` + ': ' + err); 
		});
	},
	dbinfochart: () => {
		let url = `./assets/views/${l}/dbinfo.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				title: [
					`${c`database-info`.uf()}`,
				].join(''),
				content: txt,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			
			dbq.dbinfo(true).then(res => {
				let met = [];
				let tax = [];
				Object.keys(res).sort((a, b) => a.localeCompare(b)).forEach(o => {
					let rectype = ic(String(o)).substr(0, 1) === '_' ? ic(String(o)).substr(5, 3) : 'tax';
					if(rectype === 'tax') {
						tax.push({
							name: o,
							value: res[o].count,
						});
					} else {
						met.push({
							name: o,
							value: res[o].count,
						});
					}
				});

				let pchart = echarts.init(byId('dbinfo-chart'));		
				pchart.showLoading({text: c`working`});
				let options = {
					textStyle: {
						fontFamily: 'Dosis'
					},
					itemStyle: {
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10
					},
					tooltip: {
						trigger: 'item',
						formatter: '{a} <br/>{b}:({d}%)'
					},
					toolbox: chartshelper.toolbox({
						orient: 'vertical', 
						mtype: false, 
						save: true, 
						table: false, 
						full: true,
						dom: 'route-chart'
					}),
					series: [{
						name: c`taxonomies`,
						type: 'pie',
						selectMode: 'single',
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
						data: tax,
					}, {
						name: c`metadata`,
						type: 'pie',
						radius: ['62%', '70%'],
						label: {
							normal: {
								position: 'outer'
							}
						},
						data: met,
					}]
				};
	
				pchart.setOption(options);
				pchart.hideLoading();
				
				met = tax = url = features = pchart = options = undefined;
			})
			.catch(err => { 
				url = undefined;
				throw new AppError(c`dbinfo-chart` + ': ' + err); 
			});
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`dbinfo-chart` + ': ' + err); 
		});
	},
	filtermatches: () => {
		let url = `./assets/views/${l}/filtermatches.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				title: [
					`${c`filter-matches`.uf()}`,
				].join(''),
				content: txt,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			
			dbq.filterinfo().then(res => {
				let types = res;
				let acount = Object.values(res).map(o => o.count).scalebetween(20, 100);
				let aids = Object.values(res).map(o => o.isd).scalebetween(30, 120);
				let apos = Object.keys(res).map((o, i) => ({name: o, id: i}));
				
				let links = {};
				let nodes = [];
				let edges = [];
				let heati = [];
				let heato = [];
				let heatc = [];	
											
				Object.keys(d.filtermatches).forEach(o => {
					links[c(o)] = links[c(o)] || {};
					Object.keys(d.filtermatches[o]).forEach(k => {
						links[c(o)][c(k)] = links[c(o)][c(k)] || {};
						Object.keys(d.filtermatches[o][k]).forEach(z => {
							links[c(o)][c(k)][c(z)] = links[c(o)][c(k)][c(z)] || d.filtermatches[o][k][z];
						});
					});
				});

				Object.keys(links).forEach(o => heatc.push(o));
				for(let i = 0, len = heatc.length; i < len; i++) {
					for(let j = 0, lenj = heatc.length; j < lenj; j++) {
						heati.push([heatc[i], heatc[j], 0]);
						heato.push([heatc[i], heatc[j], 0]);
					}
				}
				Object.keys(links).forEach(o => {
					let val = links[o];
					if(val) {
						let vin = val[c`<`];
						let vout = val[c`>`];
						if(vin) {
							Object.keys(vin).sort().forEach(vo => {
								heati.find(f => f[0] === o && f[1] === vo)[2] = vin[vo];
							});
						}
						if(vout) {
							Object.keys(vout).sort().forEach(vo => {
								heato.find(f => f[0] === o && f[1] === vo)[2] = vout[vo];
							});
						}
					}
				});
				
				Object.keys(links).forEach(o => {
					nodes.push(
						{
							name: o,
							value: aids[apos.find(f => f.name === o).id],
							symbolSize: acount[apos.find(f => f.name === o).id],
							draggable: true,
							tooltip: {
								formatter: `${c`items`}: {c}`,
							},
							itemStyle: {
								normal: {
									color: dbe.getcolorfromslug(ic(o))
								}
							}
						}
					);
					Object.keys(links[o]).forEach(k => {
						Object.keys(links[o][k]).forEach(z => {
							edges.push({
								source: o,
								value: links[o][k][z],
								target: z,
							});
						});
					});
				});

				// Graph
				let pchart = echarts.init(byId('filtermatches-chart'));		
				pchart.showLoading({text: c`working`});
				let options = {
					textStyle: {
						fontFamily: 'Dosis'
					},
					itemStyle: {
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10
					},
					tooltip: {},
					animation: false,
					toolbox: chartshelper.toolbox({
						orient: 'vertical', 
						mtype: false, 
						save: true, 
						table: false, 
						full: false,
						dom: 'filtermatches-chart'
					}),
					series: [{
						type: 'graph',
						ribbonType: true,
						layout: 'circular',
						roam: true,
						focusNodeAdjacency: true,
						legendHoverLink: true,
						edgeSymbol: ['circle', 'arrow'],
						edgeSymbolSize: [2, 15],
						edgeLabel: {
							show: false,
							normal: {
								show: true,
								position: 'middle',
								textStyle: {
									fontSize: 12
								},
								formatter: '{c}'
							}
						},
						itemStyle: {
							shadowColor: 'rgba(0, 0, 0, 0.5)',
							shadowBlur: 10
						},
						data: nodes,
						links: edges,
						label: {
							normal: {
								position: 'inside',
								show: true,
								textStyle: {
									fontSize: 12
								},
							}
						},
						lineStyle: {
							normal: {
								opacity: 0.9,
								width: 2,
								curveness: 0.2,
								color: '#000',
							}
						}
					}]
				};
				
				pchart.setOption(options);
				pchart.hideLoading();

				// Heatmap
				pchart = echarts.init(byId('filtermatches-heatmap'));		
				pchart.showLoading({text: c`working`});
				options = {
					textStyle: {
						fontFamily: 'Dosis'
					},
					itemStyle: {
						shadowColor: 'rgba(0, 0, 0, 0.5)',
						shadowBlur: 10
					},
					tooltip: {
						position: 'top'
					},
					animation: false,
					grid: {
						height: '50%',
						y: '10%'
					},
					xAxis: {
						type: 'category',
						data: heatc,
						splitArea: {
							show: true
						}
					},
					yAxis: {
						type: 'category',
						data: heatc,
						splitArea: {
							show: true
						}
					},
					visualMap: {
						min: 0,
						max: 10,
						calculable: true,
						orient: 'horizontal',
						left: 'center',
						bottom: '15%'
					},
					toolbox: chartshelper.toolbox({
						orient: 'vertical', 
						mtype: false, 
						save: true, 
						table: false, 
						full: true,
						dom: 'filtermatches-heatmap'
					}),
					series: [{
						name: c`<`,
						type: 'heatmap',
						data: heati.map(item => [item[1], item[0], item[2] || '-']),
						label: {
							normal: {
								show: true
							}
						},
						itemStyle: {
							emphasis: {
								shadowBlur: 10,
								shadowColor: 'rgba(0, 0, 0, 0.5)'
							}
						}
					}, {
						name: c`>`,
						type: 'heatmap',
						data: heato.map(item => [item[1], item[0], item[2] || '-']),
						label: {
							normal: {
								show: true
							}
						},
						itemStyle: {
							emphasis: {
								shadowBlur: 10,
								shadowColor: 'rgba(0, 0, 0, 0.5)'
							}
						}
					}],
					legend: {},
				};

				pchart.setOption(options);
				pchart.hideLoading();
				
				types = acount = aids = apos = undefined;
				links = nodes = edges = heati = heato = heatc = undefined;
				pchart = options = undefined;
			})			
			.catch(err => {
				url = undefined;
				throw new AppError(c`filter-matches` + ': ' + err); 
			});
			url = features = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`filter-matches` + ': ' + err); 
		});
	},

	help: (doc, title = undefined) => {
		let url = `./assets/views/${l}/${doc}help.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				title: title || c`help`.uf(),
				content: txt,
				cancel: true,
				canceltitle: c`close`.uf(),
				extended: true,
			};
			gscreen.alert = gscreen.displayalert(features);
			if(document.getElementsByClassName('shtablinks').length) {
				let source = document.getElementsByClassName('shtablinks')[0];
				let sourceid = source.id || null;
				if(sourceid) {
					let targetid = sourceid.replace('stab', 'step');
					toolkit.generictab(sourceid, targetid, 'shtabcontent', 'shtablinks');
					targetid = undefined;
				}
				source = sourceid = undefined;		
			}
			if(doc === 'app') {
				let maketree = arg => `<ul>
					${arg.map(elem => (elem.sub ? 
						`<li>
							${elem.lnk ? `<a href="javascript:toolkit.goto('${elem.lnk}');">` : ''}
							${elem['n' + l]}${elem.lnk ? `</a>` : ''}. <small class="desc">${elem['d' + l]}</small>${maketree(elem.sub)}
						</li>` : 
						`<li>
							${elem.lnk ? `<a href="javascript:toolkit.goto('${elem.lnk}');">` : ''}
							${elem['n' + l]}${elem.lnk ? `</a>` : ''}. <small class="desc">${elem['d' + l]}</small>
						</li>`)
					).join('')}
					</ul>
				`;
				document.getElementById('mh-tree').innerHTML = maketree(k.menus);
				maketree = undefined;
			}
			url = features = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`help` + ': ' + err); 
		});
	},
	filterstats: () => {
		let features = {
			title: c`filter-info`.uf(),
			content: `<div class="single-charts" id="filter-info-chart"></div>`,
		};
		let data = dbq.filteraccounting();
		let options = charts.doughnutoptions(
			data.records, 
			data.filtered, 
			c`records`, 
			c`filtered`, 
			'filter-info-chart'
		);
		gscreen.alert = gscreen.displayalert(features);
		let pchart = echarts.init(byId('filter-info-chart'));		
		pchart.showLoading({text: c`working`});
		pchart.setOption(options);
		pchart.hideLoading();
		features = data = options = undefined;
	},
	filterdescription: () => {
		let features = {
			title: c`filter`.uf(),
			content: ui.describefilter(),
		};
		gscreen.alert = gscreen.displayalert(features);
		features = undefined;
	},
	loader: () => {
		let url = `./assets/views/${l}/libraries.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				progress: false,
				title: c`libraries-info`.uf(),
				content: txt,
				action: false,
				cancel: true,
				canceltitle: c`close`.uf()
			};
			gscreen.alert = gscreen.displayalert(features);
			features = undefined;
			let xcolor = o => (o.iserror ? 'color-error' : o.isloaded ? 'color-success' : 'color-error');
			let isok = o => xcolor(o) !== 'color-error';
			window.resources.filter(o => o.id).forEach(o => {
				if(document.getElementById('infolib-' + o.slug)) {
					if(o.filetype === 'js') {
						toolkit.msg(
							'infolib-' + o.slug, 
							isok(o) ? c`loaded` : (c`unloaded` + ' ' + o.errormsg).trim()
						);
						document.getElementById('infolib-' + o.slug).classList.add(xcolor(o));
					}
				}
			});
			document.body.style.cursor = 'auto';
			isok = xcolor = url = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`libraries-info` + ': ' + err); 
		});
	},
	browserwarning: () => {
		let url = `./assets/views/${l}/warning.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let browser = toolkit.browserinfo();
			let features = {
				progress: false,
				title: c`warning`.uf(),
				content: txt,
				action: false,
				cancel: true,
				canceltitle: c`close`.uf()
			};
			gscreen.alert = gscreen.displayalert(features);
			features = undefined;
			toolkit.msg('warning-navname', browser.sName);
			toolkit.msg('warning-navver', browser.sVersion);
			browser = url = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`warning` + ': ' + err); 
		});
	},
	changetheme: () => {
		let url = `./assets/views/${l}/changetheme.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				progress: false,
				title: c`change-theme`.uf(),
				content: txt,
				action: false,
				cancel: true,
				canceltitle: c`close`.uf()
			};
			gscreen.alert = gscreen.displayalert(features);

			byId('theme-color').value = window.settings.themecolor;
			byId('theme-bgcolor').value = window.settings.themebackgroundcolor;
			features = url = undefined;
		})
		.catch(err => { 
			url = undefined;
			throw new AppError(c`warning` + ': ' + err); 
		});
	},
};
