const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator,
} = require('../validations/projectValidation');

// All project routes require authentication
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(createProjectValidator, validate, createProject);

router
  .route('/:id')
  .get(projectIdParamValidator, validate, getProjectById)
  .put(updateProjectValidator, validate, updateProject)
  .delete(projectIdParamValidator, validate, deleteProject);

module.exports = router;
