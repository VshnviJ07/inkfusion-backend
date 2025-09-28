const mongoose = require("mongoose");

const mongoURI =
  "mongodb+srv://jaiswalop484_db_user:80tshR9tdGN4EK0K@inkfusion.rreg5d4.mongodb.net/inkfusion?retryWrites=true&w=majority&appName=InkFusion";

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectToMongo;
