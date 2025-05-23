import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for the vector embedding (assuming 768 dimensions for text-embedding-004)
// For gemini-embedding-exp-03-07, it might be 1024 or higher. Adjust if needed.
export interface IEmbedding extends Array<number> {}

export interface IVideoChunk extends Document {
  videoId: Types.ObjectId; // Reference to the parent Video document
  videoTitle: string; // Denormalized for easier display with search results
  chunkText: string;
  embedding: IEmbedding; // The vector embedding
  // Optional: add chunkOrder or start/end character positions if needed later
  createdAt?: Date;
  updatedAt?: Date;
}

const VideoChunkSchema: Schema<IVideoChunk> = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video', // Creates a reference to the Video model
      required: true,
      index: true, // Good to index foreign keys
    },
    videoTitle: { // Denormalized data
      type: String,
      required: true,
    },
    chunkText: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // Array of numbers
      required: true,
      // Note: MongoDB doesn't directly validate array length here,
      // but your vector index will expect a consistent dimension.
    },
  },
  {
    timestamps: true,
    collection: 'videochunks',
  }
);

// We will create the vector search index directly in MongoDB Atlas UI or via shell.
// No need for a Mongoose index here for the vector field itself for $vectorSearch.

const VideoChunk = mongoose.model<IVideoChunk>(
  'VideoChunk',
  VideoChunkSchema
);

export default VideoChunk;