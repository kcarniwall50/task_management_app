const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

// Middleware

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://task-management-app.vercel.app"],
    credentials: true,
  })
);


mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
