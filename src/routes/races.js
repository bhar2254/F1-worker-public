//  races.js

import { Page, Table } from '../utilities/dom'
import { Hono } from 'hono';
import { extractWikiTable, wikiTableToJSON } from '../utilities/wikiParse'
import { SQLCrud } from '../utilities/sql-d1'

const router = new Hono();

router.get(`/`, async c => {
    const year = new Date().getFullYear()
    return c.redirect(`/races/${year}`)
})

router.get(`/:year`, async c => {
    const db = c.env.DB
    const { year } = c.req.param()
    const SQLTable = new SQLCrud(db, 'races')
    const { results } = await SQLTable.read({
        columns: ["DISTINCT name, date, time, url"],
        where: `races.year = ${year} AND DATE(date) < DATE('now')`,
        orderBy: ['CAST(races.raceId AS INTEGER) DESC']
    })
    const data = results.map(x => {
        return {
            track: `<a class="btn bh-primary" href="/races/race/${x.url.split('/')[4]}">${x.name}</a>`, 
            date: `${new Date(x.date).toLocaleDateString()}`,
            time: `${x.time.substring(0, 5)}`,
            // preview: `<img src=""/>`,
        }
    })
    const table = new Table({classes: ['mx-auto'], data, includesHeaders: false})
    const heading = `${year} Formula One World Championship`
    const page = new Page({
        pageTitle: heading,
        body: `<div class="row g-4 my-3">
			<div class="mx-auto col-md-10 col-sm-12">
				<div class="bg-glass-primary bg-glass-primary-5 p-3 rounded-1 border-bottom"><h3>${heading}</h3></div>
			</div>
            <div class="text-center mb-5 col-md-10 col-sm-12 mx-auto">
                <div class="table-responsive">
                    ${table.render()}
                </div>
            </div>
        </div>`
    })
    return c.html(page.render())
})

router.get(`/race/:race_name`, async c => {
    const { race_name } = c.req.param()
    const fetch2Data = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${race_name}&format=json`)
    const jsonData = await fetch2Data.json()

    const qualiTable = wikiTableToJSON('Qualifying_classification', jsonData)
    let tableObjects = qualiTable.map(x => ({
        position: Number(x[0]),
        driver_number: Number(x[1]),
        driver: String(x[2]).replaceAll('/wiki/', '/drivers/profile/'),
        constructor: String(x[3]),
        q1: String(x[4]),
        q2: String(x[5]),
        q3: String(x[6]),
        grid: String(x[7]),
    }))
    tableObjects = tableObjects.filter(obj => !isNaN(obj.position) && !isNaN(obj.driver_number))
    if(!tableObjects.length)
        tableObjects = [{ empty: 'No data in the table! Check back after qualifying is done to see the results!' }]
    console.log(JSON.stringify(tableObjects))
    const qualisTable = new Table({ data: tableObjects })

    const raceTable = wikiTableToJSON('Race_classification', jsonData)
    tableObjects = raceTable.map(x => ({
        position: Number(x[0]),
        driver_number: Number(x[1]),
        driver: String(x[2]).replaceAll('/wiki/', '/drivers/profile/'),
        constructor: String(x[3]),
        laps: String(x[4]),
        time: String(x[5]),
        grid: String(x[6]),
        points: String(x[7]),
    }))
    tableObjects = tableObjects.filter(obj => !isNaN(obj.position) && !isNaN(obj.driver_number))
    if(!tableObjects.length)
        tableObjects = [{ empty: 'No data in the table! Check back after the race is finished to see the results!' }]
    const racesTable = new Table({ data: tableObjects })

    let heading = ''
    for (const each of race_name.split('_')) {
        heading += `${each.capitalizeFirstChar()} `
    }

    const page = new Page({
        pageTitle: heading,
        body: `<div class="py-3 mx-auto col-md-10 col-sm-12">
            <h1 class="my-3 py-3 text-center">${heading}</h1>
            <div class="row">
                <div class="text-center mb-3 col">
                    <div class="btn-group flex-wrap" role="group">
                        <a href="#race" class="btn bh-primary">Race</a>
                        <a href="#qualifying" class="btn bh-primary">Qualifying</a>
                    </div>
                </div>
            </div>
			<h3 id="race">Grand Prix</h3>
			<div class= "text-center mx-auto table-responsive">
				${racesTable.render()}
			</div>
			<h3 id="qualifying">Qualifying</h3>
			<div class="text-center mx-auto table-responsive">
				${qualisTable.render()}
			</div>
			</div>`
    })
    return c.html(page.render())
})

router.get(`/:race_name`, async c => {
    const { race_name } = c.req.param()
    const fetch2Data = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${race_name}&format=json`)
    const jsonData = await fetch2Data.json()
    const raceClassificationTable = extractWikiTable('Race_classification', jsonData)
    let heading = ''
    for (const each of race_name.split('_')) {
        heading += `${each.capitalizeFirstChar()} `
    }
    const page = new Page({
        pageTitle: heading,
        body: `<h1 class="text-center">${heading}</h1>
		
			<div class="text-center mx-auto">
				${raceClassificationTable}
			</div>`
    })
    return c.html(page.render())
})

export default router