const { OpenAI } = require('openai');
const mongoose = require('mongoose');

class SocialTravelService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize schemas
    this.initializeSchemas();
    
    // Cache for recommendations and trending data
    this.recommendationsCache = new Map();
    this.trendingCache = new Map();
    this.socialGraphCache = new Map();
  }

  initializeSchemas() {
    // User Profile Schema
    const userProfileSchema = new mongoose.Schema({
      userId: { type: String, required: true, unique: true },
      username: { type: String, required: true, unique: true },
      fullName: String,
      bio: String,
      avatar: String,
      location: {
        city: String,
        country: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      stats: {
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        posts: { type: Number, default: 0 },
        travelScore: { type: Number, default: 0 },
        visitedCountries: { type: Number, default: 0 }
      },
      preferences: {
        travelStyle: [String], // adventure, luxury, budget, cultural
        interests: [String],
        languages: [String]
      },
      badges: [String],
      isVerified: { type: Boolean, default: false },
      privacy: {
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        postVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' }
      },
      createdAt: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now }
    });

    // Travel Post Schema
    const travelPostSchema = new mongoose.Schema({
      userId: { type: String, required: true },
      destination: {
        name: { type: String, required: true },
        country: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      content: { type: String, required: true },
      media: {
        images: [String],
        videos: [String]
      },
      details: {
        duration: String,
        budget: Number,
        travelType: { 
          type: String, 
          enum: ['solo', 'couple', 'family', 'group', 'business'],
          default: 'solo'
        },
        rating: { type: Number, min: 1, max: 5 },
        season: String,
        accommodation: String,
        transportation: String
      },
      tags: [String],
      engagement: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        bookmarks: { type: Number, default: 0 },
        views: { type: Number, default: 0 }
      },
      privacy: { 
        type: String, 
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      status: {
        type: String,
        enum: ['active', 'archived', 'reported', 'hidden'],
        default: 'active'
      },
      aiEnhanced: {
        sentiment: String, // positive, neutral, negative
        topics: [String],
        readabilityScore: Number,
        engagementPrediction: Number
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Social Connection Schema
    const socialConnectionSchema = new mongoose.Schema({
      followerId: { type: String, required: true },
      followingId: { type: String, required: true },
      connectionType: {
        type: String,
        enum: ['follow', 'friend', 'block', 'mute'],
        default: 'follow'
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'accepted'
      },
      createdAt: { type: Date, default: Date.now }
    });

    // Travel Group Schema
    const travelGroupSchema = new mongoose.Schema({
      name: { type: String, required: true },
      description: String,
      category: String,
      cover: String,
      adminId: { type: String, required: true },
      members: [{
        userId: String,
        role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
      }],
      stats: {
        memberCount: { type: Number, default: 1 },
        postCount: { type: Number, default: 0 }
      },
      settings: {
        privacy: { type: String, enum: ['public', 'private'], default: 'public' },
        postApproval: { type: Boolean, default: false },
        memberApproval: { type: Boolean, default: false }
      },
      tags: [String],
      location: String,
      createdAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now }
    });

    // Comment Schema
    const commentSchema = new mongoose.Schema({
      postId: { type: String, required: true },
      userId: { type: String, required: true },
      content: { type: String, required: true },
      parentCommentId: String, // for replies
      likes: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['active', 'hidden', 'reported'],
        default: 'active'
      },
      aiModeration: {
        score: Number,
        flags: [String]
      },
      createdAt: { type: Date, default: Date.now }
    });

    // Group Trip Schema
    const groupTripSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: String,
      destination: {
        name: { type: String, required: true },
        country: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      dates: {
        startDate: Date,
        endDate: Date,
        flexible: { type: Boolean, default: false }
      },
      budget: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'USD' },
        shared: { type: Boolean, default: false }
      },
      capacity: {
        min: { type: Number, default: 2 },
        max: { type: Number, default: 10 },
        current: { type: Number, default: 1 }
      },
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
        role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
        joinedAt: Date,
        preferences: {
          activities: [String],
          budget: Number,
          accommodation: String
        }
      }],
      itinerary: [{
        day: Number,
        activities: [String],
        estimatedCost: Number,
        notes: String
      }],
      preferences: {
        accommodation: [String],
        activities: [String],
        transportation: [String],
        dietary: [String]
      },
      status: {
        type: String,
        enum: ['planning', 'confirmed', 'active', 'completed', 'cancelled'],
        default: 'planning'
      },
      visibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'friends'
      },
      tags: [String],
      aiSuggestions: [{
        type: String,
        content: String,
        confidence: Number,
        createdAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Try to get existing models or create new ones safely
    this.UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
    this.TravelPost = mongoose.models.TravelPost || mongoose.model('TravelPost', travelPostSchema);
    this.SocialConnection = mongoose.models.SocialConnection || mongoose.model('SocialConnection', socialConnectionSchema);
    this.TravelGroup = mongoose.models.TravelGroup || mongoose.model('TravelGroup', travelGroupSchema);
    this.Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
    this.GroupTrip = mongoose.models.GroupTrip || mongoose.model('GroupTrip', groupTripSchema);
  }

  // User Management
  async createUserProfile(userData) {
    try {
      console.log('🆕 Creating user profile:', userData.username);

      const profile = new this.UserProfile({
        userId: userData.userId,
        username: userData.username,
        fullName: userData.fullName || userData.username,
        bio: userData.bio || 'Travel enthusiast exploring the world! ✈️',
        avatar: userData.avatar || `https://i.pravatar.cc/150?u=${userData.userId}`,
        location: userData.location || {},
        preferences: userData.preferences || {
          travelStyle: ['adventure'],
          interests: ['culture', 'food'],
          languages: ['English']
        }
      });

      await profile.save();

      // Generate initial travel score based on AI
      await this.calculateTravelScore(userData.userId);

      return profile;

    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile: ' + error.message);
    }
  }

  async getUserProfile(userId) {
    try {
      const profile = await this.UserProfile.findOne({ userId });
      if (!profile) {
        // Create default profile if not exists
        return await this.createUserProfile({
          userId,
          username: `user_${userId.slice(-6)}`
        });
      }
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile: ' + error.message);
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      console.log('🔄 Updating user profile:', userId);

      const profile = await this.UserProfile.findOneAndUpdate(
        { userId },
        { 
          ...updates,
          lastActive: new Date()
        },
        { new: true, upsert: true }
      );

      return profile;

    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile: ' + error.message);
    }
  }

  // Travel Posts
  async createTravelPost(userId, postData) {
    try {
      console.log('📝 Creating travel post for user:', userId);

      // AI content enhancement
      const aiEnhancements = await this.enhancePostContent(postData.content, postData.destination);

      const post = new this.TravelPost({
        userId,
        destination: {
          name: postData.destination,
          country: postData.country || '',
          city: postData.city || '',
          coordinates: postData.coordinates || {}
        },
        content: postData.content,
        media: {
          images: postData.images || [],
          videos: postData.videos || []
        },
        details: {
          duration: postData.duration,
          budget: postData.budget,
          travelType: postData.travelType || 'solo',
          rating: postData.rating || 5,
          season: postData.season,
          accommodation: postData.accommodation,
          transportation: postData.transportation
        },
        tags: postData.tags || [],
        privacy: postData.privacy || 'public',
        aiEnhanced: aiEnhancements
      });

      await post.save();

      // Update user stats
      await this.UserProfile.findOneAndUpdate(
        { userId },
        { 
          $inc: { 'stats.posts': 1 },
          lastActive: new Date()
        }
      );

      // Update travel score
      await this.calculateTravelScore(userId);

      return post;

    } catch (error) {
      console.error('Error creating travel post:', error);
      throw new Error('Failed to create travel post: ' + error.message);
    }
  }

  async enhancePostContent(content, destination) {
    try {
      const enhancementPrompt = `
      Analyze this travel post content and provide insights:

      Content: "${content}"
      Destination: "${destination}"

      Please provide:
      1. Sentiment analysis (positive/neutral/negative)
      2. Key topics/themes (max 5)
      3. Readability score (1-10)
      4. Engagement prediction (1-10)

      Return JSON format:
      {
        "sentiment": "positive",
        "topics": ["adventure", "culture"],
        "readabilityScore": 8,
        "engagementPrediction": 7
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: enhancementPrompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const enhancement = JSON.parse(response.choices[0].message.content);
      return enhancement;

    } catch (error) {
      console.error('Error enhancing post content:', error);
      return {
        sentiment: 'positive',
        topics: ['travel'],
        readabilityScore: 7,
        engagementPrediction: 6
      };
    }
  }

  async getFeedPosts(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        filter = 'all', // all, following, trending
        sortBy = 'recent' // recent, popular, trending
      } = options;

      console.log(`📰 Getting feed posts for user: ${userId}, filter: ${filter}`);

      let query = { status: 'active' };
      let sort = {};

      // Apply filters
      if (filter === 'following') {
        const following = await this.getUserFollowing(userId);
        query.userId = { $in: following.map(f => f.followingId) };
      } else if (filter === 'trending') {
        // Get trending posts based on engagement
        query['engagement.likes'] = { $gte: 10 };
        query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Last 7 days
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          sort = { 'engagement.likes': -1, 'engagement.comments': -1 };
          break;
        case 'trending':
          sort = { 
            'engagement.likes': -1, 
            'engagement.views': -1,
            createdAt: -1 
          };
          break;
        default:
          sort = { createdAt: -1 };
      }

      const posts = await this.TravelPost.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Enhance posts with user data and engagement info
      const enhancedPosts = await Promise.all(
        posts.map(async (post) => {
          const userProfile = await this.UserProfile.findOne({ userId: post.userId }).lean();
          const isLiked = await this.checkUserLiked(userId, post._id);
          const isBookmarked = await this.checkUserBookmarked(userId, post._id);

          return {
            ...post,
            user: userProfile,
            isLiked,
            isBookmarked
          };
        })
      );

      return enhancedPosts;

    } catch (error) {
      console.error('Error getting feed posts:', error);
      throw new Error('Failed to get feed posts: ' + error.message);
    }
  }

  async searchPosts(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {}
      } = options;

      console.log(`🔍 Searching posts with query: "${query}"`);

      let searchQuery = {
        status: 'active',
        $or: [
          { 'destination.name': { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      // Apply additional filters
      if (filters.travelType) {
        searchQuery['details.travelType'] = filters.travelType;
      }
      if (filters.minRating) {
        searchQuery['details.rating'] = { $gte: filters.minRating };
      }
      if (filters.destination) {
        searchQuery['destination.country'] = { $regex: filters.destination, $options: 'i' };
      }

      const posts = await this.TravelPost.find(searchQuery)
        .sort({ 'engagement.likes': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return posts;

    } catch (error) {
      console.error('Error searching posts:', error);
      throw new Error('Failed to search posts: ' + error.message);
    }
  }

  // Social Interactions
  async likePost(userId, postId) {
    try {
      console.log(`👍 User ${userId} liking post ${postId}`);

      // Check if already liked
      const existingLike = await this.checkUserLiked(userId, postId);
      if (existingLike) {
        // Unlike
        await this.TravelPost.findByIdAndUpdate(postId, {
          $inc: { 'engagement.likes': -1 }
        });
        // Remove from user's liked posts (implement user likes tracking)
        return { liked: false, action: 'unliked' };
      } else {
        // Like
        await this.TravelPost.findByIdAndUpdate(postId, {
          $inc: { 'engagement.likes': 1 }
        });
        // Add to user's liked posts (implement user likes tracking)
        return { liked: true, action: 'liked' };
      }

    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post: ' + error.message);
    }
  }

  async addComment(userId, postId, content, parentCommentId = null) {
    try {
      console.log(`💬 User ${userId} commenting on post ${postId}`);

      // AI moderation check
      const moderationResult = await this.moderateContent(content);

      const comment = new this.Comment({
        postId,
        userId,
        content,
        parentCommentId,
        aiModeration: moderationResult
      });

      await comment.save();

      // Update post comment count
      await this.TravelPost.findByIdAndUpdate(postId, {
        $inc: { 'engagement.comments': 1 }
      });

      // If it's a reply, update parent comment
      if (parentCommentId) {
        await this.Comment.findByIdAndUpdate(parentCommentId, {
          $inc: { replies: 1 }
        });
      }

      return comment;

    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment: ' + error.message);
    }
  }

  async moderateContent(content) {
    try {
      const moderationPrompt = `
      Analyze this content for appropriateness and safety:

      Content: "${content}"

      Check for:
      1. Inappropriate language
      2. Spam or promotional content
      3. Harassment or bullying
      4. Misinformation

      Return JSON:
      {
        "score": 0.8,
        "flags": ["appropriate"],
        "action": "approve"
      }

      Score: 0-1 (0 = inappropriate, 1 = appropriate)
      Flags: array of issues found
      Action: approve, review, reject
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: moderationPrompt }],
        temperature: 0.1,
        max_tokens: 300
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Error moderating content:', error);
      return {
        score: 0.8,
        flags: ['appropriate'],
        action: 'approve'
      };
    }
  }

  // Social Connections
  async followUser(followerId, followingId) {
    try {
      console.log(`👥 User ${followerId} following ${followingId}`);

      // Check if already following
      const existingConnection = await this.SocialConnection.findOne({
        followerId,
        followingId,
        connectionType: 'follow'
      });

      if (existingConnection) {
        // Unfollow
        await this.SocialConnection.deleteOne({ _id: existingConnection._id });
        
        // Update stats
        await Promise.all([
          this.UserProfile.findOneAndUpdate(
            { userId: followerId },
            { $inc: { 'stats.following': -1 } }
          ),
          this.UserProfile.findOneAndUpdate(
            { userId: followingId },
            { $inc: { 'stats.followers': -1 } }
          )
        ]);

        return { following: false, action: 'unfollowed' };
      } else {
        // Follow
        const connection = new this.SocialConnection({
          followerId,
          followingId,
          connectionType: 'follow'
        });

        await connection.save();

        // Update stats
        await Promise.all([
          this.UserProfile.findOneAndUpdate(
            { userId: followerId },
            { $inc: { 'stats.following': 1 } }
          ),
          this.UserProfile.findOneAndUpdate(
            { userId: followingId },
            { $inc: { 'stats.followers': 1 } }
          )
        ]);

        return { following: true, action: 'followed' };
      }

    } catch (error) {
      console.error('Error following user:', error);
      throw new Error('Failed to follow user: ' + error.message);
    }
  }

  async getUserFollowing(userId) {
    try {
      return await this.SocialConnection.find({
        followerId: userId,
        connectionType: 'follow',
        status: 'accepted'
      }).lean();
    } catch (error) {
      console.error('Error getting user following:', error);
      return [];
    }
  }

  async getUserFollowers(userId) {
    try {
      return await this.SocialConnection.find({
        followingId: userId,
        connectionType: 'follow',
        status: 'accepted'
      }).lean();
    } catch (error) {
      console.error('Error getting user followers:', error);
      return [];
    }
  }

  // Advanced Group Trip Planning
  async createGroupTrip(adminId, tripData) {
    try {
      console.log('🗺️ Creating group trip:', tripData.title);


      const groupTripSchema = new mongoose.Schema({
        title: { type: String, required: true },
        description: String,
        destination: {
          name: { type: String, required: true },
          country: String,
          coordinates: {
            lat: Number,
            lng: Number
          }
        },
        dates: {
          startDate: Date,
          endDate: Date,
          flexible: { type: Boolean, default: false }
        },
        budget: {
          min: Number,
          max: Number,
          currency: { type: String, default: 'USD' },
          shared: { type: Boolean, default: false }
        },
        capacity: {
          min: { type: Number, default: 2 },
          max: { type: Number, default: 10 },
          current: { type: Number, default: 1 }
        },
        adminId: { type: String, required: true },
        participants: [{
          userId: String,
          status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
          role: { type: String, enum: ['admin', 'co-organizer', 'participant'], default: 'participant' },
          joinedAt: { type: Date, default: Date.now },
          preferences: {
            accommodation: String,
            activities: [String],
            budget: Number
          }
        }],
        itinerary: [{
          day: Number,
          date: Date,
          activities: [{
            time: String,
            title: String,
            description: String,
            location: String,
            cost: Number,
            votes: { type: Number, default: 0 },
            votedBy: [String]
          }],
          accommodation: {
            name: String,
            address: String,
            cost: Number
          },
          transportation: {
            method: String,
            cost: Number,
            details: String
          }
        }],
        planning: {
          phase: { 
            type: String, 
            enum: ['planning', 'booking', 'confirmed', 'in-progress', 'completed', 'cancelled'],
            default: 'planning'
          },
          polls: [{
            question: String,
            options: [String],
            votes: [{
              userId: String,
              option: String
            }],
            deadline: Date,
            isActive: { type: Boolean, default: true }
          }],
          discussions: [{
            userId: String,
            message: String,
            timestamp: { type: Date, default: Date.now },
            replies: [{
              userId: String,
              message: String,
              timestamp: { type: Date, default: Date.now }
            }]
          }],
          sharedExpenses: [{
            description: String,
            amount: Number,
            paidBy: String,
            splitBetween: [String],
            date: { type: Date, default: Date.now }
          }]
        },
        requirements: {
          ageRange: {
            min: Number,
            max: Number
          },
          gender: { type: String, enum: ['any', 'male', 'female', 'mixed'] },
          experience: { type: String, enum: ['any', 'beginner', 'intermediate', 'advanced'] },
          languages: [String]
        },
        tags: [String],
        privacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' },
        aiSuggestions: {
          itinerary: [String],
          activities: [String],
          accommodation: [String],
          lastUpdated: Date
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      const trip = new this.GroupTrip({
        ...tripData,
        adminId,
        participants: [{
          userId: adminId,
          status: 'confirmed',
          role: 'admin',
          joinedAt: new Date()
        }]
      });

      await trip.save();

      // Generate AI suggestions for the trip
      await this.generateTripSuggestions(trip._id, tripData);

      return trip;

    } catch (error) {
      console.error('Error creating group trip:', error);
      throw new Error('Failed to create group trip: ' + error.message);
    }
  }

  async generateTripSuggestions(tripId, tripData) {
    try {
      console.log(`🤖 Generating AI suggestions for trip: ${tripId}`);

      const suggestionPrompt = `
      Generate comprehensive travel suggestions for a group trip:

      Destination: ${tripData.destination?.name}
      Duration: ${tripData.dates?.startDate} to ${tripData.dates?.endDate}
      Budget Range: ${tripData.budget?.min} - ${tripData.budget?.max} ${tripData.budget?.currency}
      Group Size: ${tripData.capacity?.min} - ${tripData.capacity?.max} people
      Tags: ${tripData.tags?.join(', ')}

      Please provide:
      1. 5 must-see attractions/activities
      2. 3 accommodation recommendations
      3. Daily itinerary suggestions (max 7 days)
      4. Local dining recommendations
      5. Transportation tips

      Return as JSON:
      {
        "activities": ["activity1", "activity2"],
        "accommodation": ["hotel1", "hotel2"],
        "itinerary": ["day1 suggestion", "day2 suggestion"],
        "dining": ["restaurant1", "restaurant2"],
        "transportation": ["tip1", "tip2"]
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: suggestionPrompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const suggestions = JSON.parse(response.choices[0].message.content);

      // Update trip with AI suggestions
      if (!this.GroupTrip) {
        return; // Model not initialized yet
      }

      await this.GroupTrip.findByIdAndUpdate(tripId, {
        'aiSuggestions.activities': suggestions.activities,
        'aiSuggestions.accommodation': suggestions.accommodation,
        'aiSuggestions.itinerary': suggestions.itinerary,
        'aiSuggestions.lastUpdated': new Date()
      });

      return suggestions;

    } catch (error) {
      console.error('Error generating trip suggestions:', error);
      return null;
    }
  }

  async joinGroupTrip(userId, tripId, userPreferences = {}) {
    try {
      console.log(`🎒 User ${userId} joining group trip ${tripId}`);

      if (!this.GroupTrip) {
        throw new Error('Group trip model not initialized');
      }

      const trip = await this.GroupTrip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Check if already a participant
      const isParticipant = trip.participants.some(p => p.userId === userId);
      if (isParticipant) {
        return { joined: true, message: 'Already a participant' };
      }

      // Check capacity
      if (trip.capacity.current >= trip.capacity.max) {
        return { joined: false, message: 'Trip is full' };
      }

      // Check requirements
      const userProfile = await this.getUserProfile(userId);
      const meetsRequirements = await this.checkTripRequirements(userProfile, trip.requirements);
      
      if (!meetsRequirements.eligible) {
        return { 
          joined: false, 
          message: `Requirements not met: ${meetsRequirements.reasons.join(', ')}` 
        };
      }

      // Add participant
      trip.participants.push({
        userId,
        status: 'pending',
        preferences: userPreferences,
        joinedAt: new Date()
      });

      trip.capacity.current += 1;
      trip.updatedAt = new Date();

      await trip.save();

      // Notify trip admin
      await this.notifyTripAdmin(trip.adminId, tripId, userId, 'join_request');

      return { joined: true, message: 'Join request sent successfully' };

    } catch (error) {
      console.error('Error joining group trip:', error);
      throw new Error('Failed to join group trip: ' + error.message);
    }
  }

  async checkTripRequirements(userProfile, requirements) {
    const reasons = [];
    let eligible = true;

    // Age check (if user has age in profile)
    if (requirements.ageRange && userProfile.age) {
      if (userProfile.age < requirements.ageRange.min || userProfile.age > requirements.ageRange.max) {
        eligible = false;
        reasons.push(`Age must be between ${requirements.ageRange.min}-${requirements.ageRange.max}`);
      }
    }

    // Experience check
    if (requirements.experience && requirements.experience !== 'any') {
      const userScore = userProfile.stats?.travelScore || 0;
      const requiredScore = {
        beginner: 0,
        intermediate: 500,
        advanced: 1500
      };

      if (userScore < requiredScore[requirements.experience]) {
        eligible = false;
        reasons.push(`${requirements.experience} travel experience required`);
      }
    }

    // Language check
    if (requirements.languages && requirements.languages.length > 0) {
      const userLanguages = userProfile.preferences?.languages || [];
      const hasCommonLanguage = requirements.languages.some(lang => userLanguages.includes(lang));
      
      if (!hasCommonLanguage) {
        eligible = false;
        reasons.push(`Must speak: ${requirements.languages.join(' or ')}`);
      }
    }

    return { eligible, reasons };
  }

  async createTripPoll(tripId, adminId, pollData) {
    try {
      console.log(`📊 Creating poll for trip ${tripId}`);

      let GroupTrip;
      try {
        const GroupTrip = this.GroupTrip;
      } catch (error) {
        throw new Error('Group trip schema not initialized');
      }

      const trip = await GroupTrip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Check if user is admin or co-organizer
      const participant = trip.participants.find(p => p.userId === adminId);
      if (!participant || !['admin', 'co-organizer'].includes(participant.role)) {
        throw new Error('Insufficient permissions');
      }

      // Create poll
      const poll = {
        question: pollData.question,
        options: pollData.options,
        votes: [],
        deadline: pollData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        isActive: true
      };

      trip.planning.polls.push(poll);
      trip.updatedAt = new Date();

      await trip.save();

      // Notify all participants
      const participantIds = trip.participants
        .filter(p => p.status === 'confirmed' && p.userId !== adminId)
        .map(p => p.userId);

      await this.notifyParticipants(participantIds, tripId, 'new_poll', poll);

      return poll;

    } catch (error) {
      console.error('Error creating trip poll:', error);
      throw new Error('Failed to create trip poll: ' + error.message);
    }
  }

  async voteTripPoll(tripId, userId, pollIndex, option) {
    try {
      console.log(`🗳️ User ${userId} voting on poll ${pollIndex} for trip ${tripId}`);

      let GroupTrip;
      try {
        const GroupTrip = this.GroupTrip;
      } catch (error) {
        throw new Error('Group trip schema not initialized');
      }

      const trip = await GroupTrip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Check if user is a participant
      const isParticipant = trip.participants.some(p => p.userId === userId && p.status === 'confirmed');
      if (!isParticipant) {
        throw new Error('Only confirmed participants can vote');
      }

      const poll = trip.planning.polls[pollIndex];
      if (!poll || !poll.isActive) {
        throw new Error('Poll not found or inactive');
      }

      // Check if deadline passed
      if (new Date() > poll.deadline) {
        throw new Error('Poll deadline has passed');
      }

      // Remove previous vote if exists
      poll.votes = poll.votes.filter(vote => vote.userId !== userId);

      // Add new vote
      poll.votes.push({ userId, option });

      trip.updatedAt = new Date();
      await trip.save();

      return { success: true, message: 'Vote recorded successfully' };

    } catch (error) {
      console.error('Error voting on poll:', error);
      throw new Error('Failed to vote on poll: ' + error.message);
    }
  }

  async addGroupTripDiscussion(tripId, userId, message) {
    try {
      console.log(`💬 Adding discussion message to trip ${tripId}`);

      let GroupTrip;
      try {
        const GroupTrip = this.GroupTrip;
      } catch (error) {
        throw new Error('Group trip schema not initialized');
      }

      const trip = await GroupTrip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Check if user is a participant
      const isParticipant = trip.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        throw new Error('Only participants can post messages');
      }

      // AI moderation
      const moderationResult = await this.moderateContent(message);
      if (moderationResult.action === 'reject') {
        throw new Error('Message violates community guidelines');
      }

      // Add discussion message
      const discussion = {
        userId,
        message,
        timestamp: new Date(),
        replies: []
      };

      trip.planning.discussions.push(discussion);
      trip.updatedAt = new Date();

      await trip.save();

      return discussion;

    } catch (error) {
      console.error('Error adding trip discussion:', error);
      throw new Error('Failed to add discussion message: ' + error.message);
    }
  }

  async getGroupTrips(userId, options = {}) {
    try {
      const {
        filter = 'my_trips', // my_trips, available, recommended
        page = 1,
        limit = 20
      } = options;

      console.log(`🗺️ Getting group trips for user ${userId}, filter: ${filter}`);

      let GroupTrip;
      try {
        const GroupTrip = this.GroupTrip;
      } catch (error) {
        return []; // Schema not initialized
      }

      let query = {};

      if (filter === 'my_trips') {
        query['participants.userId'] = userId;
      } else if (filter === 'available') {
        query = {
          status: 'open',
          'capacity.current': { $lt: mongoose.Schema.Types.Mixed }, // This needs to be fixed
          privacy: 'public'
        };
      } else if (filter === 'recommended') {
        // Get user profile for recommendations
        const userProfile = await this.getUserProfile(userId);
        const userInterests = userProfile.preferences?.interests || [];
        
        query = {
          status: 'open',
          privacy: 'public',
          'participants.userId': { $ne: userId },
          tags: { $in: userInterests }
        };
      }

      const trips = await GroupTrip.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Enhance trips with additional info
      const enhancedTrips = await Promise.all(
        trips.map(async (trip) => {
          const adminProfile = await this.getUserProfile(trip.adminId);
          const participantProfiles = await Promise.all(
            trip.participants.slice(0, 5).map(p => this.getUserProfile(p.userId))
          );

          return {
            ...trip,
            admin: adminProfile,
            participantPreviews: participantProfiles
          };
        })
      );

      return enhancedTrips;

    } catch (error) {
      console.error('Error getting group trips:', error);
      throw new Error('Failed to get group trips: ' + error.message);
    }
  }

  async notifyTripAdmin(adminId, tripId, userId, type) {
    try {
      // This would integrate with a notification service
      console.log(`🔔 Notifying trip admin ${adminId} about ${type} from user ${userId}`);
      
      // Implementation would depend on notification service
      // Could send push notifications, emails, in-app notifications, etc.
      
      return { success: true };
    } catch (error) {
      console.error('Error notifying trip admin:', error);
      return { success: false };
    }
  }

  async notifyParticipants(participantIds, tripId, type, data) {
    try {
      console.log(`🔔 Notifying ${participantIds.length} participants about ${type}`);
      
      // Batch notification implementation
      // Would integrate with notification service
      
      return { success: true, notified: participantIds.length };
    } catch (error) {
      console.error('Error notifying participants:', error);
      return { success: false, notified: 0 };
    }
  }

  // Advanced Travel Matching & Recommendations
  async getUserRecommendations(userId, type = 'posts') {
    try {
      console.log(`🎯 Getting ${type} recommendations for user: ${userId}`);

      const cacheKey = `${userId}_${type}_recommendations`;
      if (this.recommendationsCache.has(cacheKey)) {
        return this.recommendationsCache.get(cacheKey);
      }

      const userProfile = await this.getUserProfile(userId);
      const userPosts = await this.TravelPost.find({ userId }).lean();

      let recommendations = [];

      if (type === 'posts') {
        recommendations = await this.getPostRecommendations(userProfile, userPosts);
      } else if (type === 'users') {
        recommendations = await this.getUserSuggestions(userProfile, userPosts);
      } else if (type === 'destinations') {
        recommendations = await this.getDestinationRecommendations(userProfile, userPosts);
      } else if (type === 'travel_companions') {
        recommendations = await this.findTravelCompanions(userProfile, userPosts);
      } else if (type === 'groups') {
        recommendations = await this.getGroupRecommendations(userProfile);
      }

      // Cache for 30 minutes
      this.recommendationsCache.set(cacheKey, recommendations);
      setTimeout(() => {
        this.recommendationsCache.delete(cacheKey);
      }, 30 * 60 * 1000);

      return recommendations;

    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations: ' + error.message);
    }
  }

  async findTravelCompanions(userProfile, userPosts) {
    try {
      console.log(`🤝 Finding travel companions for user: ${userProfile.userId}`);

      // Advanced matching algorithm based on:
      // 1. Travel style compatibility
      // 2. Destination interests
      // 3. Travel dates/seasons
      // 4. Budget ranges
      // 5. Social connections
      // 6. AI personality matching

      const userInterests = userProfile.preferences?.interests || [];
      const userTravelStyle = userProfile.preferences?.travelStyle || [];
      const userLanguages = userProfile.preferences?.languages || [];

      // Find users with similar travel patterns
      const potentialCompanions = await this.UserProfile.find({
        userId: { $ne: userProfile.userId },
        $and: [
          {
            $or: [
              { 'preferences.travelStyle': { $in: userTravelStyle } },
              { 'preferences.interests': { $in: userInterests } },
              { 'preferences.languages': { $in: userLanguages } }
            ]
          },
          {
            'stats.travelScore': { $gte: Math.max(0, userProfile.stats?.travelScore - 100) }
          }
        ]
      }).limit(50).lean();

      // Calculate compatibility scores
      const scoredCompanions = await Promise.all(
        potentialCompanions.map(async (companion) => {
          const compatibilityScore = await this.calculateCompatibilityScore(
            userProfile, 
            companion, 
            userPosts
          );
          
          return {
            ...companion,
            compatibilityScore,
            matchReasons: await this.getMatchReasons(userProfile, companion)
          };
        })
      );

      // Sort by compatibility and return top matches
      return scoredCompanions
        .filter(companion => companion.compatibilityScore > 0.6)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 20);

    } catch (error) {
      console.error('Error finding travel companions:', error);
      return [];
    }
  }

  async calculateCompatibilityScore(user1, user2, user1Posts) {
    try {
      let score = 0;
      let factors = 0;

      // Travel style compatibility (0-30 points)
      const travelStyleOverlap = this.calculateArrayOverlap(
        user1.preferences?.travelStyle || [],
        user2.preferences?.travelStyle || []
      );
      score += travelStyleOverlap * 30;
      factors++;

      // Interest compatibility (0-25 points)
      const interestOverlap = this.calculateArrayOverlap(
        user1.preferences?.interests || [],
        user2.preferences?.interests || []
      );
      score += interestOverlap * 25;
      factors++;

      // Language compatibility (0-20 points)
      const languageOverlap = this.calculateArrayOverlap(
        user1.preferences?.languages || [],
        user2.preferences?.languages || []
      );
      score += languageOverlap * 20;
      factors++;

      // Travel experience level (0-15 points)
      const experienceDiff = Math.abs(
        (user1.stats?.travelScore || 0) - (user2.stats?.travelScore || 0)
      );
      const experienceScore = Math.max(0, 1 - experienceDiff / 1000) * 15;
      score += experienceScore;
      factors++;

      // Location proximity (0-10 points)
      if (user1.location?.coordinates && user2.location?.coordinates) {
        const distance = this.calculateDistance(
          user1.location.coordinates,
          user2.location.coordinates
        );
        const proximityScore = Math.max(0, 1 - distance / 5000) * 10; // Within 5000km
        score += proximityScore;
        factors++;
      }

      // Normalize score to 0-1
      return factors > 0 ? score / 100 : 0;

    } catch (error) {
      console.error('Error calculating compatibility score:', error);
      return 0;
    }
  }

  calculateArrayOverlap(arr1, arr2) {
    if (!arr1.length || !arr2.length) return 0;
    const intersection = arr1.filter(item => arr2.includes(item));
    const union = [...new Set([...arr1, ...arr2])];
    return intersection.length / union.length;
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }

  async getMatchReasons(user1, user2) {
    const reasons = [];

    // Common travel styles
    const commonTravelStyles = (user1.preferences?.travelStyle || [])
      .filter(style => (user2.preferences?.travelStyle || []).includes(style));
    if (commonTravelStyles.length > 0) {
      reasons.push(`Both enjoy ${commonTravelStyles.join(', ')} travel`);
    }

    // Common interests
    const commonInterests = (user1.preferences?.interests || [])
      .filter(interest => (user2.preferences?.interests || []).includes(interest));
    if (commonInterests.length > 0) {
      reasons.push(`Shared interests in ${commonInterests.slice(0, 3).join(', ')}`);
    }

    // Common languages
    const commonLanguages = (user1.preferences?.languages || [])
      .filter(lang => (user2.preferences?.languages || []).includes(lang));
    if (commonLanguages.length > 0) {
      reasons.push(`Both speak ${commonLanguages.join(', ')}`);
    }

    // Similar travel experience
    const scoreDiff = Math.abs(
      (user1.stats?.travelScore || 0) - (user2.stats?.travelScore || 0)
    );
    if (scoreDiff < 200) {
      reasons.push('Similar travel experience level');
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }

  async getGroupRecommendations(userProfile) {
    try {
      console.log(`👥 Getting group recommendations for user: ${userProfile.userId}`);

      const userInterests = userProfile.preferences?.interests || [];
      const userTravelStyle = userProfile.preferences?.travelStyle || [];

      // Find groups that match user's interests and travel style
      const recommendedGroups = await this.TravelGroup.find({
        $and: [
          { 'members.userId': { $ne: userProfile.userId } }, // Not already a member
          { 'settings.privacy': 'public' }, // Public groups only
          {
            $or: [
              { tags: { $in: userInterests } },
              { category: { $in: userTravelStyle } },
              { location: userProfile.location?.country }
            ]
          }
        ]
      })
      .sort({ 'stats.memberCount': -1, lastActivity: -1 })
      .limit(15)
      .lean();

      // Score groups based on relevance
      const scoredGroups = recommendedGroups.map(group => {
        let relevanceScore = 0;

        // Interest match
        const interestMatches = group.tags?.filter(tag => userInterests.includes(tag)) || [];
        relevanceScore += interestMatches.length * 10;

        // Location match
        if (group.location === userProfile.location?.country) {
          relevanceScore += 15;
        }

        // Activity level
        const daysSinceActivity = (Date.now() - new Date(group.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
        relevanceScore += Math.max(0, 10 - daysSinceActivity);

        // Member count (more members = more active)
        relevanceScore += Math.min(group.stats.memberCount * 0.5, 20);

        return {
          ...group,
          relevanceScore,
          matchReasons: this.getGroupMatchReasons(userProfile, group)
        };
      });

      return scoredGroups
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);

    } catch (error) {
      console.error('Error getting group recommendations:', error);
      return [];
    }
  }

  getGroupMatchReasons(userProfile, group) {
    const reasons = [];
    const userInterests = userProfile.preferences?.interests || [];

    // Interest matches
    const matchingTags = group.tags?.filter(tag => userInterests.includes(tag)) || [];
    if (matchingTags.length > 0) {
      reasons.push(`Matches your interests: ${matchingTags.slice(0, 2).join(', ')}`);
    }

    // Location match
    if (group.location === userProfile.location?.country) {
      reasons.push(`Based in ${group.location}`);
    }

    // Activity level
    const daysSinceActivity = (Date.now() - new Date(group.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 7) {
      reasons.push('Very active community');
    }

    // Size
    if (group.stats.memberCount > 100) {
      reasons.push(`Large community (${group.stats.memberCount} members)`);
    } else if (group.stats.memberCount < 20) {
      reasons.push('Intimate community for close connections');
    }

    return reasons.slice(0, 3);
  }

  async getPostRecommendations(userProfile, userPosts) {
    try {
      // Get posts similar to user's interests and travel style
      const userInterests = userProfile.preferences?.interests || [];
      const userTravelStyle = userProfile.preferences?.travelStyle || [];

      const query = {
        status: 'active',
        userId: { $ne: userProfile.userId },
        $or: [
          { tags: { $in: userInterests } },
          { 'details.travelType': { $in: userTravelStyle } },
          { 'aiEnhanced.topics': { $in: userInterests } }
        ]
      };

      return await this.TravelPost.find(query)
        .sort({ 'engagement.likes': -1, createdAt: -1 })
        .limit(20)
        .lean();

    } catch (error) {
      console.error('Error getting post recommendations:', error);
      return [];
    }
  }

  async getUserSuggestions(userProfile, userPosts) {
    try {
      // Find users with similar travel patterns
      const userDestinations = userPosts.map(post => post.destination.country).filter(Boolean);
      const userTravelStyle = userProfile.preferences?.travelStyle || [];

      const similarUsers = await this.UserProfile.find({
        userId: { $ne: userProfile.userId },
        $or: [
          { 'preferences.travelStyle': { $in: userTravelStyle } },
          { 'location.country': { $in: userDestinations } }
        ]
      })
      .sort({ 'stats.travelScore': -1 })
      .limit(10)
      .lean();

      return similarUsers;

    } catch (error) {
      console.error('Error getting user suggestions:', error);
      return [];
    }
  }

  // Analytics and Insights
  async calculateTravelScore(userId) {
    try {
      const userPosts = await this.TravelPost.find({ userId }).lean();
      const userProfile = await this.UserProfile.findOne({ userId }).lean();

      let score = 0;

      // Base score from posts
      score += userPosts.length * 10;

      // Engagement score
      const totalLikes = userPosts.reduce((sum, post) => sum + post.engagement.likes, 0);
      const totalComments = userPosts.reduce((sum, post) => sum + post.engagement.comments, 0);
      score += totalLikes * 2 + totalComments * 3;

      // Diversity score (different countries visited)
      const uniqueCountries = new Set(userPosts.map(post => post.destination.country).filter(Boolean));
      score += uniqueCountries.size * 25;

      // Social score
      score += (userProfile?.stats?.followers || 0) * 1;
      score += (userProfile?.stats?.following || 0) * 0.5;

      // Update user profile
      await this.UserProfile.findOneAndUpdate(
        { userId },
        { 
          'stats.travelScore': Math.round(score),
          'stats.visitedCountries': uniqueCountries.size
        }
      );

      return Math.round(score);

    } catch (error) {
      console.error('Error calculating travel score:', error);
      return 0;
    }
  }

  async getTrendingDestinations() {
    try {
      const cacheKey = 'trending_destinations';
      if (this.trendingCache.has(cacheKey)) {
        return this.trendingCache.get(cacheKey);
      }

      // Get destinations with most posts in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const trending = await this.TravelPost.aggregate([
        {
          $match: {
            status: 'active',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$destination.name',
            count: { $sum: 1 },
            totalLikes: { $sum: '$engagement.likes' },
            avgRating: { $avg: '$details.rating' }
          }
        },
        {
          $sort: { 
            totalLikes: -1,
            count: -1 
          }
        },
        {
          $limit: 10
        }
      ]);

      // Cache for 1 hour
      this.trendingCache.set(cacheKey, trending);
      setTimeout(() => {
        this.trendingCache.delete(cacheKey);
      }, 60 * 60 * 1000);

      return trending;

    } catch (error) {
      console.error('Error getting trending destinations:', error);
      return [];
    }
  }

  // Helper methods
  async checkUserLiked(userId, postId) {
    // This would typically be stored in a separate likes collection
    // For now, return random boolean for demo
    return Math.random() > 0.7;
  }

  async checkUserBookmarked(userId, postId) {
    // This would typically be stored in a separate bookmarks collection
    // For now, return random boolean for demo
    return Math.random() > 0.8;
  }

  // Cache management
  getCacheStats() {
    return {
      recommendations_cache_size: this.recommendationsCache.size,
      trending_cache_size: this.trendingCache.size,
      social_graph_cache_size: this.socialGraphCache.size,
      memory_usage: process.memoryUsage()
    };
  }

  clearCache() {
    this.recommendationsCache.clear();
    this.trendingCache.clear();
    this.socialGraphCache.clear();
    return { success: true, message: 'Social travel cache cleared' };
  }
}

module.exports = new SocialTravelService();
