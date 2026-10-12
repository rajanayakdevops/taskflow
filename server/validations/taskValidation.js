const { body, param, query } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed'])
    .withMessage('Status must be todo, in_progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO8601 date'),
  body('project')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Project must be a valid MongoDB ID'),
];

const updateTaskValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed'])
    .withMessage('Status must be todo, in_progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (isNaN(Date.parse(val))) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),
  body('project')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (!/^[0-9a-fA-F]{24}$/.test(val)) {
        throw new Error('Project must be a valid MongoDB ID');
      }
      return true;
    }),
];

const taskIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskIdParamValidator,
};
