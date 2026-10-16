const express = require("express");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");

const app = express()

app.use(express.json())

app.get("/", (req, res) => res.send("Backend is running"))

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);

app.listen(5000, () => {
    console.log('Server running on port 5000');
})