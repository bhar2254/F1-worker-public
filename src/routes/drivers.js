//  drivers.js

import { rawHtmlResponse } from '../utilities/std'
import { nationToIso2 } from '../utilities/flag'
import { Card, Form, Page, Table, applyCSSTheme } from '../utilities/dom'
import { Hono } from 'hono';
import { extractWikiTable, wikiTableToJSON } from '../utilities/wikiParse'
import { SQLCrud } from '../utilities/sql-d1'

const router = new Hono();

router.get(`/`, async c => {
    const year = new Date().getFullYear()
    return c.redirect(`/drivers/championship/${year}`)
})

router.get(`/championship`, async c => {
    const year = new Date().getFullYear()
    return c.redirect(`/drivers/championship/${year}`)
})

router.get(`/championship/:year`, async c => {
    // Access the D1 database bound to this Worker
    const db = c.env.DB
    const { year } = c.req.param()
    const resultsTable = new SQLCrud(db, 'driver_constructor_standings')

    const args = { where: { year }, orderBy: "points DESC" };

    const { results } = await resultsTable.read(args);

    let body = `<div class="row g-4 my-3 ">
			<div class="mx-auto col-md-10 col-sm-12">
				<div class="bg-glass-primary bg-glass-primary-5 p-3 rounded-1 border-bottom"><h3>${year} Drivers Championship</h3></div>
			</div>
			<div class="mx-auto col-md-10 col-sm-12 mb-5">
                <div class="row g-4">`
    let processedDrivers = []
    // console.log(`Results: `, results.join(' | '))
    for (const [index, each] of results.entries()) {
        // console.log(`index: `, each, ' | each: ', each)
        if (processedDrivers.includes(each.code))
            continue
        processedDrivers.push(each.code)
        const driver_d1_data = each
        const driver = {
            forename: driver_d1_data.forename.replaceAll(" ", ""),
            surname: driver_d1_data.surname.replaceAll(" ", ""),
            full_name: driver_d1_data.full_name,
            nationality: each.nationality,
            points: Math.round(driver_d1_data.points),
            position: Math.round(index + 1),
        }
        driver.img_code = `${driver.forename.substring(0, 3).toUpperCase()}${driver.surname.substring(0, 3).toUpperCase()}01`
        const constructor = {
            name: driver_d1_data.constructor_name,
            constructorRef: driver_d1_data.constructorRef,
            primary_color: driver_d1_data.primary_color || '000000'
        }
        const text_color = constructor.primary_color < '555555' ? 'white' : 'black'
        const col_width = index > 2 ? 'col-lg-3 col-md-4 col-sm-12 mx-auto' : 'col-lg-4 col-md-6 col-sm-12 mx-auto'
        const cardData = {
            header: `<div class='col-12 text-center'>
						<a style="text-decoration:none;" href="/drivers/profile/${driver.forename.toLowerCase()}-${driver.surname.toLowerCase()}">${driver.forename} <strong>${driver.surname.toUpperCase()}</strong></a>
					</div>
					<div class='col-12 text-center'>
						<img src="https://flagsapi.com/${nationToIso2(driver.nationality)}/flat/32.png"/>
					</div>`,
            body: `<div class="row g-4">
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
							<img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${driver.forename.substring(0, 1)}/${driver.img_code}_${driver.forename}_${driver.surname}/${driver.img_code.toLowerCase()}.png">
						</div>
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
							<p class='border-top border-bottom border-1 py-1 h5 fw-bold' lang='en'>
								${driver.position || 0} | ${driver.points || 0}  
							</p>
							<img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${driver.img_code}.png">
						</div>
					</div>`,
            footer: `<div class="row mx-auto text-center">
						<a href="/constructors/profile/${constructor.constructorRef}" class="col-lg-6 col-md-9 p-1 my-3 mx-auto rounded-3 btn" style="color: ${text_color}; background-color:#${constructor.primary_color}">${constructor.name || 'Missing'}</a>
					</div>`,
        }
        const card = new Card(cardData)
        body += `<div class="${col_width}">${card.render()}</div>`
    }
    body += '</div></div>'
    const page = new Page({
        pageTitle: `${new Date().getFullYear()} Championship`,
        body: body
    })
    return rawHtmlResponse(page.render())
})

router.get(`/profile/:identifier`, async c => {
    let identifier = c.req.param('identifier')
    identifier = identifier.replaceAll('_', '-')
    let identifierSplit = identifier.split('-')
    const year = new Date(Date.now()).getFullYear()
    let key = ''
    let value = ''

    if (!Number.isNaN(Number(identifier))) {
        key = 'driverId'
        value = identifier
    }
    if (Number.isNaN(Number(identifier))) {
        key = 'full_name'
        let splitName = identifierSplit
        splitName = splitName.map(x => x.capitalizeFirstChar())
        value = `${splitName.join(' ').trim()}`
    }

    const driversTable = new SQLCrud(c.env.DB, 'driver_info')
    const where = {}
    where[key] = value
    const { results } = await driversTable.read({ where, orderBy: 'year DESC', limit: '1' })

    if (typeof results[0] === 'undefined' && identifierSplit.length > 1) {
        identifierSplit.pop()
        return c.redirect(`/drivers/profile/${identifierSplit.join('-')}`)
    }

    const profile_data = results[0]
    const driver = {
        ...profile_data,
        driverId: profile_data.driverId || 0,
        forename: profile_data.forename || '',
        surname: profile_data.surname || '',
        number: profile_data.number || 0,
        nationality: profile_data.nationality || 'GBR',
        position: profile_data.position ? Math.round(Number(profile_data.position)) : 0,
        points: profile_data.points ? Math.round(Number(profile_data.points)) : 0,
    }
    driver.profile_headshot = `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${year}Drivers/${driver.surname.toLowerCase()}`
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

    const racesTable = new SQLCrud(c.env.DB, 'driver_race_results ')
    const racesData = await racesTable.read({ limit: -1, where: {driverId: driver.driverId}})

    let race_results = `<div class="btn-group flex-wrap" role="group">`
    let previous_year = 0
    let years_raced = []
    for (const each of racesData.results) {
        if (!years_raced.includes(each.year)) {
            years_raced.push(each.year)
            race_results += `<a href="#${each.year}" type="button" class="btn f1-team-secondary" style="color:${secondary_text_color}">${each.year}</a>`
        }
    }
    race_results += '</div>'
    for (const each of racesData.results) {
        const { url = '', time = '', position = 0, points = 0 } = each
        if (previous_year !== each.year) {
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
						<td>${String(time).replaceAll('\\N', '')}</td>
						<td>${String(position).replaceAll('\\N', '')}</td>
						<td>${String(points).replaceAll('\\N', '')}</td>
					</tr>`
    }
    race_results += `</tbody>
			</table>`
    const updateUserFields = [{
        id: `drivers.number`,
        tag: 'input',
        key: `number`,
        type: 'number',
        value: driver.number,
        label: `Driver #`,
        required: true,
    }]
    const udpateUserForm = new Form({
        action: `/api/v1/update/drivers/driverId/${driver.driverId}`,
        method: 'POST',
        fields: updateUserFields
    })
    const body = `
		<div class="row mx-auto"
			<div class="col-11">
				<div class="card bg-glass-dark bg-glass-dark-5  p-0">
					<div class='card-header text-center'>
						<div class='col-12'>
							<h2>
								${driver.forename} <strong>${driver.surname.toUpperCase()}</strong> 
								<img class="mx-3" src="https://flagsapi.com/${nationToIso2(driver.nationality)}/flat/64.png"/>
							</h2>
						</div>
					</div>
					<div class="card-body">
						<div class="row g-4 d-flex justify-content-center align-items-center">
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-8'>
                                <img style="max-width:75%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="${driver.profile_headshot}">
							</div>
							<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-12'>
								<p class='border-top border-bottom border-1 py-1 h5 fw-bold' lang='en'>
									${driver.position} | ${driver.points}
								</p>                                        
                                <img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${driver.forename} ${driver.surname} headshot' alt='${driver.forename} ${driver.surname} headshot' loading='eager' src="${driver.number_url}">
								<div class="row mx-auto text-center">
									<a href="/constructors/profile/${driver.constructorRef}" class="col-lg-6 col-md-9 my-3 mx-auto rounded-3 btn f1-team-primary" style="color:#${primary_text_color}">${constructor.name}</a>
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
        headerOverwrite: Page.defaults.header + applyCSSTheme(constructor.scheme, { team_color: true }),
        pageTitle: `${driver.forename} ${driver.surname}`,
        body: body
    })
    return rawHtmlResponse(page.render())
})

export default router