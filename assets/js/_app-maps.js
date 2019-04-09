'use strict';

/* global AppError, c, d3, dbe, dbq, L, sleep, toolkit */

/* exported maps */

// maps
const maps = {
	basemap: () => {
		// BE CAREFUL: Modified leaflet-src.js, v1.3.1, line 5780.
		// ORIGINAL: var first = e.touches ? e.touches[0] : e;
		// MODIFIED: var first = e.touches.length ? e.touches[0] : e;
		// "e.touches" is ever an array, so original value is ever true, too
		toolkit.timer('maps.basemap');
		toolkit.statustext(true);
		screen.siteoverlay(true);
		sleep(50).then(() => {
			let dropbasemap = () => {
				let out = [];
				let lname = `${c`working`}&hellip;`; 
				//Object.keys(d.maplayers.base).find(o => d.maplayers.base[o].visible);
				d.mapproviders.sortBy(['name']).forEach(g => {
					out.push([
						`<tr class="no-padding">`,
						`<td data-mapname="${g.name}">`,
						`<a class="text-decoration-none" `, 
						`id="map-base-${g.name}" `,
						`href="javascript:mapops.togglelayer('base', '${g.name}');">`,
						`${c(g.name).uf()}`,
						`</a>`,
						`</td>`,
						`</tr>`,
					].join(''));
				});
				return [
					`<div id="map-basemaps" class="ddown">`,
					`<a id="map-currentmapbase" class="button button-border" href="javascript:;">`,
					`${lname}`,
					`</a>`,
					`<div id="map-basemaps-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
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

				`.leaflet-button-zoombox{`,
				`background-image:url(./assets/img/svg/maximize.svg)}`,
				`.leaflet-button-fullscreen{`,
				`background-image:url(./assets/img/svg/maximize-2.svg)}`,
				`.leaflet-button-search{`,
				`background-image:url(./assets/img/svg/search.svg)}`,
				`.leaflet-button-print{`,
				`background-image:url(./assets/img/svg/printer.svg)}`,
				`.leaflet-button-crosshair{`,
				`background-image:url(./assets/img/svg/crosshair.svg)}`,

				`.leaflet-ruler-clicked{border-color: red !important;}`,
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
				`<div id="map-overlays" class="ddown">`,
				`<a class="button button-border" href="javascript:;">${c`layers`.uf()}</a>`,
				`<div id="map-overlays-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
				`${mapops.drawlayersselector()}`,
				`</div>`,
				`</div>`,
				`</li>`,
			].join(''));
			
			if(dbe.verifytables()) {
				out.push([
					`<li>`,
					`<input class="info" type="search" id="mapdata-search" `,
					`data-txt="${d.mapsearchtext || ''}" `, 
					`data-pid="${d.mapsearchid || ''}" `, 
					`placeholder="${c`search`}..." `,
					`value="${d.mapsearchtext || ''}" `, 
					`class="info">`,
					`</li>`,

					`<li>`,
					`<div id="map-features" class="ddown">`,
					`<a class="button button-border" href="javascript:;">${c`include`.uf()}</a>`,
					`<div id="map-features-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,

					/* `<p class="no-margin-bottom">`, */
					`<div class="field field-float-label">`,
					`<input type="text" `, 
					`id="map-buffer" name="map-buffer" `,
					`placeholder="${c`buffer`}" `,
					`value="${d.maptransformations.buffer}" `,
					`onkeyup="javascript:maphelpers.settransformations('buffer', this.value);">`,
					`<label for="map-buffer">${c`buffer`}</label>`,
					/* `</p>`, */

					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-related" name="map-related" `,
					`onclick="javascript:maphelpers.settransformations('related', this.checked);"`,
					`${d.maptransformations.related ? ' checked' : ''}>`,
					`<span class="control-indicator"></span>`,
					`<span class="control-label">${c`related`}</span>`,
					`</label>`,
					`</p>`,

					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-tin" name="map-tin" `,
					`onclick="javascript:maphelpers.settransformations('tin', this.checked);"`,
					`${d.maptransformations.tin ? ' checked' : ''}`,
					`${parseInt(d.maptransformations.buffer, 10) < 1 ? ' disabled' : ''}`,
					`>`,
					`<span id="map-tin-ctr" class="control-indicator background-light-200"></span>`,
					`<span id="map-tin-lbl" class="control-label color-light-400">${c`tin`}</span>`,
					`</label>`,
					`</p>`,

					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-convex" name="map-convex" `,
					`onclick="javascript:maphelpers.settransformations('convex', this.checked);"`,
					`${d.maptransformations.convex ? ' checked' : ''}`,
					`${parseInt(d.maptransformations.buffer, 10) < 1 ? ' disabled' : ''}`,
					`>`,
					`<span id="map-convex-ctr" class="control-indicator background-light-200"></span>`,
					`<span id="map-convex-lbl" class="control-label color-light-400">${c`convex`}</span>`,
					`</label>`,
					`</p>`,

					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-envelope" name="map-envelope" `,
					`onclick="javascript:maphelpers.settransformations('envelope', this.checked);"`,
					`${d.maptransformations.envelope ? ' checked' : ''}`,
					`${parseInt(d.maptransformations.buffer, 10) < 1 ? ' disabled' : ''}`,
					`>`,
					`<span id="map-envelope-ctr" class="control-indicator background-light-200"></span>`,
					`<span id="map-envelope-lbl" class="control-label color-light-400">${c`envelope`}</span>`,
					`</label>`,
					`</p>`,

					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-voronoi" name="map-voronoi" `,
					`onclick="javascript:maphelpers.settransformations('voronoi', this.checked);"`,
					`${d.maptransformations.voronoi ? ' checked' : ''}`,
					`${parseInt(d.maptransformations.buffer, 10) < 1 ? ' disabled' : ''}`,
					`>`,
					`<span id="map-voronoi-ctr" class="control-indicator background-light-200"></span>`,
					`<span id="map-voronoi-lbl" class="control-label color-light-400">${c`voronoi`}</span>`,
					`</label>`,
					`</p>`,

					`</div>`,
					`</div>`,
					
					`</li>`,

					`<li>`,
					`<div id="map-queries" class="ddown hide">`,
					`<a class="button button-border button-primary" href="javascript:;">${c`queries`.uf()}</a>`,
					`<div id="map-queries-list" class="ddown-content padding-xs box-shadow-xxl background-white">`,
					`</div>`,
					`</div>`,
					`</li>`,
				].join(''));
			}

			out.push([
				`</ul>`,
				`</div>`,
			].join(''));
			
			toolkit.msg('map-selectors', out.join(''));
			
			maphelpers.lfcontrols();
											
			toolkit.cleardomelement('#stats-map');
			d.mapbase = L.map('stats-map', {
				zoom: window.settings.maphomezoom,
			});

			L.control.zoomBox({
				zoomHomeTitle: c`home`,
				homeCoordinates: [window.settings.maphomelat, window.settings.maphomelon],
				homeZoom: window.settings.maphomezoom,
			}).addTo(d.mapbase);
							
			d.mapbase.addControl(L.control.search());
			d.mapbase.addControl(new L.Control.Fullscreen({
				title: {
					'false': c`view-fullscreen`,
					'true': c`exit-fullscreen`
				}
			}));

			L.control.scale({imperial: false}).addTo(d.mapbase);
			L.control.mapprint().addTo(d.mapbase);
			L.control.watermark({position: 'bottomright'}).addTo(d.mapbase);		
			
			mapops.namedlayers();
   			
			d.mapbase.setView(
				[
					window.settings.maphomelat, 
					window.settings.maphomelon
				], 
				window.settings.maphomezoom
			);
			
			//dragend, zoomend 
			d.mapbase.addEventListener('moveend', function(ev) {
				let query = L.Util.getParamString({
					lat: d.mapbase.getCenter().lat,
					lon: d.mapbase.getCenter().lng,
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
						toolkit.ddtodms(d.mapbase.getCenter().lat, false),
						', ',
						toolkit.ddtodms(d.mapbase.getCenter().lng, true)
					].join('');
					toolkit.msg(
						'map-currentmapbase',
						Object.keys(d.maplayers.base).find(o => d.maplayers.base[o].visible)
					);
					toolkit.msg(
						'map-currentcoords',
						coordinates
					);
					toolkit.msg(
						'map-currentaddress',
						displayname
					);
					query = displayname = coordinates = undefined;
				}).catch(err => {
					let coordinates = [
						toolkit.ddtodms(d.mapbase.getCenter().lat, false),
						', ',
						toolkit.ddtodms(d.mapbase.getCenter().lng, true)
					].join('');
					toolkit.msg(
						'map-currentmapbase',
						Object.keys(d.maplayers.base).find(o => d.maplayers.base[o].visible)
					);
					toolkit.msg(
						'map-currentcoords',
						coordinates
					);
					toolkit.msg(
						'map-currentaddress',
						`${c`no-address-available`}`
					);
					query = coordinates = undefined;
				});
			});

			let infopanel = L.control();

			infopanel.onAdd = function (map) {
				this._div = L.DomUtil.create('div', 'infopanel');
				this._div.classList.add('box-shadow-xxl');
				this._div.classList.add('padding-s');
				this._div.classList.add('background-white');
				this._div.classList.add('color-grey');
				this.update();
				return this._div;
			};

			infopanel.update = function (e) {
				if (e === undefined) {
					this._div.innerHTML = '';
					this._div.classList.add('hide');
					return;
				}
				this._div.classList.remove('hide');
				this._div.innerHTML = '<h4>Informations</h4>'
				+  '<span style="font-weight:bold;">' + e.airport
				+  '</span><br/>Code OACI : <span style="font-weight:bold;">' + e.oaci_code
				+  '</span><br/>Longueur de piste : <span style="font-weight:bold;">' + e.length + ' m'
				+  '</span><br/>Largeur de piste : <span style="font-weight:bold;">' + e.width + ' m'
				+  '</span><br/>Altitude : <span style="font-weight:bold;">' + e.high + ' m' + '</span>';
			};

			infopanel.addTo(d.mapbase);

			toolkit.timer('maps.basemap');
			toolkit.statustext();
			screen.siteoverlay(false);
			maps.datamap();
			return;
		});
	},
	datamap: () => {
		if(!dbe.verifytables()) {
			mapops.drawlayers();
			return;
		}
		toolkit.timer('maps.datamap');
		toolkit.statustext(true);
		screen.siteoverlay(true);
			
		sleep(50).then(() => {
			let searchrels = nid => {
				let set = new Set(d.filterids);
				return new Set(dbm.relations(false)
					.filter(o => o.ID === nid)
					.filter(o => set.has(o.RID))
					.map(o => o.RID)
				);
			};

			mapops.makemapdata();
			if(!d.mapdata) {
				filmap = searchrels = undefined;
				toolkit.timer('maps.datamap');
				toolkit.statustext();
				screen.siteoverlay(false);
				mapops.drawlayers();
				return;
			}
			if(!d.mapdata.features.length) {
				filmap = searchrels = undefined;
				toolkit.timer('maps.datamap');
				toolkit.statustext();
				screen.siteoverlay(false);
				mapops.drawlayers();
				return;
			}

			autosearch({
				onSelect: (item, inputfield) => {
					screen.siteoverlay(true);
					mapops.findpoint(item, inputfield);
					screen.siteoverlay(false);
					mapops.drawlayers();
				},
				input: byId('mapdata-search'),
				minLength: 3,
				className: 'background-white padding-xs',
				debounceWaitMs: 100,
				fetch: (text, callback) => {
					text = text.toLowerCase();
					let suggestions = d.mapdata.features
						.map(o => ({
							label: o.properties.title, 
							value: o.properties.id,
							latitude: o.properties.latitude,
							longitude: o.properties.longitude,
							radius: o.properties.radius,
							color: o.properties.color,
							shape: o.properties.shape,
							rkey: o.properties.rkey
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

			mapops.drawlayers();
						
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
		Hand made
		*/
		L.Control.MapPrint = L.Control.extend({
			options: {
				position: 'topleft',
				title: c`print`,
				domid: 'c-tab-five',
			},
		
			onAdd: function(map) {
				this._map = map;
				var container = map.zoomControl._container;
				var link = L.DomUtil.create('a', '', container);
				link.href = `javascript:toolkit.printdiv('${this.options.domid}');`;
				link.style.width = '30px';
				link.style.height = '30px';
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
		Leaflet Geocoding plugin.
		As seen at http://mapbbcode.org/leaflet.html
		*/
		L.Control.Search = L.Control.extend({
			options: {
				position: 'topleft',
				title: c`search`,
				email: ''
			},
		
			onAdd: function(map) {
				this._map = map;
				var container = map.zoomControl._container;
				var link = this._link = L.DomUtil.create('a', '', container);
				link.href = '#';
				link.style.width = '30px';
				link.style.height = '30px';
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
		Full screen control.
		As seen at 
		*/
		L.Control.Fullscreen = L.Control.extend({
			options: {
				position: 'topleft',
				title: {
					'false': c`view-fullscreen`,
					'true': c`exit-fullscreen`
				}
			},
		
			onAdd: function(map) {
				var container = map.zoomControl._container;
				this.link = L.DomUtil.create('a', 'leaflet-control-fullscreen-button leaflet-bar-part', container);
				this.link.href = 'javascript:;';
				this.link.style.width = '30px';
				this.link.style.height = '30px';
				this.link.style.textAlign = 'center';
				this.link.style.fontSize = '22px';
				this.link.style.color = '#000';
				this.link.style.backgroundColor = '#fff';
				this.link.innerHTML = '';
				this.link.classList.add('leaflet-button-fullscreen');
				
				this._map = map;
				this._map.on('fullscreenchange', this._toggleTitle, this);
				this._toggleTitle();
		
				L.DomEvent.on(this.link, 'click', this._click, this);
		
				return container;
			},
		
			_click: function(e) {
				L.DomEvent.stopPropagation(e);
				L.DomEvent.preventDefault(e);
				this._map.toggleFullscreen(this.options);
			},
		
			_toggleTitle: function() {
				this.link.title = this.options.title[this._map.isFullscreen()];
				if(this._map.isFullscreen()) {
					L.DomUtil.addClass(this.link, 'maptoolactive');
				} else {
					L.DomUtil.removeClass(this.link, 'maptoolactive');
				}
			},
		});
		
		L.Map.include({
			isFullscreen: function() {
				return this._isFullscreen || false;
			},
		
			toggleFullscreen: function(options) {
				var container = this.getContainer();
				if (this.isFullscreen()) {
					if (options && options.pseudoFullscreen) {
						this._disablePseudoFullscreen(container);
					} else if (document.exitFullscreen) {
						document.exitFullscreen();
					} else if (document.mozCancelFullScreen) {
						document.mozCancelFullScreen();
					} else if (document.webkitCancelFullScreen) {
						document.webkitCancelFullScreen();
					} else if (document.msExitFullscreen) {
						document.msExitFullscreen();
					} else {
						this._disablePseudoFullscreen(container);
					}
				} else {
					if (options && options.pseudoFullscreen) {
						this._enablePseudoFullscreen(container);
					} else if (container.requestFullscreen) {
						container.requestFullscreen();
					} else if (container.mozRequestFullScreen) {
						container.mozRequestFullScreen();
					} else if (container.webkitRequestFullscreen) {
						container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
					} else if (container.msRequestFullscreen) {
						container.msRequestFullscreen();
					} else {
						this._enablePseudoFullscreen(container);
					}
				}
		
			},
		
			_enablePseudoFullscreen: function(container) {
				L.DomUtil.addClass(container, 'leaflet-pseudo-fullscreen');
				this._setFullscreen(true);
				this.fire('fullscreenchange');
			},
		
			_disablePseudoFullscreen: function(container) {
				L.DomUtil.removeClass(container, 'leaflet-pseudo-fullscreen');
				this._setFullscreen(false);
				this.fire('fullscreenchange');
			},
		
			_setFullscreen: function(fullscreen) {
				this._isFullscreen = fullscreen;
				var container = this.getContainer();
				if (fullscreen) {
					L.DomUtil.addClass(container, 'leaflet-fullscreen-on');
				} else {
					L.DomUtil.removeClass(container, 'leaflet-fullscreen-on');
				}
				this.invalidateSize();
			},
		
			_onFullscreenChange: function(e) {
				var fullscreenElement =
					document.fullscreenElement ||
					document.mozFullScreenElement ||
					document.webkitFullscreenElement ||
					document.msFullscreenElement;
		
				if (fullscreenElement === this.getContainer() && !this._isFullscreen) {
					this._setFullscreen(true);
					this.fire('fullscreenchange');
				} else if (fullscreenElement !== this.getContainer() && this._isFullscreen) {
					this._setFullscreen(false);
					this.fire('fullscreenchange');
				}
			}
		});
		
		L.Map.mergeOptions({
			fullscreenControl: false
		});
		
		L.Map.addInitHook(function() {
			if (this.options.fullscreenControl) {
				this.fullscreenControl = new L.Control.Fullscreen(this.options.fullscreenControl);
				this.addControl(this.fullscreenControl);
			}
		
			var fullscreenchange;
		
			if ('onfullscreenchange' in document) {
				fullscreenchange = 'fullscreenchange';
			} else if ('onmozfullscreenchange' in document) {
				fullscreenchange = 'mozfullscreenchange';
			} else if ('onwebkitfullscreenchange' in document) {
				fullscreenchange = 'webkitfullscreenchange';
			} else if ('onmsfullscreenchange' in document) {
				fullscreenchange = 'MSFullscreenChange';
			}
		
			if (fullscreenchange) {
				var onFullscreenChange = L.bind(this._onFullscreenChange, this);
		
				this.whenReady(function() {
					L.DomEvent.on(document, fullscreenchange, onFullscreenChange);
				});
		
				this.on('unload', function() {
					L.DomEvent.off(document, fullscreenchange, onFullscreenChange);
				});
			}
		});
		
		L.control.fullscreen = function(options) {
			return new L.Control.Fullscreen(options);
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
				position: 'topleft',
				className: "leaflet-zoom-box-icon",
				modal: false,
				title: c`zoom`,
				crossHairTitle: c`crosshair`,
				zoomHomeTitle: c`home`,
				homeCoordinates: null,
				homeZoom: null,
			},
			onAdd: function(map) {
				this._map = map;
				this._container = map.zoomControl._container;
				
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
		 As seen at https://github.com/ablakey/Leaflet.SimpleGraticule
		*/
		L.SimpleGraticule = L.LayerGroup.extend({
			options: {
				interval: 20,
				showOriginLabel: true,
				redraw: 'move',
				hidden: false,
				zoomIntervals: []
			},
		
			lineStyle: {
				stroke: true,
				color: '#111111',
				opacity: 0.3,
				weight: 1,
				interactive: false,
				clickable: false 
			},
		
			initialize: function(options) {
				L.LayerGroup.prototype.initialize.call(this);
				L.Util.setOptions(this, options);
			},
		
			onAdd: function(map) {
				this._map = map;
		
				var graticule = this.redraw();
				this._map.on('viewreset ' + this.options.redraw, graticule.redraw, graticule);
		
				this.eachLayer(map.addLayer, map);
			},
		
			onRemove: function(map) {
				map.off('viewreset ' + this.options.redraw, this.map);
				this.eachLayer(this.removeLayer, this);
			},
		
			hide: function() {
				this.options.hidden = true;
				this.redraw();
			},
		
			show: function() {
				this.options.hidden = false;
				this.redraw();
			},
		
			redraw: function() {
				this._bounds = this._map.getBounds().pad(0.5);
		
				this.clearLayers();
		
				if (!this.options.hidden) {
		
					var currentZoom = this._map.getZoom();
		
					for (var i = 0; i < this.options.zoomIntervals.length; i++) {
						if (currentZoom >= this.options.zoomIntervals[i].start && currentZoom <= this.options.zoomIntervals[i].end) {
							this.options.interval = this.options.zoomIntervals[i].interval;
							break;
						}
					}
		
					this.constructLines(this.getMins(), this.getLineCounts());
		
					if (this.options.showOriginLabel) {
						this.addLayer(this.addOriginLabel());
					}
				}
		
				return this;
			},
		
			getLineCounts: function() {
				return {
					x: Math.ceil((this._bounds.getEast() - this._bounds.getWest()) /
						this.options.interval),
					y: Math.ceil((this._bounds.getNorth() - this._bounds.getSouth()) /
						this.options.interval)
				};
			},
		
			getMins: function() {
				var s = this.options.interval;
				return {
					x: Math.floor(this._bounds.getWest() / s) * s,
					y: Math.floor(this._bounds.getSouth() / s) * s
				};
			},
		
			constructLines: function(mins, counts) {
				var lines = new Array(counts.x + counts.y);
				var labels = new Array(counts.x + counts.y);
		
				//for horizontal lines
				for (var i = 0; i <= counts.x; i++) {
					var x = mins.x + i * this.options.interval;
					lines[i] = this.buildXLine(x);
					labels[i] = this.buildLabel('gridlabel-horiz', x);
				}
		
				//for vertical lines
				for (var j = 0; j <= counts.y; j++) {
					var y = mins.y + j * this.options.interval;
					lines[j + i] = this.buildYLine(y);
					labels[j + i] = this.buildLabel('gridlabel-vert', y);
				}
		
				lines.forEach(this.addLayer, this);
				labels.forEach(this.addLayer, this);
			},
		
			buildXLine: function(x) {
				var bottomLL = new L.LatLng(this._bounds.getSouth(), x);
				var topLL = new L.LatLng(this._bounds.getNorth(), x);
		
				return new L.Polyline([bottomLL, topLL], this.lineStyle);
			},
		
			buildYLine: function(y) {
				var leftLL = new L.LatLng(y, this._bounds.getWest());
				var rightLL = new L.LatLng(y, this._bounds.getEast());
		
				return new L.Polyline([leftLL, rightLL], this.lineStyle);
			},
		
			buildLabel: function(axis, val) {
				var bounds = this._map.getBounds().pad(-0.003);
				var latLng;
				if (axis == 'gridlabel-horiz') {
					latLng = new L.LatLng(bounds.getNorth(), val);
				} else {
					latLng = new L.LatLng(val, bounds.getWest());
				}
		
				return L.marker(latLng, {
					interactive: false,
					clickable: false, //legacy support
					icon: L.divIcon({
						iconSize: [0, 0],
						className: 'leaflet-grid-label',
						html: '<div class="' + axis + '">' + val + '</div>'
					})
				});
			},
		
			addOriginLabel: function() {
				return L.marker([0, 0], {
					interactive: false,
					clickable: false, //legacy support
					icon: L.divIcon({
						iconSize: [0, 0],
						className: 'leaflet-grid-label',
						html: '<div class="gridlabel-horiz">(0,0)</div>'
					})
				});
			}
		});
		
		L.simpleGraticule = function(options) {
			return new L.SimpleGraticule(options);
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
		Leaflet SVG icons
		*/
		d.post_types.filter(o => !['record', 'taxonomy'].includes(o.slug)).forEach(o => {
			let tmpstar = [
				`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="40" height="40">`,
				`<polygon points="9.9, 1.1, 3.3, 21.78, 19.8, 8.58, 0, 8.58, 16.5, 21.78" style="fill:${o.color}"/>`,
				`</svg>`,
			].join('');
			d.mapicons[o.slug + 'star'] = L.icon({
				iconUrl: encodeURI("data:image/svg+xml," + tmpstar).replace('#','%23'),
				iconSize: [40, 40],
				shadowSize: [60, 60],
				iconAnchor: [20, 20],
				popupAnchor: [20, -20]
			});
			tmpstar = undefined;
		});
	},
	settransformations: (cid, val) => {
		d.maptransformations[cid] = val;
		let bufferisnotok = Number(d.maptransformations.buffer) < 1;
		['convex', 'envelope', 'tin', 'voronoi'].forEach(o => {
			byId(`map-${o}`).disabled = bufferisnotok;
			if(bufferisnotok) {
				byId(`map-${o}-ctr`).classList.add('background-light-200');
				byId(`map-${o}-lbl`).classList.add('color-light-400');
			} else {
				byId(`map-${o}-ctr`).classList.remove('background-light-200');
				byId(`map-${o}-lbl`).classList.remove('color-light-400');
			}
		});
	},
};
const mapops = {
	clearqueries: () => {
		d.maplayers.queries = {};
		mapops.drawlayers();
	},
	fitbounds: () => {
		let bounds = new L.LatLngBounds();
		d.mapbase.eachLayer(o => {
			if(o instanceof L.FeatureGroup) bounds.extend(o.getBounds())
		});
		if(bounds.isValid()) d.mapbase.fitBounds(bounds);
		bounds = undefined;
	},
	namedlayers: () => {
		if(!Object.keys(d.maplayers.base).length) {
			d.mapproviders.forEach((o, i) => {
				d.maplayers.base[o.name] = {
					name: o.name,
					visible: i === 0,
					source: o.provider,
					color: null,
				};
			});
		}
		if(!Object.keys(d.maplayers.overlays).length) {
			d.mapgeojsonlayers.forEach(o => {
				d.maplayers.overlays[o.name] = {
					name: o.name,
					visible: false,
					source: o.name,
					color: o.color,
				};
			});
		}
		if(!Object.keys(d.maplayers.graticules).length) {
			d.maplayers.graticules.graticule = {
				name: 'graticule',
				visible: false, 
				source: null, 
				color: '#111'
			};
		}
		if(!Object.keys(d.maplayers.data).length) {
			d.maplayers.data = {
				filtered: {
					name: 'filtered',
					visible: false, 
					source: null, 
					color: '#195de6'
				},
				heatmap: {
					name: 'heatmap',
					visible: false, 
					source: null, 
					color: '#195de6'
				},
			};
		}
	},
	drawlayers: () => {
		if(!d.mapbase) return;
		d.mapbase.eachLayer(function (layer) {
			d.mapbase.removeLayer(layer);
		});
		let blacklist = ['base'];
		let basesource = Object.values(d.maplayers.base).find(o => o.visible).source;
		let basename = Object.values(d.maplayers.base).find(o => o.visible).name;
		d.mapbase.addLayer(L.tileLayer.provider(basesource));
		
		Object.keys(d.maplayers).filter(g => !blacklist.includes(g)).forEach(g => {
			Object.keys(d.maplayers[g])
				.filter(o => d.maplayers[g][o].visible)
				.forEach(o => mapops['q' + g](o));
			
		});
		
		toolkit.msg(
			'map-currentmapbase',
			basename
		);
		
		document.querySelectorAll('#map-basemaps-list table tbody tr td').forEach(o => {
			if(o.dataset.mapname === basename) {
				o.classList.remove('background-light-50');
				o.classList.add('background-info-50');
			} else {
				o.classList.remove('background-info-50');
				o.classList.add('background-light-50');
			}
		});
		
		toolkit.msg(
			'map-overlays-list',
			mapops.drawlayersselector()
		);
		if(dbe.verifytables()) {
			toolkit.msg(
				'map-queries-list',
				mapops.drawqueriesselector()
			);
			toolkit.drawicons();
		}

		blacklist = basesource = basename = undefined;
	},
	drawlayersselector: () => {
		let out = [];
		let blacklist = ['base', 'queries'];
		if(!dbe.verifytables()) blacklist.push(...['data']);
		Object.keys(d.maplayers).filter(k => !blacklist.includes(k)).forEach(k => {
			Object.keys(d.maplayers[k]).forEach(g => {
				out.push([
					`<p class="no-margin-bottom">`,
					`<label class="control checkbox">`,
					`<input type="checkbox"`, 
					`id="map-layers-${k}-${d.maplayers[k][g].name}" `,
					`name="map-layers-${k}-${d.maplayers[k][g].name}" `,
					`onclick="javascript:mapops.togglelayer('${k}','${d.maplayers[k][g].name}');"`,
					`${d.maplayers[k][g].visible ? ' checked' : ''}>`,
					`<span class="control-indicator" style="border:3px ${d.maplayers[k][g].color} solid"></span>`,
					`<span class="control-label" style="color:${d.maplayers[k][g].color}">`,
					`${c(d.maplayers[k][g].name).uf()}`,
					`</span>`,
					`</label>`,
					`</p>`,
				].join(''));
			});
		});
		return out.join('\n');
	},
	drawqueriesselector: () => {
		if(!dbe.verifytables()) return;
		let out = [];
		if(Object.keys(d.maplayers.queries).length) {
			byId('map-queries').classList.remove('hide');
			toolkit.restrictinput(byId('map-buffer'), value => /^\d*$/.test(value));
		} else {
			byId('map-queries').classList.add('hide');
		}
		out.push([
			`<p class="no-margin-bottom">`,
			`<a class="button button-block button-icon button-border error" `,
			`href="javascript:mapops.clearqueries();">`,
			`<span>${c`clear`.uf()}</span>`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="trash2" d=""></path>`,
			`</svg>`,
			`</a>`,
			`</p>`,
		].join(''));
		out.push([
			`<p class="no-margin-bottom">`,
			`<a class="button button-block button-icon button-border button-tertiary" `,
			`href="javascript:mapops.exportqueries();">`,
			`<span>${c`export`.uf()}</span>`,
			`<svg width="24" height="24" viewBox="0 0 24 24" class="svgicon">`,
			`<path class="download" d=""></path>`,
			`</svg>`,
			`</a>`,
			`</p>`,
		].join(''));
		Object.keys(d.maplayers.queries).forEach(g => {
			let color = '#195de6';
			out.push([
				`<p class="no-margin-bottom">`,
				`<label class="control checkbox">`,
				`<input type="checkbox"`, 
				`id="map-layers-queries-${d.maplayers.queries[g].name}" `,
				`name="map-layers-queries-${d.maplayers.queries[g].name}" `,
				`onclick="javascript:mapops.togglelayer('queries','${d.maplayers.queries[g].name}');"`,
				`${d.maplayers.queries[g].visible ? ' checked' : ''}>`,
				`<span class="control-indicator" style="border:3px ${color} solid"></span>`,
				`<span class="control-label" style="color:${color}">`,
				`${c(d.maplayers.queries[g].name).uf()}`,
				`</span>`,
				`</label>`,
				`</p>`,
			].join(''));
		});
		return out.join('\n');
	},
	togglelayer: (group, layer) => {
		if(!group) return;
		if(!layer) return;
		if(!d.mapbase) return;

		if(group === 'base') {
			Object.keys(d.maplayers.base)
				.forEach(o => d.maplayers.base[o].visible = d.maplayers.base[o].name === layer);
		} else {
			d.maplayers[group][layer].visible = !d.maplayers[group][layer].visible;
		}
		mapops.drawlayers();
	},
	qgraticules: name => d.mapbase.addLayer(L.simpleGraticule()),
	qoverlays: name => {
		if(!name) return;
		if(!d.mapgeojsonlayers.map(o => o.name).includes(name)) return;
		screen.siteoverlay(true);
		let tmptext = byId('map-overlays').innerHTML;
		byId('map-overlays').classList.add('spinner');
		sleep(50).then(() => {
			fetchasync(`./assets/data/geojson/${name}.json`).then(res => {
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
					onEachFeature: function (feature, layer) {
						layer.bindPopup([
							`<h5>`,
							`<span class="empty-square margin-right-xs" `,
							`style="`,
							`background:`,
							`${d.mapgeojsonlayers.find(o => o.name === name).fillColor};`,
							`"></span>`,
							c(name).uf(),
							`</h5>`,
							`<p>`,
							feature.properties[d.mapgeojsonlayers.find(o => o.name === name).field],
							`</p>`,
						].join(''));
					}
				});
				d.mapbase.addLayer(tmplay);
				mapops.fitbounds();
				
				screen.siteoverlay(false);
				byId('map-overlays').classList.remove('spinner');
				tmplay = undefined;
			})
			.catch(err => {
				screen.siteoverlay(false);
				byId('map-overlays').classList.remove('spinner');
				throw new AppError(c`map-overlay` + ': ' + err);				
			});				
		});
	},
	qdata: name => {
		if(!name) return;
		screen.siteoverlay(true);
		byId('map-overlays').classList.add('spinner');
		sleep(50).then(() => {
			if(name === 'filtered') {
				let makepopupinfo = (nid, rkey) => {
					let rec = dbe.getposbyid(nid) || null;
					return !rec ? 
						`ID: ${nid}` : 
						`<a href="javascript:ui.singlerecord(${nid},${nid});">${toolkit.titleformat(rec.value)}</a>
						<br />${c(rkey)}						
						`;
				};
				let shownLayer;
				let polygon;
				let cluster = L.markerClusterGroup();
			
				let tmplay = L.geoJSON(d.mapdata, {
					pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
						fillColor: feature.properties.color,
						fill: true,
						color: feature.properties.color,
						stroke: true,
						fillOpacity: .5
					}),
					onEachFeature: function (feature, layer) {
						layer.bindPopup(makepopupinfo(
							feature.properties.id, 
							feature.properties.rkey
						));
					}
				});
				cluster.addLayer(tmplay);
				d.mapbase.addLayer(cluster);
				tmplay = null;
				
				function removePolygon() {
					if (shownLayer) {
						shownLayer.setOpacity(1);
						shownLayer = null;
					}
					if (polygon) {
						if(d.mapbase) d.mapbase.removeLayer(polygon);
						polygon = null;
					}
				}
			
				cluster.on('clustermouseover', function (a) {
					removePolygon();
					a.layer.setOpacity(0.2);
					shownLayer = a.layer;
					polygon = L.polygon(a.layer.getConvexHull());
					d.mapbase.addLayer(polygon);
				});
				cluster.on('clustermouseout', removePolygon);
			
				d.mapbase.on('zoomend', removePolygon);
				
				cluster = tmplay = shownLayer = undefined;
			} else {
				let hlayer = L.heatLayer(d.mapdata.features
					.filter(o => o.geometry.coordinates[1] && o.geometry.coordinates[0])
					.map(o => [o.geometry.coordinates[1], o.geometry.coordinates[0]]), 
					{minOpacity: 0.3, gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}}
				);
				d.mapbase.addLayer(hlayer);
				hlayer = undefined;
			}
			mapops.fitbounds();
			screen.siteoverlay(false);
			byId('map-overlays').classList.remove('spinner');
		});
	},
	qqueries: name => {
		d.mapbase.addLayer(d.maplayers.queries[name].layer);
	},
	findpoint: (item, inputfield) => {
		let bname = String(item.label).shorten(30);
		let cname = null;
		function makepopupinfo (feature, lat, lng) {
			let rec = dbe.getposbyid(feature.properties.id) || null;
			let bcl = rec ? dbe.getbcolorfromslug(rec.rkey) : '';
			let dst = c`n-a`;
			lat = lat || null;
			lng = lng || null;
			if(lat && lng) {
				let tmpsource = turf.point([lng, lat]);
				let tmptarget = turf.point([feature.properties.longitude, feature.properties.latitude]);
				let tmpkm = turf.distance(tmpsource, tmptarget, {units: 'kilometers'});
				dst = tmpkm < 1 ? 
					Math.round(tmpkm * 1000).toLocaleString(l) + ' m' : 
					tmpkm.toLocaleString(l) + ' km';
			}
			return !rec ? 
				`${c`selected`.toUpperCase()} ** ID: ${feature.properties.id}` : 
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
					`</tbody>`,		
					`</table>`,		
				].join('\n');
		}
		function getpointsinbuffer(lat, lng, rkey = null) {
			let points = turf.featureCollection(
				d.mapdata.features.filter(o => rkey ? o.properties.rkey === rkey : true)
			);
			let radius = Number(d.maptransformations.buffer) / 1000;
			let buffer = turf.buffer(turf.point([lng, lat]), radius, {units: 'kilometers'});
			let pip = turf.pointsWithinPolygon(points, buffer);
			return pip;
		}
		
		inputfield.value = item.label;
		inputfield.dataset.pid = item.value;
		inputfield.dataset.txt = item.label;

		d.mapsearchtext = item.label;
		d.mapsearchid = item.value;
		d.mapbase.setView([item.latitude, item.longitude], 16);
		
		let marker = L.circleMarker([item.latitude, item.longitude], {
			fillColor: item.color,
			fill: true,
			color: item.color,
			stroke: true,
			fillOpacity: 1
		});
		marker.bindPopup(makepopupinfo({properties: {id: item.value}}));
		d.maplayers.queries[bname] = {
			name: bname,
			visible: true,
			source: null,
			layer: marker
		};
		d.mapbase.addLayer(d.maplayers.queries[bname].layer);
		marker = undefined;
		
		if(d.maptransformations.buffer > 0) {
			byId('map-queries').classList.add('spinner');
			let met = Number(d.maptransformations.buffer).toLocaleString(l);
			cname = `${c`buffer`.uf()} (${met}). ${bname}`;
			let xname = `${c`buffer`.uf()} (${met}). ${c`coverage`.uf()}. ${bname}`;
			let cluster = L.markerClusterGroup();
			let points = getpointsinbuffer(item.latitude, item.longitude);
			let radius = Number(d.maptransformations.buffer);

			let tmplay = L.geoJSON(points.features, {							
				pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
					fillColor: feature.properties.color,
					fill: true,
					color: feature.properties.color,
					stroke: true,
					fillOpacity: .2
				}),
				onEachFeature: function (feature, layer) {
					layer.bindPopup(makepopupinfo(feature, item.latitude, item.longitude));
				}
			});
			cluster.addLayer(tmplay);

			d.maplayers.queries[xname] = {
				name: xname,
				visible: true,
				source: null,
				layer: L.circle([item.latitude,item.longitude], radius, {
					color: 'white',
					weight: 2,
					opacity: 1,
					fillColor: '#111',
					fillOpacity: .3,
					dashArray: '10,5'
				})
			};
			d.mapbase.addLayer(d.maplayers.queries[xname].layer);
			d.maplayers.queries[cname] = {
				name: cname,
				data: {
					mainid: item.value,
					ids: new Set(points.features.map(o => o.properties.id))
				},
				visible: true,
				source: null,
				layer: cluster
			};
			d.mapbase.addLayer(d.maplayers.queries[cname].layer);

			tmplay = cluster = points = xname = radius = undefined;
			byId('map-queries').classList.remove('spinner');
		}
		if(d.maptransformations.related) {
			cname = `${c`related`.uf()}. ${bname}`;
			let pid = isNumber(inputfield.dataset.pid) ? parseInt(inputfield.dataset.pid, 10) : item.value;
			byId('map-queries').classList.add('spinner');
			dbq.singlemap(pid).then(res => {
				let isvalidflowpoint = f => (
					f.origin_id && f.origin_lat && f.origin_lon && 
					f.destination_id && f.destination_lat && f.destination_lon
				);
				let flo = dbe.makegeojson([
					...res.related, 
					...res.neighbourhood
				].filter(o => isvalidflowpoint(o)));

				d.maplayers.queries[cname] = {
					name: cname,
					visible: true,
					source: null,
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
							pathDisplayMode: 'all',
							wrapAroundCanvas: true,
							animationStarted: true,
							animationEasingFamily: 'Cubic',
							animationEasingType: 'In',
							animationDuration: 2000,
	
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
					),
				};
				pid = isvalidflowpoint = flo = undefined;
				mapops.drawlayers();
				byId('map-overlays').classList.remove('spinner');
			});
		}
		if(d.maptransformations.tin) {
			function vstyle(feature) {
				return {
					fillColor: 'green', 
					fillOpacity: 0.5,  
					weight: 2,
					opacity: .3,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				layer.on('click', function (e) { 
					d.maplayers.queries[cname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'yellow',
				weight: 2,
				opacity: .5,
				fillOpacity: .1
			};
			byId('map-queries').classList.add('spinner');
			cname = `${c`tin`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude, item.rkey);
			let tmplay = turf.tin(rpoints);

			d.maplayers.queries[cname] = {
				name: cname,
				visible: true,
				source: null,
				layer: L.geoJSON(tmplay.features, {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.mapbase.addLayer(d.maplayers.queries[cname].layer);
			byId('map-queries').classList.remove('spinner');
			rpoints = tmplay = undefined;
		}
		if(d.maptransformations.convex) {
			function vstyle(feature) {
				return {
					fillColor: 'green', 
					fillOpacity: 0.5,  
					weight: 2,
					opacity: .3,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				layer.on('click', function (e) { 
					d.maplayers.queries[cname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'yellow',
				weight: 2,
				opacity: .5,
				fillOpacity: .1
			};
			byId('map-queries').classList.add('spinner');
			cname = `${c`convex`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude);
			let tmplay = turf.convex(rpoints);

			d.maplayers.queries[cname] = {
				name: cname,
				visible: true,
				source: null,
				layer: L.geoJSON(tmplay, {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.mapbase.addLayer(d.maplayers.queries[cname].layer);
			byId('map-queries').classList.remove('spinner');
			rpoints = tmplay = undefined;
		}
		if(d.maptransformations.envelope) {
			function vstyle(feature) {
				return {
					fillColor: 'pink', 
					fillOpacity: 0.5,  
					weight: 2,
					opacity: .3,
					color: '#ffffff',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				layer.on('click', function (e) { 
					d.maplayers.queries[cname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'purple',
				weight: 2,
				opacity: .5,
				fillOpacity: .1
			};
			byId('map-queries').classList.add('spinner');
			cname = `${c`envelope`.uf()}. ${bname}`;
			
			let rpoints = getpointsinbuffer(item.latitude, item.longitude)
			let tmplay = turf.envelope(rpoints);

			d.maplayers.queries[cname] = {
				name: cname,
				visible: true,
				source: null,
				layer: L.geoJSON([tmplay], {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.mapbase.addLayer(d.maplayers.queries[cname].layer);
			byId('map-queries').classList.remove('spinner');
			rpoints = tmplay = undefined;
		}
		if(d.maptransformations.voronoi) {
			function vstyle(feature) {
				return {
					fillColor: 'orange', 
					fillOpacity: .3,
					weight: 2,
					opacity: .3,
					color: 'yellow',
					dashArray: '3'
				};
			}
			function vfeatures(feature, layer) {
				layer.on('click', function (e) { 
					d.maplayers.queries[cname].layer.setStyle(vstyle);
					layer.setStyle(vhighlight);
				}); 
			}
			let vhighlight = {
				fillColor: 'red',
				weight: 2,
				opacity: .5,
				fillOpacity: .1
			};
			byId('map-queries').classList.add('spinner');
			cname = `${c`voronoi`.uf()}. ${bname}`;
			
			let points = getpointsinbuffer(item.latitude, item.longitude, item.rkey);
			let bounds = L.geoJSON(points.features).getBounds();
			var voronoi = turf.voronoi(points);

			d.maplayers.queries[cname] = {
				name: cname,
				visible: true,
				source: null,
				layer: L.geoJSON(voronoi.features.filter(Boolean), {style: vstyle, onEachFeature: vfeatures}),
			};
			
			d.mapbase.addLayer(d.maplayers.queries[cname].layer);
			byId('map-queries').classList.remove('spinner');
			points = bounds = voronoi = undefined;
		}
	},
	makemapdata: () => {
		let set = new Set(d.filterids);
		let filmap = dbm.points(false).filter(o => set.has(o.ID));
		let fildata = filmap.map(o => {
			let obj = {};
			obj.id = o.ID;
			obj.title = toolkit.titleformat(d.store.pos[o.ID].value);
			obj.rkey = d.store.pos[o.ID].rkey;
			obj.color = d.store.pos[o.ID].color;
			obj.latitude = o.value.points().latitude;
			obj.longitude = o.value.points().longitude;
			obj.radius = dbe.getradiusfromslug(d.store.pos[o.ID].rkey);
			obj.shape = dbe.getshapefromslug(d.store.pos[o.ID].rkey);
			return obj;
		});
		let mai = fildata.length ? dbe.makegeojson(fildata, true) : null;
		if(!mai) {
			filmap = searchrels = undefined;
			toolkit.timer('maps.datamap');
			toolkit.statustext();
			screen.siteoverlay(false);
			mapops.drawlayers();
			return;
		}
		d.mapdata = mai;
		set = filmap = fildata = mai = undefined;
	},
	exportqueries: () => {
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
			Object.keys(d.maplayers.queries).forEach(q => {
				if(d.maplayers.queries[q].data) {
					let dat = d.maplayers.queries[q].data;
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
}