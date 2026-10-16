const express = require("express");
const client = require("./db")
const bcrypt = require("bcrypt")

const app = express()

app.use(express.json())

app.get("/", (req, res) => res.send("Backend is running"))

app.post("/api/auth/register", async(req, res) => {
    try {
        const {name, email, password} = req.body;

        if(typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof password !== "string" || !password.trim()) {
                return res.status(400).json({
                    message: "Name, email and password are required"
                });
            }

        const existingUser = await client.query(
            "select id from users where email = $1",
            [email.trim().toLowerCase()]
        );

        if(existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await client.query(
            "insert into users (name, email, password_hash) values ($1, $2, $3) returning id, name, email, created_at",
            [name.trim(), email.trim().toLowerCase(), passwordHash]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    }catch(err) {
        console.error("Registration error: ", err.message);

        return res.status(500).json({message: "Internal server error"});
    }
})

app.listen(5000, () => {
    console.log('Server running on port 5000');
})