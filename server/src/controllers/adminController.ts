// src/controllers/adminController.ts
import { Request, Response, NextFunction } from 'express';
import Video, { IVideo } from '../models/Video';
import VideoChunk from '../models/VideoChunk'; // Import the VideoChunk model
import { simpleChunker } from '../utils/textUtils'; // Import the chunker
import { generateEmbedding } from '../services/embeddingService'; // Import embedding generator

const CHUNK_SIZE = 1500; // Characters, from our simpleChunker default
const CHUNK_OVERLAP = 200; // Characters, from our simpleChunker default

export const uploadVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      publicationDate,
      videoUrl,
      category,
      tags,
      transcript,
    } = req.body;

    if (
      !title ||
      !publicationDate ||
      !videoUrl ||
      !category ||
      !transcript
    ) {
      res.status(400).json({
        message:
          'Missing required fields: title, publicationDate, videoUrl, category, transcript.',
      });
      return;
    }

    let processedTags: string[] = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      processedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    const newVideoData: Partial<IVideo> = {
      title,
      publicationDate: new Date(publicationDate),
      videoUrl,
      category,
      tags: processedTags,
      transcript,
    };

    const newVideo = new Video(newVideoData);
    await newVideo.save();

    // --- Start: Chunking and Embedding Process ---
    console.log(`[adminController:uploadVideo] Video saved: ${newVideo._id}. Starting chunking and embedding...`);
    const textChunks = simpleChunker(newVideo.transcript, CHUNK_SIZE, CHUNK_OVERLAP);
    let chunksProcessed = 0;
    let embeddingsFailed = 0;

    for (const chunk of textChunks) {
      const embeddingVector = await generateEmbedding(chunk.text);

      if (embeddingVector) {
        const videoChunkData = {
          videoId: newVideo._id,
          videoTitle: newVideo.title, // Denormalized title
          chunkText: chunk.text,
          embedding: embeddingVector,
        };
        const newChunk = new VideoChunk(videoChunkData);
        try {
          await newChunk.save();
          chunksProcessed++;
        } catch (chunkSaveError) {
          console.error(`[adminController:uploadVideo] Error saving chunk for video ${newVideo._id}:`, chunkSaveError);
          // Decide if you want to stop or continue if a chunk fails to save
        }
      } else {
        embeddingsFailed++;
        console.warn(`[adminController:uploadVideo] Failed to generate embedding for a chunk of video ${newVideo._id}. Text: ${chunk.text.substring(0,100)}...`);
      }
    }
    console.log(`[adminController:uploadVideo] Finished chunking for video ${newVideo._id}. ${chunksProcessed} chunks created. ${embeddingsFailed} embedding generations failed.`);
    // --- End: Chunking and Embedding Process ---


    res.status(201).json({
      message: `Video transcript uploaded successfully. ${chunksProcessed} chunks created.`,
      videoId: newVideo._id,
      data: newVideo, // Still return the main video data
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res
        .status(400)
        .json({ message: 'Validation Error', details: error.message });
      return;
    }
    console.error('[adminController:uploadVideo] Error:', error);
    next(error);
  }
};