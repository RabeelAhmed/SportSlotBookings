const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * Example Request:
 * POST /api/auth/register
 * Body: { "name": "John Doe", "email": "john@example.com", "phone": "1234567890", "password": "password123" }
 * 
 * Example Response (201 Created):
 * {
 *   "_id": "60d0fe4f5311236168a109ca",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "1234567890",
 *   "role": "user",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Example Request:
 * POST /api/auth/login
 * Body: { "email": "john@example.com", "password": "password123" }
 * 
 * Example Response (200 OK):
 * {
 *   "_id": "60d0fe4f5311236168a109ca",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "role": "user",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get user data
 * @route   GET /api/auth/me
 * @access  Private
 * 
 * Example Request:
 * GET /api/auth/me
 * Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 * 
 * Example Response (200 OK):
 * {
 *   "_id": "60d0fe4f5311236168a109ca",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "1234567890",
 *   "role": "user",
 *   "createdAt": "2023-10-25T10:00:00.000Z",
 *   "__v": 0
 * }
 */
const getMe = async (req, res) => {
  try {
    // req.user is set in the protect middleware
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
