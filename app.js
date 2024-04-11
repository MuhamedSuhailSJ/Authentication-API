const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())

const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const startDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server Started`)
    })
  } catch (error) {
    console.log(`Server Shows ${error}`)
    process.exit(1)
  }
}

startDatabase()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  //Scenario 1
  const checkexistence = `
        SELECT *
        FROM user
        WHERE username = '${username}'`
  let resultExistence = await db.get(checkexistence)

  if (resultExistence === undefined) {
    const createUser = `
        INSERT INTO
            user (username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`

    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const resultCreateUser = await db.run(createUser)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const checkUsername = `
    SELECT *
    FROM user
    WHERE username = '${username}'`

  const resultCheck = await db.get(checkUsername)

  if (resultCheck === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordMatch = await bcrypt.compare(password, resultCheck.password)
    if (passwordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const newhashedPassword = await bcrypt.hash(newPassword, 10)

  const currentUserDetail = `
    SELECT *
    FROM user
    WHERE username = '${username}'`

  const resultUserDetails = await db.get(currentUserDetail)
  const passwordMatch = await bcrypt.compare(
    oldPassword,
    resultUserDetails.password,
  )

  if (passwordMatch === true) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const updateUserPassword = `
                UPDATE user
                SET password = '${newhashedPassword}'
                WHERE username = '${username}'`
      await db.run(updateUserPassword)
      response.status(200)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})
module.exports = app
