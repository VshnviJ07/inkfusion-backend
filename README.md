# Inkfusion-Backend

InkFusion Backend is a Node.js + Express API for the InkFusion MERN notepad application. It handles user authentication, note CRUD operations, and connects to MongoDB Atlas.

💻 Tech Stack

Backend: Node.js, Express.js

Database: MongoDB (Atlas)

Authentication: JWT, bcrypt

⚡ Installation

Clone the repository

git clone https://github.com/Vshnvi07/inkfusion-backend.git
cd inkfusion-backend


Install dependencies

npm install


Create a .env file in the root of the backend repo:

PORT=5000
MONGO_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here


Replace your_mongodb_uri_here with your MongoDB Atlas URI.
Replace your_jwt_secret_here with any random secret string.

Run the backend

npm run server


Backend will run at:

http://localhost:5000

📂 API Endpoints
Authentication

POST /api/auth/createuser - Register a new user

POST /api/auth/login - Login a user

POST /api/auth/getuser - Get logged-in user info

Notes

GET /api/notes/fetchallnotes - Fetch all notes of the logged-in user

POST /api/notes/addnote - Add a new note

PUT /api/notes/updatenote/:id - Update a note

DELETE /api/notes/deletenote/:id - Delete a note

🔗 Frontend Integration

For frontend setup, visit the InkFusion Frontend Repository
Make sure to update the .env file in frontend with the backend URL if deployed separately.


frontend repository:-

https://github.com/VshnviJ07/inkfusion-frontend/tree/main

👩‍💻 Author

Vaishnavi Jaiswal
