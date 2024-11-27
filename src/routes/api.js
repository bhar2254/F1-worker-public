//  api.js

import { rawHtmlResponse } from '../utilities/std'
import { Form, Page, Table } from '../utilities/dom'
import { Hono } from 'hono';
import { SQLCrud } from '../utilities/sql-d1'

const router = new Hono();
const api_versions = ['v1']
const api_version = api_versions[0]

// 
// 	API
// 

// Helper function to handle errors uniformly
const handleError = (c, error) => {
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
};


// Function to escape HTML and prevent XSS
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[match];
    });
}

// Base endpoint: /api
router.get('/', (ctx) => {
    const queries = ctx.req.queries();  // For potential filters or sorting
    const { format = 'html' } = queries
    if (format == 'json')
        return ctx.json({
            message: 'Welcome to the API!',
            available_versions: ['v1'],
            usage: {
                version_info: 'Access specific API versions using /api/:api_version. For example, /api/v1.',
                operations: 'Within each version, you can perform CRUD operations like read, create, update, and delete.',
                example: 'Try accessing /api/v1/read/:table to fetch data from a table.',
            },
        });

    const page = new Page({
        pageTitle: `/${api_versions[0]}/:operation`,
        body: `<div>
            <h3 class="text-center">Welcome to the API!</h3>
                <div class="col">
                    Access specific API versions using /api/:api_version. For example, /api/v1.<br>
                    Within each version, you can perform CRUD operations like read, create, update, and delete.<br>
                    Try accessing /api/v1/read/:table to fetch data from a table.<br>
                </div>
            </div>`
    })
    return rawHtmlResponse(page.render())
});

// API version endpoint: /api/:api_version
router.get('/:api_version', (ctx) => {
    const { api_version } = ctx.req.param();
    const supportedVersions = api_versions

    if (!supportedVersions.includes(api_version)) {
        return ctx.json({ error: 'Invalid API version. Supported versions are: v1.' }, 400);
    }
    const queries = ctx.req.queries();  // For potential filters or sorting
    const { format = 'html' } = queries
    if (format == 'json')
        return ctx.json({
            message: `Welcome to API version ${api_version}!`,
            available_versions: api_versions,
            usage: {
                version_info: 'Access specific API versions using /api/:api_version. For example, /api/v1.',
                operations: 'Within each version, you can perform CRUD operations like read, create, update, and delete.',
                example: 'Try accessing /api/v1/read/:table to fetch data from a table.',
            },
        });

    const page = new Page({
        pageTitle: `/${api_versions[0]}/:operation`,
        body: `<div>
            <h3 class="text-center">Welcome to API version ${api_version}!</h3>
                <div class="col">
                    read: GET /api/${api_version}/read/:table - Fetch data from a table.<br>
                    create: POST /api/${api_version}/create/:table - Add a new record.<br>
                    update: PUT /api/${api_version}/update/:table/:id - Update an existing record.<br>
                    delete: DELETE /api/${api_version}/delete/:table/:id - Remove a record.<br>
                </div>
            </div>`
    })
    return rawHtmlResponse(page.render())
});

// Base layer: /api/v1/:operation
router.get(`/${api_versions[0]}/:operation`, (ctx) => {
    const { operation } = ctx.req.param();

    const operationsInfo = {
        read: 'Use /api/v1/read/:table to fetch data from a specific table. Add query parameters for filters.',
        create: 'Use /api/v1/create/:table to insert new records. Send data in the request body.',
        update: 'Use /api/v1/update/:table/:id to modify existing records. Send updated data in the request body.',
        delete: 'Use /api/v1/delete/:table/:id to remove records.',
    };

    const message = operationsInfo[operation] || 'Invalid operation. Available operations are: read, create, update, delete.';

    const page = new Page({
        pageTitle: `/${api_versions[0]}/:operation`,
        body: `<div class="col-6">${message}</div>`
    })
    return rawHtmlResponse(page.render())
});

//	SQLCrud implementation
router.get(`/${api_versions[0]}/create/:table`, async c => {
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

router.get(`/${api_versions[0]}/read/:table`, async (c) => {
    const { table } = c.req.param();  // Table name from the route
    const queries = c.req.queries();  // For potential filters or sorting
    const { format = 'html' } = queries

    // Extract limit and offset from query parameters or set defaults
    const limit = parseInt(queries.limit || 50);  // Default limit to 50
    const offset = parseInt(queries.offset || 0); // Default offset to 0
    const orderBy = queries.orderBy || ''

    // Instantiate the SQL class for the specified table
    const sqlTable = new SQLCrud(c.env.DB, table);

    const page = new Page({
        pageTitle: `API: /${api_versions[0]}/read/:table`
    })

    try {
        // Fetch data using the limit and offset parameters
        const response = await sqlTable.read({ limit, offset, orderBy, filter: queries });
        if (format == 'json')
            return c.json({
                response: {
                    status: 200,
                    data: response,
                    pagination: { limit, offset },  // Include pagination info in the response
                },
            });
        const table = new Table({data: response.results})
        page.body = `<div class="table-responsive">${table.render()}</div>`
    } catch (error) {
        // Handle errors gracefully
        if (format == 'json')
            return c.body(`Resource read failed: ${error.message}`, 500, {
                'X-Message': 'Resource read failed!',
                'Content-Type': 'text/plain',
            });
        page.body = [`Resource read failed: ${error.message}`, 500,
            'X-Message: Resource read failed!',
            'Content-Type: text/plain'].join('<br>')
    }
    return c.html(page.render())
});


router.get(`/${api_versions[0]}/read/:table/:identifier`, async c => {
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

router.get(`/${api_versions[0]}/update/:table/:identifier/:value`, async c => {
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

router.post(`/${api_versions[0]}/update/:table/:identifier/:value`, async c => {
    const { table, identifier, value } = c.req.param()
    const queries = await c.req.parseBody()
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

router.get(`/${api_versions[0]}/destroy/:table/:identifier/:value`, async c => {
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

function calculateAge(birthday) { // birthday is a date
    const now = new Date(Date.now()).getFullYear()
    const birthdate = Number(birthday)
    return now - birthdate + 1
}

router.get(`/${api_versions[0]}/races/addRace`, async c => {
    const heading = 'Add Race'
    const year = new Date().getFullYear()
    const yearsArray = Array.from(Array(calculateAge(1950)).keys()).map(x => new Date(Date.now()).getFullYear() - x)	// 1950, first year of F1 racing
    const track = {}
    // 	fp1_date	fp1_time	fp2_date	fp2_time	fp3_date	fp3_time	quali_date	quali_time	sprint_date	sprint_time
    track.query = `SELECT DISTINCT races.name, circuits.circuitRef FROM races JOIN circuits ON  circuits.circuitId = races.circuitId WHERE year = ${year};`
    track.prepare = await c.env.DB.prepare(track.query).all()
    track.names = {}
    for (const row of track.prepare.results) {
        const key = row.circuitRef
        track.names[key] = row.name
    }

    let fields = [{
        key: 'hr',
        value: '<h3>Race Details</h3>'
    }, {
        id: 'race.name',
        tag: 'select',
        key: 'race.name',
        value: c.req.param('race.name') || 'Bahrain',
        label: 'Name',
        required: true,
        options: track.names
    }, {
        id: 'race.year',
        tag: 'select',
        key: 'race.year',
        value: year,
        label: 'Year',
        required: true,
        options: yearsArray
    }, {
        id: 'race.type',
        tag: 'select',
        key: 'race.type',
        value: year,
        label: 'Sprint / Grand Prix',
        required: true,
        options: {
            'gp': 'Grand Prix',
            'sprint': 'Sprint',
        }
    }, {
        id: 'race.date',
        tag: 'input',
        type: 'date',
        key: 'race.date',
        value: year,
        label: 'Date',
        required: true,
    }, {
        id: 'race.time',
        tag: 'input',
        type: 'time',
        key: 'race.time',
        value: year,
        label: 'Time',
        required: true,
    },]

    const addRaceForm = new Form({
        id: 'addRaceForm',
        method: 'POST',
        action: `/api/${api_versions[0]}/races/addRace`,
        fields: fields,
    })

    const { siteTitle } = c.env
    const page = new Page({
        siteTitle: siteTitle, brand: `Formula 1 OpenAPI`,
        pageTitle: heading,
        body: `<h1 class="text-center">${heading}</h1>
			<div class="text-center mb-3 small">Submit this form to add a race to the roster.</div>
		
			<div class="text-center mx-auto">
				${addRaceForm.render()}
			</div>`
    })
    return c.html(page.render())
})

router.post(`/api/${api_versions[0]}/races/addRace`, async c => {
    const body = await c.req.parseBody()
    return c.json({ response: body })
})

router.get(`/${api_versions[0]}/mail/keyTest`, async c => {
    const { SPARKPOST_API_KEY } = c.env
    return c.json({ api_key: SPARKPOST_API_KEY })
})

router.get(`/${api_versions[0]}/mail/sendTest`, async c => {
    const { SPARKPOST_API_KEY } = c.env
    //	console.log(`Sparkpost Key is ${SPARKPOST_API_KEY.substring(8)}`)
    // 	Send test email
    const { subject = 'Test Email!', message = 'With a wonderful message attached!', to = 'blaine@blaineharper.com+danealue@blaineharper.com' } = c.req.queries()
    const recipientsEmails = String(to).split("+")
    const recipientsList = recipientsEmails.map(x => ({ 'address': x }))
    const body = JSON.stringify({ "content": { "from": "blaine@blaineharper.com", "subject": String(subject), "text": String(message) }, "recipients": recipientsList })
    let api_url = 'https://api.sparkpost.com/api/v1/transmissions'
    const response = await fetch(api_url, {
        method: 'POST',
        headers: {
            "Authorization": SPARKPOST_API_KEY,
            "Content-Type": "application/json",
        },
        body: body
    })
    // return c.json({from: 'blaine@blaineharper.com', body: body, response: response.json()})
    return c.redirect(`/`)
})

router.get(`/${api_versions[0]}/races/addResults`, async c => {
    const heading = 'Add Results'
    const year = new Date().getFullYear()
    const track = {}
    track.query = `SELECT DISTINCT races.name, circuits.circuitRef FROM races JOIN circuits ON  circuits.circuitId = races.circuitId WHERE year = ${year};`
    track.prepare = await c.env.DB.prepare(track.query).all()
    track.names = {}
    for (const row of track.prepare.results) {
        const key = row.circuitRef
        track.names[key] = row.name
    }

    const yearsArray = Array.from(Array(calculateAge(1950)).keys()).map(x => new Date(Date.now()).getFullYear() - x)	// 1950, first year of F1 racing

    let fields = [{
        key: 'hr',
        value: '<h3>Race Details</h3>'
    }, {
        id: 'race.name',
        tag: 'select',
        key: 'race.name',
        value: c.req.param('race.name') || 'Bahrain',
        label: 'Race Name',
        required: true,
        width: 'sm',
        options: track.names
    }, {
        id: 'race.year',
        tag: 'select',
        key: 'race.year',
        value: year,
        label: 'Year',
        required: true,
        width: 'sm',
        options: yearsArray
    }, {
        id: 'race.type',
        tag: 'select',
        key: 'race.type',
        value: year,
        label: 'GP / Sprint',
        required: true,
        width: 'sm',
        options: {
            'gp': 'Grand Prix',
            'sprint': 'Sprint',
        }
    }, {
        key: 'hr',
        value: '<h3>Grid Results</h3><div class="small">Input the final position 1-20 for each driver.</div>'
    },
    ]

    const drivers = {
        query: `
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
		LIMIT 25;`,
        names: {}
    }

    drivers.prepare = await c.env.DB.prepare(drivers.query).all()

    const { results } = drivers.prepare
    for (const row of results) {
        fields.push({
            id: `points_${row.constructorRef}_${row.driverRef}`,
            tag: 'input',
            key: `points.${row.constructorRef}.${row.driverRef}`,
            type: 'number',
            value: c.req.query(`points.${row.constructorRef}.${row.driverRef}`) || `0`,
            pattern: '[1-9]|1[0-9]|20',
            label: `Position`,
            placeholder: '0',
            required: true,
            width: 'xs',
        })
        fields.push({
            id: `times_${row.constructorRef}_${row.driverRef}`,
            tag: 'input',
            key: `times.${row.constructorRef}.${row.driverRef}`,
            type: 'text',
            value: c.req.query(`times.${row.constructorRef}.${row.driverRef}`) || `+1:19.215`,
            pattern: '^[+-]?\d+:\d{1,2}\.\d{3}$',
            label: `Time`,
            placeholder: '0',
            required: true,
            width: 'sm',
        })
        drivers.names[row.driverRef] = `${row.forename.capitalizeFirstChar()} ${row.surname.capitalizeFirstChar()}`
    }

    const worldChampion = 'Max Verstappen'

    fields.splice(4, 0, {
        id: 'race.fastest_lap',
        tag: 'select',
        key: 'race.fastest_lap',
        value: c.req.param('fastest_lap') ||
            drivers.names[worldChampion] ||
            Array.isArray(drivers.names) ?
            drivers.names.indexOf(worldChampion) :
            worldChampion,
        label: 'Fastest Lap',
        required: true,
        options: { 'na': 'N/A', ...drivers.names }
    })

    const addResultForm = new Form({
        id: 'addResultsForm',
        method: 'POST',
        action: `/api/${api_versions[0]}/races/addResults`,
        fields: fields,
    })

    const page = new Page({
        siteTitle: `F1 openAPI`, brand: `Formula 1 OpenAPI`,
        pageTitle: heading,
        body: `<h1 class="text-center">${heading}</h1>
			<div class="text-center mb-3 small">Submit this form to add the latest F1 Grand Prix results. Input 0 for DNF or absent.</div>
		
			<div class="text-center mx-auto">
				${addResultForm.render()}
			</div>`
    })
    return c.html(page.render())
})

const convertBodyToJSON = body => {
    let response = ''
    Object.entries(body).forEach((key, value) => {
        // console.log(`${key}`)
    })
    return body
}

const f1_points_map = [
    0, 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
]

router.post(`/api/${api_versions[0]}/races/addResults`, async c => {
    const body = await c.req.parseBody()
    const driver_points = {}
    const constructor_points = {}
    const race_details = {}
    for (const each of Object.keys(body)) {
        const value = body[each]
        if (each.split('.')[0] == 'race') {
            race_details[each.split('.')[1]] = String(body[each])
            continue
        }
        const points = f1_points_map[Number(value)] || 0
        if (each.split('.')[0] == 'points') {
            const fastest_lap = Number(value) <= 10 && race_details.fastest_lap == each.split('.')[2] ? 1 : 0
            constructor_points[each.split('.')[1]] = constructor_points[each.split('.')[1]] ?
                constructor_points[each.split('.')[1]] + points + fastest_lap :
                points + fastest_lap
            driver_points[each.split('.')[2]] = points + fastest_lap
            continue
        }
    }

    let sortable = []
    for (var driver in driver_points) {
        sortable.push([driver, driver_points[driver]])
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1]
    })
    const driver_standings = sortable.map(x => x[0])
    sortable = []
    for (var constructor in constructor_points) {
        sortable.push([constructor, constructor_points[constructor]])
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1]
    })
    const constructor_standings = sortable.map(x => x[0])

    const queryValues = {
        races: [],
        results: [],
        driver_standings: [],
        constructor_standings: [],
    }

    //  INSERT INTO results ( raceId, driverId, constructorId, number, grid, position, positionText, positionOrder, points, laps, time, milliseconds, fastestLap, rank, fastestLapTime, fastestLapSpeed, statusId)
    // 		get results.resultsId
    //  INSERT INTO driver_standings ( raceId, driverId, points, position, positionText, wins )
    // 		get driver_standings.driverStandingsId
    //  INSERT INTO constructor_standings ( constructorId, points, position, positionText, wins )
    // 		get constructor_standings.constructorStandingsId

    return c.json({ details: race_details, drivers: { points: driver_points, position: driver_standings }, constructors: { points: constructor_points, position: constructor_standings } })
})

// Dynamic CRUD handler
const handleCrudOperation = async (c, operation) => {
    const { table, identifier, value } = c.req.param();
    const queries = c.req.queries();
    const sqlTable = new SQLCrud(c.env.DB, table);

    try {
        let response;
        switch (operation) {
            case 'create':
                response = await sqlTable.create({ data: queries });
                return c.json({ status: 'Created', ...response }, 201);
            case 'read':
                response = await sqlTable.read({
                    where: `${identifier || 'id'} = "${value || queries.id}"`,
                });
                return c.json(response);
            case 'update':
                response = await sqlTable.update({
                    data: queries,
                    where: `${identifier} = "${value}"`,
                });
                return c.json({ status: 'Updated', ...response });
            case 'delete':
                response = await sqlTable.delete({
                    where: `${identifier} = "${value}"`,
                });
                return c.json({ status: 'Deleted', ...response });
            default:
                return c.json({ error: 'Invalid operation' }, 400);
        }
    } catch (error) {
        return handleError(c, error);
    }
};

// Define CRUD routes dynamically
router.get(`/${api_version}/:operation/:table/:identifier?/:value?`, async (c) => {
    const { operation } = c.req.param();
    return handleCrudOperation(c, operation);
});

// Improved query for getting a driver by ID or name
router.get(`/${api_version}/drivers/:identifier`, async (c) => {
    const { identifier } = c.req.param();
    const sqlTable = new SQLCrud(c.env.DB, 'drivers');

    try {
        const whereClause = isNaN(Number(identifier))
            ? `full_name LIKE "${identifier.replace('-', ' ')}"`
            : `driverId = "${identifier}"`;

        const response = await sqlTable.read({
            where: whereClause,
        });
        return c.json(response);
    } catch (error) {
        return handleError(c, error);
    }
});

// Route to search using query parameters
router.get(`/${api_version}/drivers`, async (c) => {
    const queries = c.req.queries();
    const sqlTable = new SQLCrud(c.env.DB, 'drivers');

    try {
        const whereConditions = Object.entries(queries)
            .map(([key, value]) => `${key} LIKE "%${value}%"`)
            .join(' AND ');

        const response = await sqlTable.read({
            where: whereConditions || '1=1', // Default to all records
        });
        return c.json(response);
    } catch (error) {
        return handleError(c, error);
    }
});

export default router