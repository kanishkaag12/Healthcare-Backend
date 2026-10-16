const express = require("express");
const router = express.Router();
const client = require("../db");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, async(req, res) => {
    try {
        const {patient_id, doctor_id} = req.body;
        const userId = req.user.id;

        if(!patient_id || !doctor_id) {
            return res.status(400).json({
                message: "Patient ID and Doctor ID are required"
            });
        }

        const patient = await client.query(
            "select id from patients where id = $1 and created_by = $2",
            [patient_id, userId]
        );

        if(patient.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        const doctor = await client.query(
            "select id from doctors where id = $1 and created_by = $2",
            [doctor_id, userId]
        );

        if(doctor.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        const result = await client.query(
            "insert into patient_doctor_mappings (patient_id, doctor_id, created_by) values($1, $2, $3) returning *",
            [patient_id, doctor_id, userId]
        );

        return res.status(201).json({
            message: "Doctor assigned to patient successfully",
            mapping: result.rows[0]
        });
    }catch(err) {
        console.error("Mapping error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

module.exports = router;