/**
 * worker.ts
 * A Cloudflare edge hosted Worker for Bootstrap UI development.
 */

//  Import modules
import { rawHtmlResponse } from './std'
import { nationToIso2, iso3To2 } from './flag'
import { Card, Form, Page, Table } from './dom'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { FetchAPI } from './fetchAPI'
import { extractWikiTable, wikiTableToJSON } from './wikiParse'
import { SQLCrud } from './sql-d1'

const version = '0.0.0'
const api_version = ['v1']

var ENV = {
	version: version,
	siteTitle: 'Fetch API',
	brand: `Fetch API Build ${version}`,
	copyright: 'Blaine Harper',
	navbar: [{
		text: 'About',
		links: [{
			text: 'Developer',
			link: '/developer'
		}, {
			text: 'Other Projects',
			link: '/projects'
		}],
	},{
		text: 'F1 API',
		links: [{
			text: 'Driver Profile',
			link: `/drivers/profile/lando-norris`
		},{
			text: 'Current Drivers',
			link: `/drivers/championship`
		},{
			text: 'Races',
			link: `/races`
		},{
			text: 'Add Race Results',
			link: `/api/${api_version[0]}/races/addResults`
		},{
			text: 'hr',
		},{
			text: 'Drivers',
			link: `/api/${api_version[0]}/drivers`
		},{
			text: 'Drivers (byYear)',
			link: `/api/${api_version[0]}/drivers/byYear/`
		},{
			text: 'Meetings',
			link: `/api/${api_version[0]}/meetings`
		}, {
			text: 'Sessions',
			link: `/api/${api_version[0]}/sessions`
		}, {
			text: 'Export',
			link: `/api/${api_version[0]}/export`
		}],
	}]
}

const colors = {
	'red': { primary: '782F40', secondary: 'FFA400' },
	'blue': { primary: '001E38', secondary: 'F7C564' },
	'green': { primary: '01504A', secondary: 'FFC600' },
	'purple': { primary: '301934', secondary: 'FFA400' },
	'orange': { primary: 'C04000', secondary: 'F7C564' },
}

const applyCSSTheme = (scheme, options = {}) => {
	function isValidHexColor(hex) {
		// Use a regular expression to check if the input is a valid 6-digit hex color
		const hexColorPattern = /^#?([A-Fa-f0-9]{6})$/;
		return hexColorPattern.test(hex);
	}	
	const hexToRBG = (hex) => {
		// Ensure the hex code is exactly 2 digits
		let _hex = hex || []
		if (_hex.length === 3) {
			_hex += _hex
		}
		if (_hex.length !== 6) {
			throw new Error('Invalid hex color format. It should be 6 digits.');
		}
		let output = parseInt(hex, 16)
		output = Math.floor(output)
		output = Math.min(255, Math.max(0, output))
		const rDecimalValue = parseInt(hex.substring(0, 2), 16)
		const gDecimalValue = parseInt(hex.substring(2, 4), 16)
		const bDecimalValue = parseInt(hex.substring(4, 6), 16)

		// Use the decimal value for each RGB component to create a shade of gray
		return `${rDecimalValue}, ${gDecimalValue}, ${bDecimalValue}`
	}
	function hexToComplement(hex) {
		// Ensure the input is a valid 6-digit hex color
		if (!/^#?([A-Fa-f0-9]{6})$/.test(hex)) {
			throw new Error("Invalid hex color");
		}
	
		// Remove the hash if it exists
		hex = hex.replace(/^#/, '');
	
		// Convert the hex color to RGB
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
	
		// Calculate the complement
		const compR = 255 - r;
		const compG = 255 - g;
		const compB = 255 - b;
	
		// Convert the complement RGB values back to hex
		const compHex = ((compR << 16) | (compG << 8) | compB).toString(16).padStart(6, '0');
	
		return `${compHex}`;
	}
	function rgbToHsl(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
	
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;
	
		if (max === min) {
			h = s = 0; // achromatic
		} else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
	
			h /= 6;
		}
	
		return { h: h * 360, s, l };
	}
	function hslToHex(h, s, l) {
		let r, g, b;
	
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 3) return q;
			if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
	
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
	
		const toHex = x => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
	
		return `${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	function hexToAnalogous(hex) {
		// Ensure the input is a valid 6-digit hex color
		if (!/^#?([A-Fa-f0-9]{6})$/.test(hex)) {
			throw new Error("Invalid hex color");
		}
	
		// Remove the hash if it exists
		hex = hex.replace(/^#/, '');
	
		// Convert hex to RGB
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
	
		// Convert RGB to HSL
		const { h, s, l } = rgbToHsl(r, g, b);
	
		// Get the analogous colors by adjusting the hue
		const analogous1 = hslToHex((h + 30) % 360, s, l);
		const analogous2 = hslToHex((h - 30 + 360) % 360, s, l);
	
		return [analogous1, analogous2];
	}
	if(options.team_color){
		const { primary_color, secondary_color, tertiary_color } = scheme
		return `
			<style>
			:root{
				--f1-team-primary: #${primary_color};
				--f1-team-primary-rgb: ${hexToRBG(primary_color)};
				--f1-team-secondary: #${secondary_color};
				--f1-team-secondary-rgb: ${hexToRBG(secondary_color)};
				--f1-team-tertiary: #${tertiary_color};
				--f1-team-tertiary-rgb: ${hexToRBG(tertiary_color)};
			}
			</style>`
	}
	if(!isValidHexColor(scheme)){
		if (!Object.keys(colors).includes(scheme))
			scheme = 'red'
		const rbgPrimary = `${hexToRBG(colors[scheme].primary)}`
		const rbgSecondary = `${hexToRBG(colors[scheme].secondary)}`
		return `
			<style>
			:root{
				--bh-primary: #${colors[scheme].primary};
				--bh-primary-rgb: ${rbgPrimary};
				--bh-secondary: #${colors[scheme].secondary};
				--bh-secondary-rgb: ${rbgSecondary};
			}
			</style>`
	}
	return `
			<style>
			:root{
				--bh-primary: #${scheme};
				--bh-primary-rgb: ${hexToRBG(scheme)};
				--bh-secondary: #${hexToComplement(scheme)};
				--bh-secondary-rgb: ${hexToRBG(hexToComplement(scheme))};
			}
			</style>
	`
}

const formatRequest = (endpoint, c, overrides = {}) => {
	overrides.request = overrides.request ? overrides.request : {}
	overrides.query = overrides.query ? overrides.query : {}
	const request = {
		endpoint: endpoint,
		...c.req.param(),
		...overrides.request,
	}
	const query = {
		...c.req.param(),
		...c.req.queries(),
		...overrides.query,
	}
	return { request: request, query: query }
}

// 	set application default's for page generation
//	Page will use this as the default contents for <head></head> unless overwritten with Page.header
const _headerDef = `
	<meta name='viewport' content='width=device-width,initial-scale=1'/>
	<link rel='icon' type='image/x-icon' href='https://blaineharper.com/assets/favicon.ico'>
	
	<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/color-square.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/wiki.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/top-button.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/team-color.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/bs.add.css'>

	<script src='https://kit.fontawesome.com/5496aaa581.js' crossorigin='anonymous'><\/script>`

const _copyright = `
	<span id = 'footerText'><span id='year'></span> © ${ENV.copyright}</span>
	<script>document.getElementById('year').innerHTML = new Date().getFullYear();</script>`

const _footerDef = `
	<div class='mx-auto'>
		<div id='footer_motto' class='col-lg-3 col-md-6 col-sm-9 col-xs-11 mx-auto bh-left-bar p-3 shadow-lg bh-sand bg-gradient text-center panel rounded-0' style='margin-bottom:7.5rem;'>
			<i>This project was created to showcase the power of Cloudflare Workers for easing workflow and improving speed and reliability. Start your own Cloudflare worker site <a href='https://github.com/bhar2254/Cloudflare-Workers-Starter'>here!</a></i>
			<br><br>
			<small>As such, this site is not affiliated with F1 or any other brands shown or displayed in these data sets.</small>
		</div>
	</div>
	<button onclick="topFunction()" id="topButton" title="Go to top" style="display:block;">Top</button> 
	<script>
		let buttonToTop = document.getElementById("topButton");

		// When the user scrolls down 20px from the top of the document, show the button
		window.onscroll = function() {scrollFunction()};

		function scrollFunction() {
			if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
				buttonToTop.style.display = "block";
			} else {
				buttonToTop.style.display = "none";
			}
		}

		// When the user clicks on the button, scroll to the top of the document
		function topFunction() {
			document.body.scrollTop = 0;
			document.documentElement.scrollTop = 0;
		}
	</script>

	<footer id='mainFooter' class='mx-auto shadow-lg p-2 text-center bh-light-grey bg-gradient sticky-footer'>
		${_copyright}
	</footer>	
<script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js' integrity='sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL' crossorigin='anonymous'><\/script>`

const pageDefaults = {
	...ENV, 
	header: _headerDef, 
	footer: _footerDef,
}

Page.setDefs(pageDefaults)

FetchAPI.setDefaults({
	baseURL: `https://api.openf1.org/v1`,
	endpoint: `drivers`,
	endpoints: {
		'drivers': 'driver_number',
		'meetings': 'meeting_key',
		'sessions': 'session_key'
	}
})

const app = new Hono()

app.use('/api/*', 
	cors({
	  // `c` is a `Context` object
	  origin: (origin, c) => {
		return origin.endsWith('.blaineharper.com')
		  ? origin
		  : 'http://blaineharper.com'
	  },
	})
)

//	route handler
app.get('/', async c => {
	const page = new Page({
		page_title: 'Home',
		body: `<div class='p-3 text-center'><h2>Hello World!</h2<</div><br>
				<img class='p-3 mx-auto d-block rounded' src='https://blaineharper.com/assets/favicon.ico' style='max-width:100%; max-height: 25rem'>`
	})
	return rawHtmlResponse(page.render())
})

app.get('/developer', async c => {
	const page = new Page({
		pageTitle: 'Developer',
		body: `Hi! My name's Blaine. I make websites and other JavaScript applications. If you're interested in creating your own JavaScript projects like this one, check out my <a href='https://github.com/bhar2254'>GitHub</a> or check out my site <a href='https://blaineharper.com'>BlaineHarper.com</a> for (possibly?) up to date details.`
	})
	return rawHtmlResponse(page.render())
})

app.get('/projects', async c => {
	const page = new Page({
		pageTitle: 'Projects',
		body: `If you'd like to view my other projects, check out my <a href='https://github.com/bhar2254'>GitHub</a>!`
	})
	return rawHtmlResponse(page.render())
})

app.get(`/wiki/:wiki_page`, async c => {
	const { wiki_page } = c.req.param()
	return c.redirect(`https://en.wikipedia.org/wiki/${wiki_page}`)
})

app.get(`/drivers`, async c => {
	const year = new Date().getFullYear()
	return c.redirect(`/drivers/championship/${year}`)
})

app.get(`/drivers/championship`, async c => {
	const year = new Date().getFullYear()
	return c.redirect(`/drivers/championship/${year}`)
})

app.get(`/drivers/championship/:year`, async c => {
	// Access the D1 database bound to this Worker
	const db = c.env.DB
	const { year } = c.req.param()
	const resultsTable = new SQLCrud(c.env.DB, 'results')
	const { results } = await resultsTable.read({
		columns: ['drivers.*', `drivers.forename || ' ' || drivers.surname AS full_name`,
			'MAX(driver_standings.position) AS position', 'MAX(driver_standings.points) as points',
			'constructors.name AS constructor_name', 'constructors.primary_color', 'constructors.secondary_color', 'constructors.tertiary_color'],
		join: ['LEFT JOIN drivers ON drivers.driverId = results.driverId, races ON races.raceId = results.raceId, constructors ON results.constructorId = constructors.constructorId',
			`driver_standings ON driver_standings.raceId = races.raceId and driver_standings.driverId = drivers.driverId`
		],
		group: ['drivers.driverId'],
		where: [`races.year = ${year}`],
		orderBy: ['points DESC'],
	})
	let body = `<div class="my-3 py-3 border-bottom h3">Formula 1 <br> ${year} Championship Drivers</div>
		<div class="row g-4">`
	let index = 1
	let processedDrivers = []
	for(const each of results){
		if(processedDrivers.includes(each.code))
			continue
		processedDrivers.push(each.code)
		const driver_d1_data = each
		const driver = {
			forename: driver_d1_data.forename.replaceAll(" ", ""),
			surname: driver_d1_data.surname.replaceAll(" ", ""),
			full_name: driver_d1_data.full_name,
			nationality: each.nationality,
			points: driver_d1_data.points,
			position: driver_d1_data.position,
		}
		driver.img_code = `${driver.forename.substring(0, 3).toUpperCase()}${driver.surname.substring(0, 3).toUpperCase()}01`
		const constructor = {
			name: driver_d1_data.constructor_name,
			primary_color: driver_d1_data.primary_color || '000000'
		}
		const text_color = constructor.primary_color < '555555' ? 'white' : 'black'
		const col_width = index > 3 ? 'col-lg-3 col-md-4 col-sm-12 mx-auto' : 'col-lg-4 col-md-6 col-sm-12 mx-auto'
		const cardData = {
			header: `<div class='col-12 float-start'>
						${driver.forename} <strong>${driver.surname.toUpperCase()}</strong>
					</div>
					<div class='col-12 float-end'>
						<img src="https://flagsapi.com/${nationToIso2(driver.nationality)}/flat/32.png"/>
					</div>`,
			body: `<div class="row g-4">
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
							<a href="/drivers/profile/${driver.forename.toLowerCase()}-${driver.surname.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${driver.forename.substring(0, 1)}/${driver.img_code}_${driver.forename}_${driver.surname}/${driver.img_code.toLowerCase()}.png"></a>
						</div>
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
							<p class='border-top border-bottom py-1 h5 fw-bold' lang='en'>
								${driver.position || 0} | ${driver.points || 0}  
							</p>                                        
							<a href="/drivers/profile/${driver.full_name.toLowerCase().replaceAll(' ','-')}}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${driver.img_code}.png"></a>
						</div>      
					</div>     `,
			footer: `<div class="row text-center">
						<div class="col-lg-6 col-md-9 p-1 my-3 mx-auto rounded-3" style="color: ${text_color}; background-color:#${constructor.primary_color}">${constructor.name || 'Missing'}</div>
					</div>`,
		}
		const card = new Card(cardData)
		body += `<div class="${col_width}">${card.render()}</div>`
		index++
	}
	body += '</div>'
	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: `${new Date().getFullYear()} Championship`,
		body: body 
	})
	return rawHtmlResponse(page.render())
})

app.get(`/drivers/profile/:identifier`, async c => {
	let identifier = c.req.param('identifier')
	identifier = identifier.replaceAll('_','-')
	let identifierSplit = identifier.split('-')
	const year = new Date(Date.now()).getFullYear()
	let key = ''
	let value = ''
	
	if(!Number.isNaN(Number(identifier))){
		key = 'drivers.driverId'
		value = identifier
	} 
	if(Number.isNaN(Number(identifier))){
		key = 'full_name'
		let splitName = identifierSplit
		splitName = splitName.map(x => x.capitalizeFirstChar())
		value = `${splitName.join(' ').trim()}`
	}

	const driversTable = new SQLCrud(c.env.DB, 'drivers')
	const driverData = await driversTable.read({
		columns: ['drivers.driverId', 'drivers.driverRef', 'drivers.surname', 'drivers.forename', 'drivers.nationality', `drivers.forename || ' ' || drivers.surname AS full_name`, 'drivers.code', 'drivers.number',
			'driver_standings.position','driver_standings.points',
			'constructors.name AS constructor_name', 'constructors.primary_color', 'constructors.secondary_color', 'constructors.tertiary_color'],
		join: ['LEFT JOIN results ON drivers.driverId = results.driverId, constructors ON results.constructorId = constructors.constructorId, driver_standings ON drivers.driverId = driver_standings.driverId'],
		where: `${key} LIKE "${value}"`,
		orderBy: ['driver_standings.driverStandingsId DESC', 'results.resultId DESC'],
		limit: '1'
	})
	
	if(typeof driverData.results[0] === 'undefined' && identifierSplit.length > 1){
		identifierSplit.pop()
		return c.redirect(`/drivers/profile/${identifierSplit.join('-')}`)
	}

	const profile_data = driverData.results[0]
	const driver = {
		driverId: profile_data.driverId || 0,
		forename: profile_data.forename || '',
		surname: profile_data.surname || '',
		number: profile_data.number || 0,
		nationality: profile_data.nationality || 'GBR',
		position: profile_data.position || 0,
		points: profile_data.points || 0,
	}
	driver.profile_headshot = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/${year}Drivers/${driver.surname.toLowerCase()}`
	driver.headshot = `${driver.forename.substring(0, 3).toUpperCase()}${driver.surname.substring(0, 3).toUpperCase()}01`
	driver.headshot_url = profile_data.url || `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${driver.forename.substring(0, 1)}/${driver.headshot.toUpperCase()}_${driver.forename}_${driver.surname}/${driver.headshot.toLowerCase()}.png`,
	driver.number_url = `https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${driver.forename.substring(0, 3).toUpperCase()}${driver.surname.substring(0, 3).toUpperCase()}01.png`

	if (key === 'drivers.driverId')
		return c.redirect(`/drivers/profile/${driver.forename.toLowerCase()}-${driver.surname.toLowerCase()}`)

	const constructor = {
		name: profile_data.constructor_name,
		scheme: (({ primary_color, secondary_color, tertiary_color }) => ({ primary_color, secondary_color, tertiary_color }))(profile_data)
	}
	const primary_text_color = constructor.scheme.primary_color < '555555' ? '#dddddd' : '#333333'
	const secondary_text_color = constructor.scheme.secondary_color < '555555' ? '#dddddd' : '#333333'

	const racesTable = new SQLCrud(c.env.DB, 'results')
	const racesData = await racesTable.read({
		columns: ['races.name', 'races.year', 'races.date', 'races.url',
			'results.number', 'results.position', 'results.positionText', 'results.points', 'results.time', 'results.fastestLap', 'results.fastestLapTime', 'results.rank'
		],
		join: ['LEFT JOIN races ON results.raceId = races.raceId'],
		where: `driverId = "${driver.driverId}"`,
		orderBy: ['results.resultId DESC']
	})

	let race_results = `<div class="btn-group flex-wrap" role="group">`
	let previous_year = 0
	let years_raced = []
	for (const each of racesData.results){
		if(!years_raced.includes(each.year)){
			years_raced.push(each.year)
			race_results += `<a href="#${each.year}" type="button" class="btn f1-team-secondary" style="color:${secondary_text_color}">${each.year}</a>`
		}
	}
	race_results += '</div>'
	for (const each of racesData.results){
		const { url = '', time = '', position = 0, points = 0 } = each
		if(previous_year !== each.year){
			previous_year = each.year
			race_results += `
					</tbody>
				</table>
				</div>
				<h2 id="${each.year}" class="my-3">${each.year} Championship Standings</h2>
				<hr>
				<div class="table-responsive">
				<table class="table table-striped">
				<thead class="fw-bold">
					<td>Track</td>
					<td>Date</td>
					<td>Time</td>
					<td>Position</td>
					<td>Points</td>
				</thead>
				<tbody>
				</div>`
		}
		race_results += `
					<tr>
						<td><a class="btn f1-team-primary" style="color:#${primary_text_color}" href="/races/race/${url.split('/')[4]}">${each.name}</a></td>
						<td>${new Date(each.date).toLocaleDateString()}</td>
						<td>${String(time).replaceAll('\\N','')}</td>
						<td>${String(position).replaceAll('\\N', '') }</td>
						<td>${String(points).replaceAll('\\N', '')}</td>
					</tr>`
	}
	race_results += `</tbody>
			</table>`
	const updateUserFields = [
		{
			id: `drivers.number`,
			tag: 'input',
			key: `number`,
			type: 'number',
			value: driver.number,
			label: `Driver #`,
			required: true,
		},
		{
			id: `drivers.forename`,
			tag: 'input',
			key: `forename`,
			type: 'text',
			value: driver.forename,
			label: `Forename`,
			placeholder: 'Forename',
			required: true,
		},
		{
			id: `drivers.surname`,
			tag: 'input',
			key: `surname`,
			type: 'text',
			value: driver.surname,
			label: `Surname`,
			placeholder: 'Surname',
			required: true,
		}
	]
	const udpateUserForm = new Form({ action: `/drivers/profile/${driver.driverId}/update`, fields: updateUserFields })
	const body = `
		<div class="row mx-auto"
			<div class="col-11">
				<div class="card p-0">
					<div class='card-header text-center'>
						<div class='col-12'>
							<h2>
								${driver.forename} <strong>${driver.surname.toUpperCase()}</strong> 
								<img class="mx-3" src="https://flagsapi.com/${nationToIso2(driver.nationality)}/flat/64.png"/>
							</h2>
						</div>
					</div>
					<div class="card-body">
						<div class="row g-4">
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-8'>
								<a href="/drivers/profile/${driver.forename.toLowerCase()}-${driver.surname.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="${driver.profile_headshot}"></a>
							</div>
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-12'>
								<p class='border-top border-bottom py-1 h5 fw-bold' lang='en'>
									${driver.position} | ${driver.points}
								</p>                                        
								<a href="/drivers/profile/${driver.forename.toLowerCase()}-${driver.surname.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="${driver.number_url}"></a>
								<div class="row text-center">
									<div class="col-lg-6 col-md-9 my-3 mx-auto rounded-3 btn f1-team-primary" style="color:#${primary_text_color}">${constructor.name}</div>
								</div>
								${udpateUserForm.render()}
							</div>      
						</div>     
					</div>          
					<div class="card-footer">
						<div class="row">
							${race_results}
						<div>
					</div>
				</div>
			</div>
		</div>`
	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		headerOverwrite: _headerDef + applyCSSTheme(constructor.scheme, {team_color: true}),
		pageTitle: `${driver.forename} ${driver.forename}`, 
		body: body
	})
	return rawHtmlResponse(page.render())
})

app.get(`/drivers/profile/:driverId/update`, async c => {
	const db = c.env.DB
	const { driverId } = c.req.param()
	const queries = c.req.queries()
	let queryArr = Object.entries(queries).map(x => `${x[0]} = "${x[1]}"`)
	let updateQuery = `UPDATE drivers SET ${queryArr.join(', ')} WHERE driverId = "${driverId}";`
	db.prepare(updateQuery).run()	
	return c.redirect(`/drivers/profile/${driverId}`)
})

app.get(`/races`, async c => {
	const year = new Date().getFullYear()
	return c.redirect(`/races/${year}`)
})

app.get(`/races/:year`, async c => {
	const db = c.env.DB
	const { year } = c.req.param()
	const SQLTable = new SQLCrud(db, 'races')
	const { results } = await SQLTable.read({
		columns: ["DISTINCT name, date, time, url"],
		where: `races.year = ${year} AND DATE(date) < DATE('now')`,
		orderBy: ['CAST(races.raceId AS INTEGER) DESC']
	})
	let race_results = `
			<table class="table table-striped">
				<thead class="fw-bold">
					<td>Track</td>
					<td>Date</td>
					<td>Time</td>
					<td>Preview</td>
				</thead>
				<tbody>`
	for(const each of results){
		const wikiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${each.name.replaceAll(" ","_")}&format=json`
		// const fetchWiki = await fetch(wikiUrl)
		// const jsonData = await fetchWiki.json()
		race_results += `
					<tr>
						<td><a class="btn bh-primary" href="/races/race/${each.url.split('/')[4]}">${each.name}</a></td>
						<td>${new Date(each.date).toLocaleDateString()}</td>
						<td>${each.time.substring(0,5)}</td>
						<td><img src=""/></td>
					</tr>`
	}
	race_results += `</tbody>
			</table>`
	const heading = `${year} Formula One World Championship`
	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: heading,
		body: `<h1 class="text-center">${heading}</h1>
		
			<div class="text-center mx-auto">
				${race_results}
			</div>`
	})
	return c.html(page.render())
})

app.get(`/races/race/:race_name`, async c => {
	const { race_name } = c.req.param()
	const fetch2Data = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${race_name}&format=json`)
	const jsonData = await fetch2Data.json()

	const qualiTable = wikiTableToJSON('Qualifying_classification', jsonData);
	let tableObjects = qualiTable.map(x => ({
		position: Number(x[0]),
		driver_number: Number(x[1]),
		driver: String(x[2]).replaceAll('/wiki/', '/drivers/profile/'),
		constructor: String(x[3]),
		q1: String(x[4]),
		q2: String(x[5]),
		q3: String(x[6]),
		grid: String(x[7]),
	}));
	tableObjects = tableObjects.filter(obj => !isNaN(obj.position) && !isNaN(obj.driver_number));
	const qualisTable = new Table({ data: tableObjects })

	const raceTable = wikiTableToJSON('Race_classification', jsonData);
	tableObjects = raceTable.map(x => ({
		position: Number(x[0]),
		driver_number: Number(x[1]),
		driver: String(x[2]).replaceAll('/wiki/', '/drivers/profile/'),
		constructor: String(x[3]),
		laps: String(x[4]),
		time: String(x[5]),
		grid: String(x[6]),
		points: String(x[7]),
	}));
	tableObjects = tableObjects.filter(obj => !isNaN(obj.position) && !isNaN(obj.driver_number));
	const racesTable = new Table({ data: tableObjects })

	let heading = ''
	for(const each of race_name.split('_')){
		heading += `${each.capitalizeFirstChar()} `
	}

	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: heading,
		body: `<h1 class="my-3 py-3 text-center">${heading}</h1>
			<div class="btn-group flex-wrap" role="group">
				<a href="#race" type="button" class="btn bh-primary">Race</a>
				<a href="#qualifying" type="button" class="btn bh-primary">Qualifying</a>
			</div>
			<h3 id="race">Grand Prix</h3>
			<div class= "text-center mx-auto table-responsive">
				${ racesTable.render() }
			</div>
			<h3 id="qualifying">Qualifying</h3>
			<div class="text-center mx-auto table-responsive">
				${qualisTable.render()}
			</div>`
	})
	return c.html(page.render())
})

app.get(`/races/:race_name`, async c => {
	const { race_name } = c.req.param()
	const fetch2Data = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${race_name}&format=json`)
	const jsonData = await fetch2Data.json()
	const raceClassificationTable = extractWikiTable('Race_classification', jsonData);
	let heading = ''
	for(const each of race_name.split('_')){
		heading += `${each.capitalizeFirstChar()} `
	}
	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: heading,
		body: `<h1 class="text-center">${heading}</h1>
		
			<div class="text-center mx-auto">
				${raceClassificationTable}
			</div>`
	})
	return c.html(page.render())
})

// 
// 	API
// 

//	SQLCrud implementation
app.get(`/api/${api_version[0]}/create/:table`, async c => {
	const { table } = c.req.param()
	const queries = c.req.queries()
	const sqlTable = new SQLCrud(c.env.DB, table)
	let response
	try {
		response = await sqlTable.create({
			data: queries,
		})
	} catch (error) {
		return c.body(`Resource create failed: ${error}`, 500, {
			'X-Message': `Resource create failed!`,
			'Content-Type': 'text/plain',
		})
	}
	return c.json({ response: { status: 201, ...response } })
})

app.get(`/api/${api_version[0]}/read/:table/:identifier`, async c => {
	const { table, identifier, value } = c.req.param()
	const queries = c.req.queries()	// filter
	const sqlTable = new SQLCrud(c.env.DB, table)
	let response
	try {
		response = await sqlTable.read({
			where: `${identifier} = "${value}"`,
		})
	} catch (error) {
		return c.body(`Resource read failed: ${error}`, 500, {
			'X-Message': `Resource update failed!`,
			'Content-Type': 'text/plain',
		})
	}
	return c.json({ response: { status: 201, ...response } })
})

app.get(`/api/${api_version[0]}/update/:table/:identifier/:value`, async c => {
	const { table, identifier, value } = c.req.param()
	const queries = c.req.queries()
	const sqlTable = new SQLCrud(c.env.DB, table)
	let response
	try {
		response = await sqlTable.update({
			data: queries,
			where: `${identifier} = "${value}"`,
		})
	} catch (error) {
		return c.body(`Resource update failed: ${error}`, 500, {
			'X-Message': `Resource update failed!`,
			'Content-Type': 'text/plain',
		})
	}
	return c.json({ response: { status: 201, ...response } })
})

app.get(`/api/${api_version[0]}/destroy/:table/:identifier/:value`, async c => {
	const { table, identifier, value } = c.req.param()
	const queries = c.req.queries()
	const sqlTable = new SQLCrud(c.env.DB, table)
	let response
	try {
		response = await sqlTable.delete({
			data: queries,
			where: `${identifier} = "${value}"`,
		})
	} catch (error) {
		return c.body(`Resource delete failed: ${error}`, 500, {
			'X-Message': `Resource delete failed!`,
			'Content-Type': 'text/plain',
		})
	}
	return c.json({ response: { status: 201, ...response } })
})

app.get(`/api/${api_version[0]}/races/addResults`, async c => {
	const heading = 'Add Race Results'
	const year = new Date().getFullYear()
	const track = {}
	let fields = []
	track.query = `SELECT DISTINCT name FROM races WHERE year = ${year}`
	track.prepare = await c.env.DB.prepare(track.query).all()
	track.options = {}
	for(const row of track.prepare.results){
		const key = row.name.split(' ')[0]
		track.options[key] = row.name
	} 
	
	function calculateAge(birthday) { // birthday is a date
		const now = new Date(Date.now()).getFullYear()
		const birthdate = Number(birthday)
		return now - birthdate + 1
	}

	function convertToObj(a, b) {
		if (a.length != b.length ||
			a.length == 0 ||
			b.length == 0) {
			return null;
		}
		let obj = {};

		// Using the foreach method
		a.forEach((k, i) => { obj[k] = b[i] })
		return obj;
	}
	const n10array = Array.from(Array(calculateAge(1950)).keys()).map(x => 2024 - x)	// 1950, first year of F1 racing
	const n10obj = convertToObj(n10array, n10array)

	fields = [
		{
			id: 'race.name',
			tag: 'select',
			key: 'race.name',
			value: c.req.param('race.name') || 'Bahrain',
			label: 'Race Name',
			required: true,
			options: track.options
		},
		{
			id: 'race.year',
			tag: 'select',
			key: 'race.year',
			value: year,
			label: 'Year',
			required: true,
			options: n10obj
		},
	]

	const drivers = {}
	drivers.query = `
		SELECT
			drivers.driverId,
			drivers.driverRef, 
			drivers.forename, 
			drivers.surname,
			constructors.constructorRef,
			constructors.name,
			constructors.constructorId
		FROM 
			results
		LEFT JOIN 
			drivers ON results.driverId = drivers.driverId,
			constructors ON results.constructorId = constructors.constructorId,
			races ON results.raceId = races.raceId
		WHERE 
			races.year = ${year}
		GROUP BY
			drivers.driverId
		ORDER BY 
			drivers.driverId ASC
		LIMIT 25;`

	drivers.prepare = await c.env.DB.prepare(drivers.query).all()
	
	const { results } = drivers.prepare
	for(const row of results){
		fields.push({
			id: `driver_${row.driverRef}`,
			tag: 'input',
			key: `drivers_${row.driverRef}_points`,
			type: 'number',
			value: `0`,
			label: `${row.forename} ${row.surname} (${row.name})`,
			placeholder: '0',
			required: true,
		})
	}

	const addResultForm = new Form({
		id: 'addResultsForm',
		method: 'POST',
		action: `/api/${api_version[0]}/races/addResults`,
		fields: fields,
	})

	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: heading,
		body: `<h1 class="text-center">${heading}</h1>
		
			<div class="text-center mx-auto">
				${addResultForm.render()}
			</div>`
	})
	return c.html(page.render())
}) 

const convertBodyToJSON = body => {
	let response = ''
	Object.entries(body).forEach( (key, value) => {
		// console.log(`${key}`)
	})
	return body
}

app.post(`/api/${api_version[0]}/races/addResults`, async c => {	
	const body = await c.req.parseBody()
	return c.json(convertBodyToJSON(body))
})

app.get(`/api/${api_version[0]}/drivers/:identifier`, async c => {
	const { identifier } = c.req.param()
	let fetchData = {}
	if(!Number.isNaN(Number(identifier))){
		const driver_number = identifier
		fetchData = await FetchAPI.gatherAPI({ query: { driver_number: driver_number } })
		const response = fetchData.singleResponse
		return c.json({ response: response })
	}
	const splitName = identifier.split('-')
	let driver_name = {
		first_name: splitName[0].capitalizeFirstChar(),
		last_name: splitName[1].capitalizeFirstChar(),
	}
	const SQLTable = new SQLCrud(c.env.DB, 'drivers')
	const { results } = await SQLTable.read({
		columns: ['drivers.surname', 'drivers.forename', 'drivers.nationality', `drivers.forename || ' ' || drivers.surname AS full_name`, 'drivers.code', 'drivers.number',
			'constructors.name AS constructor_name', 'constructors.primary_color', 'constructors.secondary_color', 'constructors.tertiary_color'],
		join: ['LEFT JOIN results ON drivers.driverId = results.driverId, constructors ON results.constructorId = constructors.constructorId'],
		where: `full_name = "${driver_name.first_name} ${driver_name.last_name}"`,
		orderBy: ['results.resultId DESC'],
		limit: '1'
	})
	return c.json({ response: results })
})

for (const [key, value] of Object.entries(FetchAPI.defaults.endpoints)) {
	let endpoint = `/api/${api_version[0]}/${key}`
	app.get(endpoint, async c => {
		const { request, query } = formatRequest(key, c)
		const fetchData = await FetchAPI.gatherAPI({ ...request, query: query })
		const response = fetchData.response
		return c.json({ response: response })
	})
	endpoint = `/api/${api_version[0]}/${key}/:${value}`
	app.get(endpoint, async c => {
		const { request, query } = formatRequest(key, c)
		const fetchData = await FetchAPI.gatherAPI({ ...request, query: query })
		const response = fetchData.singleResponse
		return c.json({ response: response })
	})
}

app.get(`/api/${api_version[0]}/drivers/byYear/`, async c => {
	const year = new Date().getFullYear()
	return c.redirect(`/api/${api_version}/drivers/byYear/${year}`)
})

app.get(`/api/${api_version[0]}/drivers/byYear/:year`, async c => {
	const { year } = c.req.param()
	const resultsTable = new SQLCrud(c.env.DB, 'results')
	const { results } = await resultsTable.read({
		columns: ['drivers.*', `drivers.forename || ' ' || drivers.surname AS full_name`,
			'MAX(driver_standings.position) AS position', 'MAX(driver_standings.points) as points',
			'constructors.name AS constructor_name', 'constructors.primary_color', 'constructors.secondary_color', 'constructors.tertiary_color'],
		join: ['LEFT JOIN drivers ON drivers.driverId = results.driverId, races ON races.raceId = results.raceId, constructors ON results.constructorId = constructors.constructorId',
			`driver_standings ON driver_standings.raceId = races.raceId and driver_standings.driverId = drivers.driverId`
		],
		group: ['drivers.driverId'],
		where: [`races.year = ${year}`],
		orderBy: ['points DESC'],
	})
	return c.json( results )
})

const JSONtoCSV = (dataArray) => {
	const columns = Object.keys(dataArray[0])
	let body = columns.join(', ')
	for (const row of dataArray) {
		let values = []
		values.push(`${columns.map(col => `${row[col]}`).join(', ')},`);
		body += `\n${values.join(', ')}`
	}
	return body
}

app.get(`/api/${api_version[0]}/export`, async c => {
	// Set headers
	c.header('X-Message', 'Export CSV!')
	c.header('Content-Type', 'text/csv')

	// Set HTTP status code
	c.status(201)

	const query = `SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name`
	const db = c.env.DB
	const { results } = await db.prepare(query).all()

	// Return the response body
	const heading = 'Database Tables'
	const buttons = ['<div class="btn-toolbar" role="group">']
	const buttonFormatting = t => {
		const a = t.split('_')
		const m = a.map(t => String(t).capitalizeFirstChar())
		return m.join(' ').trim()
	}
	results.map(row => buttons.push(`<a class="btn bh-primary my-1 mx-auto" href="/api/${api_version[0]}/export/${row.name}">${buttonFormatting(row.name)}</a>`))
	buttons.push('</div>')
	const page = new Page({
		siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
		pageTitle: heading,
		body: `<h1 class="text-center">${heading}</h1>
		
			<div class="text-center mx-auto">
				${buttons.join('')}
			</div>`
	})
	return c.html(page.render())
})

app.get(`/api/${api_version[0]}/export/:table`, async c => {
	const { page = 0, limit = 50 } = c.req.query()
	const offset = page * limit

	// Set headers
	c.header('X-Message', 'Export CSV!')
	c.header('Content-Type', 'text/csv')

	// Set HTTP status code
	c.status(201)
	const { table = 'drivers' } = c.req.param()

	const limitString = limit ? ` LIMIT ${limit} ` : ''
	const offsetString = offset ? ` OFFSET ${offset} ` : ''
	const query = `SELECT * FROM ${table}${limitString}${offsetString}`
	const db = c.env.DB
	const { results } = await db.prepare(query).all()

	// Return the response body
	const response = JSONtoCSV(results)
	return c.body(response)
})

app.notFound(c => {
	const page = new Page({
		pageTitle: '404 | Not Found!',
		body: `
			<span class='fs-3'>404 Not Found!</span> <hr> PAGE NOT FOUND! Head <a href='/'>home</a> to try and find what you're looking for.`
	})
	return rawHtmlResponse(page.render())
})

export default app
