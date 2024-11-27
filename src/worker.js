/**
 * worker.ts
 * A Cloudflare edge hosted Worker for Bootstrap UI development.
 */

//  Import modules
import { Hono } from 'hono';
import { Page } from './utilities/dom'
import { FetchAPI } from './utilities/fetchAPI'
import index from './routes/index';
import scheduled from './scheduledHandler.js';

const api_version = ['v1']
const version = '0.0.0'
FetchAPI.setDefaults({
	baseURL: `https://api.openf1.org/v1`,
	endpoint: `drivers`,
	endpoints: {
		'drivers': 'driver_number',
		'meetings': 'meeting_key',
		'sessions': 'session_key'
	}
})

var ENV = {
	version: version,
	siteTitle: 'openF1 API',
	brand: `Danealue's openF1 API`,
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
	}, {
		text: 'UI',
		links: [{
			text: 'Drivers',
			link: `/drivers/championship`
		}, {
			text: 'Constructors',
			link: `/constructors`
		}, {
			text: 'Races',
			link: `/races`
		}],
	}, {
		text: 'API',
		links: [{
			text: 'Drivers',
			link: `/api/${api_version[0]}/read/drivers`
		}, {
			text: 'Constructors',
			link: `/api/${api_version[0]}/read/constructors`
		}, {
			text: 'Circuits',
			link: `/api/${api_version[0]}/read/circuits`
		}, {
			text: 'Races',
			link: `/api/${api_version[0]}/read/races`
		}, {
			text: 'Results',
			link: `/api/${api_version[0]}/read/results`
		}, {
			text: 'Seaons',
			link: `/api/${api_version[0]}/read/seasons`
		}],
	}]
}

// 	set application default's for page generation
//	Page will use this as the default contents for <head></head> unless overwritten with Page.header
const _headerDef = `
	<meta name='viewport' content='width=device-width,initial-scale=1'/>
	<link rel='icon' type='image/x-icon' href='https://blaineharper.com/assets/favicon.ico'>

	<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/color-square.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/wiki.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/team-color.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/f1/popup.css'>
	<link rel='stylesheet' href='https://bhar2254.github.io/src/css/bs.add.css'>

	<script src='https://kit.fontawesome.com/5496aaa581.js' crossorigin='anonymous'><\/script>
	
	<style>
		body {
			background-repeat: no-repeat;
			background-attachment: fixed;

			/* Full height */
			height: 100%;

			/* Center and scale the image nicely */
			background-position: center;
			background-repeat: no-repeat;
			background-size: cover;

			background-image: url('https://bhar2254.github.io/src/img/f1/backgrounds/lando_norris.jpg');
			font-family: 'Gotham Narrow', sans-serif;
		}
	</style>`

const _copyright = `
	<span id = 'footerText'><span id='year'></span> © ${ENV.copyright}</span>
	<script>document.getElementById('year').innerHTML = new Date().getFullYear()</script>`

const _footerDef = `
	<div class='mx-auto'>
		<div id='footer_motto' class='col-lg-3 col-md-6 col-sm-9 col-xs-11 mx-auto bh-left-bar p-3 shadow-lg bg-glass-dark bg-glass-dark-5 bg-gradient text-center panel rounded-0' style='margin-bottom:7.5rem;'>
			<i>This project was created to showcase the power of Cloudflare Workers for easing workflow and improving speed and reliability. Start your own Cloudflare worker site <a href='https://github.com/bhar2254/Cloudflare-Workers-Starter'>here!</a></i>
			<br><br>
			<small>As such, this site is not affiliated with F1 or any other brands shown or displayed in these data sets.</small>
		</div>
	</div>
	<button onclick="topFunction()" id="topButton" title="Go to top" style="display:block;">Top</button> 
	<!-- Bootstrap Modal -->
	<div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content bg-transparent border-0">
				<img style="min-height:60%;min-width:60%;max-height:60%;max-width:60%" src="" alt="Enlarged Image" class="img-fluid" id="modalImage">
			</div>
		</div>
	</div>


	<footer id='mainFooter' class='mx-auto shadow-lg p-2 text-center bg-glass bg-gradient sticky-footer'>
		${_copyright}
	</footer>
	
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<script>
		let buttonToTop = document.getElementById("topButton")

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
			
		$(document).ready(function() {
			// Event listener for all images with the class 'popup-img'
			$('.popup-img').on('click', function() {
				const imgSrc = $(this).attr('src');  // Get the source of the clicked image
				$('#modalImage').attr('src', imgSrc);  // Set modal image source
				$('#imageModal').modal('show');  // Show the modal
			});
		});
	</script>	`

const pageDefaults = {
	...ENV,
	theme: 'dark',
	header: _headerDef,
	footer: _footerDef,

}

Page.setDefs(pageDefaults)

const app = new Hono();

app.route('/', index);

export default app;