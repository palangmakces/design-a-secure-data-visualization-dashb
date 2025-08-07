// Import required libraries
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Set up MongoDB connection
mongoose.connect('mongodb://localhost/secure-dashboard', { useNewUrlParser: true, useUnifiedTopology: true });

// Define user model
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// Define dashboard data model
const dataSchema = new mongoose.Schema({
  data: Object
});
const Data = mongoose.model('Data', dataSchema);

// Set up authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send('Access denied');
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token');
  }
};

// Set up dashboard route
app.get('/dashboard', authenticate, async (req, res) => {
  const data = await Data.find({});
  res.send(`<!DOCTYPE html>
    <html>
    <head>
      <title>Secure Data Visualization Dashboard</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h1>Welcome, ${req.user.username}!</h1>
      <canvas id="myChart"></canvas>
      <script>
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: ${JSON.stringify(data)},
          options: {
            title: {
              display: true,
              text: 'Secure Data Visualization'
            }
          }
        });
      </script>
    </body>
    </html>`);
});

// Set up login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('Invalid username or password');
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).send('Invalid username or password');
  const token = jwt.sign({ username }, process.env.SECRET_KEY, { expiresIn: '1h' });
  res.send(token);
});

// Set up register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password: await bcrypt.hash(password, 10) });
  await user.save();
  res.send('Registered successfully!');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));