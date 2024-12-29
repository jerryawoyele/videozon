import axios from 'axios';

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data.data.url;
  } catch (error) {
    throw new Error('Failed to upload image');
  }
}; 