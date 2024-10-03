const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const session = require('express-session')
const bcrypt = require('bcrypt')

const app = express()
const port = 5000
app.use(express.static('public'))

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/userdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Define Mongoose Schemas and Models
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
})

const User = mongoose.model('User', userSchema)

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(
  session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
  })
)

// Serve the HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/')
  }
  res.sendFile(path.join(__dirname, 'dashboard.html'))
})

// Handle the signup form submission
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create and save a new user
    const user = new User({ name, email, password: hashedPassword })
    await user.save()

    res.send('Signup successful')
  } catch (err) {
    console.error('Error saving user:', err)
    res.status(500).send('Server error')
  }
})

// Handle the login form submission
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // Find the user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).send('Invalid email or password')
    }

    // Compare the hashed password with the provided password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).send('Invalid email or password')
    }

    // Save user info in session
    req.session.user = { id: user._id, name: user.name, email: user.email }

    // Redirect to the external link
    // res.redirect('http://localhost:3000/')
    res.redirect('/dashboard.html')
  } catch (err) {
    console.error('Error during login:', err)
    res.status(500).send('Server error')
  }
})

// Handle logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout error')
    }
    res.redirect('/index')
  })
})

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
