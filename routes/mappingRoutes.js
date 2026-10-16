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

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await client.query(
            `select
                m.id AS mapping_id,
                m.patient_id,
                p.name AS patient_name,
                m.doctor_id,
                d.name AS doctor_name,
                d.specialization,
                m.created_at
             from patient_doctor_mappings m
             join patients p on p.id = m.patient_id
             join doctors d on d.id = m.doctor_id
             where m.created_by = $1
             order by m.id DESC`,
            [userId]
        );

        return res.status(200).json({
            message: "Patient-doctor mappings retrieved successfully",
            mappings: result.rows
        });

    }catch (err) {
        console.error("Get mappings error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get("/:patient_id", verifyToken, async (req, res) => {
    try {
        const patientId = Number(req.params.patient_id);
        const userId = req.user.id;

        if (!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({
                message: "Invalid patient ID"
            });
        }

        const patient = await client.query(
            `select id from patients
             where id = $1 and created_by = $2`,
            [patientId, userId]
        );

        if (patient.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }
        const result = await client.query(
            `select
                m.id AS mapping_id,
                d.id AS doctor_id,
                d.name AS doctor_name,
                d.specialization,
                d.email,
                d.phone,
                d.experience
             from patient_doctor_mappings m
             join doctors d ON d.id = m.doctor_id
             where m.patient_id = $1
               and m.created_by = $2
             order BY m.id DESC`,
            [patientId, userId]
        );

        return res.status(200).json({
            message: "Doctors retrieved successfully",
            patient_id: patientId,
            doctors: result.rows
        });

    } catch (err) {
        console.error("Get patient doctors error:", err.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

module.exports = router;