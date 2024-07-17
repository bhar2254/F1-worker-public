class SQLQuery {
//  const sample = new SQLQuery( 'SELECT','table', args )
    constructor(key, table, args){
        const _args = { ...args }
        this.key = key
        this.table = table
        this.columns = _args.columns || ['*']
        this.where = _args.where || ''
        this.limit = _args.limit || ''
        this.orderBy = _args.orderBy || ''
        this.join = _args.join || ['']
        this.data = _args.data || {}
    }
    set key(key){
        this._key = String(key).toUpperCase()
    }
    get key() {
        return this._key
    }
    set columns(columns) {
        this._columns = Array.isArray(columns) ? columns : ['*']
    }
    get columns() {
        return this._columns.join(', ')
    }
    set data(data) {
        this._data = typeof data === 'object' ? data : {}
    }
    get data() {
        return this._data
    }
    get insert() {
        const data = this._data
        const columns = Object.keys(data)
        const values = Object.values(data).map(x => `"${x}"`)
        return columns.length ? `(${columns.join(', ')}) VALUES (${values.join(', ')})` : ''
    }
    get set() {
        const data = this._data
        return Object.entries(data).map(x => {
            return `${x[0]} = "${x[1]}"`
        }).join(', ')
    }
    set join(join) {
        this._join = Array.isArray(join) ? join : ['']
    }
    get join() {
        const output = this._join.join(', ')
        return output
    }
    set where(where) {
        this._where = where
    }
    get where() {
        const where = this._where.length ? `WHERE ${this._where}` : ``
        return where
    }
    set limit(limit) {
        this._limit = limit
    }
    get limit() {
        const limit = this._limit.length ? `LIMIT ${this._limit}` : ``
        return limit
    }
    set orderBy(orderBy) {
        this._orderBy = Array.isArray(orderBy) ? orderBy : []
    }
    get orderBy() {
        const orderBy = this._orderBy.length ? `ORDER BY ${this._orderBy.join(', ')}` : ``
        return orderBy
    }
    get statement() {
    //  SELECT * FROM table WHERE ORDER BY LIMIT
        const statement_types = {
            'INSERT': `${this.key} INTO ${this.table} ${this.insert};`,
            'SELECT': `${this.key} ${this.columns} FROM ${this.table} ${this.join} ${this.where} ${this.orderBy} ${this.limit};`,
            'UPDATE': `${this.key} ${this.table} SET ${this.set} ${this.where};`,
            'DELETE': `${this.key} FROM ${this.table} ${this.where};`,
        }
        return statement_types[this.key] || ''
    }
}

export class SQLCrud {
/*
    const sample = new SQLCrud(c.env.DB, 'table', {])
    const data = await sample.create({data: {keys: values}})        INSERT INTO table (keys) VALUES (values)
    const data = await sample.read()                                SELECT * FROM table
    const data = await sample.update({data: {keys: values}})        UPDATE table SET 
    const data = await sample.destroy()                             DELETE FROM table
*/
    constructor(db, table, args){
        this.db = db || ''
        this.table = table || ''
        this.args = args || {}
    }  
    async create(args) {
    //  args.data = { columns: values }
        const query = new SQLQuery('INSERT', this.table, args)
        return await this.db.prepare(query.statement).run()
    }
    async read(args){
        const query = new SQLQuery('SELECT', this.table, args)
        console.log(query.statement)
        return await this.db.prepare(query.statement).all()
    }
    async update(args) {
    //  args.data = { columns: values }
        const query = new SQLQuery('UPDATE', this.table, args)
        return await this.db.prepare(query.statement).run()
    }
    async delete(args) {
        const query = new SQLQuery('DELETE', this.table, args)
        return await this.db.prepare(query.statement).run()
    }
}