// Simplified mock implementation for proposals routes
const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/proposals/form-fields
 * @desc    Get form field configuration
 * @access  Public
 */
router.get('/form-fields', (req, res) => {
  res.json({
    success: true,
    message: 'Form fields retrieved successfully',
    data: {
      identification: [
        { field_name: 'adminProjectID', field_label: 'Admin Assigned Project ID*', required: true }
      ],
      studentInfo: [
        { field_name: 'studentName', field_label: 'Name(s)*', required: true },
        { field_name: 'studentId', field_label: 'Student/Team ID(s)*', required: true },
        { field_name: 'sapCode', field_label: 'SAP Code*', required: true },
        { field_name: 'college', field_label: 'College Name*', required: true },
        { field_name: 'studentEmail', field_label: 'Student Email ID*', required: true },
        { field_name: 'course', field_label: 'Course/Department', required: false },
        { field_name: 'supervisor', field_label: 'Supervisor/Mentor Name', required: false },
        { field_name: 'supervisorEmail', field_label: 'Supervisor Email ID*', required: true }
      ],
      projectDetails: [
        { field_name: 'projectTitle', field_label: 'Project Title*', required: true, word_limit: 20 },
        { field_name: 'abstract', field_label: 'Abstract/Summary*', required: true, word_limit: 200 },
        { field_name: 'introduction', field_label: 'Introduction/Background*', required: true, word_limit: 500 },
        { field_name: 'objectives', field_label: 'Objectives*', required: true, word_limit: 100 },
        { field_name: 'methodology', field_label: 'Methodology*', required: true, word_limit: 500 },
        { field_name: 'timeline', field_label: 'Timeline/Schedule', required: false, word_limit: 300 },
        { field_name: 'outcomes', field_label: 'Expected Outcomes/Deliverables*', required: true, word_limit: 200 }
      ],
      references: [
        { field_name: 'references', field_label: 'References', required: false, word_limit: 300 }
      ]
    }
  });
});

/**
 * @route   POST /api/proposals
 * @desc    Submit a new proposal
 * @access  Public
 */
router.post('/', (req, res) => {
  // In a real application, this would validate and store the proposal in a database
  // For now, we'll just simulate a successful submission with a slight delay
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Proposal submitted successfully',
      projectId: req.body.adminProjectID || 'PROJ-' + Math.floor(Math.random() * 10000)
    });
  }, 1000);
});

module.exports = router;