import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/gigs/search`, {
          params: { query, category }
        });
        setResults(response.data.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query || category) {
      fetchResults();
    }
  }, [query, category]);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Search Results {query && `for "${query}"`}
        </h1>
        {category && (
          <p className="text-gray-400">
            Category: {category}
          </p>
        )}
        <p className="text-gray-400">
          {results.length} results found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((gig) => (
          <div 
            key={gig._id} 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            {gig.images?.[0] && (
              <img 
                src={gig.images[0]} 
                alt={gig.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {gig.title}
              </h3>
              <p className="text-gray-400 mb-4">
                {gig.description.substring(0, 100)}...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img 
                    src={gig.professional.avatar} 
                    alt={gig.professional.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-gray-300">
                    {gig.professional.name}
                  </span>
                </div>
                <div className="text-primary font-semibold">
                  From ${gig.packages[0]?.price}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-2">
            No results found
          </h2>
          <p className="text-gray-400">
            Try adjusting your search terms or browse our categories
          </p>
        </div>
      )}
    </Layout>
  );
};

export default SearchPage;

