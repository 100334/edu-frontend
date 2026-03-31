import axios from 'axios';
import toast from 'react-hot-toast';

// Configuration - you can use Cloudinary, Supabase Storage, or any other service
const IMAGE_UPLOAD_URL = process.env.REACT_APP_IMAGE_UPLOAD_URL || 'https://api.cloudinary.com/v1_1/your-cloud-name/image/upload';
const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET || 'quiz_images';

export const uploadImage = async (file) => {
  if (!file) return null;
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
    return null;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size should be less than 5MB');
    return null;
  }
  
  try {
    // For Supabase Storage
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    // Option 1: Upload to your backend (which then uploads to Supabase)
    const response = await axios.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data.url;
    }
    return null;
    
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('Failed to upload image. Please try again.');
    return null;
  }
};

// For Cloudinary (alternative)
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const response = await axios.post(IMAGE_UPLOAD_URL, formData);
    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};