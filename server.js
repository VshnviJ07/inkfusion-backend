// server.js
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); // Only load .env locally
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Models
const User = require("./models/User");
const Note = require("./models/Notes");

// JWT auth middleware
const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token)
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate using a valid token" });
  }
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Helper to get dynamic backend URL
const getBaseURL = (req) => req.protocol + "://" + req.get("host");

// ===== Routes =====

// Create user
app.post("/api/auth/createuser", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: secPass });
    const savedUser = await newUser.save();

    const data = { user: { id: savedUser.id } };
    const authtoken = jwt.sign(data, JWT_SECRET);
    res.json({ authtoken });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) return res.status(400).json({ error: "Invalid credentials" });

    const data = { user: { id: user.id } };
    const authtoken = jwt.sign(data, JWT_SECRET);
    res.json({ authtoken });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get logged-in user
app.post("/api/auth/getuser", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Fetch all notes
app.get("/api/notes/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ date: -1 });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Add new note
app.post("/api/notes/addnote", fetchuser, upload.array("files", 10), async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    const baseURL = getBaseURL(req);
    const multimedia = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      url: `${baseURL}/uploads/${file.filename}`,
    }));

    const note = new Note({ title, description, tag, multimedia, user: req.user.id });
    const savedNote = await note.save();
    res.json(savedNote);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Update note
app.put("/api/notes/updatenote/:id", fetchuser, upload.array("files", 10), async (req, res) => {
  try {
    const { title, description, tag, existingMultimedia } = req.body;
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Not Found");
    if (note.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    const updatedNote = {};
    if (title !== undefined) updatedNote.title = title;
    if (description !== undefined) updatedNote.description = description;
    if (tag !== undefined) updatedNote.tag = tag;

    let existing = [];
    if (existingMultimedia) existing = JSON.parse(existingMultimedia);
    updatedNote.multimedia = existing || [];

    if (req.files && req.files.length > 0) {
      const baseURL = getBaseURL(req);
      const newFiles = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        url: `${baseURL}/uploads/${file.filename}`,
      }));
      updatedNote.multimedia = [...updatedNote.multimedia, ...newFiles];
    }

    note = await Note.findByIdAndUpdate(req.params.id, { $set: updatedNote }, { new: true });
    res.json(note);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Delete note
app.delete("/api/notes/deletenote/:id", fetchuser, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Not Found");
    if (note.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: "Note deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => console.log(`✅ Server running at port ${PORT}`));
