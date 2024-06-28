/**
 * worker.ts
 * A Cloudflare edge hosted Worker for Bootstrap UI development.
 */

//  Import modules
import { rawHtmlResponse } from './std'
import { nationToIso2, iso3To2 } from './flag'
import { Page } from './dom'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { FetchAPI } from './fetchAPI'
import { extractRaceClassification } from './wikiParse'

const version = '0.0.0'
const api_version = 'v1'

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
			text: 'hr',
		},{
			text: 'Drivers',
			link: `/api/${api_version}/drivers`
		},{
			text: 'Drivers (byYear)',
			link: `/api/${api_version}/drivers/byYear/${current_year}`
		},{
			text: 'Meetings',
			link: `/api/${api_version}/meetings`
		},{
			text: 'Sessions',
			link: `/api/${api_version}/sessions`
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
		if (hex.length !== 6) {
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
		const { primary_color, secondary_color, ternary_color } = scheme
		return `
			<style>
			:root{
				--f1-team-primary: #${primary_color};
				--f1-team-primary-rgb: ${hexToRBG(primary_color)};
				--f1-team-secondary: #${secondary_color};
				--f1-team-secondary-rgb: ${hexToRBG(secondary_color)};
				--f1-team-ternary: #${ternary_color};
				--f1-team-ternary-rgb: ${hexToRBG(ternary_color)};
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
		<div id='footer_motto' class='mx-auto bh-left-bar p-3 shadow-lg bh-sand bg-gradient text-center panel rounded-0' style='width:25%; min-width:10rem; margin-bottom:7.5rem;'>
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
	const year = c.req.param('year')
	const { results } = await db.prepare(`SELECT 
			driver_standings.*,
			drivers.surname,
			drivers.forename,
			drivers.nationality,
			drivers.forename || ' ' || drivers.surname AS full_name,
			drivers.code,
			drivers.number,
			races.year,
			races.round,
			teams.team_name,
			teams.primary_color,
			teams.secondary_color,
			teams.ternary_color
		FROM 
			driver_standings
		JOIN 
			drivers ON driver_standings.driverId = drivers.driverId,
			races ON driver_standings.raceId = races.raceId
		LEFT JOIN
			teams ON driver_standings.teamId = teams.teamId
		WHERE 
			races.year = ${year}
		ORDER BY 
			CAST(driver_standings.raceId AS INTEGER) DESC,
			CAST(driver_standings.position AS INTEGER) ASC;`).all()

	let body = '<div class="row g-4">'
	let index = 1
	let processedDrivers = []
	for(const each of results){
		if(processedDrivers.includes(each.code))
			continue
		processedDrivers.push(each.code)
		const driver_d1_data = each
		const first_name = driver_d1_data.forename.replaceAll(" ","")
		const last_name = driver_d1_data.surname.replaceAll(" ","")
		const driver_img_code = `${first_name.substring(0,3).toUpperCase()}${last_name.substring(0,3).toUpperCase()}01`
		const primary_color = driver_d1_data.primary_color || '000000'
		const text_color = primary_color < '555555' ? 'white' : 'black'
		const col_width = index > 3 ? 'col-lg-3 col-md-4 col-sm-12' : 'col-lg-4 col-md-6 col-sm-12'
		body += `
			<div class="${col_width} mx-auto">
				<div class="card">
					<div class='card-header text-center'>
						<div class='col-12 float-start'>
							${first_name} <strong>${last_name.toUpperCase()}</strong>
						</div>
						<div class='col-12 float-end'>
							<img src="https://flagsapi.com/${nationToIso2(driver_d1_data.nationality)}/flat/32.png"/>
						</div>
					</div>
					<div class="card-body">
						<div class="row g-4">
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
								<a href="/drivers/profile/${first_name.toLowerCase()}-${last_name.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${first_name} ${last_name} headshot' alt='${first_name} ${last_name} headshot' loading='eager' src="https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${first_name.substring(0,1)}/${driver_img_code}_${first_name}_${last_name}/${driver_img_code.toLowerCase()}.png"></a>
							</div>
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
								<p class='border-top border-bottom py-1 h5 fw-bold' lang='en'>
									${driver_d1_data.position || 0} | ${driver_d1_data.points || 0}  
								</p>                                        
								<a href="/drivers/profile/${first_name.toLowerCase()}-${last_name.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${first_name} ${last_name} headshot' alt='${first_name} ${last_name} headshot' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${driver_img_code}.png"></a>
							</div>      
						</div>     
					</div>          
					<div class="card-footer">
						<div class="row text-center">
							<div class="col-lg-6 col-md-9 p-1 my-3 mx-auto rounded-3" style="color: ${text_color}; background-color:#${primary_color}">${driver_d1_data.team_name || 'Missing'}</div>
						</div>
					</div>
				</div>
			</div>`
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
	const identifier = c.req.param('identifier')
	let key = ''
	let value = ''
	
	if(!Number.isNaN(Number(identifier))){
		key = 'drivers.number'
		value = identifier
	} else {
		key = 'full_name'
		const splitName = identifier.split('-')
		value = `${splitName[0].capitalizeFirstChar()} ${splitName[1].capitalizeFirstChar()}`
	}

	const db = c.env.DB
	const year = new Date().getFullYear()
	const query = `SELECT 
			driver_standings.*,
			drivers.surname,
			drivers.forename,
			drivers.nationality,
			drivers.forename || ' ' || drivers.surname AS full_name,
			drivers.code,
			drivers.number,
			races.year,
			races.date,
			races.round,
			races.name,
			races.time,
			races.url,
			teams.team_name,
			teams.primary_color,
			teams.secondary_color,
			teams.ternary_color
		FROM 
			driver_standings
		JOIN 
			drivers ON driver_standings.driverId = drivers.driverId,
			races ON driver_standings.raceId = races.raceId
		LEFT JOIN
			teams ON driver_standings.teamId = teams.teamId
		WHERE 
			${key} = "${value}"
		ORDER BY 
			CAST(races.year AS INTEGER) DESC,
			CAST(driver_standings.raceId AS INTEGER) DESC,
			CAST(driver_standings.position AS INTEGER) ASC;`
	const { results } = await db.prepare(query).all()

	const user_current_data = results[0]
	const first_name = user_current_data.forename || ''
	const last_name = user_current_data.surname || ''
	const color_scheme = (({primary_color, secondary_color, ternary_color}) => ({primary_color, secondary_color, ternary_color}))(user_current_data)
	const primary_text_color = color_scheme.primary_color < '555555' ? '#dddddd' : '#333333'
	const secondary_text_color = color_scheme.secondary_color < '555555' ? '#dddddd' : '#333333'
	const driver_img_code = `${first_name.substring(0,3).toUpperCase()}${last_name.substring(0,3).toUpperCase()}01`
	const headshot_url = `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${first_name.substring(0,1)}/${driver_img_code}_${first_name}_${last_name}/${driver_img_code.toLowerCase()}.png`

	let race_results = `<div class="btn-group flex-wrap" role="group">`
	let previous_year = 0
	let years_raced = []
	for(const each of results){
		if(!years_raced.includes(each.year)){
			years_raced.push(each.year)
			race_results += `<a href="#${each.year}" type="button" class="btn f1-team-secondary" style="color:${secondary_text_color}">${each.year}</a>`
		}
	}
	race_results += '</div>'
	for(const each of results){
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
						<td><a class="btn f1-team-primary" style="color:#${primary_text_color}" href="/races/race/${each.url.split('/')[4]}">${each.name}</a></td>
						<td>${new Date(each.date).toLocaleDateString()}</td>
						<td>${each.time.substring(0,5)}</td>
						<td>${each.position}</td>
						<td>${each.points}</td>
					</tr>`
	}
	race_results += `</tbody>
			</table>`
	const body = `
		<div class="row mx-auto"
			<div class="col-11">
				<div class="card p-0">
					<div class='card-header text-center'>
						<div class='col-12'>
							<h2>
								${first_name} <strong>${last_name.toUpperCase()}</strong> 
								<img class="mx-3" src="https://flagsapi.com/${nationToIso2(results[0].nationality)}/flat/64.png"/>
							</h2>
						</div>
					</div>
					<div class="card-body">
						<div class="row g-4">
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-8'>
								<a href="/drivers/profile/${first_name.toLowerCase()}-${last_name.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${first_name} ${last_name} headshot' alt='${first_name} ${last_name} headshot' loading='eager' src="${headshot_url}"></a>
							</div>
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-12'>
								<p class='border-top border-bottom py-1 h5 fw-bold' lang='en'>
									${results[0].position} | ${results[0].points}
								</p>                                        
								<a href="/drivers/profile/${first_name.toLowerCase()}-${last_name.toLowerCase()}"><img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${first_name} ${last_name} headshot' alt='${first_name} ${last_name} headshot' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${first_name.substring(0,3).toUpperCase()}${last_name.substring(0,3).toUpperCase()}01.png"></a>
								<div class="row text-center">
									<div class="col-lg-6 col-md-9 my-3 mx-auto rounded-3 btn f1-team-primary" style="color:#${primary_text_color}">${results[0].team_name}</div>
								</div>
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
		headerOverwrite: _headerDef + applyCSSTheme(color_scheme, {team_color: true}),
		pageTitle: `${first_name} ${last_name}`, 
		body: body
	})
	return rawHtmlResponse(page.render())
})

app.get(`/races`, async c => {
	const year = new Date().getFullYear()
	return c.redirect(`/races/${year}`)
})

app.get(`/races/:year`, async c => {
	const db = c.env.DB
	const { year } = c.req.param()
	const { results } = await db.prepare(`SELECT 
			*
		FROM
			races
		WHERE 
			races.year = ${year}
			AND DATE(date) < DATE('now')
		ORDER BY 
			CAST(raceId AS INTEGER) DESC;`).all()

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
		console.log(wikiUrl)
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
	const raceClassificationTable = extractRaceClassification(jsonData);
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

app.get(`/races/:race_name`, async c => {
	const { race_name } = c.req.param()
	const fetch2Data = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${race_name}&format=json`)
	const jsonData = await fetch2Data.json()
	const raceClassificationTable = extractRaceClassification(jsonData);
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

app.get(`/api/${api_version}/drivers/:identifier`, async c => {
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
	fetchData = await FetchAPI.gatherAPI({ endpoint:'drivers', query: {...driver_name} })

	const response = fetchData.singleResponse
	return c.json({ response: response })
})

for (const [key, value] of Object.entries(FetchAPI.defaults.endpoints)) {
	let endpoint = `/api/${api_version}/${key}`
	app.get(endpoint, async c => {
		const { request, query } = formatRequest(key, c)
		const fetchData = await FetchAPI.gatherAPI({ ...request, query: query })
		const response = fetchData.response
		return c.json({ response: response })
	})
	endpoint = `/api/${api_version}/${key}/:${value}`
	app.get(endpoint, async c => {
		const { request, query } = formatRequest(key, c)
		const fetchData = await FetchAPI.gatherAPI({ ...request, query: query })
		const response = fetchData.singleResponse
		return c.json({ response: response })
	})
}

app.get(`/api/${api_version}/drivers/byYear/:year`, async c => {
	const currentYear = current_year // magic number because cloudflare doesn't like global dates
	const minimumYear = minimum_year // from OpenAi.com
	const { year } = c.req.param()
	
	// Access the D1 database bound to this Worker
	try {
		const db = c.env.DB
		console.log(db)
	} catch {
		console.log('DB Error')
	}

	// year = year < minimumYear ? minimumYear : year > currentYear ? currentYear : year
	const meetingRequest = formatRequest('meetings', c)
	let fetchData = await FetchAPI.gatherAPI({ ...meetingRequest.request, query: { ...meetingRequest.query, year: year } })
	const meetingData = fetchData.response
	let meetingKeys = []
	for (const each of meetingData)
		if(!meetingKeys.includes(each.meeting_key))
			meetingKeys.push(each.meeting_key)

	fetchData = await FetchAPI.gatherAPI({ endpoint: 'drivers' })
	const driverData = fetchData.response
	let driverNames = []
	let drivers = []
	for (const each of driverData){
		const driverNotInRoster = !driverNames.includes(each.full_name)
		const meetingKeyInList = meetingKeys.includes(each.meeting_key)
		const isntJuniorDriver = true || each.headshot_url
		const addDriverToList = driverNotInRoster && meetingKeyInList && isntJuniorDriver
		if (addDriverToList){
			drivers.push(each)
			driverNames.push(each.full_name)
		}
	}
	
	return c.json( drivers )
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