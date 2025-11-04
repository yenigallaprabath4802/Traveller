const express = require('express');
const router = express.Router();
const aiItineraryService = require('../services/aiItineraryService');
const mongoose = require('mongoose');

// Itinerary Schema
const ItinerarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  destination: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  travelers: {
    type: Number,
    default: 1
  },
  travelStyle: {
    type: String,
    enum: ['budget', 'mid-range', 'luxury', 'adventure', 'cultural', 'relaxation'],
    default: 'mid-range'
  },
  interests: [{
    type: String
  }],
  season: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter'],
    default: 'summer'
  },
  itineraryData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'active', 'completed'],
    default: 'draft'
  },
  isAIGenerated: {
    type: Boolean,
    default: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const Itinerary = mongoose.model('Itinerary', ItinerarySchema);

// Generate new AI itinerary
router.post('/generate', async (req, res) => {
  try {
    const {
      destination,
      duration,
      budget,
      travelers = 1,
      travelStyle = 'mid-range',
      interests = [],
      season = 'summer',
      userId
    } = req.body;

    // Validate required fields
    if (!destination || !duration || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Destination, duration, and budget are required'
      });
    }

    // Generate AI itinerary
    const aiResult = await aiItineraryService.generateItinerary({
      destination,
      duration,
      budget,
      travelers,
      travelStyle,
      interests,
      season
    });

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: aiResult.message || 'Failed to generate itinerary'
      });
    }

    // Save to database
    const newItinerary = new Itinerary({
      userId: userId || '507f1f77bcf86cd799439011', // Default user ID for testing
      destination,
      duration,
      budget,
      travelers,
      travelStyle,
      interests,
      season,
      itineraryData: aiResult.itinerary,
      isAIGenerated: true
    });

    const savedItinerary = await newItinerary.save();

    res.json({
      success: true,
      message: 'Itinerary generated successfully',
      itinerary: savedItinerary,
      aiGenerated: true
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Regenerate/modify existing itinerary
router.put('/regenerate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { modifications, userId } = req.body;

    const existingItinerary = await Itinerary.findById(id);
    if (!existingItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Regenerate with modifications
    const aiResult = await aiItineraryService.regenerateItinerary(
      existingItinerary.itineraryData,
      modifications
    );

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate itinerary'
      });
    }

    // Update existing itinerary
    existingItinerary.itineraryData = aiResult.itinerary;
    existingItinerary.lastModified = new Date();
    
    const updatedItinerary = await existingItinerary.save();

    res.json({
      success: true,
      message: 'Itinerary updated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('Error regenerating itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's itineraries
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const itineraries = await Itinerary.find(query)
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Itinerary.countDocuments(query);

    res.json({
      success: true,
      itineraries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific itinerary
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    res.json({
      success: true,
      itinerary
    });

  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update itinerary status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'finalized', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const itinerary = await Itinerary.findByIdAndUpdate(
      id,
      { status, lastModified: new Date() },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      itinerary
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete itinerary
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItinerary = await Itinerary.findByIdAndDelete(id);
    if (!deletedItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get AI suggestions for destinations
router.post('/suggest-destinations', async (req, res) => {
  try {
    const { budget, interests, travelStyle, season, duration } = req.body;

    // This would integrate with AI service for destination suggestions
    // For now, returning mock suggestions
    const suggestions = [
      {
        destination: 'Bali, Indonesia',
        estimatedCost: budget * 0.8,
        highlights: ['Beaches', 'Culture', 'Food'],
        bestTime: 'April-October',
        reason: 'Perfect for your budget and interests in culture and relaxation'
      },
      {
        destination: 'Prague, Czech Republic',
        estimatedCost: budget * 0.6,
        highlights: ['Architecture', 'History', 'Nightlife'],
        bestTime: 'May-September',
        reason: 'Budget-friendly with rich cultural experiences'
      },
      {
        destination: 'Costa Rica',
        estimatedCost: budget * 0.9,
        highlights: ['Adventure', 'Nature', 'Wildlife'],
        bestTime: 'December-April',
        reason: 'Great for adventure travel and nature experiences'
      }
    ];

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error getting destination suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;