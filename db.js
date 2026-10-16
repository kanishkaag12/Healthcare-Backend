require("dotenv").config();

const {Client} = require("pg")

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
.then(() => console.log("PostgreSQL connected"))
.catch((err) => console.error("Database Connection failed", err.message));

module.exports = client;