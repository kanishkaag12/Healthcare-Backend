const express = require("express")
const router = express.Router();

const client = require("../db");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", async(req, res) => {
    try {
        const {name, age, gender, phone, address} = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Patient name is required"
            });
        }

        if (age !== undefined && age !== null && 
            (!Number.isInteger(age) || age<0 || age > 100)
        ) {
            return res.status(400).json({
                message: "Age must be a valid positive number"
            })
        }

        const result = await client.query(
            "insert into patients (name, age, gender, phone, address) values ($1, $2, $3, $4, $5) returning *",
            [
                name.trim(), age ?? null, gender ?? null, phone ?? null, address ?? null
            ]
        );

        return res.status(201).json({
            message: "Patient created successfully",
            patient: result.rows[0]
        });

    }catch(err) {
        console.error("Patient creation error:", err.message);
        
        return res.status(500).json({message: "Internal server error"});
    }
})

module.exports = router;