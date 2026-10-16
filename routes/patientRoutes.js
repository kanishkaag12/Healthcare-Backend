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

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const patientId = Number(req.params.id);

        if(!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({message: "Invalid patient id"});
        }

        const result = await client.query(
            "select * from patients where id = $1 and created_by = $2",
            [patientId, userId]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Patient retrieved successfully",
            patient: result.rows[0]
        });

    }catch(err) {
        console.error("Get patient error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
})

router.put("/:id", verifyToken, async(req, res) => {
    try {
        const userId = req.user.id;
        const patientId = Number(req.params.id);

        const {name, age, gender, phone, address} = req.body;

        if(!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({
                message: "Invalid patient ID"
            });
        }

        if(typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Patient name is required"
            });
        }

        if(age !== undefined && age !== null && 
            (!Number.isInteger(age) || age<0 || age > 100)
        ) {
            return res.status(400).json({
                message: "Age must be a valid positive number"
            });
        }

        const result = await client.query(
            "update patients set name = $1, age = $2, gender = $3, phone = $4, address = $5 where id = $6 and created_by = $7 returning *",
            [
                name.trim(),
                age ?? null,
                gender ?? null,
                phone ?? null,
                address ?? null,
                patientId,
                userId
            ]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Patient updated successfully",
            patient: result.rows[0]
        });
    }catch(err) {
        console.error("Update patient error:", err.message);

        return res.status(500).json({
            message: "internal server error"
        });
    }
})

router.delete("/:id", verifyToken, async(req, res) => {
    try {
        const userId = req.user.id;
        const patientId = Number(req.params.id);

        if(!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({
                message: "Invalid patiend id"
            });
        }

        const result = await client.query(
            "delete from patients where id = $1 and created_by = $2 returning *",
            [patientId, userId]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Patient deleted successfully",
            patient: result.rows[0]
        });
    }catch(err) {
        console.error("Delete patient error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
})

module.exports = router;