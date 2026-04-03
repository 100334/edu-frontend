// src/components/common/ImageUploader.jsx
import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ImageUploader = ({ label, currentImage = '', onImageUpload, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // Upload to Cloudinary via backend
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.imageUrl) {
        const uploadedUrl = response.data.imageUrl;
        setPreview(uploadedUrl);
        onImageUpload(uploadedUrl);
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
      // Revert preview
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    if (onRemove) onRemove();
    else onImageUpload(''); // clear the URL
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Uploaded preview"
            className="max-h-32 rounded-lg border border-gray-200 object-contain bg-gray-50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            disabled={uploading}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            ) : (
              <>
                <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Click to upload</p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

export default ImageUploader;