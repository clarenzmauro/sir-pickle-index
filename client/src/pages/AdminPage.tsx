import React, { useState } from 'react';
import apiService from '../services/apiService.js';
import styles from './AdminPage.module.css';

interface FormData {
  title: string;
  publicationDate: string;
  videoUrl: string;
  category: string;
  tags: string;
  transcript: string;
}

interface FormErrors {
  title?: string;
  publicationDate?: string;
  videoUrl?: string;
  category?: string;
  tags?: string;
  transcript?: string;
}

const AdminPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    publicationDate: '',
    videoUrl: '',
    category: '',
    tags: '',
    transcript: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.publicationDate) {
      newErrors.publicationDate = 'Publication date is required';
    }

    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    } else if (!isValidUrl(formData.videoUrl)) {
      newErrors.videoUrl = 'Please enter a valid URL';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.transcript.trim()) {
      newErrors.transcript = 'Transcript is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await apiService.uploadVideo(formData);
      setSubmitMessage({
        type: 'success',
        text: `Video uploaded successfully! ID: ${response.videoId}`
      });
      
      // Reset form on success
      setFormData({
        title: '',
        publicationDate: '',
        videoUrl: '',
        category: '',
        tags: '',
        transcript: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video. Please try again.';
      setSubmitMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.adminPageContainer}>
      <div className={styles.pageHeader}>
        <h2>Upload New Content</h2>
        <p>Add new video content to the Sir Pickle AI knowledge base</p>
      </div>

      {submitMessage && (
        <div className={`${styles.messageBox} ${styles[submitMessage.type]}`}>
          {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.uploadForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Enter video title..."
            disabled={isSubmitting}
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="publicationDate" className={styles.label}>
            Publication Date *
          </label>
          <input
            type="date"
            id="publicationDate"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.publicationDate ? styles.inputError : ''}`}
            disabled={isSubmitting}
          />
          {errors.publicationDate && <span className={styles.errorText}>{errors.publicationDate}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="videoUrl" className={styles.label}>
            Video URL *
          </label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.videoUrl ? styles.inputError : ''}`}
            placeholder="https://youtube.com/watch?v=..."
            disabled={isSubmitting}
          />
          {errors.videoUrl && <span className={styles.errorText}>{errors.videoUrl}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.label}>
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`${styles.input} ${styles.select} ${errors.category ? styles.inputError : ''}`}
            disabled={isSubmitting}
          >
            <option value="">Select a category...</option>
            <option value="youtube-videos">YouTube Videos</option>
            <option value="youtube-livestreams">YouTube Livestreams</option>
            <option value="discord-livestreams">Discord Livestreams</option>
          </select>
          {errors.category && <span className={styles.errorText}>{errors.category}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.label}>
            Tags
            <span className={styles.helpText}>(comma-separated, e.g., "trading, analysis, strategy")</span>
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="Enter tags separated by commas..."
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="transcript" className={styles.label}>
            Transcript *
          </label>
          <textarea
            id="transcript"
            name="transcript"
            value={formData.transcript}
            onChange={handleInputChange}
            className={`${styles.textarea} ${errors.transcript ? styles.inputError : ''}`}
            placeholder="Paste the video transcript here..."
            rows={10}
            disabled={isSubmitting}
          />
          {errors.transcript && <span className={styles.errorText}>{errors.transcript}</span>}
        </div>

        <div className={styles.submitContainer}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Uploading...
              </>
            ) : (
              'Upload Video'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPage;