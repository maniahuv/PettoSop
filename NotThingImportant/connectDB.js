import pgPromise from 'pg-promise'
const pgp = pgPromise()
const client = {
    user: 'postgres',
    password: 'admin',
    host: 'localhost',
    port: '5432',
    database: 'Project'
}
const db = pgp(client)

export default db