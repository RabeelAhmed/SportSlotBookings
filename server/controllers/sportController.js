import Sport from '../models/Sport.js';

// @desc    Get all active sports
// @route   GET /api/sports
// @access  Public
export const getAllSports = async (req, res) => {
  try {
    const sports = await Sport.find({ isActive: true });
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single sport
// @route   GET /api/sports/:id
// @access  Public
export const getSportById = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (sport) {
      res.json(sport);
    } else {
      res.status(404).json({ message: 'Sport not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a sport
// @route   POST /api/sports
// @access  Private/Admin
export const createSport = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;
    const sport = new Sport({
      name,
      description,
      image,
      isActive: isActive !== undefined ? isActive : true
    });
    const createdSport = await sport.save();
    res.status(201).json(createdSport);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle sport active status
// @route   PUT /api/sports/:id/toggle
// @access  Private/Admin
export const toggleSport = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (sport) {
      sport.isActive = !sport.isActive;
      const updatedSport = await sport.save();
      res.json(updatedSport);
    } else {
      res.status(404).json({ message: 'Sport not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
