const express = require("express");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const { use } = require("bcrypt/promises");

const databasePath = path.join(__dirname, "userDatabase.db");

const app = express();

app.use(express.json());

// Enable CORS for all routes

app.use(cors());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(8000, () =>
      console.log("Server Running at http://localhost:8000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//To get all users

app.get("/", async (request, response) => {
  const usersQuery = `SELECT * FROM userTable;`;
  const users = await database.all(usersQuery);
  response.send(users);
});

//adding the user to the userTable
app.post("/add-user", async (request, response) => {
  const { username } = request.body;

  if (!username) {
    return response.status(400).send("Username is required.");
  }

  const selectUserQuery = `SELECT * FROM userTable WHERE username = ?;`;
  const dbUser = await database.get(selectUserQuery, username);

  if (dbUser) {
    return response.status(400).send("User already exists.");
  }

  try {
    const createUserQuery = `INSERT INTO userTable (username, questions_attempted, completedAllQuestions) VALUES (?, 0, FALSE);`;
    await database.run(createUserQuery, username);
    response.status(201).send("User created successfully.");
  } catch (error) {
    console.error("Error creating user:", error);
    response.status(500).send("Internal server error.");
  }
});

// Update questions_attempted and completedAllQuestions
app.put("/update-status", async (request, response) => {
  const { username, questions_attempted, completedAllQuestions } = request.body;

  // Ensure completedAllQuestions is treated as a boolean in the SQL query
  const updateUserQuery = `
        UPDATE userTable 
        SET questions_attempted = ${questions_attempted}, 
            completedAllQuestions = ${completedAllQuestions ? 1 : 0}
        WHERE username = '${username}';
      `;

  try {
    await database.run(updateUserQuery);
    response.status(200).json({ message: "Status Updated Successfully" });
  } catch (error) {
    console.error("Error updating user status:", error);
    response.status(500).send("Error updating user status");
  }
});

// Get user progress by username
app.get("/user/:username", async (request, response) => {
  const { username } = request.params;
  const selectUserQuery = `SELECT * FROM userTable WHERE username = '${username}';`;
  const user = await database.get(selectUserQuery);

  if (user === undefined) {
    response.status(404).send("User not found");
  } else {
    response.send(user); // Send the user's progress data
  }
});
