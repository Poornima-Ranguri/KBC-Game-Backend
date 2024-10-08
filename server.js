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

    app.listen(3003, () =>
      console.log("Server Running at http://localhost:3003/")
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
  const selectUserQuery = `SELECT * FROM userTable WHERE username='${username}';`;
  const dbUser = await database.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser !== undefined) {
    response.send("user already exists");
    response.status(400);
  } else {
    const createuserQuery = `INSERT INTO userTable(username, questions_attempted, completedAllQuestions) VALUES('${username}', 0, FALSE);`;
    const databaseResponse = await database.run(createuserQuery);
    response.send("user created successfully");
  }
});

//Update questions_attempted and completedAllQuestions

app.put("/update-status", async (request, response) => {
  const { id, username, questions_attempted, completedAllQuestions } =
    request.body;

  const updateUserQuery = `UPDATE userTable SET username='${username}', questions_attempted='${questions_attempted}', completedAllQuestions='${completedAllQuestions}' WHERE id='${id}';`;
  await database.run(updateUserQuery);
  response.send("Status Updated Successfully");
});
