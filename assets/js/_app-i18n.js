'use strict';

/* global AppError, cfetch, cultures, d, toolkit, URLSearchParams */
/* exported c, fc, i18n, ic, l */

let usp = new URLSearchParams(window.location.search);
const l = usp.has('l') ? usp.get('l') : window.navigator.language.split('-')[0].toLowerCase() === 'es' ? 'es' : 'en';
const c = text => cultures[l] && cultures[l][text] || text;
const ic = text => Object.keys(cultures[l]).find(x => cultures[l][x].na().toLowerCase() === String(text).na().toLowerCase()) || text;
const fc = (text, notype = false) => text.split('|').map(o => o === 'rel' ? '[R]' : o.getposttype() !== '' ? (notype ? '' : c(o.getposttype()) + ': ') + c(o) : c(o)).join(' ');
usp = undefined;

const i18n = {
	showlang: lang => {
		let newl = lang === 'es' ? 'en' : 'es';
		let longnewl = {es: 'español', en: 'english'};
		return [
			`<a href="javascript:i18n.changelang('${newl}');">`, 
			`<span style="color:red;">`,  
			`${longnewl[newl].uf()}`, 
			` `,  
			`${icons.flags[newl]}`, 
			`</span></a>`
		].join('');
	},
	changelang: lang => {
		let href = window.location.origin + window.location.pathname;
		let newh = href + '?l=' + lang;
		let longnewl = {es: 'español', en: 'english'};
		let out = [
			`<a class="button button-primary button-icon margin-right-s" `,
			`href="${newh}">`,
			`<span>`,
			`${c`change-lang`.uf()} ${c`and`} ${c`set`} `,
			`${longnewl[lang].uf()}`,
			`</span>`,
			`${icons.flags[lang]}</a>`,
		].join('');
		let url = `./assets/views/${l}/changelang.html`;
		cfetch(url).then(txt => txt.text()).then(txt => { 
			let features = {
				progress: false,
				title: c`change-lang`.uf(),
				content: txt,
				action: out,
				cancel: true,
				canceltitle: c`close`.uf()
			}
			screen.alert = screen.displayalert(features);
			features = undefined;
			toolkit.msg('cl-newl', lang.toUpperCase() + ' ' + icons.flags[lang]);
			toolkit.msg('cl-dbstatus', d.datalength > 0 ? 
				`<span class="color-success">${c`loaded`}</span>` : 
				`<span class="color-error">${c`unloaded`}</span>`);
			href = newh = longnewl = out = url = undefined;
		}).catch(err => { 
			href = newh = longnewl = out = url = undefined;
			throw new AppError(c`change-lang` + ': ' + err); 
		});
	},
};

const icons = {
	flags: {
		es: `
			<svg version="1.1" id="es_flag" xmlns="http://www.w3.org/2000/svg" 
			xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" 
			height=13 width=13 
			viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
			<path style="fill:#FFDA44;" d="M0,256c0,31.314,5.633,61.31,15.923,89.043L256,367.304l240.077-22.261
			C506.367,317.31,512,287.314,512,256s-5.633-61.31-15.923-89.043L256,144.696L15.923,166.957C5.633,194.69,0,224.686,0,256z"/>
			<path style="fill:#D80027;" d="M496.077,166.957C459.906,69.473,366.071,0,256,0S52.094,69.473,15.923,166.957H496.077z"/>
			<path style="fill:#D80027;" d="M15.923,345.043C52.094,442.527,145.929,512,256,512s203.906-69.473,240.077-166.957H15.923z"/>
			</svg>		
		`,
		en: `
			<svg version="1.1" id="en_flag" xmlns="http://www.w3.org/2000/svg" 
			xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" 
			height=13 width=13 
			viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
			<circle style="fill:#F0F0F0;" cx="256" cy="256" r="256"/>
			<path style="fill:#0052B4;" d="M52.92,100.142c-20.109,26.163-35.272,56.318-44.101,89.077h133.178L52.92,100.142z"/>
			<path style="fill:#0052B4;" d="M503.181,189.219c-8.829-32.758-23.993-62.913-44.101-89.076l-89.075,89.076H503.181z"/>
			<path style="fill:#0052B4;" d="M8.819,322.784c8.83,32.758,23.993,62.913,44.101,89.075l89.074-89.075L8.819,
			322.784L8.819,322.784z"/>
			<path style="fill:#0052B4;" d="M411.858,52.921c-26.163-20.109-56.317-35.272-89.076-44.102v133.177L411.858,52.921z"/>
			<path style="fill:#0052B4;" d="M100.142,459.079c26.163,20.109,56.318,35.272,89.076,44.102V370.005L100.142,459.079z"/>
			<path style="fill:#0052B4;" d="M189.217,8.819c-32.758,8.83-62.913,23.993-89.075,44.101l89.075,89.075V8.819z"/>
			<path style="fill:#0052B4;" d="M322.783,503.181c32.758-8.83,62.913-23.993,89.075-44.101l-89.075-89.075V503.181z"/>
			<path style="fill:#0052B4;" d="M370.005,322.784l89.075,89.076c20.108-26.162,35.272-56.318,44.101-89.076H370.005z"/>
			<path style="fill:#D80027;" d="M509.833,222.609h-220.44h-0.001V2.167C278.461,0.744,267.317,0,256,0
			c-11.319,0-22.461,0.744-33.391,2.167v220.44v0.001H2.167C0.744,233.539,0,244.683,0,256c0,11.319,0.744,22.461,2.167,33.391
			h220.44h0.001v220.442C233.539,511.256,244.681,512,256,512c11.317,0,22.461-0.743,33.391-2.167v-220.44v-0.001h220.442
			C511.256,278.461,512,267.319,512,256C512,244.683,511.256,233.539,509.833,222.609z"/>
			<path style="fill:#D80027;" d="M322.783,322.784L322.783,322.784L437.019,437.02c5.254-5.252,10.266-10.743,15.048-16.435
			l-97.802-97.802h-31.482V322.784z"/>
			<path style="fill:#D80027;" d="M189.217,322.784h-0.002L74.98,437.019c5.252,5.254,10.743,10.266,16.435,15.048l97.802-97.804
			V322.784z"/>
			<path style="fill:#D80027;" d="M189.217,189.219v-0.002L74.981,74.98c-5.254,5.252-10.266,10.743-15.048,16.435l97.803,97.803
			H189.217z"/>
			<path style="fill:#D80027;" d="M322.783,189.219L322.783,189.219L437.02,74.981c-5.252-5.254-10.743-10.266-16.435-15.047
			l-97.802,97.803V189.219z"/>
			</svg>		
		`
	},
	charts: {
		charthandleicon: () => [
			'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1',
			',8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,', 
			'12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z'
		].join(''), 
		linecharticon: () => [
			'M22 11h-4c-0.439 0-0.812 0.283-0.949 0.684l-2.051 6.154-5.051-15.154c-0.1',
			'75-0.524-0.741-0.807-1.265-0.633-0.31 0.103-0.535 0.343-0.633 0.633l-2.77',
			'2 8.316h-3.279c-0.552 0-1 0.448-1 1s0.448 1 1 1h4c0.423-0.003 0.81-0.267 ',
			'0.949-0.684l2.051-6.154 5.051 15.154c0.098 0.29 0.323 0.529 0.632 0.632 0',
			'.524 0.175 1.090-0.109 1.265-0.632l2.773-8.316h3.279c0.552 0 1-0.448 1-1s',
			'-0.448-1-1-1z',
		].join(''),
		barcharticon: () => [
			'M19 20v-10c0-0.552-0.448-1-1-1s-1 0.448-1 1v10c0 0.552 0.448 1 1 1s1-0.44',
			'8 1-1zM13 20v-16c0-0.552-0.448-1-1-1s-1 0.448-1 1v16c0 0.552 0.448 1 1 1s',
			'1-0.448 1-1zM7 20v-6c0-0.552-0.448-1-1-1s-1 0.448-1 1v6c0 0.552 0.448 1 1',
			' 1s1-0.448 1-1z',
		].join(''),
		selectzoneicon: () => [
			'M7.378 16.551c0.011 0.012 0.023 0.025 0.035 0.036s0.024 0.023 0.036 0.035',
			'c0.169 0.177 0.305 0.385 0.4 0.614 0.097 0.234 0.151 0.491 0.151 0.764s-0',
			'.054 0.53-0.151 0.765c-0.101 0.244-0.25 0.464-0.435 0.65s-0.406 0.334-0.6',
			'5 0.435c-0.234 0.096-0.491 0.15-0.764 0.15s-0.53-0.054-0.765-0.151c-0.244',
			'-0.101-0.464-0.25-0.65-0.435s-0.334-0.406-0.435-0.65c-0.096-0.234-0.15-0.',
			'491-0.15-0.764s0.054-0.53 0.151-0.765c0.101-0.244 0.25-0.464 0.435-0.65s0',
			'.406-0.334 0.65-0.435c0.234-0.096 0.491-0.15 0.764-0.15s0.53 0.054 0.765 ',
			'0.151c0.228 0.095 0.436 0.231 0.614 0.4zM13.764 15.188l5.53 5.52c0.391 0.',
			'39 1.024 0.39 1.414-0.001s0.39-1.024-0.001-1.414l-5.53-5.52c-0.391-0.39-1',
			'.024-0.39-1.414 0.001s-0.39 1.024 0.001 1.414zM7.449 7.378c-0.012 0.011-0',
			'.024 0.023-0.036 0.035s-0.024 0.024-0.035 0.036c-0.177 0.169-0.385 0.305-',
			'0.614 0.4-0.234 0.097-0.491 0.151-0.764 0.151s-0.53-0.054-0.765-0.151c-0.',
			'244-0.101-0.464-0.25-0.65-0.435s-0.334-0.406-0.435-0.65c-0.096-0.234-0.15',
			'-0.491-0.15-0.764s0.054-0.53 0.151-0.765c0.101-0.244 0.25-0.464 0.435-0.6',
			'5s0.406-0.334 0.65-0.435c0.234-0.096 0.491-0.15 0.764-0.15s0.53 0.054 0.7',
			'65 0.151c0.244 0.101 0.464 0.25 0.65 0.435s0.334 0.406 0.435 0.65c0.096 0',
			'.234 0.15 0.491 0.15 0.764s-0.054 0.53-0.151 0.765c-0.095 0.228-0.231 0.4',
			'36-0.4 0.614zM8.032 9.446l2.554 2.554-2.554 2.554c-0.16-0.095-0.328-0.179',
			'-0.502-0.251-0.473-0.195-0.99-0.303-1.53-0.303s-1.057 0.108-1.53 0.303c-0',
			'.49 0.203-0.93 0.5-1.298 0.868s-0.666 0.809-0.869 1.299c-0.195 0.473-0.30',
			'3 0.99-0.303 1.53s0.108 1.057 0.303 1.53c0.203 0.49 0.5 0.93 0.868 1.298s',
			'0.808 0.665 1.298 0.868c0.474 0.196 0.991 0.304 1.531 0.304s1.057-0.108 1',
			'.53-0.303c0.49-0.203 0.93-0.5 1.298-0.868s0.665-0.808 0.868-1.298c0.196-0',
			'.474 0.304-0.991 0.304-1.531s-0.108-1.057-0.303-1.53c-0.072-0.174-0.156-0',
			'.342-0.251-0.502l11.261-11.261c0.391-0.391 0.391-1.024 0-1.414s-1.024-0.3',
			'91-1.414 0l-7.293 7.293-2.554-2.554c0.095-0.16 0.179-0.328 0.251-0.502 0.',
			'195-0.473 0.303-0.99 0.303-1.53s-0.108-1.057-0.303-1.53c-0.203-0.49-0.5-0',
			'.93-0.868-1.298s-0.809-0.666-1.299-0.869c-0.473-0.195-0.99-0.303-1.53-0.3',
			'03s-1.057 0.108-1.53 0.303c-0.49 0.203-0.93 0.5-1.298 0.868s-0.666 0.809-',
			'0.869 1.299c-0.195 0.473-0.303 0.99-0.303 1.53s0.108 1.057 0.303 1.53c0.2',
			'03 0.49 0.5 0.93 0.868 1.298s0.809 0.666 1.299 0.869c0.473 0.195 0.99 0.3',
			'03 1.53 0.303s1.057-0.108 1.53-0.303c0.174-0.072 0.342-0.156 0.502-0.251z',
		].join(''),
		reloadsquareicon: () => [
			'M4 11v-2c0-0.408 0.081-0.795 0.227-1.147 0.152-0.366 0.375-0.697 0.652-0.',
			'974s0.608-0.5 0.974-0.652c0.352-0.146 0.739-0.227 1.147-0.227h11.586l-2.2',
			'93 2.293c-0.391 0.391-0.391 1.024 0 1.414s1.024 0.391 1.414 0l4-4c0.096-0',
			'.096 0.168-0.207 0.217-0.325 0.049-0.12 0.075-0.247 0.076-0.374 0-0.005 0',
			'-0.011 0-0.016-0.001-0.127-0.026-0.255-0.076-0.374-0.049-0.118-0.121-0.22',
			'9-0.217-0.325l-4-4c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414l',
			'2.293 2.293h-11.586c-0.675 0-1.322 0.134-1.912 0.379-0.613 0.254-1.163 0.',
			'625-1.624 1.085s-0.831 1.011-1.085 1.624c-0.245 0.59-0.379 1.237-0.379 1.',
			'912v2c0 0.552 0.448 1 1 1s1-0.448 1-1zM20 13v2c0 0.408-0.081 0.795-0.227 ',
			'1.147-0.152 0.366-0.375 0.697-0.652 0.974s-0.608 0.5-0.974 0.652c-0.352 0',
			'.146-0.739 0.227-1.147 0.227h-11.586l2.293-2.293c0.391-0.391 0.391-1.024 ',
			'0-1.414s-1.024-0.391-1.414 0l-4 4c-0.096 0.096-0.169 0.207-0.217 0.325-0.',
			'050 0.119-0.075 0.245-0.076 0.372 0 0.007 0 0.014 0 0.020 0.001 0.127 0.0',
			'26 0.253 0.075 0.372s0.121 0.229 0.217 0.325l4 4c0.391 0.391 1.024 0.391 ',
			'1.414 0s0.391-1.024 0-1.414l-2.292-2.293h11.586c0.675 0 1.322-0.134 1.912',
			'-0.379 0.613-0.254 1.163-0.625 1.623-1.085s0.832-1.011 1.085-1.623c0.246-',
			'0.591 0.38-1.238 0.38-1.913v-2c0-0.552-0.448-1-1-1s-1 0.448-1 1z',
		].join(''),
		reloadcircleicon: () => [
			'M4.453 9.334c0.362-1.023 0.91-1.925 1.591-2.682 0.708-0.787 1.562-1.42 2.',
			'505-1.869s1.971-0.716 3.029-0.772c1.017-0.054 2.063 0.088 3.086 0.45 1.18',
			'6 0.42 2.206 1.088 2.983 1.88l2.829 2.659h-3.476c-0.552 0-1 0.448-1 1s0.4',
			'48 1 1 1h6c0.004 0 0.007 0 0.011 0 0.137-0.001 0.268-0.031 0.386-0.082 0.',
			'122-0.053 0.231-0.129 0.322-0.223 0.013-0.014 0.027-0.028 0.039-0.043 0.0',
			'72-0.083 0.13-0.179 0.171-0.282 0.041-0.102 0.065-0.212 0.069-0.327 0.002',
			'-0.015 0.002-0.029 0.002-0.043v-6c0-0.552-0.448-1-1-1s-1 0.448-1 1v3.689l',
			'-2.926-2.749c-0.992-1.010-2.271-1.843-3.743-2.364-1.275-0.451-2.583-0.629',
			'-3.858-0.562-1.324 0.070-2.609 0.403-3.785 0.964s-2.243 1.351-3.13 2.336c',
			'-0.854 0.949-1.539 2.077-1.99 3.353-0.184 0.521 0.088 1.092 0.609 1.276s1',
			'.092-0.088 1.276-0.609zM2 16.312l2.955 2.777c0.934 0.935 2.038 1.659 3.21',
			'7 2.148 1.224 0.507 2.528 0.761 3.831 0.761s2.607-0.253 3.831-0.759c1.18-',
			'0.488 2.284-1.211 3.241-2.168 1.104-1.104 1.901-2.407 2.361-3.745 0.18-0.',
			'522-0.098-1.091-0.621-1.271s-1.091 0.098-1.271 0.621c-0.361 1.050-0.993 2',
			'.091-1.883 2.981-0.768 0.767-1.65 1.345-2.592 1.734-0.978 0.405-2.022 0.6',
			'08-3.066 0.607s-2.087-0.204-3.065-0.609c-0.941-0.39-1.823-0.968-2.613-1.7',
			'57l-2.8-2.632h3.475c0.552 0 1-0.448 1-1s-0.448-1-1-1h-6c-0.004 0-0.007 0-',
			'0.011 0-0.137 0.001-0.268 0.031-0.386 0.082-0.122 0.053-0.232 0.13-0.323 ',
			'0.225-0.013 0.013-0.025 0.027-0.037 0.041-0.072 0.084-0.131 0.18-0.172 0.',
			'284-0.040 0.102-0.064 0.211-0.069 0.326-0.002 0.014-0.002 0.028-0.002 0.0',
			'42v6c0 0.552 0.448 1 1 1s1-0.448 1-1z',
		].join(''),
		downloadicon: () => [
			'M20 15v4c0 0.137-0.027 0.266-0.075 0.382-0.050 0.122-0.125 0.232-0.218 0.',
			'325s-0.203 0.167-0.325 0.218c-0.116 0.048-0.245 0.075-0.382 0.075h-14c-0.',
			'137 0-0.266-0.027-0.382-0.075-0.122-0.050-0.232-0.125-0.325-0.218s-0.167-',
			'0.203-0.218-0.325c-0.048-0.116-0.075-0.245-0.075-0.382v-4c0-0.552-0.448-1',
			'-1-1s-1 0.448-1 1v4c0 0.405 0.081 0.793 0.228 1.148 0.152 0.368 0.375 0.6',
			'98 0.651 0.974s0.606 0.499 0.974 0.651c0.354 0.146 0.742 0.227 1.147 0.22',
			'7h14c0.405 0 0.793-0.081 1.148-0.228 0.368-0.152 0.698-0.375 0.974-0.651s',
			'0.499-0.606 0.651-0.974c0.146-0.354 0.227-0.742 0.227-1.147v-4c0-0.552-0.',
			'448-1-1-1s-1 0.448-1 1zM13 12.586v-9.586c0-0.552-0.448-1-1-1s-1 0.448-1 1',
			'v9.586l-3.293-3.293c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414',
			'l5 5c0.002 0.002 0.004 0.004 0.006 0.006 0.095 0.093 0.203 0.163 0.318 0.',
			'211 0.12 0.050 0.249 0.075 0.377 0.076 0.004 0 0.008 0 0.011 0 0.128-0.00',
			'1 0.257-0.026 0.377-0.076 0.118-0.049 0.228-0.121 0.324-0.217l5-5c0.391-0',
			'.391 0.391-1.024 0-1.414s-1.024-0.391-1.414 0z',
		].join(''),
		tableicon: () => [
			'M17.586 7h-2.586v-2.586zM20.703 7.289l-5.996-5.996c-0.001-0.001-0.003-0.0',
			'02-0.004-0.004-0.095-0.094-0.204-0.165-0.32-0.213-0.122-0.051-0.253-0.076',
			'-0.383-0.076h-8c-0.405 0-0.793 0.081-1.148 0.228-0.367 0.152-0.697 0.375-',
			'0.973 0.651s-0.499 0.606-0.651 0.973c-0.147 0.355-0.228 0.743-0.228 1.148',
			'v16c0 0.405 0.081 0.793 0.228 1.148 0.152 0.368 0.375 0.698 0.651 0.974s0',
			'.606 0.499 0.974 0.651c0.354 0.146 0.742 0.227 1.147 0.227h12c0.405 0 0.7',
			'93-0.081 1.148-0.228 0.368-0.152 0.698-0.375 0.974-0.651s0.499-0.606 0.65',
			'1-0.974c0.146-0.354 0.227-0.742 0.227-1.147v-12c0-0.276-0.112-0.526-0.293',
			'-0.707zM13 3v5c0 0.552 0.448 1 1 1h5v11c0 0.137-0.027 0.266-0.075 0.382-0',
			'.050 0.122-0.125 0.232-0.218 0.325s-0.203 0.167-0.325 0.218c-0.116 0.048-',
			'0.245 0.075-0.382 0.075h-12c-0.137 0-0.266-0.027-0.382-0.075-0.122-0.050-',
			'0.232-0.125-0.325-0.218s-0.167-0.203-0.218-0.325c-0.048-0.116-0.075-0.245',
			'-0.075-0.382v-16c0-0.137 0.027-0.266 0.075-0.382 0.050-0.122 0.125-0.232 ',
			'0.218-0.325s0.203-0.167 0.325-0.218c0.116-0.048 0.245-0.075 0.382-0.075zM',
			'16 12h-8c-0.552 0-1 0.448-1 1s0.448 1 1 1h8c0.552 0 1-0.448 1-1s-0.448-1-',
			'1-1zM16 16h-8c-0.552 0-1 0.448-1 1s0.448 1 1 1h8c0.552 0 1-0.448 1-1s-0.4',
			'48-1-1-1zM10 8h-2c-0.552 0-1 0.448-1 1s0.448 1 1 1h2c0.552 0 1-0.448 1-1s',
			'-0.448-1-1-1z',
		].join(''),
		fullscreenicon: () => [
			'M8 2h-3c-0.405 0-0.793 0.081-1.148 0.228-0.367 0.152-0.697 0.375-0.973 0.',
			'651s-0.499 0.606-0.651 0.973c-0.147 0.355-0.228 0.743-0.228 1.148v3c0 0.5',
			'52 0.448 1 1 1s1-0.448 1-1v-3c0-0.137 0.027-0.266 0.075-0.382 0.050-0.122',
			' 0.125-0.232 0.218-0.325s0.203-0.167 0.325-0.218c0.116-0.048 0.245-0.075 ',
			'0.382-0.075h3c0.552 0 1-0.448 1-1s-0.448-1-1-1zM22 8v-3c0-0.405-0.081-0.7',
			'93-0.228-1.148-0.152-0.368-0.375-0.698-0.651-0.974s-0.606-0.499-0.974-0.6',
			'51c-0.354-0.146-0.742-0.227-1.147-0.227h-3c-0.552 0-1 0.448-1 1s0.448 1 1',
			' 1h3c0.137 0 0.266 0.027 0.382 0.075 0.122 0.050 0.232 0.125 0.325 0.218s',
			'0.167 0.203 0.218 0.325c0.048 0.116 0.075 0.245 0.075 0.382v3c0 0.552 0.4',
			'48 1 1 1s1-0.448 1-1zM16 22h3c0.405 0 0.793-0.081 1.148-0.228 0.368-0.152',
			' 0.698-0.375 0.974-0.651s0.499-0.606 0.651-0.974c0.146-0.354 0.227-0.742 ',
			'0.227-1.147v-3c0-0.552-0.448-1-1-1s-1 0.448-1 1v3c0 0.137-0.027 0.266-0.0',
			'75 0.382-0.050 0.122-0.125 0.232-0.218 0.325s-0.203 0.167-0.325 0.218c-0.',
			'116 0.048-0.245 0.075-0.382 0.075h-3c-0.552 0-1 0.448-1 1s0.448 1 1 1zM2 ',
			'16v3c0 0.405 0.081 0.793 0.228 1.148 0.152 0.368 0.375 0.698 0.651 0.974s',
			'0.606 0.499 0.974 0.651c0.354 0.146 0.742 0.227 1.147 0.227h3c0.552 0 1-0',
			'.448 1-1s-0.448-1-1-1h-3c-0.137 0-0.266-0.027-0.382-0.075-0.122-0.050-0.2',
			'32-0.125-0.325-0.218s-0.167-0.203-0.218-0.325c-0.048-0.116-0.075-0.245-0.',
			'075-0.382v-3c0-0.552-0.448-1-1-1s-1 0.448-1 1z',
		].join(''),
	},
};
