import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db'; // Adjust path to your db connection
import Video, { IVideo } from '../src/models/Video'; // Adjust path
import VideoChunk from '../src/models/VideoChunk'; // Adjust path
import { simpleChunker } from '../src/utils/textUtils'; // Adjust path
import { generateEmbedding } from '../src/services/embeddingService'; // Adjust path

dotenv.config({ path: '.env' }); // Ensure .env from server root is loaded

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

const backfillChunks = async () => {
  console.log('Starting backfill process for video chunks...');
  await connectDB(); // Connect to the database

  try {
    const allVideos = await Video.find({}).lean(); // Get all videos
    console.log(`Found ${allVideos.length} videos to process.`);

    for (const video of allVideos) {
      console.log(`\nProcessing video: ${video.title} (ID: ${video._id})`);

      // Optional: Check if chunks already exist for this video to avoid reprocessing
      const existingChunksCount = await VideoChunk.countDocuments({ videoId: video._id });
      if (existingChunksCount > 0) {
        console.log(`  Video ID ${video._id} already has ${existingChunksCount} chunks. Skipping.`);
        continue; // Skip to the next video
      }

      if (!video.transcript || video.transcript.trim() === "") {
        console.log(`  Video ID ${video._id} has no transcript. Skipping.`);
        continue;
      }

      const textChunks = simpleChunker(video.transcript, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`  Generated ${textChunks.length} chunks for this video.`);

      let chunksSuccessfullyProcessed = 0;
      let embeddingsFailedForThisVideo = 0;

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        process.stdout.write(`  Processing chunk ${i + 1}/${textChunks.length}... `); // Progress indicator

        const embeddingVector = await generateEmbedding(chunk.text);

        if (embeddingVector) {
          const videoChunkData = {
            videoId: video._id,
            videoTitle: video.title,
            chunkText: chunk.text,
            embedding: embeddingVector,
          };
          const newChunk = new VideoChunk(videoChunkData);
          try {
            await newChunk.save();
            chunksSuccessfullyProcessed++;
            process.stdout.write('Saved.\n');
          } catch (chunkSaveError) {
            process.stdout.write('Save Error.\n');
            console.error(`    Error saving chunk for video ${video._id}:`, chunkSaveError);
          }
        } else {
          embeddingsFailedForThisVideo++;
          process.stdout.write('Embedding Failed.\n');
          console.warn(`    Failed to generate embedding for a chunk of video ${video._id}. Text: ${chunk.text.substring(0,50)}...`);
        }
      }
      console.log(`  Finished processing video ${video._id}. ${chunksSuccessfullyProcessed} chunks saved. ${embeddingsFailedForThisVideo} embeddings failed.`);
    }

    console.log('\nBackfill process completed!');
  } catch (error) {
    console.error('Error during backfill process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

// Run the backfill function
backfillChunks().catch(err => {
    console.error("Unhandled error in backfill script:", err);
    process.exit(1);
});