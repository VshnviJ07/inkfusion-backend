const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note = require("../models/Notes");
const multer = require("multer");
const fs = require("fs");

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Serve static uploads
router.use("/uploads", express.static("uploads"));

// Fetch all notes
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// Add note
router.post("/addnote", fetchuser, upload.array("multimedia", 10), async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    const multimediaFiles = req.files
      ? req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        }))
      : [];

    const note = new Note({
      title,
      description,
      tag,
      multimedia: multimediaFiles,
      user: req.user.id,
    });

    const savedNote = await note.save();
    res.json(savedNote);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// Update note
router.put("/updatenote/:id", fetchuser, upload.array("multimedia", 10), async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Not Found");
    if (note.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    const { title, description, tag } = req.body;
    const newNote = {};
    if (title) newNote.title = title;
    if (description) newNote.description = description;
    if (tag) newNote.tag = tag;

    // Keep existing + add new files
    let multimediaFiles = note.multimedia || [];
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
      }));
      multimediaFiles = [...multimediaFiles, ...newFiles];
    }
    newNote.multimedia = multimediaFiles;

    note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// Delete note
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Not Found");
    if (note.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    // Delete multimedia files from disk
    if (note.multimedia && note.multimedia.length > 0) {
      note.multimedia.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: "Note deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
