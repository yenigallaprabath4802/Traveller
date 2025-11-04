const express = require('express');
const router = express.Router();
const socialTravelService = require('../services/socialTravelService');
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/social/health
 * @desc    Health check for social travel service
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 Social travel service health check');

    const status = {
      service: 'Social Travel Network',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        user_profiles: 'active',
        travel_posts: 'active',
        social_connections: 'active',
        group_trips: 'active',
        recommendations: 'active',
        ai_companion: 'active'
      },
      cache_stats: socialTravelService.getCacheStats()
    };

    res.json({
      success: true,
      data: status,
      message: 'Social travel service is operational'
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Service health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Apply authentication middleware to all protected routes
router.use(authMiddleware);

/**
 * @route   GET /api/social/profile/:userId?
 * @desc    Get user profile (own or another user's)
 * @access  Private
 */
router.get('/profile/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    
    console.log(`👤 Getting profile for user: ${targetUserId}`);

    const profile = await socialTravelService.getUserProfile(targetUserId);

    res.json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/social/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user.id;

    console.log(`🔄 Updating profile for user: ${userId}`);

    const updatedProfile = await socialTravelService.updateUserProfile(userId, updates);

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/feed
 * @desc    Get personalized feed of travel posts
 * @access  Private
 */
router.get('/feed', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      filter = 'all', // all, following, trending
      sortBy = 'recent' // recent, popular, trending
    } = req.query;

    const userId = req.user.id;

    console.log(`📰 Getting feed for user: ${userId}, filter: ${filter}`);

    const posts = await socialTravelService.getFeedPosts(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      filter,
      sortBy
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        },
        filter,
        sortBy
      },
      message: `Retrieved ${posts.length} posts for your feed`
    });

  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/posts
 * @desc    Create a new travel post
 * @access  Private
 */
router.post('/posts', async (req, res) => {
  try {
    const postData = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!postData.destination || !postData.content) {
      return res.status(400).json({
        success: false,
        message: 'Destination and content are required'
      });
    }

    console.log(`📝 Creating post for user: ${userId}, destination: ${postData.destination}`);

    const post = await socialTravelService.createTravelPost(userId, postData);

    res.status(201).json({
      success: true,
      data: post,
      message: 'Travel post created successfully'
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/posts/search
 * @desc    Search travel posts
 * @access  Private
 */
router.get('/posts/search', async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 20,
      travelType,
      minRating,
      destination
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log(`🔍 Searching posts with query: "${query}"`);

    const filters = {};
    if (travelType) filters.travelType = travelType;
    if (minRating) filters.minRating = parseFloat(minRating);
    if (destination) filters.destination = destination;

    const posts = await socialTravelService.searchPosts(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    });

    res.json({
      success: true,
      data: {
        posts,
        query,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      },
      message: `Found ${posts.length} posts matching "${query}"`
    });

  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search posts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/posts/:postId/like
 * @desc    Like or unlike a travel post
 * @access  Private
 */
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    console.log(`👍 User ${userId} liking post ${postId}`);

    const result = await socialTravelService.likePost(userId, postId);

    res.json({
      success: true,
      data: result,
      message: `Post ${result.action} successfully`
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/posts/:postId/comments
 * @desc    Add a comment to a travel post
 * @access  Private
 */
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!postId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment content are required'
      });
    }

    console.log(`💬 User ${userId} commenting on post ${postId}`);

    const comment = await socialTravelService.addComment(userId, postId, content, parentCommentId);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/follow/:userId
 * @desc    Follow or unfollow a user
 * @access  Private
 */
router.post('/follow/:userId', async (req, res) => {
  try {
    const { userId: followingId } = req.params;
    const followerId = req.user.id;

    if (!followingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    console.log(`👥 User ${followerId} following ${followingId}`);

    const result = await socialTravelService.followUser(followerId, followingId);

    res.json({
      success: true,
      data: result,
      message: `User ${result.action} successfully`
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/following/:userId?
 * @desc    Get list of users that a user is following
 * @access  Private
 */
router.get('/following/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    console.log(`👥 Getting following list for user: ${targetUserId}`);

    const following = await socialTravelService.getUserFollowing(targetUserId);

    res.json({
      success: true,
      data: following,
      message: 'Following list retrieved successfully'
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get following list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/followers/:userId?
 * @desc    Get list of users following a user
 * @access  Private
 */
router.get('/followers/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    console.log(`👥 Getting followers list for user: ${targetUserId}`);

    const followers = await socialTravelService.getUserFollowers(targetUserId);

    res.json({
      success: true,
      data: followers,
      message: 'Followers list retrieved successfully'
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get followers list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/recommendations/:type
 * @desc    Get personalized recommendations (posts, users, destinations, travel_companions, groups)
 * @access  Private
 */
router.get('/recommendations/:type', async (req, res) => {
  try {
    const { type } = req.params; // posts, users, destinations, travel_companions, groups
    const userId = req.user.id;

    if (!['posts', 'users', 'destinations', 'travel_companions', 'groups'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation type. Use: posts, users, destinations, travel_companions, or groups'
      });
    }

    console.log(`🎯 Getting ${type} recommendations for user: ${userId}`);

    const recommendations = await socialTravelService.getUserRecommendations(userId, type);

    res.json({
      success: true,
      data: {
        type,
        recommendations,
        count: recommendations.length
      },
      message: `${type} recommendations retrieved successfully`
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/group-trips
 * @desc    Create a new group trip
 * @access  Private
 */
router.post('/group-trips', async (req, res) => {
  try {
    const tripData = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!tripData.title || !tripData.destination?.name) {
      return res.status(400).json({
        success: false,
        message: 'Trip title and destination are required'
      });
    }

    console.log(`🗺️ Creating group trip: ${tripData.title}`);

    const trip = await socialTravelService.createGroupTrip(adminId, tripData);

    res.status(201).json({
      success: true,
      data: trip,
      message: 'Group trip created successfully'
    });

  } catch (error) {
    console.error('Create group trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group trip',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/group-trips
 * @desc    Get group trips (my trips, available, recommended)
 * @access  Private
 */
router.get('/group-trips', async (req, res) => {
  try {
    const {
      filter = 'my_trips', // my_trips, available, recommended
      page = 1,
      limit = 20
    } = req.query;

    const userId = req.user.id;

    console.log(`🗺️ Getting group trips for user ${userId}, filter: ${filter}`);

    const trips = await socialTravelService.getGroupTrips(userId, {
      filter,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: trips.length === parseInt(limit)
        },
        filter
      },
      message: `Retrieved ${trips.length} group trips`
    });

  } catch (error) {
    console.error('Get group trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group trips',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/group-trips/:tripId/join
 * @desc    Join a group trip
 * @access  Private
 */
router.post('/group-trips/:tripId/join', async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const userPreferences = req.body.preferences || {};

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    console.log(`🎒 User ${userId} joining group trip ${tripId}`);

    const result = await socialTravelService.joinGroupTrip(userId, tripId, userPreferences);

    res.json({
      success: result.joined,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Join group trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group trip',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/group-trips/:tripId/polls
 * @desc    Create a poll for group trip
 * @access  Private
 */
router.post('/group-trips/:tripId/polls', async (req, res) => {
  try {
    const { tripId } = req.params;
    const pollData = req.body;
    const adminId = req.user.id;

    // Validate poll data
    if (!pollData.question || !pollData.options || pollData.options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Poll must have a question and at least 2 options'
      });
    }

    console.log(`📊 Creating poll for trip ${tripId}`);

    const poll = await socialTravelService.createTripPoll(tripId, adminId, pollData);

    res.status(201).json({
      success: true,
      data: poll,
      message: 'Poll created successfully'
    });

  } catch (error) {
    console.error('Create trip poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create poll',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/group-trips/:tripId/polls/:pollIndex/vote
 * @desc    Vote on a trip poll
 * @access  Private
 */
router.post('/group-trips/:tripId/polls/:pollIndex/vote', async (req, res) => {
  try {
    const { tripId, pollIndex } = req.params;
    const { option } = req.body;
    const userId = req.user.id;

    if (!option) {
      return res.status(400).json({
        success: false,
        message: 'Vote option is required'
      });
    }

    console.log(`🗳️ User ${userId} voting on poll ${pollIndex} for trip ${tripId}`);

    const result = await socialTravelService.voteTripPoll(
      tripId, 
      userId, 
      parseInt(pollIndex), 
      option
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Vote on poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on poll',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/group-trips/:tripId/discussions
 * @desc    Add message to group trip discussion
 * @access  Private
 */
router.post('/group-trips/:tripId/discussions', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    console.log(`💬 Adding discussion message to trip ${tripId}`);

    const discussion = await socialTravelService.addGroupTripDiscussion(
      tripId, 
      userId, 
      message.trim()
    );

    res.status(201).json({
      success: true,
      data: discussion,
      message: 'Discussion message added successfully'
    });

  } catch (error) {
    console.error('Add trip discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add discussion message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/compatibility/:userId
 * @desc    Check compatibility with another user for travel
 * @access  Private
 */
router.get('/compatibility/:userId', async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check compatibility with yourself'
      });
    }

    console.log(`🤝 Checking compatibility between ${currentUserId} and ${targetUserId}`);

    // Get both user profiles
    const [currentUser, targetUser] = await Promise.all([
      socialTravelService.getUserProfile(currentUserId),
      socialTravelService.getUserProfile(targetUserId)
    ]);

    // Get current user's posts for context
    const currentUserPosts = await socialTravelService.TravelPost?.find({ 
      userId: currentUserId 
    }).lean() || [];

    // Calculate compatibility
    const compatibilityScore = await socialTravelService.calculateCompatibilityScore(
      currentUser,
      targetUser,
      currentUserPosts
    );

    const matchReasons = await socialTravelService.getMatchReasons(currentUser, targetUser);

    res.json({
      success: true,
      data: {
        targetUser: {
          userId: targetUser.userId,
          username: targetUser.username,
          fullName: targetUser.fullName,
          avatar: targetUser.avatar,
          travelScore: targetUser.stats?.travelScore || 0
        },
        compatibilityScore: Math.round(compatibilityScore * 100), // Convert to percentage
        matchReasons,
        compatibility: compatibilityScore > 0.7 ? 'High' : 
                      compatibilityScore > 0.5 ? 'Medium' : 'Low'
      },
      message: 'Compatibility analysis completed'
    });

  } catch (error) {
    console.error('Compatibility check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check compatibility',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/discover/companions
 * @desc    Discover potential travel companions
 * @access  Private
 */
router.get('/discover/companions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      minCompatibility = 60 // Minimum compatibility percentage
    } = req.query;

    const userId = req.user.id;

    console.log(`🤝 Discovering travel companions for user: ${userId}`);

    // Get travel companion recommendations
    const companions = await socialTravelService.getUserRecommendations(userId, 'travel_companions');

    // Filter by minimum compatibility
    const filteredCompanions = companions.filter(
      companion => (companion.compatibilityScore * 100) >= parseInt(minCompatibility)
    );

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCompanions = filteredCompanions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        companions: paginatedCompanions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredCompanions.length,
          hasMore: endIndex < filteredCompanions.length
        },
        filters: {
          minCompatibility: parseInt(minCompatibility)
        }
      },
      message: `Found ${paginatedCompanions.length} potential travel companions`
    });

  } catch (error) {
    console.error('Discover companions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover travel companions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/groups
 * @desc    Create a new travel group
 * @access  Private
 */
router.post('/groups', async (req, res) => {
  try {
    const groupData = req.body;
    const adminId = req.user.id;

    if (!groupData.name || !groupData.description) {
      return res.status(400).json({
        success: false,
        message: 'Group name and description are required'
      });
    }

    console.log(`👥 Creating group: ${groupData.name}`);

    const group = await socialTravelService.createTravelGroup(adminId, groupData);

    res.status(201).json({
      success: true,
      data: group,
      message: 'Travel group created successfully'
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/social/groups/:groupId/join
 * @desc    Join a travel group
 * @access  Private
 */
router.post('/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    console.log(`👥 User ${userId} joining group ${groupId}`);

    const result = await socialTravelService.joinGroup(userId, groupId);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/trending/destinations
 * @desc    Get trending destinations
 * @access  Private
 */
router.get('/trending/destinations', async (req, res) => {
  try {
    console.log('📈 Getting trending destinations');

    const trending = await socialTravelService.getTrendingDestinations();

    res.json({
      success: true,
      data: trending,
      message: 'Trending destinations retrieved successfully'
    });

  } catch (error) {
    console.error('Trending destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending destinations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/analytics/score/:userId?
 * @desc    Get travel score for a user
 * @access  Private
 */
router.get('/analytics/score/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    console.log(`📊 Calculating travel score for user: ${targetUserId}`);

    const score = await socialTravelService.calculateTravelScore(targetUserId);

    res.json({
      success: true,
      data: {
        userId: targetUserId,
        travelScore: score,
        calculatedAt: new Date().toISOString()
      },
      message: 'Travel score calculated successfully'
    });

  } catch (error) {
    console.error('Travel score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate travel score',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/discover/users
 * @desc    Discover new users to follow
 * @access  Private
 */
router.get('/discover/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      filter = 'suggested' // suggested, popular, nearby
    } = req.query;

    const userId = req.user.id;

    console.log(`🔍 Discovering users for ${userId}, filter: ${filter}`);

    // Get user recommendations
    const users = await socialTravelService.getUserRecommendations(userId, 'users');

    res.json({
      success: true,
      data: {
        users: users.slice((page - 1) * limit, page * limit),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: users.length > page * limit
        },
        filter
      },
      message: `Discovered ${users.length} users`
    });

  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/social/cache/stats
 * @desc    Get social cache statistics
 * @access  Private
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = socialTravelService.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

/**
 * @route   DELETE /api/social/cache
 * @desc    Clear social cache
 * @access  Private
 */
router.delete('/cache', async (req, res) => {
  try {
    const result = socialTravelService.clearCache();
    
    res.json({
      success: true,
      data: result,
      message: 'Social cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

module.exports = router;