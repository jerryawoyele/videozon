import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import Layout from '../../components/Layout';
import { DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PaymentPage = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gig, setGig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    console.log('Gig ID from URL:', gigId);
    if (!gigId) {
      toast.error('No gig ID provided');
      navigate('/gigs');
      return;
    }
    fetchGigDetails();
  }, [gigId, navigate]);

  const fetchGigDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching gig details for ID:', gigId);
      const response = await api.get(`/gigs/${gigId}`);
      console.log('Gig details response:', response.data);
      if (response.data.success) {
        const fetchedGig = response.data.data.gig;
        if (!fetchedGig) {
          throw new Error('Gig not found');
        }
        if (fetchedGig.paymentStatus === 'paid') {
          toast.error('This gig has already been paid for');
          navigate('/gigs');
          return;
        }
        setGig(fetchedGig);
      }
    } catch (error) {
      console.error('Fetch gig error:', error);
      toast.error(error.message || 'Failed to fetch gig details');
      navigate('/gigs');
    } finally {
      setIsLoading(false);
    }
  };

  const config = {
    reference: `pay_${gigId}_${Date.now()}`,
    email: user.email,
    amount: gig?.price ? Math.round(gig.price * 1.05 * 100) : 0, // Convert to kobo and include platform fee
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    metadata: {
      gigId,
      professionalId: gig?.professional?._id,
      eventId: gig?.event?._id,
      type: 'escrow',
      description: `Payment for ${gig?.service} service at ${gig?.event?.title}`,
      platform_fee: gig?.price ? Math.round(gig.price * 0.05) : 0,
    },
    channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    split: {
      type: "percentage",
      bearer_type: "account",
      subaccounts: [
        {
          subaccount: gig?.professional?.paystackSubaccountCode, // Professional's Paystack subaccount
          share: 95 // Professional gets 95% of the payment
        }
      ]
    }
  };

  const onSuccess = async (reference) => {
    setIsProcessing(true);
    try {
      const response = await api.post('/payments/verify', {
        reference: reference.reference,
        gigId,
        amount: gig.price * 1.05, // Total amount including platform fee
        metadata: {
          professionalId: gig?.professional?._id,
          eventId: gig?.event?._id,
          platformFee: gig.price * 0.05
        }
      });

      if (response.data.success) {
        toast.success('Payment successful! Funds will be released after service completion.');
        navigate('/gigs');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const onClose = () => {
    toast.error('Payment cancelled');
  };

  const handlePayment = () => {
    if (!gig?.professional?.paystackSubaccountCode || !user?.paystackSubaccountCode) {
      toast.error('Both parties must set up their payment information');
      return;
    }
    initializePayment(onSuccess, onClose);
  };

  const initializePayment = usePaystackPayment(config);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-800 rounded-lg"></div>
            <div className="h-64 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!gig) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Gig Not Found</h3>
            <p className="text-gray-400 mb-4">
              The gig you're trying to pay for could not be found.
            </p>
            <button
              onClick={() => navigate('/gigs')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Gigs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Payment Details</h2>
                  <p className="text-gray-400 text-sm mt-1">{gig.event?.title}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Gig Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Service</span>
                      <span className="text-white font-medium">{gig.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Professional</span>
                      <span className="text-white font-medium">{gig.professional?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Event</span>
                      <span className="text-white font-medium">{gig.event?.title}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Service Fee</span>
                      <span className="text-white font-medium">₦{gig.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Platform Fee (5%)</span>
                      <span className="text-white font-medium">₦{(gig.price * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-semibold">Total</span>
                        <span className="text-white font-semibold">₦{(gig.price * 1.05).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(!gig?.professional?.paystackSubaccountCode || !user?.paystackSubaccountCode) && (
                  <div className="bg-yellow-500/20 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                      <div className="space-y-4 flex-grow">
                        <div>
                          <h4 className="text-yellow-500 font-semibold mb-2">Payment Setup Required</h4>
                          <p className="text-gray-300">
                            Both parties need to set up their payment information before proceeding with the transaction.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {!gig?.professional?.paystackSubaccountCode && (
                            <div>
                              <p className="text-gray-300 mb-2">
                                Professional ({gig?.professional?.name}) needs to set up payment information
                                {user._id === gig?.professional?._id && " (You)"}
                              </p>
                              {user._id === gig?.professional?._id && (
                                <button
                                  onClick={() => navigate('/settings')}
                                  className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-200"
                                >
                                  Set Up Your Payment Info
                                </button>
                              )}
                            </div>
                          )}

                          {!user?.paystackSubaccountCode && (
                            <div>
                              <p className="text-gray-300 mb-2">
                                Client ({user.name}) needs to set up payment information (You)
                              </p>
                              <button
                                onClick={() => navigate('/settings')}
                                className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400"
                              >
                                Set Up Your Payment Info
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => navigate('/gigs')}
                    className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !gig?.professional?.paystackSubaccountCode || !user?.paystackSubaccountCode}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5 mr-2" />
                        Pay Now (Escrow)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage; 