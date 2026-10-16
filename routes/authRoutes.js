const express = require("express")
const router = express.Router();

const client = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/register", async(req, res) => {
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



router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;
        if(typeof email !== "string" || !email.trim() ||
            typeof password !== "string" || !password.trim()) {
                return res.status(400).json({"message": "Email and password are required"})
            }

        const result = await client.query(
            "select id, name, email, password_hash from users where email = $1",
            [email.trim().toLowerCase()]
        );

        if(result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if(!isPasswordValid) {
            return res.status(401).json({message: "Invalid email or password"});
        }

        const token = jwt.sign(
            {id: user.id},
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        return res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
        
    }catch(err) {
        console.error("Login error:", err.message);
        return res.status(500).json({"message": "Internal Server Error"});
    }
})

module.exports = router;