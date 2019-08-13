'use strict';

/* global AppError, c, d3, dbe, dbq, L, sleep, toolkit */

/* exported maps */

// maps
const mapengine = {
	drawmap: (cid = 'base') => {
		// BE CAREFUL: Modified leaflet-src.js, v1.3.1, line 5780.
		// ORIGINAL: var first = e.touches ? e.touches[0] : e;
		// MODIFIED: var first = e.touches.length ? e.touches[0] : e;
		// "e.touches" is ever an array, so original value is ever true, too
		
		if (!window.L || !L.GeoJSON) throw new AppError(c`invalid-map-library`);
		if(!cid) throw new AppError('mapengine.drawmap: no cid');
		
		maphelpers.lfcontrols();
		
		toolkit.cleardomelement(`#${cid}-map`);
		
		L.Icon.Default.imagePath = './assets/js/vendor/leaflet/images/';
		
		d.map[cid] = L.map(`${cid}-map`, {
			zoom: window.settings.maphomezoom,
			maxZoom: 19,
			preferCanvas: true,
			disable3D: true,
			printable: true,
			downloadable: true,
			rendered: L.canvas(),
			zoomControl: false,
		});
		
		let zoomfs = new L.Control.ZoomFS({domid: cid}); 
		d.map[cid].addControl(zoomfs);
		zoomfs = undefined;

		L.control.zoomBox({
			zoomHomeTitle: c`home`,
			homeCoordinates: [window.settings.maphomelat, window.settings.maphomelon],
			homeZoom: window.settings.maphomezoom,
			domid: cid,
		}).addTo(d.map[cid]);

		d.map[cid].addControl(L.control.search({domid: cid}));
		
		L.control.scale({imperial: false}).addTo(d.map[cid]);
		
		d.map[cid].addControl(L.control.mapdownload({
			domid: cid,
			maptitle: toolkit.appversion().join(' ')
		}));
		
		L.control.watermark({position: 'bottomright'}).addTo(d.map[cid]);

		mapops.namedlayers(cid);
   			
		d.map[cid].setView(
			[
				window.settings.maphomelat, 
				window.settings.maphomelon
			], 
			window.settings.maphomezoom
		);
		
		//dragend, zoomend 
		d.map[cid].addEventListener('moveend', function(ev) {
			let query = L.Util.getParamString({
				lat: d.map[cid].getCenter().lat.toFixed(6),
				lon: d.map[cid].getCenter().lng.toFixed(6),
				osm_type: 'N',
				format: 'json',
				zoom: 18,
				limit: 1,
				'accept-language': l,
				addressdetails: 1,
			});
			fetchtextasync(d.reversegeocodesrc + query).then(res => {
				res = JSON.parse(res);
				let displayname = res.display_name || `${c`no-address-available`}`;
				let coordinates = [
					toolkit.ddtodms(d.map[cid].getCenter().lat, false),
					', ',
					toolkit.ddtodms(d.map[cid].getCenter().lng, true)
				].join('');
				toolkit.msg(
					`${cid}-map-currentmapbase`,
					Object.keys(d.maplayers[cid].base).find(o => d.maplayers[cid].base[o].visible)
				);
				toolkit.msg(
					`${cid}-map-currentcoords`,
					coordinates
				);
				toolkit.msg(
					`${cid}-map-currentaddress`,
					displayname
				);
				query = displayname = coordinates = undefined;
			}).catch(err => {
				let coordinates = [
					toolkit.ddtodms(d.map[cid].getCenter().lat, false),
					', ',
					toolkit.ddtodms(d.map[cid].getCenter().lng, true)
				].join('');
				toolkit.msg(
					`${cid}-map-currentmapbase`,
					Object.keys(d.maplayers[cid].base).find(o => d.maplayers[cid].base[o].visible)
				);
				toolkit.msg(
					`${cid}-map-currentcoords`,
					coordinates
				);
				toolkit.msg(
					`${cid}-map-currentaddress`,
					`${c`no-address-available`}`
				);
				query = coordinates = undefined;
			});
		});

		['infopanel', 'datepanel'].forEach(o => {
			d.maplayers[cid][o] = L.control();
			d.maplayers[cid][o].onAdd = function(map) {
				let dp = o === 'datepanel';
				this._div = L.DomUtil.create('div', o);
				if(dp) {
					this._div.classList.add('font-weight-bold');
					this._div.classList.add('color-grey-700');
					this._div.classList.add('max-width-xs');
					this._div.style.opacity = .8;
					this.update();
				} else {
					this._div.classList.add('box-shadow-xxl');
					this._div.classList.add('padding-s');
					this._div.classList.add('background-white');
					this._div.classList.add('color-grey');
					this._div.classList.add('max-width-xs');
					this._div.style.opacity = .8;
					this.update();
				}
				dp = undefined;
				return this._div;
			};
			d.maplayers[cid][o].update = function(e) {
				if (e === undefined) {
					this._div.innerHTML = '';
					this._div.classList.add('hide');
					return;
				}
				this._div.classList.remove('hide');
				this._div.innerHTML = e;
			};
			d.maplayers[cid][o].addTo(d.map[cid]);
			if(o === 'infopanel') {
				d.maplayers[cid][o]._div.onclick = () => d.maplayers[cid][o].update();
			} else {
				d.maplayers[cid][o].update([
					`<p class="font-size-xs no-margin-vertical text-align-right" id="${cid}-map-currentmapbase"></p>`,
					`<p class="font-size-xs no-margin-vertical text-align-right" id="${cid}-timerange-label"></p>`
				].join(''));
			}
		});

		d.mapoms[cid] = new OverlappingMarkerSpiderfier(d.map[cid]);
	},
	drawselectors: (cid = 'base') => {
		let dropbasemap = () => {
			let out = [];
			let lname = `${c`working`}&hellip;`; 
			d.mapproviders.sortBy(['name']).forEach(g => {
				out.push([
					`<tr class="no-padding">`,
					`<td data-mapname="${g.name}">`,
					`<a class="text-decoration-none" `, 
					`id="${cid}-map-base-${g.name}" `,
					`href="javascript:mapops.togglelayer('base', '${g.name}', '${cid}');">`,
					`${c(g.name).uf()}`,
					`</a>`,
					`</td>`,
					`</tr>`,
				].join(''));
			});
			return [
				`<div id="${cid}-map-basemaps" class="ddown" `,
				`data-tooltip="${c`cartography`}">`,
				`<button class="button button-square button-border button-s" `,
				`>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="map" d=""></path>`,
				`</svg>`,
				`</button>`,

				`<div id="${cid}-map-basemaps-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
				`<table class="no-border no-padding">`,
				`<thead>`,
				`<tr class="no-padding border-bottom">`,
				`<th class="background-light-200 font-weight-bold">`,
				`<a href="javascript:info.help('basemaps', '${c`base-maps`.uf()}')">`,
				`${d.mapproviders.length} ${c`base-maps`.uf()}`,
				`</a>`,
				`</th>`,
				`</tr>`,
				`</thead>`,
				`<tbody>`,
				`${out.join('\n')}`,
				`</tbody>`,
				`</table>`,
				`</div>`,
				`</div>`,
			].join('\n');
		};
		let out = [];
		out.push([
			`<style>`,
			`.leaflet-control-layers-toggle{`,
			`background-image:url(./assets/img/svg/layers.svg)}`,
			`.leaflet-button-homebutton{`,
			`background-image:url(./assets/img/svg/home.svg)}`,
			`.leaflet-control-scale{`,
			`margin-left:10px !important;margin-bottom:10px !important;}`,

			`.leaflet-button-zoombox{`,
			`background-image:url(./assets/img/svg/maximize.svg)}`,
			`.leaflet-button-fullscreen{`,
			`background-image:url(./assets/img/svg/maximize-2.svg)}`,
			`.leaflet-button-search{`,
			`background-image:url(./assets/img/svg/search.svg)}`,
			`.leaflet-button-print{`,
			`background-image:url(./assets/img/svg/printer.svg)}`,
			`.leaflet-button-download{`,
			`background-image:url(./assets/img/svg/save.svg)}`,
			`.leaflet-button-crosshair{`,
			`background-image:url(./assets/img/svg/crosshair.svg)}`,

			`.leaflet-ruler-clicked{border-color: red !important;}`,
			`.leaflet-grid-label{color:#aaa;font-size:xx-small}`,
			`.leaflet-control {cursor: pointer;}`,
			`.result-tooltip{background-color: white;font-size: smaller;}`,
			`.moving-tooltip{background-color: rgba(255, 255, 255, .5);`,
			`background-clip: padding-box;opacity: 0.5;font-size: smaller;}`,
			`.plus-length{padding-left: 45px;}`,
			`</style>`,
			`<div class="group group-xs margin-bottom-s">`,
			`<ul>`,
			`<li>`,
			`${dropbasemap()}`,
			`</li>`,

			`<li>`,
			`<div id="${cid}-map-overlays" `,
			`class="ddown">`,
			`<div data-tooltip="${c`layers`}">`,
			`<button class="button button-square button-border button-s">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="layers" d=""></path>`,
			`</svg>`,
			`</button>`,
			`</div>`,
			`<div id="${cid}-map-overlays-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
			`${mapops.drawlayersselector(cid)}`,
			`</div>`,
			`</div>`,
			`</li>`,
		].join(''));
		
		if(dbe.verifytables()) {
			out.push([
				`<li id="${cid}-map-legend-point" class="hide">`,
				`<span id="${cid}-map-legend-list"></span>`,
				`</li>`,
			].join('\n'));
			out.push([
				`<li${cid === 'base' ? '' : ' class="hide"'}>`,
				`<input type="${cid === 'base' ? 'search' : 'hidden'}" id="${cid}-mapdata-search" `,
				`data-txt="${d.mapsearch[cid].text || ''}" `, 
				`data-pid="${d.mapsearch[cid].id || ''}" `, 
				`placeholder="${c`search`}..." `,
				`value="${d.mapsearch[cid].text || ''}" `, 
				`class="input-s">`,
				`</li>`,
			].join('\n'));
			out.push([
				`<li>`,
				`<div id="${cid}-map-features" class="ddown" `,
				`data-tooltip="${c`include`}">`,
				`<button class="button button-square button-border button-s">`,
				`<svg `,
				`width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="checkcircle" d=""></path>`,
				`</svg>`,
				`</button>`,
				
				`<div id="${cid}-map-features-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,

				`<div class="field field-float-label">`,
				`<input type="text" `, 
				`id="${cid}-map-buffer" name="${cid}-map-buffer" `,
				`placeholder="${c`buffer`}" `,
				`value="${d.maptransformations[cid].buffer}" `,
				`onkeyup="javascript:maphelpers.settransformations('buffer', this.value, '${cid}');">`,
				`<label for="map-buffer">${c`buffer`}</label>`,

				`<p class="no-margin-bottom">`,
				`<label class="control switch">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-maintainqueries" name="${cid}-map-maintainqueries" `,
				`onclick="javascript:maphelpers.settransformations('maintainqueries', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].maintainqueries ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">${c`maintain-queries`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-related" name="${cid}-map-related" `,
				`onclick="javascript:maphelpers.settransformations('related', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].related ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">${c`related`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-neighbourhood" name="${cid}-map-neighbourhood" `,
				`onclick="javascript:maphelpers.settransformations('neighbourhood', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].neighbourhood ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">${c`neighbourhood`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-relatedhmap" name="${cid}-map-relatedhmap" `,
				`onclick="javascript:maphelpers.settransformations('relatedhmap', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].relatedhmap ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">${c`related-hmap`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-neighbourhoodhmap" name="${cid}-map-neighbourhoodhmap" `,
				`onclick="javascript:maphelpers.settransformations('neighbourhoodhmap', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].neighbourhoodhmap ? ' checked' : ''}>`,
				`<span class="control-indicator"></span>`,
				`<span class="control-label">${c`neighbourhood-hmap`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-tin" name="${cid}-map-tin" `,
				`onclick="javascript:maphelpers.settransformations('tin', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].tin ? ' checked' : ''}`,
				`${parseInt(d.maptransformations[cid].buffer, 10) < 1 ? ' disabled' : ''}`,
				`>`,
				`<span id="${cid}-map-tin-ctr" class="control-indicator background-light-200"></span>`,
				`<span id="${cid}-map-tin-lbl" class="control-label color-light-400">${c`tin`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-convex" name="${cid}-map-convex" `,
				`onclick="javascript:maphelpers.settransformations('convex', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].convex ? ' checked' : ''}`,
				`${parseInt(d.maptransformations[cid].buffer, 10) < 1 ? ' disabled' : ''}`,
				`>`,
				`<span id="${cid}-map-convex-ctr" class="control-indicator background-light-200"></span>`,
				`<span id="${cid}-map-convex-lbl" class="control-label color-light-400">${c`convex`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-envelope" name="${cid}-map-envelope" `,
				`onclick="javascript:maphelpers.settransformations('envelope', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].envelope ? ' checked' : ''}`,
				`${parseInt(d.maptransformations[cid].buffer, 10) < 1 ? ' disabled' : ''}`,
				`>`,
				`<span id="${cid}-map-envelope-ctr" class="control-indicator background-light-200"></span>`,
				`<span id="${cid}-map-envelope-lbl" class="control-label color-light-400">${c`envelope`}</span>`,
				`</label>`,
				`</p>`,

				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="${cid}-map-voronoi" name="${cid}-map-voronoi" `,
				`onclick="javascript:maphelpers.settransformations('voronoi', this.checked, '${cid}');"`,
				`${d.maptransformations[cid].voronoi ? ' checked' : ''}`,
				`${parseInt(d.maptransformations[cid].buffer, 10) < 1 ? ' disabled' : ''}`,
				`>`,
				`<span id="${cid}-map-voronoi-ctr" class="control-indicator background-light-200"></span>`,
				`<span id="${cid}-map-voronoi-lbl" class="control-label color-light-400">${c`voronoi`}</span>`,
				`</label>`,
				`</p>`,

				`</div>`,
				`</div>`,
				
				`</li>`,

				`<li>`,
				`<div id="${cid}-map-queries" class="ddown hide" `,
				`data-tooltip="${c`queries`}"`,
				`>`,
				`<button class="button button-square button-border button-s" `,
				`onclick="javascript:${cid === 'single' ? 'maps.singlemap(' + d.mapsearch[cid].id + ');' : ''};"`,
				`>`,
				`<svg `,
				`width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="search" d=""></path>`,
				`</svg>`,
				`</button>`,
				
				`<div id="${cid}-map-queries-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
				`</div>`,
				`</div>`,
				`</li>`,

				`<li>`,
				`<div data-tooltip="${c`time-range`}">`,
				`<button class="button button-square button-border button-s rangevalues" `,
				`onclick="javascript:mapengine.showtimerangeselector('${cid}');">`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="calendar" d=""></path>`,
				`</svg>`,
				`</button>`,
				`</div>`,
				`</li>`,

				`<li>`,
				`<div data-tooltip="${c`time-lapse`}">`,
				`<button `,
				`id="${cid}-timerange-repeater" `,
				`class="button button-square button-border button-s" `,
				`aria-label="${c`time-lapse`}" `,
				`onclick="mapengine.timerangerepeater('${cid}')"`,
				`>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="repeat" d=""></path>`,
				`</svg>`,
				`</button>`,
				`</div>`,
				`</li>`,

				`<li>`,
				`<div data-tooltip="${c`time-slider`}">`,
				`<label class="control checkbox">`,
				`<input type="checkbox" `,
				`id="${cid}-timerange-slider-activate" `,
				`name="${cid}-timerange-slider-activate" `,
				`onclick="d.maptransformations['${cid}'].timerange.slideractive=this.checked;`,
				`mapengine.slidetimerange('${cid}',d.maptransformations['${cid}'].timerange.min)"`,
				d.maptransformations[cid].timerange.slideractive ? ` checked` : ``,
				`>`,
				`<span class="control-indicator"></span>`,
				`</label>`,
				`</li>`,

				`<li>`,
				`<input type="range" `,
				`disabled `,
				`id="${cid}-timerange-slider" `, 
				`min="${d.maptransformations[cid].timerange.totalmin}" `,
				`max="${d.maptransformations[cid].timerange.totalmax}" `,
				`value="${d.maptransformations[cid].timerange.totalmin}" `,
				`onchange="mapengine.slidetimerange('${cid}',this.value)" `,
				`/>`,
				`</li>`,

				`<li>`,
				`<span class="font-weight-semibold color-info" `,
				`id="${cid}-timerange-slider-label">`,
				d.maptransformations[cid].timerange.sliderpos,
				`</span>`,
				`</li>`,
			].join(''));
		}

		out.push([
			`</ul>`,
			`</div>`,
		].join(''));
		
		screen.siteoverlay(false);

		return out.join('\n');
	},
	slidetimerange: (cid = 'base', value) => {
		byId(`${cid}-timerange-slider`).disabled = !d.maptransformations[cid].timerange.slideractive;
		d.maptransformations[cid].timerange.sliderpos = parseInt(value, 10);
		d.maptransformations[cid].timerange.min = d.maptransformations[cid].timerange.sliderpos;
		d.maptransformations[cid].timerange.max = d.maptransformations[cid].timerange.sliderpos;
		mapengine.activatetimerangeselector(cid);
		//mapops.drawlayers(cid);
	},
	timerangerepeater: (cid = 'base') => {
		d.maptransformations[cid].timerange.repeateractive = !d.maptransformations[cid].timerange.repeateractive;
		if(!d.maptransformations[cid].timerange.repeateractive) {
			if(d.maptransformations[cid].timerange.repeater) {
				window.clearInterval(d.maptransformations[cid].timerange.repeater);
			}
			d.maptransformations[cid].timerange.repeater = null;
			byId(`${cid}-timerange-repeater`).classList.remove('spinner');
			byId(`${cid}-timerange-repeater`).title = '';
			mapengine.resettimerange(cid);
			return;
		}
		let tr = d.maptransformations[cid].timerange;
		tr.sliderpos = tr.totalmin;
		byId(`${cid}-timerange-repeater`).classList.add('spinner');
		byId(`${cid}-timerange-repeater`).title = `${c`working`}...`;
		tr.repeater = window.setInterval(() => {
			if(tr.sliderpos === tr.totalmax) {
				tr.sliderpos = tr.totalmin;
			}
			tr.sliderpos++;
			mapengine.slidetimerange(cid, tr.sliderpos);
		}, window.settings.mapanimation);
	},
	verifytimerangeselector: (cid = 'base') => {
		if(!byId(`${cid}-timerange-activate`)) return true;
		let isvalid = typ => isNumeric(byId(`${cid}-timerange-${typ}`).value) && 
			byId(`${cid}-timerange-${typ}`).value >= d.maptransformations[cid].timerange.totalmin && 
			byId(`${cid}-timerange-${typ}`).value <= d.maptransformations[cid].timerange.totalmax;
		if(isvalid('min') && isvalid('max')) {
			byId(`${cid}-timerange-activate`).classList.remove('disabled');
			isvalid = undefined;
			return true;
		} else {
			byId(`${cid}-timerange-activate`).classList.add('disabled');
			isvalid = undefined;
			return false;
		}
	},
	activatetimerangeselector: (cid = 'base', updateselectors = true) => {
		if(!dbe.verifytables()) return;

		let popupshown = () => byId(`${cid}-timerange-min`) && 
			byId(`${cid}-timerange-max`) && 
			byId(`${cid}-timerange-label`);
		if(mapengine.verifytimerangeselector(cid)) {
			if(popupshown()){
				byId(`${cid}-timerange-min`).min = d.maptransformations[cid].timerange.totalmin;
				byId(`${cid}-timerange-min`).max = d.maptransformations[cid].timerange.totalmax;
				byId(`${cid}-timerange-max`).min = d.maptransformations[cid].timerange.totalmin;
				byId(`${cid}-timerange-max`).max = d.maptransformations[cid].timerange.totalmax;
				if(updateselectors) {
					byId(`${cid}-timerange-min`).value = d.maptransformations[cid].timerange.min;
					byId(`${cid}-timerange-max`).value = d.maptransformations[cid].timerange.max;
				}
			}
			byId(`${cid}-timerange-label`).innerHTML = [
				`${d.maptransformations[cid].timerange.min}`,
				`${c`to`}`,
				`${d.maptransformations[cid].timerange.max}`,
			].join(' ');
			byId(`${cid}-timerange-slider`).min = d.maptransformations[cid].timerange.totalmin;
			byId(`${cid}-timerange-slider`).max = d.maptransformations[cid].timerange.totalmax;
			byId(`${cid}-timerange-slider`).value = d.maptransformations[cid].timerange.sliderpos;
			byId(`${cid}-timerange-slider-label`).innerHTML = d.maptransformations[cid].timerange.sliderpos;
		}
		//mapops.drawlayers(cid);
	},
	showtimerangeselector: (cid = 'base') => {
		let res = [
			`<div class="group group-m group-center">`,
			`<ul>`,

			`<li>`,
			`<span class="font-weight-semibold color-success" `,
			`id="${cid}-timerange-label-totalmin">`,
			d.maptransformations[cid].timerange.totalmin,
			`</span>`,
			`</li>`,

			`<li>`,
			`<svg width="24" height="24" viewBox="0 0 24 24" `,
			`class="svgicon">`,
			`<path class="arrowright" d=""></path>`,
			`</svg>`,
			`</li>`,

			`<li>`,
			`<input id="${cid}-timerange-min" `,
			`type="number" `,
			`min="${d.maptransformations[cid].timerange.totalmin}" `,
			`max="${d.maptransformations[cid].timerange.totalmax}" `,
			`step="1" pattern="[0-9]{4}" `,
			`placeholder="${c`yyyy`.toUpperCase()}" `,
			`value="${d.maptransformations[cid].timerange.min}" `,
			`onchange="/* d.maptransformations['${cid}'].timerange.min=this.value; */`,
			`mapengine.activatetimerangeselector('${cid}', false);`,
			`mapengine.verifytimerangeselector('${cid}');`,
			`" `,
			`onkeyup="mapengine.verifytimerangeselector('${cid}');" `,
			`onblur="/* d.maptransformations['${cid}'].timerange.min=this.value; */`,
			`mapengine.activatetimerangeselector('${cid}', false);" `,
			`required>`,
			`</li>`,
			
			`<li>`,
			`<input  id="${cid}-timerange-max" `,
			`type="number" `,
			`min="${d.maptransformations[cid].timerange.totalmin}" `,
			`max="${d.maptransformations[cid].timerange.totalmax}" `,
			`step="1" pattern="[0-9]{4}" `,
			`placeholder="${c`yyyy`.toUpperCase()}" `,
			`value="${d.maptransformations[cid].timerange.max}" `,
			`onchange="/* d.maptransformations['${cid}'].timerange.max=this.value; */`,
			`mapengine.activatetimerangeselector('${cid}', false);`,
			`mapengine.verifytimerangeselector('${cid}');`,
			`" `,
			`onkeyup="mapengine.verifytimerangeselector('${cid}');" `,
			`onblur="/* d.maptransformations['${cid}'].timerange.max=this.value; */`,
			`mapengine.activatetimerangeselector('${cid}', false);" `,
			`required>`,
			`</li>`,
			
			`<li>`,
			`<svg width="24" height="24" viewBox="0 0 24 24" `,
			`class="svgicon">`,
			`<path class="arrowleft" d=""></path>`,
			`</svg>`,
			`</li>`,

			`<li>`,
			`<span class="font-weight-semibold color-error" `,
			`id="${cid}-timerange-label-totalmax" class="pull-right">`,
			d.maptransformations[cid].timerange.totalmax,
			`</span>`,
			`</li>`,

			`</ul>`,
			`</div>`,
		].join('');
		let features = {
			progress: false,
			title: c`time-range`.uf(),
			content: res,
			action: [
				`<a id="${cid}-timerange-activate" `,
				`class="button button-primary margin-right-s disabled" `,
				`href="javascript:`,
				`d.maptransformations['${cid}'].timerange.max=byId('${cid}-timerange-max').value;`,
				`d.maptransformations['${cid}'].timerange.min=byId('${cid}-timerange-min').value;`,
				`mapops.drawlayers('${cid}');`,
				`if(screen.alert){screen.alert.remove();screen.alert=undefined;}`,
				`">${c`activate`.uf()}</a>`,
				
				`<a id="${cid}-timerange-activate" `,
				`class="button button-warning margin-right-s" `,
				`href="javascript:`,
				`mapengine.resettimerange('${cid}');`,
				`if(screen.alert){screen.alert.remove();screen.alert=undefined;}`,
				`">${c`reset`.uf()}</a>`,
			].join(''),
			cancel: true,
			canceltitle: c`close`.uf()
		}
		screen.alert = screen.displayalert(features);
		features = undefined;
		mapengine.activatetimerangeselector(cid);
	},
	resettimerange: (cid = 'base') => {
		d.maptransformations[cid].timerange.totalmin = arraymin(
			d.mapdata.features.filter(o => o.properties.year).map(o => o.properties.year)
		);
		d.maptransformations[cid].timerange.totalmax = arraymax(
			d.mapdata.features.filter(o => o.properties.year).map(o => o.properties.year)
		);

		d.maptransformations[cid].timerange.min = d.maptransformations[cid].timerange.totalmin;
		d.maptransformations[cid].timerange.max = d.maptransformations[cid].timerange.totalmax;
		d.maptransformations[cid].timerange.sliderpos = d.maptransformations[cid].timerange.totalmin;
		d.maptransformations[cid].timerange.slideractive = false;
		
		byId(`${cid}-timerange-slider-activate`).checked = false,

		byId(`${cid}-timerange-label`).innerHTML = [
			`${d.maptransformations[cid].timerange.min}`,
			`${c`to`}`,
			`${d.maptransformations[cid].timerange.max}`,
		].join(' ');
		
		byId(`${cid}-timerange-slider`).value = d.maptransformations[cid].timerange.min;
		mapops.drawlayers(cid);
	},
	drawlegend: (cid = 'single', keys) => {
		if(!keys) return;
		let out = [];
		out.push([
			`<div id="${cid}-map-legend" class="ddown">`,
			`<button class="button button-square button-border button-s" `,
			`aria-label="${c`legend`}" ` ,
			`onclick="javascript:mapops.fitbounds('${cid}');">`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="list" d=""></path>`,
			`</svg>`,
			`</button>`,
			`<div id="${cid}-map-legend-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
		].join('\n'));

		Object.keys(keys).forEach(o => {
			let obj = keys[o];
			out.push([
				`<p class="margin-bottom border-bottom border-color-light-300">${c(o).uf()}</p>`,
			].join('\n'));
			Object.keys(obj.keys).forEach(k => {
				let shortn = dbe.getnamefromslug(k);
				out.push([
					`<p class="no-margin-bottom">`,

					`<label class="control checkbox color-${dbe.getbcolorfromslug(k)}">`,
					`<input type="checkbox"`, 
					`id="${cid}-map-legend-${shortn}" `,
					`name="${cid}-map-legend-${shortn}" `,
					`onclick="javascript:maphelpers.settransformations('legend.${k}', this.checked, '${cid}');`,
					`mapops.drawlayers('${cid}');"`,
					`${d.maptransformations[cid].legend[k] ? ' checked' : ''}`,
					`>`,
					`<span id="${cid}-map-legend-${shortn}-ctr" `,
					`class="control-indicator"></span>`,
					`<span id="${cid}-map-legend-${shortn}-lbl" `,
					`class="control-label">`,
					`${c(k)}`,
					`: `,
					obj.keys[k].count.toLocaleString(l),
					`</span>`,
					`</label>`,

					`</p>`,
				].join(''));
				shortn = undefined;
			});
		});
		out.push([
			`<p class="no-margin-bottom form-message">`,
			`${c`heatmap-scale`.uf()}`,
			`</p>`,
			`<p class="no-margin-top margin-bottom" style="padding-left:5px;padding-right:5px;`,
			`background-color:red;height:23px;`,
			`background-image:linear-gradient(to right,`,
			`${window.settings.hmaplow},`,
			`${window.settings.hmapmedium},`,
			`${window.settings.hmaphigh});">`,
			`<span class="color-black">0%</span>`,
			`<span class="color-white pull-right">100%</span>`,
			`</p>`,
		].join('\n'));
		return out.join('');
	},
};
const maps = {	
	basemap: (cid = 'base') => {
		if (!window.L || !L.GeoJSON) throw new AppError(c`invalid-map-library`);
		toolkit.timer('maps.basemap');
		toolkit.statustext(true);
		screen.siteoverlay(true);
		sleep(50).then(() => {
			if(!d.maptransformations.base.maintainqueries) {
				d.mapsearch.base.text = null;
				d.mapsearch.base.id = null;
				d.maplayers.base.queries = {};
			}
			toolkit.msg(`${cid}-map-selectors`, mapengine.drawselectors('base'));
			
			toolkit.drawicons();

			mapengine.drawmap('base');
			
			toolkit.timer('maps.basemap');
			toolkit.statustext();
			screen.siteoverlay(false);
			
			maps.datamap(cid);

			return;
		});
	},
	singlemap: (nid, typ = '') => {
		if (!window.L || !L.GeoJSON) throw new AppError(c`invalid-map-library`);
		if(!nid || nid === undefined) throw new AppError(c`mandatory-field-empty`);
		toolkit.timer('maps.singlemap');
		toolkit.statustext(true);
		screen.siteoverlay(true);
		sleep(50).then(() => {
			dbq.singlemap(nid)
			.then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let mai = res.main.length ? dbe.makegeojson(res.main) : null;
				let rel = dbe.makegeojson(res.related);
				let nei = dbe.makegeojson(res.neighbourhood);
				let flo = dbe.makegeojson([...res.related, ...res.neighbourhood].filter(o => isvalidflowpoint(o)));
	
				let mic = mai.features.map(o => o.properties).countBy(['rkey']);
				let ric = rel.features.map(o => o.properties).countBy(['rkey']);
				let nic = nei.features.map(o => o.properties).countBy(['rkey']);
				let leg = {
					main: {type: 'cross', keys: mic},
					related: {type: 'circle', keys: ric},
					neighbourhood: {type: 'square', keys: nic},
				};

				d.mapsearch.single.id = nid;
				d.mapsearch.single.text = toolkit.titleformat(d.store.pos[d.mapsearch.single.id].value);
				
				let out = [];
				out.push([
					`<div class="no-print" id="single-map-selectors"></div>`,
					`<div id="single-map" class="full-width page-map" `,
					`style="width: 100%; height: 500px; border: 1px solid lightgray;">`,
					`<p class="color-error text-center margin-vertical-auto min-height-50vh">`,
					`${c`no-data`.uf()}`,
					`</p>`,
					`</div>`,
					`<p class="form-message">`,
					`<span id="single-map-currentcoords" class="color-primary"></span>`,
					`&nbsp;`,
					`<span id="single-map-currentaddress"></span>`,
					`</p>`,
				].join('\n'));
				
				toolkit.msg('c-stab-six', out.join(''));
				
				toolkit.msg(`single-map-selectors`, mapengine.drawselectors('single'));

				mapengine.drawmap('single');
				maps.datamap('single', nid);
				
				toolkit.msg(`single-map-legend-list`, mapengine.drawlegend('single', leg));
				byId(`single-map-legend-point`).classList.remove('hide');
				
				toolkit.timer('maps.singlemap');
				toolkit.statustext(false);
				screen.siteoverlay(false);
			})
			.catch(err => {
				toolkit.timer('maps.singlemap');
				toolkit.statustext(false);
				screen.siteoverlay(false);
				throw new AppError(c`maps` + ': ' + err);
			});
		});
	},
	datamap: (cid = 'base', nid = undefined, refined = undefined) => {
		if(!dbe.verifytables()) {
			mapops.drawlayers(cid);
			return;
		}
		toolkit.timer('maps.datamap');
		toolkit.statustext(true);
		screen.siteoverlay(true);
			
		sleep(50).then(() => {
			let searchrels = xid => {
				let set = new Set(dbe._filterids());
				return new Set(dbm.relations(false)
					.filter(o => o.ID === xid)
					.filter(o => set.has(o.RID))
					.map(o => o.RID)
				);
			};

			mapops.makemapdata(cid);

			if(!Object.keys(d.mapdata).length) {
				searchrels = undefined;
				toolkit.timer('maps.datamap');
				toolkit.statustext();
				screen.siteoverlay(false);
				mapops.drawlayers(cid);
				return;
			}
			if(!d.mapdata.hasOwnProperty('features')) {
				searchrels = undefined;
				toolkit.timer('maps.datamap');
				toolkit.statustext();
				screen.siteoverlay(false);
				mapops.drawlayers(cid);
				return;
			}
			if(!d.mapdata.features.length) {
				searchrels = undefined;
				toolkit.timer('maps.datamap');
				toolkit.statustext();
				screen.siteoverlay(false);
				mapops.drawlayers(cid);
				return;
			}
			
			mapengine.resettimerange(cid);

			byId(`${cid}-timerange-slider`).min = d.maptransformations[cid].timerange.min;
			byId(`${cid}-timerange-slider`).max = d.maptransformations[cid].timerange.max;
			byId(`${cid}-timerange-slider`).value = d.maptransformations[cid].timerange.sliderpos;
			byId(`${cid}-timerange-slider-label`).innerHTML = d.maptransformations[cid].timerange.sliderpos;

			if(nid !== undefined) {
				let item = d.mapdata.features
					.filter(o => mapops.filtermapdata(cid, o))
					.map(o => ({
						label: o.properties.title, 
						value: o.properties.id,
						latitude: o.properties.latitude,
						longitude: o.properties.longitude,
						radius: o.properties.radius,
						color: o.properties.color,
						shape: o.properties.shape,
						rkey: o.properties.rkey,
						size: o.properties.size,
						range: o.properties.range,
					}))
					.find(o => o.value === nid);
				screen.siteoverlay(true);
				mapops.findpoint(item, byId(`${cid}-mapdata-search`), 'single');
				screen.siteoverlay(false);
				mapops.drawlayers(cid);
				item === undefined;
			} else {
				let mic = d.mapdata.features.map(o => o.properties).countBy(['rkey']);
				let leg = {
					main: {type: 'circle-1', keys: mic},
				};
				toolkit.msg(
					`${cid}-map-legend-list`,
					mapengine.drawlegend(cid, leg),
				);
				byId(`${cid}-map-legend-point`).classList.remove('hide');

				autosearch({
					onSelect: (item, inputfield) => {
						screen.siteoverlay(true);
						mapops.findpoint(item, inputfield, 'base');
						screen.siteoverlay(false);
						mapops.drawlayers(cid);
					},
					input: byId(`${cid}-mapdata-search`),
					minLength: 3,
					className: 'background-white padding-xs',
					debounceWaitMs: 100,
					fetch: (text, callback) => {
						text = text.toLowerCase();
						let suggestions = d.mapdata.features
							.filter(o => mapops.filtermapdata(cid, o))
							.map(o => ({
								label: o.properties.title, 
								value: o.properties.id,
								latitude: o.properties.latitude,
								longitude: o.properties.longitude,
								radius: o.properties.range,
								color: o.properties.color,
								shape: o.properties.shape,
								rkey: o.properties.rkey,
								size: o.properties.size,
								range: o.properties.range,
							}))
							.filter(o => dbe._operation('li', o.label, text));
						callback(suggestions);
					},
					render: (item, value) => {
						let allowedChars = new RegExp(/^[a-zA-Z\s]+$/)
						let charsAllowed = value => allowedChars.test(value);
						let itemElement = document.createElement('div');
						if (charsAllowed(value)) {
							var regex = new RegExp(value, 'gi');
							var inner = item.label.replace(regex, match => `<strong>${match}</strong>`);
							itemElement.innerHTML = inner;
						} else {
							itemElement.textContent = item.label;
						}
						return itemElement;
					},
					emptyMsg: c`no-data`.uf(),
					customize: (input, inputRect, container, maxHeight) => {
						if (maxHeight < 100) {
							container.style.top = '';
							container.style.bottom = (window.innerHeight - inputRect.bottom + input.offsetHeight) + 'px';
							container.style.maxHeight = '140px';
						}
					}
				});

				mic = leg = undefined;
			}

			mapops.drawlayers(cid);

			toolkit.timer('maps.datamap');
			toolkit.statustext();
			screen.siteoverlay(false);
		});
	},	
};

const maphelpers = {
	lfcontrols: () => {
		/* 
		Leaflet Map Print plugin.
		Hand made && based in Leaflet export & print
		*/
		L.Control.MapPrint = L.Control.extend({
			options: {
				position: 'topleft',
				title: c`print`.uf(),
				domid: 'base',
				maptitle: toolkit.appversion().join(' '),
			},
		
			onAdd: function(map) {
				this._map = map;
				var container = byId(this.options.domid + '-leaflet-zoomfs'); 
				var link = L.DomUtil.create('a', '', container);
				link.href = `javascript:maphelpers.printmap('${this.options.domid}', '${this.options.maptitle}');`;
				link.style.textAlign = 'center';
				link.style.fontSize = '22px';
				link.style.color = '#000';
				link.style.backgroundColor = '#fff';
				link.innerHTML = '';
				link.classList.add('leaflet-button-print');
				link.title = this.options.title;

				return container;
			},
		});
		
		L.control.mapprint = function(options) {
			return new L.Control.MapPrint(options);
		};

		/* 
		Leaflet Map Save plugin.
		Hand made && based in Leaflet export & print
		*/
		L.Control.MapDownload = L.Control.extend({
			options: {
				position: 'topleft',
				title: c`save`.uf(),
				domid: 'base',
				maptitle: toolkit.appversion().join(' '),
			},
		
			onAdd: function(map) {
				this._map = map;
				var container = byId(this.options.domid + '-leaflet-zoomfs'); 
				var link = L.DomUtil.create('a', '', container);
				link.href = `javascript:maphelpers.downloadmap('${this.options.domid}', '${this.options.maptitle}');`;
				link.style.textAlign = 'center';
				link.style.fontSize = '22px';
				link.style.color = '#000';
				link.style.backgroundColor = '#fff';
				link.innerHTML = '';
				link.classList.add('leaflet-button-download');
				link.title = this.options.title;

				return container;
			},
		});
		
		L.control.mapdownload = function(options) {
			return new L.Control.MapDownload(options);
		};

		/* 
		Leaflet Geocoding plugin.
		As seen at http://mapbbcode.org/leaflet.html
		*/
		L.Control.Search = L.Control.extend({
			options: {
				position: 'topleft',
				domid: 'base',
				title: c`search`.uf(),
				email: ''
			},
		
			onAdd: function(map) {
				this._map = map;
				var container = byId(this.options.domid + '-leaflet-zoomfs');
				var link = this._link = L.DomUtil.create('a', '', container);
				link.href = '#';
				link.style.textAlign = 'center';
				link.style.fontSize = '22px';
				link.style.color = '#000';
				link.style.backgroundColor = '#fff';
				link.innerHTML = '';
				link.classList.add('leaflet-button-search');
				link.title = this.options.title;
		
				var stop = L.DomEvent.stopPropagation;
				L.DomEvent
					.on(link, 'click', stop)
					.on(link, 'mousedown', stop)
					.on(link, 'dblclick', stop)
					.on(link, 'click', L.DomEvent.preventDefault)
					.on(link, 'click', this._toggle, this);
		
		
				var form = this._form = document.createElement('form');
				form.style.display = 'none';
				form.style.position = 'absolute';
				form.style.left = '36px';
				form.style.height = '30px';
				form.style.top = '0px';
				form.style.zIndex = -10;
				var input = this._input = document.createElement('input');
				input.style.width = '200px';
				form.appendChild(input);
				L.DomEvent.on(form, 'submit', function() {
					this._doSearch(input.value);
					return false;
				}, this).on(form, 'submit', L.DomEvent.preventDefault);
				container.appendChild(form);
		
				return container;
			},
		
			_toggle: function() {
				if (this._form.style.display !== 'block') {
					L.DomUtil.addClass(this._link, 'maptoolactive');
					this._form.style.display = 'block';
					this._input.focus();
				} else {
					this._collapse();
				}
			},
		
			_collapse: function() {
				this._form.style.display = 'none';
				this._input.value = '';
				L.DomUtil.removeClass(this._link, 'maptoolactive');
			},
		
			_nominatimCallback: function(results) {
				if (results && results.length > 0) {
					var bbox = results[0].boundingbox;
					this._map.fitBounds(L.latLngBounds([
						[bbox[0], bbox[2]],
						[bbox[1], bbox[3]]
					]));
				}
				this._collapse();
			},
		
			_callbackId: 0,
		
			_doSearch: function(query) {
				var callback = '_l_osmgeocoder_' + this._callbackId++;
				window[callback] = L.Util.bind(this._nominatimCallback, this);
				var queryParams = {
					q: query,
					format: 'json',
					limit: 1,
					'json_callback': callback
				};
				if (this.options.email)
					queryParams.email = this.options.email;
				if (this._map.getBounds())
					queryParams.viewbox = this._map.getBounds().toBBoxString();
				var url = 'https://nominatim.openstreetmap.org/search' + L.Util.getParamString(queryParams);
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = url;
				document.getElementsByTagName('head')[0].appendChild(script);
			},
		});
		
		L.control.search = function(options) {
			return new L.Control.Search(options);
		};
		
		/*
		Leaflet zonal zoom control + home control
		As seen at https://github.com/consbio/Leaflet.ZoomBox and https://github.com/torfsen/leaflet.zoomhome
		*/
		L.Control.ZoomBox = L.Control.extend({
			_active: false,
			_chactive: false,
			_map: null,
			includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
			options: {
				domid: 'base',
				position: 'topleft',
				className: "leaflet-zoom-box-icon",
				modal: false,
				title: c`zoom-to-area`.uf(),
				crossHairTitle: c`crosshair`.uf(),
				zoomHomeTitle: c`home`.uf(),
				homeCoordinates: null,
				homeZoom: null,
			},
			onAdd: function(map) {
				this._map = map;
				this._container = byId(this.options.domid + '-leaflet-zoomfs'); 
				
				this._link = L.DomUtil.create('a', this.options.className, this._container);
				this._link.title = this.options.title;
				this._link.style.textAlign = 'center';
				this._link.style.fontSize = '22px';
				this._link.style.color = '#000';
				this._link.style.backgroundColor = '#fff';
				this._link.innerHTML = '';
				this._link.classList.add('leaflet-button-zoombox');
				this._link.href = "javascript:;";

				this._crosshair = L.DomUtil.create('a', this.options.className, this._container);
				this._crosshair.title = this.options.crossHairTitle;
				this._crosshair.style.textAlign = 'center';
				this._crosshair.style.fontSize = '22px';
				this._crosshair.style.color = '#000';
				this._crosshair.style.backgroundColor = '#fff';
				this._crosshair.innerHTML = ''; 
				this._crosshair.href = "javascript:;";
				this._crosshair.classList.add('leaflet-button-crosshair');

				this._zoomHomeButton = L.DomUtil.create('a', this.options.className + '-home', this._container);
				this._zoomHomeButton.title = this.options.zoomHomeTitle;
				this._zoomHomeButton.style.textAlign = 'center';
				this._zoomHomeButton.style.fontSize = '22px';
				this._zoomHomeButton.style.color = '#000';
				this._zoomHomeButton.style.backgroundColor = '#fff';
				this._zoomHomeButton.innerHTML = '';
				this._zoomHomeButton.classList.add('leaflet-button-homebutton');
				this._zoomHomeButton.href = "javascript:;";
				
				var _origMouseDown = map.boxZoom._onMouseDown;
				map.boxZoom._onMouseDown = function(e) {
					if (e.button > 1) return; 
					_origMouseDown.call(map.boxZoom, {
						clientX: e.clientX,
						clientY: e.clientY,
						which: 1,
						shiftKey: true
					});
				};
		
				map.on('zoomend', function() {
					if (map.getZoom() == map.getMaxZoom()) {
						L.DomUtil.addClass(this._link, 'leaflet-disabled');
					} else {
						L.DomUtil.removeClass(this._link, 'leaflet-disabled');
					}
				}, this);
				if (!this.options.modal) {
					map.on('boxzoomend', this.deactivate, this);
				}
		
				L.DomEvent
					.on(this._link, 'dblclick', L.DomEvent.stop)
					.on(this._link, 'click', L.DomEvent.stop)
					.on(this._link, 'mousedown', L.DomEvent.stopPropagation)
					.on(this._link, 'click', function() {
						this._active = !this._active;
						if (this._active && map.getZoom() != map.getMaxZoom()) {
							this.activate();
						} else {
							this.deactivate();
						}
					}, this);
				L.DomEvent
					.on(this._zoomHomeButton, 'dblclick', L.DomEvent.stop)
					.on(this._zoomHomeButton, 'click', L.DomEvent.stop)
					.on(this._zoomHomeButton, 'mousedown', L.DomEvent.stopPropagation)
					.on(this._zoomHomeButton, 'click', function() {
						this._zoomHome();
					}, this);
				L.DomEvent
					.on(this._crosshair, 'dblclick', L.DomEvent.stop)
					.on(this._crosshair, 'click', L.DomEvent.stop)
					.on(this._crosshair, 'mousedown', L.DomEvent.stopPropagation)
					.on(this._crosshair, 'click', function() {
						this._chactive = !this._chactive;
						if (this._chactive) {
							this.chactivate();
						} else {
							this.chdeactivate();
						}
					}, this);
				return this._container;
			},
			activate: function() {
				L.DomUtil.addClass(this._link, 'maptoolactive');
				this._map.dragging.disable();
				this._map.boxZoom.addHooks();
				L.DomUtil.addClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
			},
			deactivate: function() {
				L.DomUtil.removeClass(this._link, 'maptoolactive');
				this._map.dragging.enable();
				this._map.boxZoom.removeHooks();
				L.DomUtil.removeClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
				this._active = false;
			},
			chactivate: function() {
				L.DomUtil.addClass(this._crosshair, 'maptoolactive');
				L.DomUtil.addClass(this._map.getContainer(), 'mapcrosshairs');
			},
			chdeactivate: function() {
				L.DomUtil.removeClass(this._crosshair, 'maptoolactive');
				L.DomUtil.removeClass(this._map.getContainer(), 'mapcrosshairs');
				this._chactive = false;
			},
			_zoomHome: function(e) {
				this._map.setView(this.options.homeCoordinates, this.options.homeZoom);
			},
		});
		
		L.control.zoomBox = function(options) {
			return new L.Control.ZoomBox(options);
		};
		
		
		/*
		Leaflet graticule
		As seen at https://github.com/turban/Leaflet.Graticule but seriously modified
		*/
		L.Graticule = L.GeoJSON.extend({
			options: {
				style: {
					color: '#333',
					weight: .2
				},
				interval: 20,
			},
			initialize: function(options) {
				L.Util.setOptions(this, options);
				this._layers = {};
				this._map = d.map[this.options.map];
		
				this.addData(this._getGraticule());
			},
			_getGraticule: function() {
				let features = [];
				for (let lng = 0; lng <= 180; lng = lng + this.options.interval) {
					features.push(this._getFeature(this._getMeridian(lng), {
						name: (lng) ? lng.toString() + 'E' : '0',
						coordinates: [90, lng],
					}));
					if (lng !== 0) {
						features.push(this._getFeature(this._getMeridian(-lng), {
							name: lng.toString() + 'W',
							coordinates: [90, lng * -1],
						}));
					}
				}
				for (var lat = 0; lat <= 90; lat = lat + this.options.interval) {
					features.push(this._getFeature(this._getParallel(lat), {
						name: (lat) ? lat.toString() + 'N' : '0',
						coordinates: [lat, -180],
					}));
					if (lat !== 0) {
						features.push(this._getFeature(this._getParallel(-lat), {
							name: lat.toString() + 'S',
							coordinates: [lat * -1, -180],
						}));
					}
				}
				return {
					'type': 'FeatureCollection',
					'features': features
				};
			},
			_getMeridian: function(lng) {
				lng = this._lngFix(lng);
				let coords = [];
				for (let lat = -90; lat <= 90; lat++) {
					coords.push([lng, lat]);
				}
				return coords;
			},
			_getParallel: function(lat) {
				let coords = [];
				for (var lng = -180; lng <= 180; lng++) {
					coords.push([this._lngFix(lng), lat]);
				}
				return coords;
			},
			_getFeature: function(coords, prop) {
				return {
					'type': 'Feature',
					'geometry': {
						'type': 'LineString',
						'coordinates': coords
					},
					'properties': prop
				};
			},
			_lngFix: function(lng) {
				if (lng >= 180) return 179.999999;
				if (lng <= -180) return -179.999999;
				return lng;
			},
		});
		
		L.graticule = function(options) {
			return new L.Graticule(options);
		};		
		
		/*
		Leaflet Watermark
		*/
		L.Control.Watermark = L.Control.extend({
			onAdd: function(map) {
				let hrf = L.DomUtil.create('a');
				hrf.href = 'javascript:info.app();';
				let img = L.DomUtil.create('img');
				img.src = './assets/img/logos/LOGOPF.svg';
				img.style.height = '2em';
				hrf.appendChild(img);
				return hrf;
			},
			onRemove: function(map) {}
		});
		
		L.control.watermark = function(opts) {
			return new L.Control.Watermark(opts);
		}
				
		/*
		Leaflet full screen
		As seen at https://github.com/elidupuis/leaflet.zoomfs but slightly modified
		*/
		L.Control.ZoomFS = L.Control.Zoom.extend({
			includes: L.Evented,
			options: {
				domid: 'base',
			},
			onAdd: function (map) {
				var zoomName = 'leaflet-control-zoom',
					barName = 'leaflet-bar',
					partName = barName + '-part',
					container = L.DomUtil.create('div', zoomName + ' ' + barName);
		
				container.id = this.options.domid + '-leaflet-zoomfs';
				
				this._map = map;
				this._isFullscreen = false;
		
				this._zoomFullScreenButton = this._createButton('', c`full-screen`.uf(),
					'leaflet-button-fullscreen ' +
					partName + ' ' +
					partName + '-top',
					container, this.fullscreen, this);
		
				this._zoomInButton = this._createButton('+', c`zoom-in`.uf(),
					zoomName + '-in ' +
					partName + ' ',
					container, this._zoomIn,  this);
		
				this._zoomOutButton = this._createButton('-', c`zoom-out`.uf(),
					zoomName + '-out ' +
					partName + ' ' +
					partName + '-bottom',
					container, this._zoomOut, this);
		
				map.on('zoomend zoomlevelschange', this._updateDisabled, this);
		
				return container;
			},
			fullscreen: function() {
				if (!this._isFullscreen) {
					this._enterFullScreen();
				} else {
					this._exitFullScreen();
				}
				this._map.invalidateSize();
			},
			_enterFullScreen: function() {
				var container = this._map._container;
				container.style.position = 'fixed';
				container.style.left = 0;
				container.style.top = 0;
				container.style.width = '100%';
				container.style.height = '100%';
				L.DomUtil.addClass(container, 'leaflet-fullscreen');
				this._isFullscreen = true;
				L.DomEvent.addListener(document, 'keyup', this._onKeyUp, this);
				this._map.fire('enterFullscreen');
			},
			_exitFullScreen: function() {
				var container = this._map._container;
				L.DomUtil.removeClass(container, 'leaflet-fullscreen');
				this._isFullscreen = false;
				container.removeAttribute('style');
				var position = L.DomUtil.getStyle(container, 'position');
				if (position !== 'absolute' && position !== 'relative') {
					container.style.position = 'relative';
				}
				L.DomEvent.removeListener(document, 'keyup', this._onKeyUp);
				this._map.fire('exitFullscreen');
			},
			_onKeyUp: function(e) {
				if (!e) e = window.event;
				if (e.keyCode === 27 && this._isFullscreen === true) {
					this._exitFullScreen();
				}
			}
		});	
		
		/* 
		Leaflet CircleMarker variants
		*/
		L.Canvas.include({
			_updateStarMarker: function (layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
		
				var rot = Math.PI / 2 * 3;
				var x = p.x;
				var y = p.y;
				var step = Math.PI / 5;
				var orad = r;
				var irad = orad / 2;
				
				ctx.beginPath();
				ctx.moveTo(p.x, p.y - orad)
				for(var i = 0; i < 5; i++) {
					x = p.x + Math.cos(rot) * orad;
					y = p.y + Math.sin(rot) * orad;
					ctx.lineTo(x, y);
					rot += step;
					x = p.x + Math.cos(rot) * irad;
					y = p.y + Math.sin(rot) * irad;
					ctx.lineTo(x, y);
					rot += step;
				}
				ctx.lineTo(p.x, p.y - orad);
				ctx.closePath();
				
				this._fillStroke(ctx, layer);
			},
			_updateHexaStarMarker: function (layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius * .7), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
				
				ctx.beginPath();
				ctx.moveTo(p.x + r, p.y);
				ctx.lineTo(p.x + 0.43 * r, p.y + 0.25 * r);
				ctx.lineTo(p.x + 0.50 * r, p.y + 0.87 * r);
				ctx.lineTo(p.x, p.y + 0.50 * r);
				ctx.lineTo(p.x - 0.50 * r, p.y + 0.87 * r);
				ctx.lineTo(p.x - 0.43 * r, p.y + 0.25 * r);
				ctx.lineTo(p.x - r, p.y );
				ctx.lineTo(p.x - 0.43 * r, p.y - 0.25 * r);
				ctx.lineTo(p.x - 0.50 * r, p.y - 0.87 * r);
				ctx.lineTo(p.x , p.y - 0.50 * r);
				ctx.lineTo(p.x + 0.50 * r, p.y - 0.87 * r);
				ctx.lineTo(p.x + 0.43 * r, p.y - 0.25 * r);
				ctx.closePath();
				
				this._fillStroke(ctx, layer);
			},
			_updateSquareMarker: function(layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
		
				ctx.beginPath();
				ctx.moveTo(p.x, p.y);
				ctx.lineTo(p.x, p.y + r);
				ctx.lineTo(p.x + r, p.y + r);
				ctx.lineTo(p.x + r, p.y);
				ctx.closePath();
				
		        this._fillStroke(ctx, layer);
			},
			_updateDiamondMarker: function(layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
		
				ctx.beginPath();
				ctx.moveTo(p.x, p.y);
				ctx.lineTo(p.x - r / 2, p.y + r / 2);
				ctx.lineTo(p.x, p.y + r);
				ctx.lineTo(p.x + r / 2, p.y + r / 2);
				ctx.closePath();
				
		        this._fillStroke(ctx, layer);
			},
			_updateTriangleMarker: function(layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
				
				ctx.beginPath();
				ctx.moveTo(p.x, p.y);
				ctx.lineTo(p.x + r / 2, p.y + r);
				ctx.lineTo(p.x - r / 2, p.y + r);
				ctx.closePath();
				
		        this._fillStroke(ctx, layer);
			},
			_updateInvertedTriangleMarker: function(layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);
		
				this._drawnLayers[layer._leaflet_id] = layer;
				
				ctx.beginPath();
				ctx.moveTo(p.x, p.y);
				ctx.lineTo(p.x + r, p.y);
				ctx.lineTo(p.x + r / 2, p.y + r);
				ctx.closePath();
				
		        this._fillStroke(ctx, layer);
			},
			_updatePieChartMarker: function(layer) {
				if (!this._drawing || layer._empty()) { return; }
				let p = layer._point;
				let ctx = this._ctx;
				let r = Math.max(Math.round(layer._radius), 1);

				let getstyle = (segment, total) => {
					var hslToRgb = function(h, s, l) {
						var r, g, b;
						if (s == 0) {
							r = g = b = l;
						} else {
							var hue2rgb = function(p, q, t) {
								if (t < 0) t += 1;
								if (t > 1) t -= 1;
								if (t < 1 / 6) return p + (q - p) * 6 * t;
								if (t < 1 / 2) return q;
								if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
								return p;
							};
				
							var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
							var p = 2 * l - q;
							r = hue2rgb(p, q, h + 1 / 3);
							g = hue2rgb(p, q, h);
							b = hue2rgb(p, q, h - 1 / 3);
						}
				
						return Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255);
					};
				
					var angle = 360 / (total * 2.5);
					var offset = (segment % 2) * total;
					var hue = (angle * (offset + (segment - (segment % 2)))) / 360;
					var rgb = hslToRgb(hue, 0.7, 0.5);
					return {
						fillStyle: 'rgba(' + rgb + ',.5)',
						strokeStyle: 'rgba(' + rgb + ',.7)',
						lineWidth: 1
					};
				};
				let applystyle = (ctx, props) => {
					for (var i in props) {
						ctx[i] = props[i];
					}
				};
				
				this._drawnLayers[layer._leaflet_id] = layer;

				var size = L.point([r, r]);
				var center = size.divideBy(2);
				
				ctx.clearRect(0, 0, size.x, size.y);

				var data = layer.options.data;				
				var valueField = layer.options.valueField;
				var total = data.map(o => o[valueField]).sum();
				var x = center.x;
				var y = center.y;
				
				if (total) {
					var radius = Math.min(x, y);
					var fraction = Math.PI / total * 2;
					var startAngle = -Math.PI / 2;
					var stopAngle;
					var style;
					for (var i = 0, l = data.length; i < l; i++) {
						ctx.beginPath();
						style = data[i].style || getstyle(i, l);
						applystyle(ctx, style);
						stopAngle = fraction * data[i][valueField] + startAngle;
						ctx.arc(p.x, p.y, radius - Math.ceil((style.lineWidth || 0) / 2), startAngle, stopAngle);
						ctx.stroke();
						ctx.lineTo(p.x, p.y);
						startAngle = stopAngle;
						ctx.fill();
						ctx.closePath();
					}
				}

				this._fillStroke(ctx, layer);
			},
		});
		
		L.StarMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateStarMarker(this);
			}
		});
		
		L.HexaStarMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateHexaStarMarker(this);
			}
		});

		L.SquareMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateSquareMarker(this);
			}
		});

		L.DiamondMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateDiamondMarker(this);
			}
		});
		
		L.TriangleMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateTriangleMarker(this);
			}
		});

		L.InvertedTriangleMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updateInvertedTriangleMarker(this);
			}
		});
		
		L.PieChartMarker = L.CircleMarker.extend({
			_updatePath: function () {
				this._renderer._updatePieChartMarker(this);
			}
		});
	},
	buffermeasure: radius => {
		return [
			`${Math.round((Math.PI * radius * radius)).toLocaleString(l)} m<sup>2</sup>`,
			`${Math.round((2 * Math.PI * radius)).toLocaleString(l)} m`,
		].join(', ');
	},
	settransformations: (xid, val, cid = 'base') => {
		if(xid.includes('.')) {
			d.maptransformations[cid][xid.split('.')[0]][xid.split('.')[1]] = val;
		} else {
			d.maptransformations[cid][xid] = val;
		}
		maphelpers.drawtransformations(cid);
	},
	drawtransformations: (cid = 'base') => {
		let bufferisnotok = Number(d.maptransformations[cid].buffer) < 1;
		['convex', 'envelope', 'tin', 'voronoi'].forEach(o => {
			byId(`${cid}-map-${o}`).disabled = bufferisnotok;
			if(bufferisnotok) {
				byId(`${cid}-map-${o}-ctr`).classList.add('background-light-200');
				byId(`${cid}-map-${o}-lbl`).classList.add('color-light-400');
			} else {
				byId(`${cid}-map-${o}-ctr`).classList.remove('background-light-200');
				byId(`${cid}-map-${o}-lbl`).classList.remove('color-light-400');
			}
		});
		bufferisnotok = undefined;
	},
	makepopupinfo: (feature, lat, lng) => {
		let rec = dbe.getposbyid(feature.properties.id) || null;
		let bcl = rec ? dbe.getbcolorfromslug(rec.rkey) : '';
		let dst = c`n-a`;
		lat = lat || (feature.properties.origin_lat ? feature.properties.origin_lat : null);
		lng = lng || (feature.properties.origin_lon ? feature.properties.origin_lon : null);
		let dlat = feature.properties.latitude ? 
			feature.properties.latitude : 
			feature.properties.destination_lat;
		let dlng = feature.properties.longitude ? 
			feature.properties.longitude : 
			feature.properties.destination_lon;
		if(lat && lng && dlat && dlng) {
			let tmpsource = turf.point([lng, lat]);
			let tmptarget = turf.point([dlng, dlat]);
			let tmpkm = turf.distance(tmpsource, tmptarget, {units: 'kilometers'});
			dst = tmpkm < 1 ? 
				Math.round(tmpkm * 1000).toLocaleString(l) + ' m' : 
				tmpkm.toLocaleString(l) + ' km';
		}
		dlng = dlat = undefined;
		return !rec ? 
			`ID: ${feature.properties.id}` : 
			[
				`<h6>`,
				`<a class="color-${bcl}" `,
				`href="javascript:ui.singlerecord(${rec.ID},${rec.ID});">`,
				`${toolkit.titleformat(rec.value)}</a>`,
				`</h6>`,
				`<table>`,
				`<tbody>`,
				`<tr><td>${c`post_type`}</td><td>${c(rec.rkey)}</td></tr>`,
				`<tr><td>${c`distance`}</td><td>${dst}</td></tr>`,
				`<tr><td>${c`related`}</td><td>${feature.properties.size.toLocaleString(l)}</td></tr>`,
				`</tbody>`,		
				`</table>`,		
			].join('\n');
	},
	makeflowpoup: (stitle, text, origin, tarray, cid = 'base') => {
		if(!tarray.length) return;
		let out = [];
		let oout = [];
		out.push(`<h6>${stitle}</h6>`);
		if(origin.id) {
			out.push([
				`<p class="no-vertical-margin border-bottom">`,
				`${c`related-to`.uf()}: `,
				`<span class="empty-square `,
				`background-${dbe.getbcolorfromslug(d.store.pos[origin.id].rkey)}" `,
				`style="height:1em;width:1em"></span>`,
				`<a class="text-decoration-none color-${dbe.getbcolorfromslug(d.store.pos[origin.id].rkey)}" `,
				`href="javascript:`,
				`maphelpers.centermarker(`,
				`${origin.lat},${origin.lon},'${cid}'`,
				`);">`,
				`${origin.title}`,
				`</a>`,
				`</p>`,
			].join('\n'));
		}
		let itemotxt = tarray.length === 1 ? c`item` : c`items`;
		out.push([
			`<p class="all-caps border-bottom">`,
			`${text} (${oout.length.toLocaleString(l)} ${itemotxt})`,
			`</p>`,
			oout.join('\n'),
		].join('\n'));
		itemotxt = undefined;
		out.push(`<div style="overflow-y:auto!important;max-height:250px!important;">`);
		tarray.forEach(o => {
			oout.push([
				`<p class="no-margin-vertical">`,
				`<span class="empty-square `,
				`background-${dbe.getbcolorfromslug(o.properties.rkey)}" `,
				`style="height:1.1em;width:1.1em">`,
				`</span>`,
				`<a class="text-decoration-none color-${dbe.getbcolorfromslug(o.properties.rkey)}" `,
				`href="javascript:`,
				`maphelpers.centermarker(`,
				`${o.properties.destination_lat},${o.properties.destination_lon},'${cid}'`,
				`);">`,
				toolkit.titleformat(o.properties.title),
				`</a>`,
				`</p>`,
			].join('\n'));
		});
		out.push(oout.join('\n'));
		out.push(`</div>`);
		oout = undefined;
		return out.join('\n');
	},
	makepanelinfo: (cid = 'base', info = {markercolor: '', title: '', msg: '', area: 0, action: ''}) => {
		let taction = !isBlank(info.action) ? [
		`<p class="font-size-xs">`,
		`<a class="text-decoration-none font-weight-bold" `,
		`href="javascript:mapops.exportintersections(cid, ${info.action});">`,
		`${c`included-data`.uf()}&hellip;`,
		`</a>`,									
		`</p>`,									
		`<p class="font-size-xs">`,
		`<a class="text-decoration-none font-weight-bold" `,
		`href="javascript:mapops.refinefilter(${info.action});">`,
		`${c`refine-filter`.uf()}&hellip;`,
		`</a>`,									
		`</p>`,									
		].join('\n') : '';
		return [
			`<h5 class="border-bottom border-color-light-300 font-size-xs">`,
			`<span class="empty-square margin-right-xs" `,
			`style="background:${info.markercolor};"></span>`,
			info.title,
			`</h5>`,
			`<p class="font-size-xs">${info.msg}</p>`,
			`<p class="font-size-xs">${c`area`.uf()}: `,
			`${info.area.toLocaleString(l)} km<sup>2</sup></p>`,
			`${taction}`,
		].join('\n');
	},
	centermarker: (lat, lng, cid = 'base') => d.map[cid].fitBounds(L.latLngBounds([new L.latLng(lat, lng)])),
	downloadmap: (cid = 'base', caption = '') => {
		let mapcontainer = d.map[cid].getContainer();
		domtoimage.toBlob(mapcontainer, {
			width: mapcontainer.getBoundingClientRect().width,
			height: mapcontainer.getBoundingClientRect().height,
			filter: fnode => fnode instanceof HTMLElement ? 
				(!fnode.classList.contains('leaflet-control-zoom')) : 
				true,
		}).then(function(dataurl) {
			file.save(
				dataurl, 
				window.version.appname + '_' + (Math.random().toString(36).substring(7)) + '.png',
				'image/png'
			)
		})
		.catch(function(error) {
			throw new Apperror(error);
		});
	},
	clamprange: (ref = [], val, bias = 1, multiplier = 10) => {
		let out = bias * multiplier;
		if(!ref.length) out = bias * multiplier;
		ref.forEach((o, i) => {
			if(!o.max && !o.min) out = bias * multiplier;
			if(val >= o.min && val <= o.max) out = (i + bias) * multiplier;
		});
		return out;
	},
	graphicscale: (array = [], title = '', subtitle = '', bias = 1, multiplier = 10) => {
		let genders = dbm.genders();
		let ownership = dbm.ownership();
		let baselist = mapops.uniquelist(
			[].concat(Object.values(genders).map(o => o.value), Object.values(ownership).map(o => o.value))
		);
		
		let line0 = [];
		let line1 = [];
		let line2 = [];
		let isize = d.mapiconfeatures.size.tiny;
		baselist.forEach(o => {
			line0.push([
				`<li><div class="font-size-xs">`,
				`<svg width="${isize}" height="${isize}" `,
				`viewBox="0 0 24 24" class="svgicon">`,
				`<path fill="none" stroke="#000000" stroke-width="2" class="SYMBOL_${o.symbol}" d=""></path>`,
				`</svg>`,
				` ${o.name}`,
				`</li>`,
			].join(''));
		});
		for(let i = 0; i < array.length; i++) {
			line1.push([
				`<li><div class="font-size-xxs" style="width:${(i + 1 + bias) * multiplier}px">`,
				array[i].max === Infinity ? 
					`${array[i - 1].max.toLocaleString(l)}+` :  
					array[i].max.toLocaleString(l),
				`</div></li>`,
			].join(''));
			line2.push([
				`<li><div class="background-light${i % 2 === 0 ? '-800' : ''}" `,
				`style="width:${(i + 1 + bias) * multiplier}px !important;height:3px">`,
				`</div></li>`,
			].join(''));
		}
		isize = undefined;
		return [
			/*
			`<h6 class="font-size-xs no-margin-bottom">${title}</h6>`,
			`<p class="font-size-xs no-margin-vertical">${subtitle}</p>`,
			*/
			`<div class="group group-xs text-align-left"><ul>${line0.join('\n')}</ul></div>`,
			`<div class="group text-align-center"><ul>${line1.join('\n')}</ul></div>`,
			`<div class="group text-align-center"><ul>${line2.join('\n')}</ul></div>`,
		].join('\n');
	},
};
const mapops = {
	clearqueries: (cid = 'base') => {
		d.maplayers[cid].queries = {};
		mapops.drawlayers(cid);
	},
	fitbounds: (cid = 'base') => {
		let bounds = new L.LatLngBounds();
		d.map[cid].eachLayer(o => {
			if(o instanceof L.FeatureGroup) {
				if(o instanceof L.CircleMarker) bounds.extend(o.getBounds())
			}
		});
		if(bounds.isValid()) d.map[cid].fitBounds(bounds);
		bounds = undefined;
	},
	namedlayers: (cid = 'base') => {
		if(!Object.keys(d.maplayers[cid].base).length) {
			d.mapproviders.forEach((o, i) => {
				d.maplayers[cid].base[o.name] = {
					name: o.name,
					visible: i === window.settings.mapbasedefault || 0,
					source: o.provider,
					isflowlayer: false,
					color: null,
				};
			});
		}
		if(!Object.keys(d.maplayers[cid].overlays).length) {
			d.mapgeojsonlayers.forEach(o => {
				d.maplayers[cid].overlays[o.name] = {
					name: o.name,
					visible: false,
					source: o.name,
					isflowlayer: false,
					color: o.color,
				};
			});
		}
		if(!Object.keys(d.maplayers[cid].graticules).length) {
			d.maplayers[cid].graticules.graticule = {
				name: 'graticule',
				visible: false, 
				source: null, 
				isflowlayer: false,
				color: '#111'
			};
		}
		if(!Object.keys(d.maplayers[cid].data).length) {
			d.maplayers[cid].data = {
				located: {
					name: 'located',
					visible: false,
					source: null,
					isflowlayer: false,
					color: '#195de6',
				},
				graduated: {
					name: 'graduated',
					visible: false,
					source: null,
					isflowlayer: false,
					color: '#195de6',
				},
				clusters: {
					name: 'clusters',
					visible: false, 
					source: null, 
					isflowlayer: false,
					color: '#195de6',
				},
				heatmap: {
					name: 'heatmap',
					visible: false, 
					source: null, 
					isflowlayer: false,
					color: '#195de6',
				},
				kmeans: {
					name: 'kmeans',
					visible: false,
					source: null,
					isflowlayer: false,
					color: '#195de6',
				},
			};
		}
	},
	drawlayers: (cid = 'base') => {
		if(!d.map[cid]) return;
		d.map[cid].eachLayer(function (layer) {
			try {
				d.map[cid].removeLayer(layer);
			} catch {}
		});

		if(d.maplayers[cid].data.kmeans.source) {
			if(d.maplayers[cid].data.kmeans.source.layers) {
				Object.keys(d.maplayers[cid].data.kmeans.source.layers).forEach(o => {
					d.maplayers[cid].data.kmeans.source.layers[o].layer.remove();
				});
			}
			if(d.maplayers[cid].data.kmeans.source.panel) {
				d.maplayers[cid].data.kmeans.source.panel.remove();	
			}
			if(d.maplayers[cid].data.kmeans.source.legend) {
				d.maplayers[cid].data.kmeans.source.legend.remove();	
			}
		};
		d.maplayers[cid].data.kmeans.source = {
			panel: null,
			legend: null,
			layers: null,
		};
		
		if(d.maplayers[cid].legend !== null) {
			d.maplayers[cid].legend.remove();
			d.maplayers[cid].legend = null;
		}

		let blacklist = ['base', 'legend'];
		let basesource = Object.values(d.maplayers[cid].base).find(o => o.visible).source;
		let basename = Object.values(d.maplayers[cid].base).find(o => o.visible).name;
		d.map[cid].addLayer(L.tileLayer.provider(basesource));
		
		Object.keys(d.maplayers[cid]).filter(g => !blacklist.includes(g)).forEach(g => {
			Object.keys(d.maplayers[cid][g])
				.filter(o => d.maplayers[cid][g][o].visible)
				.forEach(o => mapops['q' + g](o, cid));
		});
		
		toolkit.msg(
			`${cid}-map-currentmapbase`,
			basename
		);
		
		document.querySelectorAll(`#${cid}-map-basemaps-list table tbody tr td`).forEach(o => {
			if(o.dataset.mapname === basename) {
				o.classList.remove('background-light-50');
				o.classList.add('background-info-50');
			} else {
				o.classList.remove('background-info-50');
				o.classList.add('background-light-50');
			}
		});

		toolkit.msg(
			`${cid}-map-overlays-list`,
			mapops.drawlayersselector(cid)
		);
		if(dbe.verifytables()) {
			toolkit.msg(
				`${cid}-map-queries-list`,
				mapops.drawqueriesselector(cid)
			);
			toolkit.drawicons();
			maphelpers.drawtransformations(cid);
			if(Object.keys(d.maplayers[cid].queries).length) {
				byId(`${cid}-map-queries-list`).classList.remove('hide');
				if(cid === 'base') document.querySelector(`#${cid}-map-queries button`).classList.remove('disabled');
			} else {
				byId(`${cid}-map-queries-list`).classList.add('hide');
				if(cid === 'base') document.querySelector(`#${cid}-map-queries button`).classList.add('disabled');
			}
			mapops.drawsizelegend(cid);
			toolkit.drawicons();
		}

		let visiblelayers = Object.values(d.maplayers[cid].overlays).filter(o => o.visible);
		if(!visiblelayers.length) d.maplayers[cid].infopanel.update();

		mapops.fitbounds(cid);
		
		mapops.sendoverlaystoback(cid);
		
		blacklist = basesource = basename = undefined;
	},
	sendoverlaystoback: (cid = 'base') => {
		d.map[cid].eachLayer(o => { if(o instanceof L.Polygon) o.bringToBack(); });
	},
	drawsizelegend: (cid = 'base') => {
		if(d.maplayers[cid].legend !== null) {
			d.maplayers[cid].legend.remove();
			d.maplayers[cid].legend = null;
		}
		let mustredraw = false;
		Object.keys(d.maplayers[cid].data).forEach(k => {
			if(d.maplayers[cid].data[k].visible) mustredraw = true;
		});
		Object.keys(d.maplayers[cid].queries).forEach(k => {
			if(d.maplayers[cid].queries[k].visible) mustredraw = true;
		});
		if(mustredraw) {
			d.maplayers[cid].legend = L.control({
				position: 'bottomleft'
			});
			d.maplayers[cid].legend.onAdd = function(map) {
				let div = L.DomUtil.create('div', 'leaflet-linfo leaflet-linfo-legend');
				this._div = div;
				div.innerHTML = maphelpers.graphicscale(
					d.mapdataranges, 
					c`graduated-points`.uf(), 
					c`related`.uf(), 
					1, 
					d.mapiconradius
				);
				return div;
			};
			
			d.maplayers[cid].legend.update = function(e) {
				if (e === undefined) {
					this._div.innerHTML = '';
					this._div.classList.add('hide');
					return;
				}
				this._div.classList.remove('hide');
				this._div.innerHTML = e;
			};
			
			d.maplayers[cid].legend.addTo(d.map[cid]);
			d.maplayers[cid].legend._div.onclick = () => d.maplayers[cid].legend.update();
		}
	},
	drawlayersselector: (cid = 'base') => {
		let out = [];
		let blacklist = ['base', 'queries', 'infopanel', 'datepanel', 'maintainqueries', 'legend'];
		if(!dbe.verifytables()) blacklist.push(...['data']);

		Object.keys(d.maplayers[cid]).filter(k => !blacklist.includes(k)).forEach(k => {
			Object.keys(d.maplayers[cid][k]).forEach(g => {
				out.push([
					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="${cid}-map-layers-${k}-${d.maplayers[cid][k][g].name}" `,
					`name="${cid}-map-layers-${k}-${d.maplayers[cid][k][g].name}" `,
					`onclick="javascript:mapops.togglelayer(`,
					`'${k}','${d.maplayers[cid][k][g].name}', '${cid}'`,
					`);"`,
					`${d.maplayers[cid][k][g].visible ? ' checked' : ''}>`,
					`<span class="control-indicator" style="border:3px ${d.maplayers[cid][k][g].color} solid"></span>`,
					`<span class="control-label" style="color:${d.maplayers[cid][k][g].color}">`,
					`${c(d.maplayers[cid][k][g].name).uf()}`,
					`</span>`,
					`</label>`,
					`</p>`,
				].join(''));
			});
		});
		return out.join('\n');
	},
	drawqueriesselector: (cid = 'base') => {
		if(!dbe.verifytables()) return;
		let out = [];
		
		byId(`${cid}-map-queries`).classList.remove('hide');
		toolkit.restrictinput(byId(`${cid}-map-buffer`), value => /^\d*$/.test(value));
		
		if(Object.keys(d.maplayers[cid].queries).length) {
			out.push([
				`<p class="no-margin-bottom">`,
				`<a class="button button-block button-icon error" `,
				`href="javascript:mapops.clearqueries('${cid}');">`,
				`<span>${c`clear`.uf()}</span>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="trash2" d=""></path>`,
				`</svg>`,
				`</a>`,
				`</p>`,
			].join(''));
			out.push([
				`<p class="no-margin-bottom">`,
				`<a class="button button-block button-icon button-tertiary" `,
				`href="javascript:mapops.exportqueries('${cid}');">`,
				`<span>${c`export`.uf()}</span>`,
				`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
				`<path class="download" d=""></path>`,
				`</svg>`,
				`</a>`,
				`</p>`,
			].join(''));
			Object.keys(d.maplayers[cid].queries).forEach(g => {
				let color = '#195de6';
				out.push([
					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="${cid}-map-layers-queries-${d.maplayers[cid].queries[g].name}" `,
					`name="${cid}-map-layers-queries-${d.maplayers[cid].queries[g].name}" `,
					`onclick="javascript:mapops.togglelayer('queries','${d.maplayers[cid].queries[g].name}', '${cid}');"`,
					`${d.maplayers[cid].queries[g].visible ? ' checked' : ''}>`,
					`<span class="control-indicator" style="border:3px ${color} solid"></span>`,
					`<span class="control-label" style="color:${color}">`,
					`${c(d.maplayers[cid].queries[g].title).uf()}`,
					`</span>`,
					`</label>`,
					`</p>`,
				].join(''));
			});
		}
		return out.join('\n');
	},
	togglelayer: (group, layer, cid = 'base') => {
		if(!group) return;
		if(!layer) return;
		if(!d.map[cid]) return;

		if(group === 'base') {
			Object.keys(d.maplayers[cid].base)
				.forEach(o => d.maplayers[cid].base[o].visible = d.maplayers[cid].base[o].name === layer);
		} else {
			d.maplayers[cid][group][layer].visible = !d.maplayers[cid][group][layer].visible;
		}
		mapops.drawlayers(cid);
	},
	togglesublayer: (layer, lstatus = false, cid = 'base') => {
		if(!layer) return;
		if(lstatus) {
			d.maplayers[cid].data.kmeans.source.layers[layer].layer.addTo(d.map[cid]);
		} else {
			d.map[cid].removeLayer(d.maplayers[cid].data.kmeans.source.layers[layer].layer);
		}
		mapops.sendoverlaystoback(cid);
	},
	qgraticules: (name, cid = 'base') => d.map[cid].addLayer(L.graticule({
		onEachFeature: (feature, layer) => {
			L.marker(feature.properties.coordinates, {
				interactive: false,
				clickable: false,
				icon: L.divIcon({
					iconSize: [0, 0],
					iconAnchor: [-2, -2],
					className: 'leaflet-grid-label',
					html: '<div>' + feature.properties.name + '</div>'
				}),
			}).addTo(d.map[cid]);
		},
	})),
	qoverlays: (name, cid = 'base') => {
		if(!name) return;
		if(!d.mapgeojsonlayers.map(o => o.name).includes(name)) return;
		screen.siteoverlay(true);
		let tmptext = byId(`${cid}-map-overlays`).innerHTML;
		byId(`${cid}-map-overlays`).classList.add('spinner');
		sleep(50).then(() => {
			fetchasync(`./assets/data/geojson/${name}.json`).then(res => {
				let nindex = 0;
				let tmplay = L.geoJSON(res, {
					style: function(feature) {
						return {
							color: res.css.properties.color,
							opacity: res.css.properties.opacity,
							weight: res.css.properties.weight,
							fillColor: res.css.properties.fillColor,
							fillOpacity: res.css.properties.fillOpacity,
						};
					},
					pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.medium,
						radius: feature.properties.range, 
					}),
					onEachFeature: function (feature, layer) {						
						let tmp = [];
						let fnm = d.mapgeojsonlayers.find(o => o.name === name).fieldname;
						d.mapgeojsonlayers.find(o => o.name === name).field.forEach((k, i) => {
							if(isNumber(feature.properties[k])) {
								tmp.push([
									c(fnm[i]).uf(),
									Number(feature.properties[k]).toLocaleString(l)
								].join(': '));
							} else {
								tmp.push([
									c(fnm[i]).uf(),
									feature.properties[k]
								].join(': '));
							}
						});
						let action = Object.keys(d.mapdata).length ? `'${name}',${nindex},'${cid}'` : '';
						layer.on('click', function(e) {
							d.maplayers[cid].infopanel.update(maphelpers.makepanelinfo(cid, {
								markercolor: d.mapgeojsonlayers.find(o => o.name === name).fillColor,
								title: c(name).uf(),
								msg: tmp.join('. '),
								area: turf.area(layer.toGeoJSON()) / 1000000,
								action: action,
							}));
						});
						nindex++;
					}
				});
				nindex = undefined;
				d.map[cid].addLayer(tmplay);
				mapops.fitbounds(cid);
		
				mapops.sendoverlaystoback(cid);
				
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
				tmplay = undefined;
			})
			.catch(err => {
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
				throw new AppError(c`map-overlay` + ': ' + err);				
			});
		});
	},
	qdata: (name, cid = 'base') => {
		if(!name) return;
		screen.siteoverlay(true);
		byId(`${cid}-map-overlays`).classList.add('spinner');
		sleep(50).then(() => {
			if(name === 'clusters') {
				let shownLayer;
				let polygon;
				let cluster = L.markerClusterGroup();

				let tmpdata = {
					type: 'FeatureCollection', 
					features: d.mapdata.features.filter(o => mapops.filtermapdata(cid, o))
				};
				let tmplay = L.geoJSON(tmpdata, {
					pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.medium,
						weight: 2,
						radius: feature.properties.range,
					}),
					onEachFeature: function (feature, layer) {
						layer.bindPopup(maphelpers.makepopupinfo(feature));
					}
				});
				cluster.addLayer(tmplay);
				d.map[cid].addLayer(cluster);
				
				tmplay = null;
				
				function removePolygon() {
					if (shownLayer) {
						shownLayer.setOpacity(1);
						shownLayer = null;
					}
					if (polygon) {
						if(d.map[cid]) d.map[cid].removeLayer(polygon);
						polygon = null;
					}
				}
			
				cluster.on('clustermouseover', function (a) {
					removePolygon();
					a.layer.setOpacity(0.2);
					shownLayer = a.layer;
					polygon = L.polygon(a.layer.getConvexHull());
					d.map[cid].addLayer(polygon);
				});
				cluster.on('clustermouseout', removePolygon);
			
				d.map[cid].on('zoomend', removePolygon);

				cluster = tmplay = shownLayer = undefined;
				mapops.fitbounds(cid);
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
			} else if(name === 'located') {
				function dstyle(feature) {
					return {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.low,
						weight: 1,
						radius: feature.properties.radius,
				    };
				}
				function highlightstyle(feature) {
					return {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.medium,
						weight: 1,
						radius: feature.properties.radius * 1.2,
				    };
				}
				function highlightdot(e) {
					let layer = e.target;
					let dotstylehighlight = highlightstyle(layer.feature);
					layer.setStyle(dotstylehighlight);
					if (!L.Browser.ie && !L.Browser.opera) {
						layer.bringToFront();
					}
				}
				function resetdothighlight(e) {
					e.target.setStyle(dstyle(e.target.feature));
				}
				let tmpdata = {
					type: 'FeatureCollection', 
					features: d.mapdata.features.filter(o => mapops.filtermapdata(cid, o))
				};

				let tmplay = L.geoJSON(tmpdata, {
					pointToLayer: (feature, latlng) => {
						return new L[`${feature.properties.shape}Marker`](latlng, dstyle(feature))
					},
					onEachFeature: function (feature, layer) {
						
						layer.on({
							mouseover: highlightdot,
							mouseout: resetdothighlight
						});
						
						layer.bindPopup(maphelpers.makepopupinfo(feature));
						d.mapoms[cid].addMarker(layer);
					},
				});
				d.map[cid].addLayer(tmplay);
				tmplay = null;
				
				mapops.fitbounds(cid);
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
			} else if(name === 'graduated') {
				function dstyle(feature) {
					return {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.low,
						weight: 1,
						radius: feature.properties.range,
				    };
				}
				function highlightstyle(feature) {
					return {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: d.mapiconfeatures.opacity.medium,
						weight: 1,
						radius: feature.properties.range * 1.2,
				    };
				}
				function highlightdot(e) {
					let layer = e.target;
					let dotstylehighlight = highlightstyle(layer.feature);
					layer.setStyle(dotstylehighlight);
					if (!L.Browser.ie && !L.Browser.opera) {
						layer.bringToFront();
					}
				}
				function resetdothighlight(e) {
					e.target.setStyle(dstyle(e.target.feature));
				}
				let tmpdata = {
					type: 'FeatureCollection', 
					features: d.mapdata.features.filter(o => mapops.filtermapdata(cid, o))
				};

				let tmplay = L.geoJSON(tmpdata, {
					pointToLayer: (feature, latlng) => {
						return new L[`${feature.properties.shape}Marker`](latlng, dstyle(feature))
					},
					onEachFeature: function (feature, layer) {
						layer.on({
							mouseover: highlightdot,
							mouseout: resetdothighlight
						});						
						layer.bindPopup(maphelpers.makepopupinfo(feature));
						d.mapoms[cid].addMarker(layer);
					},
				});
				d.map[cid].addLayer(tmplay);
				tmplay = null;
				
				mapops.fitbounds(cid);
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
			} else if(name === 'kmeans') {
				fetchasync(`./assets/data/geojson/world_basic.json`).then(res => {
					let points = turf.featureCollection(d.mapdata.features.filter(o => mapops.filtermapdata(cid, o)));
					let cluster = turf.clustersKmeans(points, {
						numberOfClusters: 50,
						mutate: true
					});
					let groups = cluster.features.map(o => o.properties).groupByMultiple(['rkey', 'cluster']);
					let colors = Object.keys(groups).map(o => dbe.getcolorfromslug(o));
					let result = {};
					let layers = {};

					Object.keys(groups).forEach(rk => {
						let total = Object.values(groups[rk]).map(o => o.length).sum();
						Object.keys(groups[rk]).forEach((cl, i) => {
							let obj = {
								name: rk,
								value: groups[rk][cl].length,
								total: total,
								cluster: parseInt(cl, 10),
								color: groups[rk][cl][0].color,
								point: turf.point(groups[rk][cl][0].centroid)
							};
							result[rk] = result[rk] || [];
							result[rk].push(obj);
						});
					});

					Object.keys(result).forEach((o, i) => {
						let basearray = Object.values(result[o]);
						let basecolor = basearray[0].color;
						let total = Object.values(basearray).map(o => o.value).sum();
						let tmpovl = L.geoJSON(res, {
							style: function(feature) {
								let obj = {
									color: basecolor,
									opacity: 1,
									weight: 1,
									fillColor: basecolor,
									fillOpacity: 0,
								};
								return obj;
							},
							onEachFeature: function (feature, layer) {
								let values = [];
								basearray.forEach(f => {
									let tmplayer = layer.toGeoJSON()
									if(turf.booleanPointInPolygon(f.point, turf.feature(feature.geometry))) {
										values.push(f.value);
									}
								});
								if(values.length) {
									layer.setStyle({
										fillOpacity: toolkit.getnumberinrange(values.sum(), d.mapchoroplethranges) / 10
									});
									let svalue = values.sum().toLocaleString(l);
									let stotal = total.toLocaleString(l);
									layer.bindPopup([
										c(feature.properties.name),
										`${svalue}/${stotal} ${c`items`}`,
									].join(': '));
									svalue = stotal = values = undefined;
								}
							}			
						});
						layers[`c${i}`] = {
							name: `${c`choropleth`.uf()}. ${c(o).uf()}`,
							layer: tmpovl,
						};

						let basegeojson = basearray.map((m, i) => {
							let rsize = d.mapiconfeatures.size.big * toolkit.getnumberinrange(m.value, d.mapchoroplethranges);
							return {
								type: 'Feature',
								properties: {
									name: m.name,
									value: m.value,
									total: m.total,
									cluster: m.cluster,
									radius: rsize * 2,
									color: m.color,
								},
								geometry: {
									type: 'Point',
									coordinates: [
										m.point.geometry.coordinates[0], 
										m.point.geometry.coordinates[1]
									]
								}						
							};
						});
						let tmplay = L.geoJSON(basegeojson, {
							pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
								fillColor: feature.properties.color,
								fill: true,
								color: feature.properties.color,
								stroke: true,
								fillOpacity: d.mapiconfeatures.opacity.low,
								weight: 2,
								radius: feature.properties.range,
							}),
							onEachFeature: function (feature, layer) {
								let svalue = feature.properties.value.toLocaleString(l);
								let stotal = feature.properties.total.toLocaleString(l);
								layer.bindPopup([
									c(feature.properties.name),
									`${svalue}/${stotal} ${c`items`}`,
								].join(': '));
								svalue = stotal = undefined;
							}
						});
						layers[`p${i}`] = {
							name: `${c`graduated-points`.uf()}. ${c(o).uf()}`,
							layer: tmplay,
						};

						basearray = basecolor = total = tmpovl = basegeojson = tmplay = undefined;
					});
					
					if(d.maplayers[cid].data.kmeans.source) {
						if(d.maplayers[cid].data.kmeans.source.layers) {
							Object.keys(d.maplayers[cid].data.kmeans.source.layers).forEach(o => {
								d.maplayers[cid].data.kmeans.source.layers[o].layer.remove();
							});
						}
						if(d.maplayers[cid].data.kmeans.source.panel) {
							d.maplayers[cid].data.kmeans.source.panel.remove();	
						}
						if(d.maplayers[cid].data.kmeans.source.legend) {
							d.maplayers[cid].data.kmeans.source.legend.remove();	
						}
					};
					d.maplayers[cid].data.kmeans.source = {
						panel: null,
						legend: null,
						layers: layers
					};
					
					d.maplayers[cid].data.kmeans.source.panel = L.control();
					d.maplayers[cid].data.kmeans.source.panel.onAdd = function (map) {
						this._div = L.DomUtil.create('div', 'leaflet-linfo leaflet-linfo-panel'); 
						this.update();
						return this._div;
					};
					d.maplayers[cid].data.kmeans.source.panel.update = function (props) {
						this._div.innerHTML = [
							Object.keys(d.maplayers[cid].data.kmeans.source.layers).map(o => {
								return [
									`<label class="control control-xxs checkbox">`,
									`<input type="checkbox"`, 
									`id="${cid}-map-kmeans-${o}" name="${cid}-map-kmeans-${o}" `,
									`onclick="javascript:mapops.togglesublayer('${o}', this.checked, '${cid}');"`,
									`>`,
									`<span class="control-indicator"></span>`,
									`<span class="control-label font-size-xs">`,
									`${d.maplayers[cid].data.kmeans.source.layers[o].name}</span>`,
									`</label>`,
								].join('\n');
							}).join('\n'),
						].join('\n');
					};
					d.maplayers[cid].data.kmeans.source.panel.addTo(d.map[cid]);
					
					d.maplayers[cid].data.kmeans.source.legend = L.control({position: 'bottomright'});
					d.maplayers[cid].data.kmeans.source.legend.onAdd = function (map) {
						let div = L.DomUtil.create('div', 'leaflet-linfo leaflet-linfo-legend');
						let grades = d.mapchoroplethranges;
						let labels = [];
						let getcolors = grade => {
							return colors
								.map(c => `<i style="background:${c};opacity:${grade / 10};"></i>`)
								.join('\n');
						};
						for (let i = 0; i < grades.length; i++) {
							div.innerHTML +=
								getcolors(i + 1) + 
								grades[i].toLocaleString(l) + 
								(grades[i + 1] ? '&ndash;' + grades[i + 1].toLocaleString(l) + '<br>' : '+');
						}
						grades = labels = undefined;
						return div;
					};
					d.maplayers[cid].data.kmeans.source.legend.addTo(d.map[cid]);
					
					points = cluster = groups = result = layers = undefined;
					mapops.fitbounds(cid);
					screen.siteoverlay(false);
					byId(`${cid}-map-overlays`).classList.remove('spinner');
				});
			} else if(name === 'timeline') {
				//${cid}-map-time-range-wrapper				
			} else {
				let tmpleg = d.maptransformations[cid].legend;
				let tmpkys = Object.keys(tmpleg).filter(o => tmpleg[o]);
				tmpkys.forEach(k => {
					let hlayer = L.heatLayer(d.mapdata.features
						.filter(o => mapops.filtermapdata(cid, o))
						.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
						.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
						{
							minOpacity: 0.1, 
							gradient: {
								0.4: window.settings.hmaplow, 
								0.65: window.settings.hmapmedium, 
								1: window.settings.hmaphigh
							}
						}
					);
					d.map[cid].addLayer(hlayer);
					
					hlayer = undefined;
				});
				mapops.fitbounds(cid);
				screen.siteoverlay(false);
				byId(`${cid}-map-overlays`).classList.remove('spinner');
			}
			
			mapops.sendoverlaystoback(cid);
		});
	},
	qqueries: (name, cid = 'base') => {
		d.map[cid].addLayer(d.maplayers[cid].queries[name].layer);
		if(d.maplayers[cid].queries[name].isflowlayer) {
			let ltitle = d.maplayers[cid].queries[name].title || c`no-title`;
			let origin = d.maplayers[cid].queries[name].origin || {id: null};
			d.maplayers[cid].queries[name].layer.on('click', function(e) {
				let popup = null;
				let out = [];
				if (e.sharedOriginFeatures) {
					out.push(maphelpers.makeflowpoup(
						ltitle, 
						c`source`,
						origin, 
						e.sharedOriginFeatures,
						cid
					));
		        }
				if (e.sharedDestinationFeatures) {
					out.push(maphelpers.makeflowpoup(
						ltitle, 
						c`target`,
						origin, 
						e.sharedDestinationFeatures,
						cid
					));
				}
				popup = L.popup()
					.setLatLng(e.latlng)
					.setContent(out.join('\n'))
					.openOn(d.map[cid]);
				popup = out = undefined;
			});
			let bounds = d.maplayers[cid].queries[name].layer.getBounds();
			if(bounds.isValid()) {
				d.map[cid].fitBounds(d.maplayers[cid].queries[name].layer.getBounds());
			}
			bounds = undefined;
		}
		mapops.sendoverlaystoback(cid);
	},
	findpoint: (item, inputfield, cid = 'base') => {
		let bname = String(item.label).slugify().shorten(30);
		let tname = String(item.label).shorten(30);
		let cname = null;
		function getpointsinbuffer(lat, lng, rkey) {
			if(!isNumber(lat) || !isNumber(lng)) return turf.featureCollection([]);
			let points = turf.featureCollection(
				d.mapdata.features
					.filter(o => mapops.filtermapdata(cid, o))
					.filter(o => rkey ? o.properties.rkey === rkey : true)
			);
			let point = turf.point([lng, lat]);
			let radius = Number(d.maptransformations[cid].buffer) / 1000;
			let buffer = turf.buffer(point, radius, {units: 'kilometers'});
			let pip = turf.pointsWithinPolygon(points, buffer);
			let out = {
				type: 'FeatureCollection',
				features: pip.features.filter(o => {
					if(!o.geometry.coordinates.length === 2) return false;
					if(!isNumeric(o.geometry.coordinates[0]) || !isNumeric(o.geometry.coordinates[1])) return false;
				}),
			}
			
			points = point = radius = buffer = undefined;
			return pip;
		}
		
		inputfield.value = item.label;
		inputfield.dataset.pid = item.value;
		inputfield.dataset.txt = item.label;

		d.mapsearch[cid].text = item.label;
		d.mapsearch[cid].id = item.value;
		d.map[cid].setView([item.latitude, item.longitude], 16);
		
		let marker = new L.circleMarker([item.latitude, item.longitude], {
			fillColor: item.color,
			color: item.color,
			radius: item.range, 
			fillOpacity: d.mapiconfeatures.opacity.medium
		});

		marker.bindPopup(
			maphelpers.makepopupinfo({
				properties: {
					id: item.value, 
					rkey: item.rkey,
					color: item.color,
					longitude: item.longitude, 
					latitude: item.latitude,
					size: item.size,
					range: item.range,
				}
			})
		);
		d.maplayers[cid].queries[bname] = {
			name: bname,
			title: tname,
			visible: true,
			source: null,
			isflowlayer: false,
			layer: marker
		};

		marker = undefined;
		
		if(d.maptransformations[cid].buffer > 0) {
			byId(`${cid}-map-queries`).classList.add('spinner');
			let met = Number(d.maptransformations[cid].buffer).toLocaleString(l);
			cname = `${c`buffer`.uf()} (${met}). ${bname}`;
			let xname = `${c`buffer`.uf()} (${met}). ${c`coverage`.uf()}. ${bname}`;
			let cluster = L.markerClusterGroup();
			let points = getpointsinbuffer(item.latitude, item.longitude);
			let radius = Number(d.maptransformations[cid].buffer);

			let tmplay = L.geoJSON(points.features, {
				pointToLayer: (feature, latlng) => new L.circleMarker(latlng, {
					fillColor: dbe.getcolorfromslug(feature.properties.rkey),
					color: dbe.getcolorfromslug(feature.properties.rkey),
					radius: feature.properties.range, 
					fillOpacity: d.mapiconfeatures.opacity.medium
				}),
				onEachFeature: function (feature, layer) {
					layer.bindPopup(maphelpers.makepopupinfo(feature, item.latitude, item.longitude));
				}
			});
			cluster.addLayer(tmplay);

			d.maplayers[cid].queries[xname] = {
				name: xname,
				title: `${c`buffer`.uf()} (${met}). ${c`coverage`.uf()}. ${tname}`,
				visible: true,
				source: null,
				isflowlayer: false,
				layer: L.circle([item.latitude,item.longitude], radius, {
					color: 'white',
					weight: 3,
					opacity: 1,
					fillColor: 'none',
					fillOpacity: 0,
					dashArray: '10,5'
				}).bindTooltip(maphelpers.buffermeasure(radius))
			};
			d.map[cid].addLayer(d.maplayers[cid].queries[xname].layer);
			d.maplayers[cid].queries[cname] = {
				name: cname,
				title: `${c`buffer`.uf()} (${met}). ${tname}`,
				data: {
					mainid: item.value,
					ids: new Set(points.features.map(o => o.properties.id))
				},
				visible: true,
				source: null,
				isflowlayer: false,
				layer: cluster
			};
			d.map[cid].addLayer(d.maplayers[cid].queries[cname].layer);

			tmplay = cluster = points = xname = radius = undefined;
			byId(`${cid}-map-queries`).classList.remove('spinner');
		}
		if(d.maptransformations[cid].related) {	
			let tmpname = 'related';
			cname = `${c(tmpname).uf()}. ${bname}`;
			let pid = isNumber(inputfield.dataset.pid) ? parseInt(inputfield.dataset.pid, 10) : item.value;
			byId(`${cid}-map-queries`).classList.add('spinner');
			dbq.singlemap(pid).then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let flo = dbe.makegeojson(res[tmpname].filter(o => isvalidflowpoint(o)));
				let main = res.main[0] || {
					id: null,
					lat: null,
					lon: null,
					radius: null,
					color: null,
					title: null,
				};
				
				d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`] = {
					name: `${c(tmpname).uf()}. ${bname}`,
					title: `${c(tmpname).uf()}. ${tname}`,
					visible: true,
					source: null,
					isflowlayer: true,
					origin: {
						id: main.id,
						lat: main.origin_lat,
						lon: main.origin_lon,
						radius: main.range,
						color: main.color,
						title: main.title,
					},
					layer: L.canvasFlowmapLayer(flo, {				
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
							animationStarted: true,
							animationEasingFamily: 'Linear',
							animationEasingType: 'None',
							animationDuration: 5000,
							pathDisplayMode: 'all',
							wrapAroundCanvas: true,
							style: (feature, latlng) => {
								if (feature.properties.isOrigin) {
									return {
										color: dbe.getcolorfromslug(feature.properties.rkey),
										fillColor: dbe.getcolorfromslug(feature.properties.rkey),
										fillOpacity: d.mapiconfeatures.opacity.high,
										radius: feature.properties.range, 
									};
								} else {
									return {
										color: dbe.getcolorfromslug(feature.properties.rkey),
										fillColor: dbe.getcolorfromslug(feature.properties.rkey),
										fillOpacity: d.mapiconfeatures.opacity.low,
										radius: feature.properties.range,
										dashArray: '4 1'
									};
								}
							},
							animatedCanvasBezierStyle: {
								type: 'simple',
								symbol: {
									strokeStyle: main.color || 'rgb(0, 255, 255)',
									lineWidth: 5,
									lineDashOffsetSize: 5, 
									lineCap: 'round',
									shadowColor: main.color || 'rgb(0, 255, 255)',
									shadowBlur: 20
								}
							},
							canvasBezierStyle: {
								type: 'simple',
								symbol: {
									strokeStyle: main.color || 'rgba(0, 255, 0, 0.5)',
									lineWidth: 0.75,
									lineCap: 'round',
									shadowColor: main.color || 'rgb(0, 255, 255)',
									shadowBlur: 20,
									dashArray: '10 5'
								}
							},
						}
					),
				};
				pid = isvalidflowpoint = flo = tmpname = main = undefined;
				byId(`${cid}-map-queries`).classList.remove('spinner');
				mapops.drawlayers(cid);
			});
		}
		if(d.maptransformations[cid].neighbourhood) {			
			let tmpname = 'neighbourhood';
			cname = `${c(tmpname).uf()}. ${bname}`;
			let pid = isNumber(inputfield.dataset.pid) ? parseInt(inputfield.dataset.pid, 10) : item.value;
			byId(`${cid}-map-queries`).classList.add('spinner');
			dbq.singlemap(pid).then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let flo = dbe.makegeojson(res[tmpname].filter(o => isvalidflowpoint(o)));

				let main = res.main[0] || {
					id: null,
					lat: null,
					lon: null,
					radius: null,
					color: null,
					title: null,
				};
				d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`] = {
					name: `${c(tmpname).uf()}. ${bname}`,
					title: `${c(tmpname).uf()}. ${tname}`,
					visible: true,
					source: null,
					isflowlayer: true,
					origin: {
						id: main.id,
						lat: main.origin_lat,
						lon: main.origin_lon,
						radius: main.range,
						color: main.color,
						title: main.title,
					},
					layer: L.canvasFlowmapLayer(flo, {				
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
							animationStarted: true,
							animationEasingFamily: 'Linear',
							animationEasingType: 'None',
							animationDuration: 5000,
							pathDisplayMode: 'all',
							wrapAroundCanvas: true,
							style: (feature, latlng) => {
								if (feature.properties.isOrigin) {
									return {
										color: dbe.getcolorfromslug(feature.properties.rkey),
										fillColor: dbe.getcolorfromslug(feature.properties.rkey),
										fillOpacity: d.mapiconfeatures.opacity.medium,
										radius: feature.properties.range,
									};
								} else {
									return {
										color: dbe.getcolorfromslug(feature.properties.rkey),
										fillColor: dbe.getcolorfromslug(feature.properties.rkey),
										fillOpacity: d.mapiconfeatures.opacity.low,
										radius: feature.properties.range,
										dashArray: '4 1'
									};
								}
							},
							animatedCanvasBezierStyle: {
								type: 'simple',
								symbol: {
									strokeStyle: main.color || 'rgb(255, 0, 255)',
									lineWidth: 5,
									lineDashOffsetSize: 25, 
									lineCap: 'round',
									shadowColor: main.color || 'rgb(0, 255, 0)',
									shadowBlur: 20
								}
							},
							canvasBezierStyle: {
								type: 'simple',
								symbol: {
									strokeStyle: main.color || 'rgba(255, 0, 255, 0.5)',
									lineWidth: 0.75,
									lineCap: 'round',
									shadowColor: main.color || 'rgb(0, 255, 0)',
									shadowBlur: 40
								}
							},
						}
					),
				};

				pid = isvalidflowpoint = flo = tmpname = main = undefined;
				byId(`${cid}-map-queries`).classList.remove('spinner');
				mapops.drawlayers(cid);
			});
		}
		if(d.maptransformations[cid].relatedhmap) {	
			let tmpname = 'related-hmap';
			cname = `${c(tmpname).uf()}. ${bname}`;
			let pid = isNumber(inputfield.dataset.pid) ? parseInt(inputfield.dataset.pid, 10) : item.value;
			byId(`${cid}-map-queries`).classList.add('spinner');
			dbq.singlemap(pid).then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let flo = dbe.makegeojson(res.related.filter(o => isvalidflowpoint(o)));
				let main = res.main[0] || {
					id: null,
					lat: null,
					lon: null,
					radius: null,
					color: null,
					title: null,
				};
				d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`] = {
					name: `${c(tmpname).uf()}. ${bname}`,
					title: `${c(tmpname).uf()}. ${tname}`,
					visible: true,
					source: null,
					isflowlayer: false,
					origin: {
						id: main.id,
						lat: main.origin_lat,
						lon: main.origin_lon,
						radius: main.range,
						color: main.color,
						title: main.title,
					},
					layer: L.heatLayer(flo.features
						.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
						.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
						{minOpacity: 0.3, gradient: {0.4: '#e1ebfe', 0.65: '#87acf7', 1: '#2e6deb'}}
					),
				};
				d.map[cid].addLayer(d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`].layer);
				pid = isvalidflowpoint = flo = tmpname = main = undefined;
				byId(`${cid}-map-queries`).classList.remove('spinner');
				mapops.drawlayers(cid);
			});
		}
		if(d.maptransformations[cid].neighbourhoodhmap) {	
			let tmpname = 'neighbourhood-hmap';
			cname = `${c(tmpname).uf()}. ${bname}`;
			let pid = isNumber(inputfield.dataset.pid) ? parseInt(inputfield.dataset.pid, 10) : item.value;
			byId(`${cid}-map-queries`).classList.add('spinner');
			dbq.singlemap(pid).then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let flo = dbe.makegeojson(res.neighbourhood.filter(o => isvalidflowpoint(o)));
				let main = res.main[0] || {
					id: null,
					lat: null,
					lon: null,
					radius: null,
					color: null,
					title: null,
				};
				
				d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`] = {
					name: `${c(tmpname).uf()}. ${bname}`,
					title: `${c(tmpname).uf()}. ${tname}`,
					visible: true,
					source: null,
					isflowlayer: false,
					origin: {
						id: main.id,
						lat: main.origin_lat,
						lon: main.origin_lon,
						radius: main.range,
						color: main.color,
						title: main.title,
					},
					layer: L.heatLayer(flo.features
						.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
						.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
						{minOpacity: 0.3, gradient: {0.4: '#fee6f6', 0.65: '#f787d1', 1: '#eb2eac'}}
					),
				};
				d.map[cid].addLayer(d.maplayers[cid].queries[`${c(tmpname).uf()}. ${bname}`].layer);
				pid = isvalidflowpoint = flo = tmpname = main = undefined;
				byId(`${cid}-map-queries`).classList.remove('spinner');
				mapops.drawlayers(cid);
			});
		}
		if(d.maptransformations[cid].tin) {
			function vstyle(feature) {
				return {
					fillColor: '#e07859', 
					fillOpacity: .1,  
					weight: 2,
					opacity: .4,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				let tmpname = cname;
				layer.on('click', function (e) { 
					d.maplayers[cid].queries[tmpname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'yellow',
				weight: 2,
				opacity: .5,
				fillOpacity: .2
			};
			byId(`${cid}-map-queries`).classList.add('spinner');
			cname = `${c`tin`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude, item.rkey);
			let tmplay = turf.tin(rpoints);

			d.maplayers[cid].queries[cname] = {
				name: cname,
				title: `${c`tin`.uf()}. ${tname}`,
				visible: true,
				source: null,
				isflowlayer: false,
				layer: L.geoJSON(tmplay.features, {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.map[cid].addLayer(d.maplayers[cid].queries[cname].layer);
			byId(`${cid}-map-queries`).classList.remove('spinner');
			rpoints = tmplay = vstyle = vfeatures = undefined;
		}
		if(d.maptransformations[cid].convex) {
			function vstyle(feature) {
				return {
					fillColor: '#85d1d4', 
					fillOpacity: .1,  
					weight: 2,
					opacity: .4,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				let tmpname = cname;
				layer.on('click', function (e) { 
					d.maplayers[cid].queries[tmpname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'yellow',
				weight: 2,
				opacity: .5,
				fillOpacity: .2
			};
			byId(`${cid}-map-queries`).classList.add('spinner');
			cname = `${c`convex`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude);
			let tmplay = turf.convex(rpoints);

			d.maplayers[cid].queries[cname] = {
				name: cname,
				title: `${c`convex`.uf()}. ${tname}`,
				visible: true,
				source: null,
				isflowlayer: false,
				layer: L.geoJSON(tmplay, {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.map[cid].addLayer(d.maplayers[cid].queries[cname].layer);
			byId(`${cid}-map-queries`).classList.remove('spinner');
			rpoints = tmplay = undefined;
		}
		if(d.maptransformations[cid].envelope) {
			function vstyle(feature) {
				return {
					fillColor: 'pink', 
					fillOpacity: .1,  
					weight: 2,
					opacity: .4,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				let tmpname = cname;
				layer.on('click', function (e) { 
					d.maplayers[cid].queries[tmpname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'purple',
				weight: 2,
				opacity: .5,
				fillOpacity: .2
			};
			byId(`${cid}-map-queries`).classList.add('spinner');
			cname = `${c`envelope`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude)
			let tmplay = turf.envelope(rpoints);

			d.maplayers[cid].queries[cname] = {
				name: cname,
				title: `${c`envelope`.uf()}. ${tname}`,
				visible: true,
				source: null,
				isflowlayer: false,
				layer: L.geoJSON([tmplay], {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.map[cid].addLayer(d.maplayers[cid].queries[cname].layer);
			byId(`${cid}-map-queries`).classList.remove('spinner');
			rpoints = tmplay = undefined;
		}
		if(d.maptransformations[cid].voronoi) {
			function vstyle(feature) {
				return {
					fillColor: 'CornflowerBlue', 
					fillOpacity: .1,
					weight: 2,
					opacity: .5,
					color: 'DarkBlue',
					dashArray: '1 4'
				};
			}
			function vfeatures(feature, layer) {
				let tmpname = cname;
				layer.on('click', function (e) { 
					d.maplayers[cid].queries[tmpname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'red',
				weight: 2,
				opacity: .5,
				fillOpacity: .2
			};
			byId(`${cid}-map-queries`).classList.add('spinner');
			cname = `${c`voronoi`.uf()}. ${bname}`;
			
			let points = getpointsinbuffer(item.latitude, item.longitude, item.rkey);
			
			try {
				let voronoi = turf.voronoi(points);			
				d.maplayers[cid].queries[cname] = {
					name: cname,
					title: `${c`voronoi`.uf()}. ${tname}`,
					visible: true,
					source: null,
					isflowlayer: false,
					layer: L.geoJSON(voronoi.features.filter(Boolean), {style: vstyle, onEachFeature: vfeatures}),
				};
				d.map[cid].addLayer(d.maplayers[cid].queries[cname].layer);
				byId(`${cid}-map-queries`).classList.remove('spinner');
				points = voronoi = undefined;
				bname = tname = cname = undefined;
			} catch(error) {
				byId(`${cid}-map-queries`).classList.remove('spinner');
				points = undefined;
				bname = tname = cname = undefined;
				screen.siteoverlay(false);
				throw new AppWarning(c`unsuccessful-operation`.uf() + ': ' + error);
			};
		}
		
		mapops.fitbounds(cid);

		mapops.sendoverlaystoback(cid);

		if(Object.keys(d.maplayers[cid].queries).length) {
			byId(`${cid}-map-queries-list`).classList.remove('hide');
			if(cid === 'base') document.querySelector(`#${cid}-map-queries button`).classList.remove('disabled');
		} else {
			byId(`${cid}-map-queries-list`).classList.add('hide');
			if(cid === 'base') document.querySelector(`#${cid}-map-queries button`).classList.add('disabled');
		}
	},
	generatebasepoints: (filtered = true) => {
		let filmap;
		if(filtered) {
			let set = new Set(dbe._filterids());
			filmap = dbm.points(false).filter(o => set.has(o.ID));
			set = undefined;
		} else {
			filmap = dbm.points(false);
		}
		d.mapdatauuid = d.filteruuid;
		let datesstart = dbm.startdates();
		let datesend = dbm.enddates();
		let genders = dbm.genders();
		let ownership = dbm.ownership();
		let isyearok = year => {
			return Number(year) >= d.maptimelimits.low && Number(year) <= d.maptimelimits.high;		
		};
		let baselist = mapops.uniquelist(
			[].concat(Object.values(genders).map(o => o.value), Object.values(ownership).map(o => o.value))
		);
		
		let fildata = filmap.filter(o => o.value).map(o => {
			let sdat = datesstart[o.ID] || null;
			let syea = !sdat ? null : String(sdat.value).dateparts('year').year;
			let edat = datesend[o.ID] || null;
			let eyea = !edat ? null : String(edat.value).dateparts('year').year;
			let fyea = isyearok(syea) ? syea : isyearok(eyea) ? eyea : null;
			let fgen = genders[o.ID] ? genders[o.ID].value : null;
			let fown = ownership[o.ID] ? ownership[o.ID].value : null;
			
			let features = baselist.find(f => f.name === fown || f.name === fgen) || null;
			
			let fshp = features ? features.symbol : 'Circle';
			let fcol = dbe.getcolorfromslug(d.store.pos[o.ID].rkey);
			let frat = features ? features.ratio : 1;
			let frad = fshp === 'Circle' ? d.mapiconfeatures.size.micro : d.mapiconfeatures.size.tiny;
			let fopa = features ? features.opacity : 1;
			
			let obj = {};
			obj.id = o.ID;
			obj.title = toolkit.titleformat(d.store.pos[o.ID].value);
			obj.rkey = d.store.pos[o.ID].rkey;
			obj.color = fcol;
			obj.latitude = o.value.points().latitude;
			obj.longitude = o.value.points().longitude;
			obj.radius = frad * frat;
			obj.shape = fshp;
			obj.year = fyea;
			obj.opacity = fopa;
			obj.gender = fgen;
			obj.ownership = fown;
			sdat = syea = edat = eyea = fyea = fgen = fown = undefined;
			features = fshp = fcol = frat = frad = fopa = undefined;
			return obj;
		}).filter(o => o.latitude && o.longitude); 
		filmap = datesstart = datesend = genders = ownership = isyearok = undefined;
		baselist = undefined;
		return fildata.length ? dbe.makegeojson(fildata, true) : null;
	},
	uniquelist: array => {
		let ring = new Circular(d.mapshapes);
		let out = [];
		array.unique().sort().forEach((o, i) => {
			out.push({name: o, symbol: ring.next(), index: i});
		});
		ring = undefined;
		return out.map(o => Object.assign({}, o, {
			color: d.mapcolors[o.index], 
			ratio: d.mapratios[o.index],
			opacity: d.mapopacity[o.index],
		}));
	},
	makemapdata: (cid = 'base') => {
		d.mapdata = mapops.generatebasepoints(true);
	},
	exportqueries: (cid = 'base') => {
		screen.siteoverlay(true);
		sleep(50).then(() => {
			let out = [];
			out.push([
				'query_name',
				'main_id',
				'main_title',
				'related_id',
				'related_rkey',
				'rrelated_title'
			]);
			Object.keys(d.maplayers[cid].queries).forEach(q => {
				if(d.maplayers[cid].queries[q].data) {
					let dat = d.maplayers[cid].queries[q].data;
					let main = d.store.pos[dat.mainid];
					let result = Object.values(d.store.pos).filter(o => dat.ids.has(o.ID));
					result.forEach(r => {
						out.push([
							q,
							main.ID,
							toolkit.titleformat(main.value),
							r.ID,
							c(r.rkey),
							toolkit.titleformat(r.value)
						]);
					});
				}
			});
			file.exportdatatocsv(out);
			screen.siteoverlay(false);
		});
	},
	filtermapdata: (cid = 'base', elm) => {
		if(!elm.hasOwnProperty('properties')) return false;
		let kr = d.maptransformations[cid].legend;
		let isvalid = kr[elm.properties.rkey];
		kr = undefined;
		if(!isvalid) return false;
		if(!elm.properties.hasOwnProperty('year')) return true;
		if(!elm.properties.year) return true;		
		let tr = d.maptransformations[cid].timerange;
		if(tr.min === 0 && tr.max === 0) return true;
		return elm.properties.year >= tr.min && elm.properties.year <= tr.max;
	},
	exportintersections: (cid = 'base', lname, lindex) => {
		if(!dbe.verifytables()) throw new AppError(c`no-data`);
		if(!lname || !lindex) throw new AppError(c`mandatory-field-empty`);
		if(!d.mapdata) throw new AppError(c`no-data`);
		if(!d.mapdata.features.length) throw new AppError(c`no-data`);
		screen.siteoverlay(true);
		toolkit.timer('maps.exportintersections');
		toolkit.statustext(true);
		sleep(50).then(() => {
			fetchasync(`./assets/data/geojson/${lname}.json`).then(res => {
				let matches = [];
				let ffields = d.mapgeojsonlayers.find(o => o.name === lname).field;
				let ffieldnames = d.mapgeojsonlayers.find(o => o.name === lname).fieldname;
				let points = turf.featureCollection(d.mapdata.features.filter(o => mapops.filtermapdata(cid, o)));
				let nindex = 0;
				let tmplay = L.geoJSON(res, {
					onEachFeature: function (feature, layer) {
						if(nindex === lindex) {
							let bounds = layer.getBounds();
							let fvalue = [];
							ffields.forEach(o => fvalue.push(feature.properties[o]));
							let fcollection = turf.featureCollection([feature]);
							let fmatches = turf.pointsWithinPolygon(points,fcollection);
							fmatches.features.forEach(o => {
								let obj = {};
								obj.layer = lname;
								fvalue.forEach((f, i) => {
									obj[ffieldnames[i]] = f;
								});
								obj.title = o.properties.title;
								obj.id = o.properties.id;
								obj.rkey = o.properties.rkey;
								matches.push(obj);
								obj = undefined;
							});
							fvalue = fcollection = fmatches = undefined;
						}
						nindex++;
					}
				});
				nindex = undefined;
				if(!matches.length) {
					points = ffields = ffieldnames = matches = tmplay = undefined;
					toolkit.timer('maps.exportintersections');
					toolkit.statustext(false);
					screen.siteoverlay(false);
					throw new AppWarning(`${c`no-data`}`);
				} else {
					file.exportdatatocsv(matches);
					points = ffields = ffieldnames = matches = tmplay = undefined;
					toolkit.timer('maps.exportintersections');
					toolkit.statustext(false);
					screen.siteoverlay(false);
				}
			})
		});
	},
	refinefilter: (lname, lindex, cid = 'base') => {
		if(!dbe.verifytables()) throw new AppError(c`no-data`);
		if(!lname || !lindex) throw new AppError(c`mandatory-field-empty`);
		if(!d.mapdata) throw new AppError(c`no-data`);
		if(!d.mapdata.features.length) throw new AppError(c`no-data`);
		screen.siteoverlay(true);
		toolkit.timer('maps.refineindex');
		toolkit.statustext(true);
		sleep(50).then(() => {
			fetchasync(`./assets/data/geojson/${lname}.json`).then(res => {
				let bpoints = mapops.generatebasepoints(false);
				if(bpoints) {
					let matches = [];
					let ffields = d.mapgeojsonlayers.find(o => o.name === lname).field;
					let points = turf.featureCollection(bpoints.features);
					let nindex = 0;
					let tmplay = L.geoJSON(res, {
						onEachFeature: function (feature, layer) {
							if(nindex === lindex) {
								let bounds = layer.getBounds();
								let fvalue = [];
								ffields.forEach(o => fvalue.push(feature.properties[o]));
								let fcollection = turf.featureCollection([feature]);
								let fmatches = turf.pointsWithinPolygon(points, fcollection);
								fmatches.features.forEach(o => {
									let obj = {};
									obj.id = o.properties.id;
									matches.push(obj);
									obj = undefined;
								});
								fvalue = fcollection = fmatches = undefined;
							}
							nindex++;
						}
					});
					nindex = undefined;
					if(!matches.length) {
						points = ffields = matches = tmplay = undefined;
						toolkit.timer('maps.refineindex');
						toolkit.statustext(false);
						screen.siteoverlay(false);
						d.filterrefine = null;
						throw new AppWarning(`${c`no-data`}`);
					} else {
						d.filterrefine = new Set(matches.map(o => o.id));
						maps.datamap(cid);
						points = ffields = matches = tmplay = undefined;						
						toolkit.timer('maps.refineindex');
						toolkit.statustext(false);
						screen.siteoverlay(false);
					}			
				} else {
					toolkit.timer('maps.refineindex');
					toolkit.statustext(false);
					screen.siteoverlay(false);
					d.filterrefine = null;
					throw new AppWarning(`${c`no-data`}`);
				}
			})
		});
	},
}
