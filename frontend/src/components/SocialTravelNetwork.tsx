import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Star,
  Camera,
  Video,
  Plane,
  Globe,
  TrendingUp,
  Award,
  Eye,
  ThumbsUp,
  Send,
  Play,
  MoreHorizontal,
  UserPlus,
  CheckCircle,
  Navigation,
  Sparkles
} from 'lucide-react';

// Mock data for stunning visual display
const mockTravelPhotos = [
  { id: 1, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', location: 'Paris, France', user: 'Sarah Johnson', likes: 1234, comments: 89 },
  { id: 2, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', location: 'Santorini, Greece', user: 'Mike Chen', likes: 2156, comments: 145 },
  { id: 3, url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', location: 'Bali, Indonesia', user: 'Emma Wilson', likes: 3421, comments: 234 },
  { id: 4, url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', location: 'Tokyo, Japan', user: 'Alex Rodriguez', likes: 892, comments: 67 },
  { id: 5, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', location: 'Iceland', user: 'Lisa Anderson', likes: 4523, comments: 312 },
  { id: 6, url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800', location: 'Maldives', user: 'David Kim', likes: 5678, comments: 456 },
  { id: 7, url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', location: 'Swiss Alps', user: 'Sophie Turner', likes: 2890, comments: 178 },
  { id: 8, url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800', location: 'Dubai, UAE', user: 'James Brown', likes: 1567, comments: 98 },
  { id: 9, url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800', location: 'New York, USA', user: 'Maria Garcia', likes: 3234, comments: 201 },
];

const mockReels = [
  { id: 1, thumbnail: 'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=400', title: 'Exploring Paris Streets', location: 'Paris, France', views: '234K', user: 'Travel Vlogger' },
  { id: 2, thumbnail: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=400', title: 'Surfing in Bali', location: 'Bali, Indonesia', views: '567K', user: 'Adventure Seeker' },
  { id: 3, thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', title: 'Northern Lights Magic', location: 'Iceland', views: '892K', user: 'Nature Explorer' },
  { id: 4, thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400', title: 'Mountain Trekking', location: 'Nepal', views: '445K', user: 'Trek Master' },
];

const mockReviews = [
  {
    id: 1,
    user: { name: 'Emily Roberts', avatar: 'https://i.pravatar.cc/150?img=1', country: 'USA' },
    place: 'Eiffel Tower, Paris',
    rating: 5,
    review: 'Absolutely breathtaking! The view from the top is worth every minute of the wait. Visited at sunset and it was magical. The sparkling lights at night are a must-see!',
    images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400'],
    date: '2 days ago',
    likes: 234,
    helpful: 189
  },
  {
    id: 2,
    user: { name: 'Carlos Martinez', avatar: 'https://i.pravatar.cc/150?img=12', country: 'Spain' },
    place: 'Santorini Beaches, Greece',
    rating: 5,
    review: 'Paradise on Earth! Crystal clear waters, stunning white architecture against the blue sky. Perfect for couples and photographers. The sunset views are legendary!',
    images: ['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400'],
    date: '5 days ago',
    likes: 456,
    helpful: 321
  },
  {
    id: 3,
    user: { name: 'Yuki Tanaka', avatar: 'https://i.pravatar.cc/150?img=5', country: 'Japan' },
    place: 'Bali Rice Terraces, Indonesia',
    rating: 4,
    review: 'Stunning natural beauty! The emerald green rice terraces are a photographers dream. Best visited in the morning for golden hour. Local guides are very helpful and friendly.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400'],
    date: '1 week ago',
    likes: 567,
    helpful: 423
  },
  {
    id: 4,
    user: { name: 'Sophia Anderson', avatar: 'https://i.pravatar.cc/150?img=9', country: 'UK' },
    place: 'Dubai Marina, UAE',
    rating: 5,
    review: 'Modern marvel! The skyline at night is absolutely stunning. Amazing restaurants, luxury yachts, and beautiful waterfront promenade. Perfect for evening strolls!',
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400'],
    date: '3 days ago',
    likes: 789,
    helpful: 654
  }
];

const SocialTravelNetwork: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'reels' | 'reviews'>('photos');
  const [likedPhotos, setLikedPhotos] = useState<Set<number>>(new Set());
  const [savedPhotos, setSavedPhotos] = useState<Set<number>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const toggleLike = (id: number) => {
    const newLiked = new Set(likedPhotos);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedPhotos(newLiked);
  };

  const toggleSave = (id: number) => {
    const newSaved = new Set(savedPhotos);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedPhotos(newSaved);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Floating Travel Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Plane size={40 + i * 10} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-16"
        >
          <div className="container-custom text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block text-6xl mb-4"
            >
              🌍
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
              Travel Social Network
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8">
              Discover. Share. Connect with travelers worldwide
            </p>
            
            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                <div className="text-3xl font-bold">2.5M+</div>
                <div className="text-pink-200 text-sm">Travelers</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                <div className="text-3xl font-bold">150K+</div>
                <div className="text-pink-200 text-sm">Destinations</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                <div className="text-3xl font-bold">10M+</div>
                <div className="text-pink-200 text-sm">Photos</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                <div className="text-3xl font-bold">500K+</div>
                <div className="text-pink-200 text-sm">Reviews</div>
              </motion.div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" className="w-full h-16">
              <path fill="rgb(253 242 248)" d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
            </svg>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="container-custom py-8">
          <div className="flex justify-center space-x-4 mb-8">
            {[
              { id: 'photos', label: '📸 Photos', icon: Camera },
              { id: 'reels', label: '🎥 Travel Reels', icon: Video },
              { id: 'reviews', label: '⭐ Reviews', icon: Star }
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(id as any)}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl'
                    : 'bg-white text-gray-700 hover:shadow-xl'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Photos Grid */}
          {activeTab === 'photos' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {mockTravelPhotos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="break-inside-avoid group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.id)}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.location}
                        className="w-full h-auto transform group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center space-x-4 text-white">
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                              className="flex items-center space-x-2"
                            >
                              <Heart className={`w-6 h-6 ${likedPhotos.has(photo.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="font-semibold">{formatNumber(photo.likes + (likedPhotos.has(photo.id) ? 1 : 0))}</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center space-x-2"
                            >
                              <MessageCircle className="w-6 h-6" />
                              <span className="font-semibold">{photo.comments}</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className="ml-auto"
                            >
                              <Share2 className="w-6 h-6" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Photo Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://i.pravatar.cc/150?u=${photo.user}`}
                            alt={photo.user}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{photo.user}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {photo.location}
                            </div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); toggleSave(photo.id); }}
                          className="text-gray-400 hover:text-pink-600"
                        >
                          <Bookmark className={`w-6 h-6 ${savedPhotos.has(photo.id) ? 'fill-pink-600 text-pink-600' : ''}`} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reels Section */}
          {activeTab === 'reels' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {mockReels.map((reel, index) => (
                <motion.div
                  key={reel.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <img
                      src={reel.thumbnail}
                      alt={reel.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center"
                      >
                        <Play className="w-8 h-8 text-pink-600 ml-1" fill="currentColor" />
                      </motion.div>
                    </div>

                    {/* View Count */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-semibold">{reel.views}</span>
                    </div>
                  </div>

                  {/* Reel Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{reel.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {reel.location}
                      </div>
                      <div className="flex items-center space-x-2">
                        <img
                          src={`https://i.pravatar.cc/150?u=${reel.user}`}
                          alt={reel.user}
                          className="w-6 h-6 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Reviews Section */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {mockReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-14 h-14 rounded-full ring-4 ring-purple-100"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-lg text-gray-900">{review.user.name}</h3>
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-600">From {review.user.country}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Place and Rating */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-red-500" />
                        {review.place}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                    {review.review}
                  </p>

                  {/* Review Images */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {review.images.map((img, imgIndex) => (
                      <motion.div
                        key={imgIndex}
                        whileHover={{ scale: 1.05 }}
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                      >
                        <img
                          src={img}
                          alt={`Review ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Engagement Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span className="font-semibold">{review.likes}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-semibold">Reply</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-semibold">{review.helpful} helpful</span>
                      </motion.button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="font-semibold">Share</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialTravelNetwork;
