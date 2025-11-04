const express = require('express');
const router = express.Router();
const smartRemindersService = require('../services/smartRemindersService');
const auth = require('../middleware/auth');

// Create a new reminder
router.post('/create', auth, async (req, res) => {
  try {
    const { reminderData } = req.body;
    
    if (!reminderData || !reminderData.title || !reminderData.reminderDate) {
      return res.status(400).json({
        error: 'Reminder title and date are required'
      });
    }

    console.log(`📝 Creating reminder for user ${req.user.userId}: ${reminderData.title}`);

    const result = await smartRemindersService.createReminder(reminderData, req.user.userId);

    res.json({
      success: true,
      reminder: result.reminder,
      message: result.message,
      metadata: {
        created_by: req.user.userId,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      error: 'Failed to create reminder',
      message: error.message
    });
  }
});

// Get all reminders for user
router.get('/list', auth, async (req, res) => {
  try {
    const { 
      type, 
      priority, 
      status = 'all',
      limit = 100,
      offset = 0 
    } = req.query;

    console.log(`📋 Fetching reminders for user ${req.user.userId}`);

    let reminders = smartRemindersService.getUserReminders(req.user.userId);

    // Apply filters
    if (type && type !== 'all') {
      reminders = reminders.filter(r => r.type === type);
    }

    if (priority && priority !== 'all') {
      reminders = reminders.filter(r => r.priority === priority);
    }

    if (status === 'completed') {
      reminders = reminders.filter(r => r.isCompleted);
    } else if (status === 'pending') {
      reminders = reminders.filter(r => !r.isCompleted);
    } else if (status === 'overdue') {
      const now = new Date();
      reminders = reminders.filter(r => 
        !r.isCompleted && new Date(`${r.reminderDate}T${r.reminderTime}`) < now
      );
    }

    // Apply pagination
    const total = reminders.length;
    const paginatedReminders = reminders.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      reminders: paginatedReminders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: total > parseInt(offset) + parseInt(limit)
      },
      filters_applied: { type, priority, status },
      metadata: {
        user_id: req.user.userId,
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      error: 'Failed to fetch reminders',
      message: error.message
    });
  }
});

// Get single reminder
router.get('/:reminderId', auth, async (req, res) => {
  try {
    const { reminderId } = req.params;
    
    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    // Check if user owns this reminder
    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      reminder,
      metadata: {
        accessed_by: req.user.userId,
        accessed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({
      error: 'Failed to fetch reminder',
      message: error.message
    });
  }
});

// Update reminder
router.put('/:reminderId', auth, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { updates } = req.body;

    if (!updates) {
      return res.status(400).json({
        error: 'Updates are required'
      });
    }

    console.log(`📝 Updating reminder ${reminderId} for user ${req.user.userId}`);

    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updatedReminder = smartRemindersService.updateReminder(reminderId, updates);

    res.json({
      success: true,
      reminder: updatedReminder,
      message: 'Reminder updated successfully',
      metadata: {
        updated_by: req.user.userId,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      error: 'Failed to update reminder',
      message: error.message
    });
  }
});

// Delete reminder
router.delete('/:reminderId', auth, async (req, res) => {
  try {
    const { reminderId } = req.params;

    console.log(`🗑️ Deleting reminder ${reminderId} for user ${req.user.userId}`);

    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const deleted = smartRemindersService.deleteReminder(reminderId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Reminder deleted successfully',
        metadata: {
          deleted_by: req.user.userId,
          deleted_at: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete reminder'
      });
    }

  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      error: 'Failed to delete reminder',
      message: error.message
    });
  }
});

// Toggle reminder completion
router.patch('/:reminderId/toggle', auth, async (req, res) => {
  try {
    const { reminderId } = req.params;

    console.log(`✅ Toggling completion for reminder ${reminderId}`);

    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updatedReminder = smartRemindersService.updateReminder(reminderId, {
      isCompleted: !reminder.isCompleted,
      completedAt: !reminder.isCompleted ? new Date().toISOString() : null
    });

    res.json({
      success: true,
      reminder: updatedReminder,
      message: `Reminder marked as ${updatedReminder.isCompleted ? 'completed' : 'pending'}`,
      metadata: {
        toggled_by: req.user.userId,
        toggled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({
      error: 'Failed to toggle reminder',
      message: error.message
    });
  }
});

// Generate calendar events
router.get('/calendar/events', auth, async (req, res) => {
  try {
    const { 
      start_date, 
      end_date,
      include_completed = 'false' 
    } = req.query;

    console.log(`📅 Generating calendar events for user ${req.user.userId}`);

    let reminders = smartRemindersService.getUserReminders(req.user.userId);

    // Filter by date range if provided
    if (start_date && end_date) {
      reminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminderDate);
        return reminderDate >= new Date(start_date) && reminderDate <= new Date(end_date);
      });
    }

    // Filter completed reminders if requested
    if (include_completed === 'false') {
      reminders = reminders.filter(reminder => !reminder.isCompleted);
    }

    const calendarEvents = await smartRemindersService.generateCalendarEvents(reminders);

    res.json({
      success: true,
      events: calendarEvents,
      count: calendarEvents.length,
      date_range: {
        start: start_date || 'all',
        end: end_date || 'all'
      },
      metadata: {
        user_id: req.user.userId,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating calendar events:', error);
    res.status(500).json({
      error: 'Failed to generate calendar events',
      message: error.message
    });
  }
});

// Get weather alerts
router.get('/weather/alerts', auth, async (req, res) => {
  try {
    console.log(`🌤️ Fetching weather alerts for user ${req.user.userId}`);

    const weatherAlerts = smartRemindersService.getUserWeatherAlerts(req.user.userId);

    res.json({
      success: true,
      weather_alerts: weatherAlerts,
      count: weatherAlerts.length,
      metadata: {
        user_id: req.user.userId,
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch weather alerts',
      message: error.message
    });
  }
});

// Manual weather check for destination
router.post('/weather/check', auth, async (req, res) => {
  try {
    const { destination, date } = req.body;

    if (!destination) {
      return res.status(400).json({
        error: 'Destination is required'
      });
    }

    console.log(`🌤️ Manual weather check for ${destination}`);

    // Create a mock reminder for weather checking
    const mockReminder = {
      destination,
      reminderDate: date || new Date().toISOString().split('T')[0],
      userId: req.user.userId
    };

    await smartRemindersService.checkDestinationWeather(mockReminder);

    res.json({
      success: true,
      message: `Weather check initiated for ${destination}`,
      destination,
      check_date: date || new Date().toISOString().split('T')[0],
      metadata: {
        requested_by: req.user.userId,
        requested_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking weather:', error);
    res.status(500).json({
      error: 'Failed to check weather',
      message: error.message
    });
  }
});

// Update checklist item
router.patch('/:reminderId/checklist/:itemId', auth, async (req, res) => {
  try {
    const { reminderId, itemId } = req.params;
    const { isCompleted } = req.body;

    console.log(`✅ Updating checklist item ${itemId} in reminder ${reminderId}`);

    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Update checklist item
    const updatedChecklist = reminder.checklist.map(item =>
      item.id === itemId ? { ...item, isCompleted } : item
    );

    const updatedReminder = smartRemindersService.updateReminder(reminderId, {
      checklist: updatedChecklist
    });

    res.json({
      success: true,
      reminder: updatedReminder,
      message: 'Checklist item updated successfully',
      metadata: {
        updated_by: req.user.userId,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({
      error: 'Failed to update checklist item',
      message: error.message
    });
  }
});

// Add checklist item
router.post('/:reminderId/checklist', auth, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { text, category = 'General', priority = 'medium' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Checklist item text is required'
      });
    }

    console.log(`➕ Adding checklist item to reminder ${reminderId}`);

    const reminder = smartRemindersService.reminders.get(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        error: 'Reminder not found'
      });
    }

    if (reminder.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      priority,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const updatedChecklist = [...(reminder.checklist || []), newItem];

    const updatedReminder = smartRemindersService.updateReminder(reminderId, {
      checklist: updatedChecklist
    });

    res.json({
      success: true,
      reminder: updatedReminder,
      new_item: newItem,
      message: 'Checklist item added successfully',
      metadata: {
        added_by: req.user.userId,
        added_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({
      error: 'Failed to add checklist item',
      message: error.message
    });
  }
});

// Get reminder statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    console.log(`📊 Fetching reminder statistics for user ${req.user.userId}`);

    const userReminders = smartRemindersService.getUserReminders(req.user.userId);
    const weatherAlerts = smartRemindersService.getUserWeatherAlerts(req.user.userId);

    const now = new Date();
    const stats = {
      total_reminders: userReminders.length,
      completed_reminders: userReminders.filter(r => r.isCompleted).length,
      pending_reminders: userReminders.filter(r => !r.isCompleted).length,
      overdue_reminders: userReminders.filter(r => 
        !r.isCompleted && new Date(`${r.reminderDate}T${r.reminderTime}`) < now
      ).length,
      upcoming_24h: userReminders.filter(r => {
        const reminderTime = new Date(`${r.reminderDate}T${r.reminderTime}`);
        const hours24 = 24 * 60 * 60 * 1000;
        return !r.isCompleted && reminderTime > now && reminderTime <= new Date(now.getTime() + hours24);
      }).length,
      by_priority: {
        urgent: userReminders.filter(r => r.priority === 'urgent').length,
        high: userReminders.filter(r => r.priority === 'high').length,
        medium: userReminders.filter(r => r.priority === 'medium').length,
        low: userReminders.filter(r => r.priority === 'low').length
      },
      by_type: {
        pre_trip: userReminders.filter(r => r.type === 'pre_trip').length,
        during_trip: userReminders.filter(r => r.type === 'during_trip').length,
        post_trip: userReminders.filter(r => r.type === 'post_trip').length,
        weather: userReminders.filter(r => r.type === 'weather').length,
        document: userReminders.filter(r => r.type === 'document').length,
        health: userReminders.filter(r => r.type === 'health').length,
        booking: userReminders.filter(r => r.type === 'booking').length
      },
      weather_alerts: weatherAlerts.length,
      completion_rate: userReminders.length > 0 
        ? Math.round((userReminders.filter(r => r.isCompleted).length / userReminders.length) * 100)
        : 0
    };

    res.json({
      success: true,
      statistics: stats,
      metadata: {
        user_id: req.user.userId,
        calculated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching reminder statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch reminder statistics',
      message: error.message
    });
  }
});

// Service health check
router.get('/health', async (req, res) => {
  try {
    const serviceStats = smartRemindersService.getServiceStats();
    
    res.json({
      success: true,
      service: 'Smart Reminders Service',
      status: 'healthy',
      features: [
        'AI-Enhanced Reminders',
        'Multi-Channel Notifications',
        'Smart Checklists',
        'Weather Alerts',
        'Calendar Integration',
        'Recurring Reminders'
      ],
      service_stats: serviceStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Smart Reminders Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;