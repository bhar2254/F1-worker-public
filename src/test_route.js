
import { Hono } from 'hono'
const router = new Hono()

//	route handler
router.get('/', async c => {
	const page = new Page({
		page_title: 'Test Route',
		body: `This is a rest route to test program functionality.`
	})
	return rawHtmlResponse(page.render())
})

//	route handler
router.get('/test', async c => {
	const page = new Page({
		page_title: 'Test II Route',
		body: `This is a rest route to test program functionality.`
	})
	return rawHtmlResponse(page.render())
})

export default router