//  constructors.js

import { rawHtmlResponse } from '../utilities/std'
import { nationToIso2 } from '../utilities/flag'
import { Card, Page } from '../utilities/dom'
import { Hono } from 'hono';
import { SQLCrud } from '../utilities/sql-d1'

const router = new Hono();

router.get(`/`, async c => {
    const year = new Date().getFullYear()
    return c.redirect(`/constructors/${year}`)
})

router.get(`/:year`, async c => {
    // Access the D1 database bound to this Worker
    const db = c.env.DB
    const { year } = c.req.param()
    const resultsTable = new SQLCrud(db, 'constructor_info')
    const { results } = await resultsTable.read({ where: {year}, orderBy: ['position ASC'] })
    let body = `<div class="row g-4 my-3 ">
			<div class="mx-auto col-md-10 col-sm-12">
				<div class="bg-glass-primary bg-glass-primary-5 p-3 rounded-1 border-bottom"><h3>${year} Constructors Championship</h3></div>
			</div>
			<div class="mx-auto col-md-10 col-sm-12 mb-5">
                <div class="row g-4">`
    let processedConstructors = []
    for (const [index, each] of results.entries()) {
        if (processedConstructors.includes(each.constructorRef))
            continue
        processedConstructors.push(each.constructorRef)
        const constructor_d1_data = each
        const constructor = { ...constructor_d1_data }
        const text_color = constructor.primary_color < '555555' ? 'white' : 'black'
        const col_width = index > 2 ? 'col-lg-3 col-md-4 col-sm-5 col-xs-11 mx-auto' : 'col-lg-4 col-md-6 col-sm-5 col-xs-11 mx-auto'
        const cardData = {
            header: `<div class='col-11 text-center'>
						<a style="text-decoration:none;" href="/constructors/profile/${constructor.constructorRef.toLowerCase()}">
							${constructor.name}
						</strong></a>
					</div>
					<div class='col-11 text-center'>
						<img src="https://flagsapi.com/${nationToIso2(constructor.nationality)}/flat/32.png"/>
					</div>`,
            body: `<div class="row g-4">
                    <div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
                        <a href="/constructors/profile/${constructor.constructorRef.toLowerCase()}">
                        <img style="max-width:100%;" class='rounded-3 img-drop-shadow mb-3 border-0' title='${constructor.name}' alt='${constructor.name}' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/teams/2024/${constructor.constructorRef}-logo.png"></a>
                    </div>
                    <div class='text-center mx-auto col-lg-6 col-md-6 col-sm-6'>
                        <p class='border-top border-bottom border-1 py-1 h5 fw-bold' lang='en'>
                            ${index + 1} | ${constructor.points || 0}  
                        </p>
                        <img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${constructor.name}' alt='${constructor.name}' loading='eager' src="https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/${constructor.constructorRef}.png"></a>
                    </div>
                </div>`,
            footer: `<div class="row mx-auto text-center">
						<a href="/constructors/profile/${constructor.constructorRef}" class="col-lg-6 col-md-9 p-1 my-3 mx-auto rounded-3 btn" style="color: ${text_color}; background-color:#${constructor.primary_color}">${constructor.name || 'Missing'}</a>
					</div>`,
        }
        const card = new Card(cardData)
        body += `<div class="${col_width}">${card.render()}</div>`
    }
    body += '</div></div></div>'
    const page = new Page({
        pageTitle: `${new Date().getFullYear()} Championship`,
        body: body
    })
    return rawHtmlResponse(page.render())
})

router.get(`/profile/:constructorRef`, async c => {
    const { constructorRef } = c.req.param()
    const db = c.env.DB
    const year = new Date(Date.now()).getFullYear()
    const tables = (table) => {
        return new SQLCrud(db, table)
    }
    const { results } = await tables('constructor_info').read({
        where: { constructorRef, year },
        orderBy: ['year DESC'],
        limit: '1'
    })

    const profile_data = results[0]
    const constructor = {
        ...profile_data
    }
    const { constructorId } = profile_data

    const driver_data = await tables('constructor_drivers').read({
        where: { constructorId },
        group: ['year', 'driverRef'],
        orderBy: ['year DESC', 'points DESC'],
    })

    let driver_html = ''
    const years_printed = []
    for (const [index, each] of driver_data.results.entries()) {
        // console.log(each)
        each.profile_headshot = `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${year}Drivers/${each.surname.toLowerCase()}`
        each.headshot = `${each.forename.substring(0, 3).toUpperCase()}${each.surname.substring(0, 3).toUpperCase()}01`
        each.headshot_url = each.url || `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${each.forename.substring(0, 1)}/${each.headshot.toUpperCase()}_${each.forename}_${each.surname}/${each.headshot.toLowerCase()}.png`,
            each.number_url = `https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${each.forename.substring(0, 3).toUpperCase()}${each.surname.substring(0, 3).toUpperCase()}01.png`

        if (!years_printed.includes(each.year)) {
            years_printed.push(each.year)
            driver_html += `
				<div class="row g-4">
					<div class="mx-auto text-center col-md-3 col-sm-5">
						<h1 id="${each.year}">${each.year}</h1>
					</div>
					<div class="mx-auto text-center col-md-3 col-sm-5">
						 <small>#${each.constructor_position || 0} in World Constructors Championship (${each.constructor_points} Points)</small>
					</div>
				</div>`
        }

        // console.log(JSON.stringify(each))

        driver_html += `
		<div class="mx-auto col-md-5 col-sm-10">
			<div class="card bg-glass-dark bg-glass-dark-5 p-0">
				<div class='card-header text-center'>
					<div class='col-12'>
						<h2>
							<a style="text-decoration:none;" href="/drivers/profile/${String(each.forename).toLowerCase()}-${String(each.surname).toLowerCase()}">${each.forename} ${each.surname}</a>
							<img class="mx-3" src="https://flagsapi.com/${nationToIso2(each.nationality)}/flat/64.png"/>
						</h2>
					</div>
				</div>
				<div class="card-body">
					<div class="row g-4">            
						<div class='text-center mx-auto col-lg-11'>
							<p class='border-top border-bottom border-1 py-1 h5 fw-bold' lang='en'>
								${each.position} | ${each.points}
							</p>             
						</div>                            
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-8'>
                            <img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${each.forename} ${each.surname} headshot' alt='${each.forename} ${each.surname} headshot' loading='eager' src="${each.profile_headshot}">
						</div>
						<div class='text-center mx-auto col-lg-6 col-md-6 col-sm-12'>
                            <img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${each.forename} ${each.surname} headshot' alt='${each.forename} ${each.surname} headshot' loading='eager' src="${each.number_url}">
						</div>      
					</div>     
				</div>   
			</div>   
		</div>`
    }

    const years_buttons = `
		<div class="btn-group flex-wrap">
			${years_printed.map(x => `<a href="#${x}" class="btn bh-primary">${x}</a>`).join(' ')}
		</div>
	`

    const body = `
		<div class="row mx-auto">
			<div class="col-sm-11 col-xs-12">
				<div class="card bg-glass-dark bg-glass-dark-5 p-0">
					<div class='card-header text-center'>
                        <div class="row d-flex justify-content-center align-items-center">
                            <div class='col-2'>
                                <img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow border-0 ' title='${constructor.name}' alt='${constructor.name}' loading='eager' src="https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/teams/2024/${constructor.constructorRef}-logo.png">
                            </div>
                            <div class='col-8 text-center'>
                                <h2>${constructor.name}</h2>
                            </div>
                            <div class='col-2'>
                                <img style="max-width:100%;" class="ms-auto" src="https://flagsapi.com/${nationToIso2(constructor.nationality)}/flat/64.png"/>
                            </div>
						</div>
					</div>
					<div class="card-body">
						<div class="row g-4">
							<div class='text-center mx-auto col-lg-11'>
								<p class='border-top border-bottom border-1 py-1 h5 fw-bold' lang='en'>
									${constructor.position} | ${constructor.points}
								</p>           
							</div>
						    <div class='text-center mx-auto col-lg-8 col-md-8 col-sm-11'>                       
								<img style="max-width:100%;" class='popup-img rounded-3 img-drop-shadow mb-3 border-0' title='${constructor.name}' alt='${constructor.name}' loading='eager' src="https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/${constructor.constructorRef}.png">
							</div>      
						</div>     
					</div>   
					<div class="card-footer">
						${years_buttons}
						<div class="row g-4">
							${driver_html}
						</div>
					</div>
				</div>
			</div>
		</div>`
    const page = new Page({
        headerOverwrite: Page.defaults.header,
        pageTitle: `${constructor.name}`,
        body: body
    })
    return rawHtmlResponse(page.render())
})

export default router