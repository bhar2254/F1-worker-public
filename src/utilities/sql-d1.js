// Function to retrieve column names for a given table (SQLite PRAGMA)
async function getColumnNames(db, table) {
    const query = `PRAGMA table_info(${table});`;
    const { results } = await db.prepare(query).all();
    if (!results)
        return []
    return results.map(row => row.name); // Extract column names
}

class SQLQuery {
    constructor(key, table, args = {}, validColumns = []) {
        this.key = key.toUpperCase();
        this.table = table;
        this.columns = args.columns || ['*'];
        this.where = args.filter || args.where || ''
        this.validColumns = validColumns
        this.group = args.group || '';
        this.orderBy = args.orderBy || '';
        this.limit = args.limit || 50; // Default limit
        this.offset = args.offset || 0; // Default offset
        this.join = args.join || '';
        this.data = args.data || {};
        this.args = args || {}
    }

    // Sanitize values to prevent SQL injection
    sanitizeValue(value) {
        if (typeof value === 'string') {
            // Escape quotes to avoid issues with different environments
            return value.replace(/'/g, "''").replace(/"/g, '""');
        }
        return value;
    }

    // Build WHERE clause with validation
    buildWhereClause(filter, validColumns) {
        if (!filter) return '';

        if (filter instanceof String) {
            return `WHERE ${filter}`;
        }

        if (typeof filter === 'object' && Object.keys(filter).length > 0) {
            const conditions = Object.entries(filter)
                .filter(([key]) => validColumns.includes(key)) // Validate column names
                .map(([key, value]) => `${key} LIKE "${this.sanitizeValue(value)}"`); // Sanitize values

            return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        }
        return '';
    }

    set where(where) {
        this._where = where
    }

    get where() {
        return this.buildWhereClause(this._where, this.validColumns)
    }

    // Getters and Setters for columns
    get columns() {
        return Array.isArray(this._columns) ? this._columns.join(', ') : this._columns;
    }

    set columns(columns) {
        this._columns = Array.isArray(columns) ? columns : ['*'];
    }

    // Getters and Setters for GROUP BY
    get group() {
        return this._group ? `GROUP BY ${this._group}` : '';
    }

    set group(group) {
        this._group = group;
    }

    // Getters and Setters for ORDER BY
    get orderBy() {
        return this._orderBy ? `ORDER BY ${this._orderBy}` : '';
    }

    set orderBy(orderBy) {
        this._orderBy = orderBy;
    }

    // Getters and Setters for LIMIT
    get limit() {
        return this._limit ? `LIMIT ${parseInt(this._limit, 10)}` : '';
    }

    set limit(limit) {
        this._limit = parseInt(limit, 10) > 0 ? limit : '';
    }

    // Getters and Setters for OFFSET
    get offset() {
        return this._offset ? `OFFSET ${parseInt(this._offset, 10)}` : '';
    }

    set offset(offset) {
        this._offset = parseInt(offset, 10) >= 0 ? offset : '';
    }

    // Getters and Setters for JOIN
    get join() {
        return Array.isArray(this._join) ? this._join.join(' ') : this._join;
    }

    set join(join) {
        this._join = Array.isArray(join) ? join : [join];
    }

    // Get the final SQL statement
    get statement() {
        const statements = {
            'SELECT': `SELECT ${this.columns} FROM ${this.table} ${this.join} ${this.where} ${this.group} ${this.orderBy} ${this.limit} ${this.offset};`,
            'INSERT': `INSERT INTO ${this.table} ${this.insert};`,
            'UPDATE': `UPDATE ${this.table} SET ${this.set} ${this.where};`,
            'DELETE': `DELETE FROM ${this.table} ${this.where};`,
        };
        return statements[this.key].replace(/\s+/g, ' ').trim();
    }

    get insert() {
        const columns = Object.keys(this.data).join(', ');
        const values = Object.values(this.data).map(value => this.sanitizeValue(value)).join(', ');
        return columns ? `(${columns}) VALUES (${values})` : '';
    }

    get set() {
        return Object.entries(this.data)
            .map(([key, value]) => `${key} = ${this.sanitizeValue(value)}`)
            .join(', ');
    }
}

export class SQLCrud {
    constructor(db, table) {
        this.db = db;
        this.table = table;
    }

    async getValidColumns() {
        return await getColumnNames(this.db, this.table);
    }

    async create(args) {
        const query = new SQLQuery('INSERT', this.table, {...this.args, ...args});
        console.log(query.statement);
        return await this.db.prepare(query.statement).run();
    }

    async read(args = {}) {
        const validColumns = await this.getValidColumns(); // Fetch valid columns
        args.limit = args.limit || 50;
        args.offset = args.offset || 0;

        const query = new SQLQuery('SELECT', this.table, {...this.args, ...args}, validColumns);
        console.log(query.statement);
        return await this.db.prepare(query.statement).all();
    }

    async update(args) {
        const validColumns = await this.getValidColumns(); // Ensure valid columns
        const query = new SQLQuery('UPDATE', this.table, {...this.args, ...args}, validColumns);
        console.log(query.statement);
        return await this.db.prepare(query.statement).run();
    }

    async delete(args) {
        const validColumns = await this.getValidColumns(); // Validate columns in WHERE
        const query = new SQLQuery('DELETE', this.table, {...this.args, ...args}, validColumns);
        console.log(query.statement);
        return await this.db.prepare(query.statement).run();
    }
}
