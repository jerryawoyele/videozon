import React from 'react';
import Layout from '../../components/Layout';
import BackButton from '../../components/BackButton';

const EditGigPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-white">Edit Gig</h1>
        </div>
        {/* Rest of your edit gig form */}
      </div>
    </Layout>
  );
};

export default EditGigPage; 