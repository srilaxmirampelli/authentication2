const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')

const databasePath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

// Register User API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
  SELECT * FROM user
  WHERE username = "${username}";
  `
  const dbUser = await database.get(selectUserQuery)
  if (dbUser === undefined) {
    // check if password is strong
    if (password.length < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      // Create User
      const createUserQuery = `
        INSERT INTO 
        user (username, name, password, gender, location)
        VALUES (
            "${username}",
            "${name}",
            "${hashedPassword}",
            "${gender}",
            "${location}"
            );
        `
      const dbResponse = await database.run(createUserQuery)
      response.send('User created successfully')
    }
  } else {
    response.status = 400
    response.send('User already exists')
  }
})

// Login User API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT * FROM user
  WHERE username = "${username}";
  `
  const dbUser = await database.get(selectUserQuery)
  if (dbUser === undefined) {
    // Invalid user login
    response.status = 400
    response.send('Invalid user')
  } else {
    // check password
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  }
})

// update password API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
  SELECT * FROM user
  WHERE username = "${username}";
  `
  const dbUser = await database.get(selectUserQuery)
  if (dbUser !== undefined) {
    // check password
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        // check if new password is too short
        response.status = 400
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE user
        SET password = "${hashedPassword}";
        `
        console.log(hashedPassword)
        console.log(newPassword)
        response.send('Password updated')
      }
    } else {
      // Invalid current password
      response.status = 400
      response.send('Invalid current password')
    }
  }
})

module.exports = app
