// src/components/common/ImageUploader.jsx
import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ImageUploader = ({ label, currentImage = '', onImageUpload, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.imageUrl) {
        setPreview(response.data.imageUrl);
        onImageUpload(response.data.imageUrl);
        toast.success('Image uploaded!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setPreview(currentImage); // revert
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    if (onRemove) onRemove();
    else onImageUpload(''); // clear the URL
    toast.success('Image removed');
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}
      
      {preview ? (
        <div className="relative inline-block group">
          <img src={preview} alt="Preview" className="max-h-32 rounded-lg border border-gray-200 object-contain bg-gray-50" />
          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              title="Remove image"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <label className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer">
              <ArrowPathIcon className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
            </label>
          </div>
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
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default ImageUploader;