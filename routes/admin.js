const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private
 */
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard data retrieved',
    stats: {
      totalProposals: 124,
      pendingReview: 12,
      approved: 105,
      rejected: 7
    }
  });
});

/**
 * @route   GET /api/admin/proposals
 * @desc    Get all proposals for admin
 * @access  Private
 */
router.get('/proposals', (req, res) => {
  const mockProposals = [
    {
      id: 'PROJ-2025',
      title: 'Machine Learning for Climate Prediction',
      student: 'Jane Smith',
      college: 'College of Engineering',
      submittedOn: '2025-04-10',
      status: 'approved'
    },
    {
      id: 'PROJ-2026',
      title: 'Renewable Energy Integration Systems',
      student: 'David Johnson',
      college: 'College of Science',
      submittedOn: '2025-04-12',
      status: 'pending'
    },
    {
      id: 'PROJ-2027',
      title: 'Healthcare App for Remote Areas',
      student: 'Sarah Williams',
      college: 'College of Health Sciences',
      submittedOn: '2025-04-13',
      status: 'pending'
    }
  ];
  
  res.json({
    success: true,
    message: 'Proposals retrieved successfully',
    data: mockProposals
  });
});

module.exports = router;