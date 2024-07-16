
export class FetchAPI {
	static endpoints = []
	static defaults = {
		baseURL: '',
		endpoint: ''
	}
	static setDefaults = (args) => {
		FetchAPI.defaults = {
			...FetchAPI.defaults,
			...args
		}
	}
	static async gatherAPI(args = {}) {
		this.baseURL = args.baseURL || FetchAPI.defaults.baseURL
		this.endpoint = args.endpoint || FetchAPI.defaults.endpoint
		this.query = new URLSearchParams(args.query)
        this.url = `${this.baseURL}/${this.endpoint}?${this.query.toString()}`
		this.result = await fetch(this.url)
		this.response = await this.result.json()
		return new FetchAPI({...args, ...this})
	}
	constructor(args) {
		this.endpoint = args.endpoint
		this.query = args.query
		this.url = args.url
		this.result = args.result
		this.response = args.response
	}
	set response(response) {
		this._response = response
		this._singleResponse = response[0]
	}
	get response() {
		return this._response
	}
	get singleResponse() {
		return this._singleResponse
	}
	set endpoint(endpoint) {
		this._endpoint = endpoint
	}
	get endpoint() {
		return this._endpoint
	}
}