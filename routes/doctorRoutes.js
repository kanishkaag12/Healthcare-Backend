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

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await client.query(
            "select * from doctors where created_by = $1 order by id desc",
            [userId]
        );

        return res.status(200).json({
            message: "Doctors retrieved successfully",
            doctors: result.rows
        });

    }catch (err) {
        console.error("Get doctors error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const doctorId = Number(req.params.id);

        if (!Number.isInteger(doctorId) || doctorId <= 0) {
            return res.status(400).json({
                message: "Invalid doctor ID"
            });
        }

        const result = await client.query(
            "select * from doctors where id = $1 and created_by = $2",
            [doctorId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        return res.status(200).json({
            message: "Doctor retrieved successfully",
            doctor: result.rows[0]
        });

    }catch (err) {
        console.error("Get doctor error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

module.exports = router;