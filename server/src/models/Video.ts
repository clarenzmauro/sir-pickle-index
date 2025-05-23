import mongoose, { Schema, Document } from 'mongoose';

// Interface to define the structure of a Video document
export interface IVideo extends Document {
  title: string;
  publicationDate: Date;
  videoUrl: string;
  category: string;
  tags: string[];
  transcript: string;
  // createdAt and updatedAt are automatically managed by timestamps: true
}

const VideoSchema: Schema<IVideo> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required.'],
      trim: true,
    },
    publicationDate: {
      type: Date,
      required: [true, 'Publication date is required.'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required.'],
      trim: true,
      // Consider adding a regex validator for URL format if needed
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => tags.map(tag => tag.toLowerCase().trim())
    },
    transcript: {
      type: String,
      required: [true, 'Transcript is required.'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'videos', // Explicitly set the collection name
  }
);

// Create a text index on the transcript field for efficient keyword searching
// Also index other fields as per PRD (tags, category)
VideoSchema.index({ transcript: 'text' }); // For keyword search
VideoSchema.index({ tags: 1 }); // For filtering/searching by tags
VideoSchema.index({ category: 1 }); // For filtering/searching by category
VideoSchema.index({ publicationDate: -1 }); // For sorting by date

const Video = mongoose.model<IVideo>('Video', VideoSchema);

export default Video;