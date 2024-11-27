//  index.js

import { rawHtmlResponse } from '../utilities/std'
import { Page } from '../utilities/dom'
import { Hono } from 'hono';

const router = new Hono();

import api from './api';
import drivers from './drivers';
import constructors from './constructors';
import races from './races';

router.route('/api', api)
router.route('/drivers', drivers)
router.route('/constructors', constructors)
router.route('/races', races)

//	route handler
router.get('/', c => {

    const body = `<div class="py-3 mx-auto col-md-10 col-sm-12">
        <!-- Header Section -->
        <header class="bg-glass-primary bg-glass-primary-3 text-muted text-center py-5">
            <h1 class="display-4">Welcome to the openF1 API Project</h1>
            <p class="lead">Your gateway to detailed Formula 1 data and beyond.</p>
        </header>

        <!-- Introduction Section -->
        <section class="container my-5">
            <div class="row">
                <div class="col-md-8 mx-auto">
                    <h2 class="text-center mb-4">Project Overview</h2>
                    <p class="lead">
                        The openF1 API project is a comprehensive platform providing real-time and historical Formula 1 data. With endpoints designed for easy access to race results, driver statistics, and constructor standings, this API serves as a valuable tool for developers, data analysts, and F1 enthusiasts alike.
                    </p>
                </div>
            </div>
        </section>

        <!-- API Endpoints Section -->
        <section class="container my-5">
            <h2 class="text-center mb-4">Available API Endpoints</h2>
            <div class="row">
                <div class="col-md-6">
                    <ul class="list-group">
                        <li class="bg-glass-primary bg-glass-primary-5 list-group-item"><strong>/api/v1/drivers</strong> - Fetches information about all drivers.</li>
                        <li class="bg-glass-dark bg-glass-dark-1 list-group-item"><strong>/api/v1/constructors</strong> - Retrieves details about all constructors.</li>
                        <li class="bg-glass-primary bg-glass-primary-5 list-group-item"><strong>/api/v1/race-results</strong> - Provides race results for a given season or race.</li>
                        <li class="bg-glass-dark bg-glass-dark-5 list-group-item"><strong>/api/v1/standings</strong> - Returns current driver and constructor standings.</li>
                        <li class="bg-glass-primary bg-glass-primary-3 list-group-item"><strong>/api/v1/schedule</strong> - Shows the F1 race calendar for the current or upcoming season.</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <ul class="list-group">
                        <li class="bg-glass-primary bg-glass-primary-5 list-group-item"><strong>/api/v1/lap-times</strong> - Detailed lap times for each driver per race.</li>
                        <li class="bg-glass-dark bg-glass-dark-1 list-group-item"><strong>/api/v1/qualifying</strong> - Qualifying session results.</li>
                        <li class="bg-glass-primary bg-glass-primary-5 list-group-item"><strong>/api/v1/circuits</strong> - Data about circuits and track information.</li>
                        <li class="bg-glass-dark bg-glass-dark-5 list-group-item"><strong>/api/v1/teams</strong> - Information about teams and their members.</li>
                        <li class="bg-glass-primary bg-glass-primary-3 list-group-item"><strong>/api/v1/drivers/{id}</strong> - Fetches detailed statistics for a specific driver.</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Future Goals Section -->
        <section class="container my-5">
            <h2 class="text-center mb-4">Future Goals</h2>
            <p class="lead text-center">
                We are committed to expanding the openF1 API platform to deliver even more features and capabilities.
            </p>
            <div class="row">
                <div class="col-md-8 mx-auto">
                    <ul class="list-group">
                        <li class="bg-glass-primary bg-glass-primary-3 list-group-item">Introduce fantasy F1 leagues where users can create and manage their own teams.</li>
                        <li class="bg-glass-dark bg-glass-dark-5 list-group-item">Allow users to select their favorite constructors and drivers to compete with friends.</li>
                        <li class="bg-glass-primary bg-glass-primary-3 list-group-item">Develop detailed analytics and performance comparison tools for fantasy teams.</li>
                        <li class="bg-glass-dark bg-glass-dark-7 list-group-item">Enhance real-time data support for live race tracking and statistics.</li>
                    </ul>
                </div>
            </div>
        </section>
    </div>`
    const page = new Page({
        page_title: 'Home',
        body: body || `<div class='p-3 text-center'><h2>Hello World!</h2<</div><br>
				<img class='p-3 mx-auto d-block rounded' src='https://blaineharper.com/assets/favicon.ico' style='max-width:100%; max-height: 25rem'>`
    })
    return rawHtmlResponse(page.render())
})

router.get('/developer', async c => {
    const page = new Page({
        pageTitle: 'Developer',
        body: `
        <div class="py-3 mx-auto col-md-10 col-sm-12">
            Hi! My name's Blaine. I make websites and other JavaScript applications. If you're interested in creating your own JavaScript projects like this one, check out my <a href='https://github.com/bhar2254'>GitHub</a> or check out my site <a href='https://blaineharper.com'>BlaineHarper.com</a> for (possibly?) up to date details.
        </div>`
    })
    return rawHtmlResponse(page.render())
})

router.get('/projects', async c => {
    const page = new Page({
        pageTitle: 'Projects',
        body: `
        <div class="py-3 mx-auto col-md-10 col-sm-12">
            If you'd like to view my other projects, check out my <a href='https://github.com/bhar2254'>GitHub</a>!
        </div>`
    })
    return rawHtmlResponse(page.render())
})

router.get(`/wiki/:wiki_page`, async c => {
    const { wiki_page } = c.req.param()
    return c.redirect(`https://en.wikipedia.org/wiki/${wiki_page}`)
})

export default router