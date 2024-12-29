import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Search, 
  Video, 
  Users, 
  Calendar,
  Camera,
  Film,
  Play,
  Radio
} from 'lucide-react';

const HomePage = () => {
  const categories = [
    { name: 'Videography', icon: Video },
    { name: 'Photography', icon: Camera },
    { name: 'Event Coverage', icon: Calendar },
    { name: 'Video Editing', icon: Film },
    { name: 'Animation', icon: Play },
    { name: 'Live Streaming', icon: Radio },
  ];

  const featuredProfessionals = [
    {
      id: 1,
      name: 'John Doe',
      title: 'Professional Videographer',
      rating: 4.9,
      reviews: 127,
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    },
    // Add more featured professionals...
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Find the Perfect Video Professional
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Connect with talented videographers for your next project
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for video services..."
            className="w-full px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                to={`/search?category=${category.name}`}
                className="flex flex-col items-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-8 h-8 text-blue-500 mb-3" />
                <span className="text-white text-sm font-medium">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Professionals */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Featured Professionals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProfessionals.map((pro) => (
            <Link
              key={pro.id}
              to={`/profile/${pro.id}`}
              className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200"
            >
              <img
                src={pro.image}
                alt={pro.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-white font-semibold text-lg mb-1">{pro.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{pro.title}</p>
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm ml-2">
                    {pro.rating} ({pro.reviews} reviews)
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Find Professionals</h3>
            <p className="text-gray-400">Browse through our talented video professionals</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Connect</h3>
            <p className="text-gray-400">Discuss your project details and requirements</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Book & Create</h3>
            <p className="text-gray-400">Schedule your project and bring your vision to life</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gray-800 rounded-lg p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-gray-400 mb-6">Join our community of video professionals and clients</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Sign Up Now
          </Link>
          <Link
            to="/gigs"
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;

