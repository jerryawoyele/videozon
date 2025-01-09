import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, Star } from 'lucide-react';
import Avatar from '../../components/Avatar';
import api from '../../utils/axios';
import { toast } from 'react-hot-toast';

const GigPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const response = await api.get(`/gigs/${id}`);
        if (response.data.success) {
          setGig(response.data.data.gig);
        }
      } catch (error) {
        console.error('Fetch gig error:', error);
        toast.error('Failed to load gig details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGig();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-800 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded w-1/2"></div>
              <div className="h-32 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!gig) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Gig not found</h2>
            <p className="text-gray-400">The gig you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Gig Preview</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {gig.event.title}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-full">
              Preview Mode
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <Avatar user={gig.professional} size="lg" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{gig.professional.name}</h2>
                <div className="flex items-center mt-1 text-gray-400">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{gig.professional.rating || 0} ({gig.professional.completedGigs || 0} gigs)</span>
                </div>
                <p className="mt-2 text-gray-300">{gig.professional.bio}</p>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Date</span>
                </div>
                <div>{new Date(gig.startDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Time</span>
                </div>
                <div>{new Date(gig.startDate).toLocaleTimeString()}</div>
              </div>
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Location</span>
                </div>
                <div>{gig.event.location}</div>
              </div>
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Budget</span>
                </div>
                <div>₦{gig.price?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Service Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 mb-1">Selected Services</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(gig.services) ? (
                    gig.services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-500"
                      >
                        {service.charAt(0).toUpperCase() + service.slice(1)}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-500">
                      {gig.service}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Description</div>
                <div className="text-gray-300">{gig.description}</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 mb-1">Current Status</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  gig.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
                  gig.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Payment Status</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  gig.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {gig.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GigPreviewPage; 