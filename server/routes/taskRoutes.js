const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createTaskValidator,
  updateTaskValidator,
  taskIdParamValidator,
} = require('../validations/taskValidation');

// All task routes require authentication
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(createTaskValidator, validate, createTask);

router
  .route('/:id')
  .get(taskIdParamValidator, validate, getTaskById)
  .put(updateTaskValidator, validate, updateTask)
  .delete(taskIdParamValidator, validate, deleteTask);

module.exports = router;
