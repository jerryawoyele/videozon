import React from 'react';
import Layout from '../../components/Layout';
import BackButton from '../../components/BackButton';

const GigPreviewPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-white">Gig Preview</h1>
          </div>
          <div className="text-sm text-gray-400">
            Preview Mode
          </div>
        </div>
        {/* Rest of your gig preview content */}
      </div>
    </Layout>
  );
};

export default GigPreviewPage; 