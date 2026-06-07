import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return both formats: message (first error) + errors array for debugging
    const firstError = errors.array()[0];
    return res.status(400).json({
      message: firstError.msg,
      errors: errors.array()
    });
  }
  next();
};

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .escape(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const createBookingValidator = [
  body('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isMongoId()
    .withMessage('Invalid Sport ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('startTime')
    .toInt()
    .isInt({ min: 0, max: 24 })
    .withMessage('Start time must be an integer between 0 and 24'),
  body('endTime')
    .toInt()
    .isInt({ min: 1, max: 25 })
    .withMessage('End time must be an integer between 1 and 25'),
  body('paymentMethod')
    .optional()
    .isIn(['jazzcash', 'easypaisa', 'stripe_card', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

export const blockSlotValidator = [
  body('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isMongoId()
    .withMessage('Invalid Sport ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('startTime')
    .isInt({ min: 0, max: 24 })
    .withMessage('Start time must be an integer between 0 and 24'),
  body('endTime')
    .isInt({ min: 1, max: 25 })
    .withMessage('End time must be an integer between 1 and 25'),
  handleValidationErrors
];

export const createSportValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Sport name is required')
    .escape(),
  body('description')
    .optional()
    .trim()
    .escape(),
  body('image')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
];
