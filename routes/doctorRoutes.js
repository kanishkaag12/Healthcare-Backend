const express = require("express");
const router = express.Router();
const client = require("../db");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, async(req, res) => {
    try {
        const {name, specialization, email, phone, experience} = req.body;
        const userId = req.user.id;

        if (typeof name !== "string" || !name.trim() ||
            typeof specialization !== "string" || !specialization.trim() ||
            typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Doctor name, specialization and email are required"
            });
        }

        if (experience !== undefined && experience !== null && 
            (!Number.isInteger(experience) || experience<0)
        ) {
            return res.status(400).json({
                message: "Experience must be a valid positive number"
            })
        }

        const result = await client.query(
            "insert into doctors (name, specialization, email, phone, experience, created_by) values ($1, $2, $3, $4, $5, $6) returning *",
            [
                name.trim(), 
                specialization.trim(), 
                email.trim(), 
                phone ?? null, 
                experience ?? null, 
                userId
            ]
        );

        return res.status(201).json({
            message: "Doctor created successfully",
            doctor: result.rows[0]
        });

    }catch(err) {
        console.error("Doctor creation error:", err.message);

        return res.status(500).json({message: "Internal server error"});
    }
})

module.exports = router;