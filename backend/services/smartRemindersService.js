const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

class SmartRemindersService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Email transporter setup
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // In-memory storage for scheduled jobs
    this.scheduledJobs = new Map();
    this.reminders = new Map();
    this.weatherAlerts = new Map();

    // Initialize weather monitoring
    this.initializeWeatherMonitoring();
  }

  // Create intelligent reminder with AI optimization
  async createReminder(reminderData, userId) {
    try {
      console.log(`📝 Creating intelligent reminder for user ${userId}`);

      // Enhance reminder with AI insights
      const enhancedReminder = await this.enhanceReminderWithAI(reminderData);

      // Generate reminder ID
      const reminderId = `${userId}_${Date.now()}`;
      
      // Store reminder
      this.reminders.set(reminderId, {
        ...enhancedReminder,
        id: reminderId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Schedule reminder notifications
      await this.scheduleReminderNotifications(reminderId);

      // Generate smart checklist if needed
      if (enhancedReminder.type === 'pre_trip' || enhancedReminder.type === 'document') {
        enhancedReminder.checklist = await this.generateSmartChecklist(enhancedReminder);
      }

      return {
        success: true,
        reminder: this.reminders.get(reminderId),
        message: 'Reminder created successfully with AI enhancements'
      };

    } catch (error) {
      console.error('Error creating reminder:', error);
      throw new Error('Failed to create reminder: ' + error.message);
    }
  }

  // Enhance reminder with AI insights
  async enhanceReminderWithAI(reminderData) {
    const enhancementPrompt = `
    Analyze this travel reminder and provide intelligent enhancements:

    Reminder: ${JSON.stringify(reminderData, null, 2)}

    Please enhance the reminder with:
    1. Optimal timing suggestions
    2. Additional preparation tasks
    3. Weather considerations
    4. Cultural or local insights
    5. Priority adjustments based on destination and type

    Return enhanced data in this JSON format:
    {
      "optimizedTime": "HH:MM format for best reminder time",
      "additionalTasks": ["task1", "task2", "task3"],
      "weatherConsiderations": "weather-specific advice",
      "culturalInsights": "local customs or important info",
      "suggestedPriority": "low|medium|high|urgent",
      "estimatedDuration": "time needed to complete this task",
      "dependencies": ["other tasks this depends on"],
      "tips": ["helpful tips for this reminder"]
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: enhancementPrompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const enhancements = JSON.parse(response.choices[0].message.content);
      
      return {
        ...reminderData,
        aiEnhancements: enhancements,
        optimizedTime: enhancements.optimizedTime || reminderData.reminderTime,
        priority: enhancements.suggestedPriority || reminderData.priority,
        estimatedDuration: enhancements.estimatedDuration,
        tips: enhancements.tips || []
      };

    } catch (error) {
      console.error('Error enhancing reminder with AI:', error);
      return reminderData; // Return original if AI enhancement fails
    }
  }

  // Generate smart checklist using AI
  async generateSmartChecklist(reminderData) {
    const checklistPrompt = `
    Generate a comprehensive, intelligent checklist for this travel reminder:

    Reminder Type: ${reminderData.type}
    Destination: ${reminderData.destination || 'General'}
    Title: ${reminderData.title}
    Description: ${reminderData.description}
    Priority: ${reminderData.priority}

    Create a detailed checklist with categories. Return JSON format:
    {
      "checklist": [
        {
          "text": "specific actionable task",
          "category": "Documents|Packing|Health|Booking|Preparation",
          "priority": "low|medium|high|urgent",
          "estimatedTime": "time to complete",
          "tips": "helpful tip for this task",
          "deadline": "relative to travel date (e.g., '2 weeks before')"
        }
      ]
    }

    Focus on practical, actionable items that are specific to the reminder type and destination.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: checklistPrompt }],
        temperature: 0.6,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Add IDs to checklist items
      return result.checklist.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        text: item.text,
        category: item.category,
        priority: item.priority,
        isCompleted: false,
        estimatedTime: item.estimatedTime,
        tips: item.tips,
        deadline: item.deadline
      }));

    } catch (error) {
      console.error('Error generating smart checklist:', error);
      return [];
    }
  }

  // Schedule reminder notifications
  async scheduleReminderNotifications(reminderId) {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) return;

    const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
    
    // Schedule main notification
    const mainJob = schedule.scheduleJob(reminderDateTime, () => {
      this.sendNotification(reminder);
    });

    // Schedule pre-notifications based on priority
    const preNotificationTimes = this.getPreNotificationTimes(reminder.priority);
    const preJobs = preNotificationTimes.map(offsetMinutes => {
      const preTime = new Date(reminderDateTime.getTime() - offsetMinutes * 60000);
      if (preTime > new Date()) {
        return schedule.scheduleJob(preTime, () => {
          this.sendPreNotification(reminder, offsetMinutes);
        });
      }
      return null;
    }).filter(job => job !== null);

    // Store scheduled jobs
    this.scheduledJobs.set(reminderId, {
      mainJob,
      preJobs,
      reminder
    });

    console.log(`📅 Scheduled ${preJobs.length + 1} notifications for reminder: ${reminder.title}`);
  }

  // Get pre-notification times based on priority
  getPreNotificationTimes(priority) {
    switch (priority) {
      case 'urgent':
        return [5, 15, 60, 240]; // 5min, 15min, 1hour, 4hours before
      case 'high':
        return [15, 60, 1440]; // 15min, 1hour, 1day before
      case 'medium':
        return [60, 1440]; // 1hour, 1day before
      case 'low':
        return [1440]; // 1day before
      default:
        return [60];
    }
  }

  // Send notification through multiple channels
  async sendNotification(reminder) {
    try {
      console.log(`🔔 Sending notification for: ${reminder.title}`);

      const notificationData = {
        title: reminder.title,
        body: reminder.description,
        data: {
          reminderId: reminder.id,
          type: reminder.type,
          priority: reminder.priority,
          destination: reminder.destination
        }
      };

      // Send through enabled notification methods
      const promises = reminder.notificationMethods.map(method => {
        switch (method) {
          case 'push':
            return this.sendPushNotification(notificationData, reminder.userId);
          case 'email':
            return this.sendEmailNotification(reminder);
          case 'sms':
            return this.sendSMSNotification(reminder);
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);

      // Update reminder status
      reminder.lastNotificationSent = new Date().toISOString();
      this.reminders.set(reminder.id, reminder);

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send pre-notification
  async sendPreNotification(reminder, minutesBefore) {
    const timeUntil = this.formatTimeUntil(minutesBefore);
    
    const preNotificationData = {
      title: `Upcoming: ${reminder.title}`,
      body: `Reminder in ${timeUntil}: ${reminder.description}`,
      data: {
        reminderId: reminder.id,
        type: 'pre_notification',
        minutesBefore
      }
    };

    await this.sendPushNotification(preNotificationData, reminder.userId);
  }

  // Send push notification
  async sendPushNotification(notificationData, userId) {
    try {
      // In a real implementation, this would use a service like Firebase Cloud Messaging
      console.log(`📱 Push notification sent to user ${userId}:`, notificationData.title);
      
      return {
        success: true,
        method: 'push',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, method: 'push', error: error.message };
    }
  }

  // Send email notification
  async sendEmailNotification(reminder) {
    try {
      // Generate email content with AI
      const emailContent = await this.generateEmailContent(reminder);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'travel@wanderlust.com',
        to: reminder.userEmail, // This would come from user data
        subject: `Travel Reminder: ${reminder.title}`,
        html: emailContent
      };

      await this.emailTransporter.sendMail(mailOptions);
      
      console.log(`📧 Email notification sent for: ${reminder.title}`);
      
      return {
        success: true,
        method: 'email',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, method: 'email', error: error.message };
    }
  }

  // Generate email content with AI
  async generateEmailContent(reminder) {
    const emailPrompt = `
    Generate a professional, helpful email for this travel reminder:

    Reminder: ${JSON.stringify(reminder, null, 2)}

    Create an HTML email that includes:
    1. Friendly greeting
    2. Clear reminder details
    3. Helpful tips and suggestions
    4. Checklist if applicable
    5. Professional closing

    Make it visually appealing and actionable.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: emailPrompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('Error generating email content:', error);
      
      // Fallback email template
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Travel Reminder: ${reminder.title}</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder about your upcoming travel task:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${reminder.title}</h3>
            <p>${reminder.description}</p>
            ${reminder.destination ? `<p><strong>Destination:</strong> ${reminder.destination}</p>` : ''}
            <p><strong>Priority:</strong> ${reminder.priority.toUpperCase()}</p>
          </div>
          ${reminder.tips && reminder.tips.length > 0 ? `
            <h3>Tips:</h3>
            <ul>
              ${reminder.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          ` : ''}
          <p>Safe travels!</p>
          <p>The Wanderlust Team</p>
        </div>
      `;
    }
  }

  // Send SMS notification (placeholder)
  async sendSMSNotification(reminder) {
    try {
      // In a real implementation, this would use a service like Twilio
      console.log(`📱 SMS notification sent for: ${reminder.title}`);
      
      return {
        success: true,
        method: 'sms',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, method: 'sms', error: error.message };
    }
  }

  // Weather monitoring and alerts
  initializeWeatherMonitoring() {
    // Check weather every 6 hours
    schedule.scheduleJob('0 */6 * * *', () => {
      this.checkWeatherAlerts();
    });

    console.log('🌤️ Weather monitoring initialized');
  }

  async checkWeatherAlerts() {
    try {
      console.log('🌤️ Checking weather alerts for upcoming trips...');

      // Get all upcoming reminders with destinations
      const upcomingReminders = Array.from(this.reminders.values())
        .filter(reminder => {
          const reminderDate = new Date(reminder.reminderDate);
          const now = new Date();
          const daysDiff = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff >= 0 && daysDiff <= 7 && reminder.destination;
        });

      // Check weather for each destination
      for (const reminder of upcomingReminders) {
        await this.checkDestinationWeather(reminder);
      }

    } catch (error) {
      console.error('Error checking weather alerts:', error);
    }
  }

  async checkDestinationWeather(reminder) {
    try {
      // In a real implementation, this would call a weather API
      // For now, we'll generate mock weather alerts
      
      const weatherConditions = ['clear', 'rain', 'snow', 'storm', 'extreme_heat', 'extreme_cold'];
      const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      
      if (randomCondition !== 'clear') {
        const weatherAlert = {
          id: `weather_${Date.now()}`,
          destination: reminder.destination,
          condition: randomCondition,
          severity: this.getWeatherSeverity(randomCondition),
          message: this.getWeatherMessage(randomCondition, reminder.destination),
          date: reminder.reminderDate,
          createdAt: new Date().toISOString()
        };

        this.weatherAlerts.set(weatherAlert.id, weatherAlert);
        
        // Send weather alert notification
        await this.sendWeatherAlert(weatherAlert, reminder.userId);
      }

    } catch (error) {
      console.error('Error checking destination weather:', error);
    }
  }

  getWeatherSeverity(condition) {
    const severityMap = {
      'rain': 'warning',
      'snow': 'warning',
      'storm': 'severe',
      'extreme_heat': 'severe',
      'extreme_cold': 'severe',
      'clear': 'info'
    };
    return severityMap[condition] || 'info';
  }

  getWeatherMessage(condition, destination) {
    const messages = {
      'rain': `Heavy rainfall expected in ${destination}. Pack waterproof clothing and umbrella.`,
      'snow': `Snow forecast for ${destination}. Bring warm clothing and check for travel delays.`,
      'storm': `Severe weather warning for ${destination}. Monitor conditions and consider travel adjustments.`,
      'extreme_heat': `High temperatures expected in ${destination}. Stay hydrated and plan indoor activities.`,
      'extreme_cold': `Extreme cold warning for ${destination}. Pack heavy winter gear and check for service disruptions.`
    };
    return messages[condition] || `Weather update for ${destination}`;
  }

  async sendWeatherAlert(weatherAlert, userId) {
    const alertNotification = {
      title: `Weather Alert: ${weatherAlert.destination}`,
      body: weatherAlert.message,
      data: {
        type: 'weather_alert',
        severity: weatherAlert.severity,
        condition: weatherAlert.condition
      }
    };

    await this.sendPushNotification(alertNotification, userId);
  }

  // Calendar integration helpers
  async generateCalendarEvents(reminders) {
    const events = reminders.map(reminder => ({
      id: `reminder_${reminder.id}`,
      title: reminder.title,
      start: `${reminder.reminderDate}T${reminder.reminderTime}`,
      end: `${reminder.reminderDate}T${this.addMinutes(reminder.reminderTime, 30)}`,
      description: reminder.description,
      location: reminder.destination,
      type: 'reminder',
      priority: reminder.priority
    }));

    return events;
  }

  // Utility functions
  formatTimeUntil(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  addMinutes(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  // Get reminders for user
  getUserReminders(userId) {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.userId === userId)
      .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }

  // Get weather alerts for user
  getUserWeatherAlerts(userId) {
    // This would typically filter by user's upcoming trips
    return Array.from(this.weatherAlerts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Update reminder
  updateReminder(reminderId, updates) {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) return null;

    const updatedReminder = {
      ...reminder,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.reminders.set(reminderId, updatedReminder);

    // Reschedule notifications if timing changed
    if (updates.reminderDate || updates.reminderTime) {
      this.cancelScheduledJobs(reminderId);
      this.scheduleReminderNotifications(reminderId);
    }

    return updatedReminder;
  }

  // Cancel scheduled jobs
  cancelScheduledJobs(reminderId) {
    const jobs = this.scheduledJobs.get(reminderId);
    if (jobs) {
      jobs.mainJob?.cancel();
      jobs.preJobs?.forEach(job => job?.cancel());
      this.scheduledJobs.delete(reminderId);
    }
  }

  // Delete reminder
  deleteReminder(reminderId) {
    this.cancelScheduledJobs(reminderId);
    return this.reminders.delete(reminderId);
  }

  // Get service statistics
  getServiceStats() {
    return {
      total_reminders: this.reminders.size,
      scheduled_jobs: this.scheduledJobs.size,
      weather_alerts: this.weatherAlerts.size,
      active_notifications: Array.from(this.reminders.values())
        .filter(r => new Date(r.reminderDate) > new Date()).length
    };
  }
}

module.exports = new SmartRemindersService();