const express = require('express');
const cors = require('cors');
const passport = require('./passport');
const config = require('./config');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
