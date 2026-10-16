const express = require("express")
const router = express.Router();

const client = require("../db");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, async(req, res) => {
    try {
        const {name, age, gender, phone, address} = req.body;
        const userId = req.user.id;

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
            "insert into patients (name, age, gender, phone, address, created_by) values ($1, $2, $3, $4, $5, $6) returning *",
            [
                name.trim(), age ?? null, gender ?? null, phone ?? null, address ?? null, userId
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

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await client.query(
            "select * from patients where created_by = $1 order by id desc",
            [userId]
        );

        return res.status(200).json({
            message: "Patients retrieved successfully",
            patients: result.rows
        });

    }catch(err) {
        console.error("Patients retriving error: ", err.message);

        return res.status(500).json({message: "Internal server error"});
    }
})



module.exports = router;