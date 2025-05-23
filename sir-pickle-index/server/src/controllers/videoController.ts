// src/controllers/videoController.ts
import { Request, Response, NextFunction } from 'express';
import Video from '../models/Video';
import VideoChunk from '../models/VideoChunk';
import { generateQueryEmbedding } from '../services/embeddingService';
import { generateAnswer } from '../services/llmService'; // Import from the new LLM service
import dotenv from 'dotenv';

dotenv.config();

const MAX_SNIPPET_LENGTH_IN_RESPONSE = 1024; // Max characters for the snippet in relatedSources display
const MAX_CONTEXT_SEGMENTS_FOR_LLM = 5; // How many top chunks to send to the LLM

// --- askQuestion function MODIFIED to use Vector Search and llmService ---
export const askQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const startTime = Date.now();
    try {
      const { question } = req.body;
  
      if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ message: 'Question is required and must be a non-empty string.' });
      }
  
      // 1. Generate embedding for the user's question
      const queryEmbedding = await generateQueryEmbedding(question);
      if (!queryEmbedding) {
        return res.status(500).json({ message: 'Failed to generate embedding for the question.' });
      }
  
      // 2. Perform Vector Search on `videochunks` collection
      const relevantChunks = await VideoChunk.aggregate([
        {
          $vectorSearch: {
            index: 'spi_vector_index', // YOUR ATLAS VECTOR SEARCH INDEX NAME
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: MAX_CONTEXT_SEGMENTS_FOR_LLM,
            // Example filter (uncomment and adapt if needed):
            // filter: {
            //   videoId: new mongoose.Types.ObjectId("your_specific_video_id_to_filter_by")
            // }
          },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videoId",
                foreignField: "_id",
                as: "videoInfo"
            }
        },
        {
            $unwind: { // Use object form for preserveNullAndEmptyArrays if needed
                path: "$videoInfo",
                preserveNullAndEmptyArrays: true // Keep chunks even if parent video is somehow missing
            }
        },
        {
            $project: {
                _id: 0,
                title: "$videoTitle", // Denormalized in VideoChunk
                segment: "$chunkText",
                // originalIndex: "$_id", // Using chunk's _id might be too specific if AI needs 0-based index of this result set
                videoId: "$videoId",
                videoUrl: "$videoInfo.videoUrl", // From joined Video document
                publicationDate: "$videoInfo.publicationDate",
                tags: "$videoInfo.tags",
                category: "$videoInfo.category",
                // searchScore: { $meta: "vectorSearchScore" } // If you want the score
            }
        }
      ]).exec();

      if (!relevantChunks || relevantChunks.length === 0) {
        return res.status(404).json({ message: 'Could not find relevant context for your question using vector search.' });
      }
  
      // 3. Prepare context for LLM and sources for the final response
      const contextSegmentsForLLM: Array<{ title: string, segment: string, originalIndex: number, videoId?: string, videoUrl?: string }> = [];
      const relatedSourcesForResponse: any[] = [];
  
      relevantChunks.forEach((chunk: any, index) => {
        contextSegmentsForLLM.push({
          title: chunk.title,
          segment: chunk.segment,
          originalIndex: index, // This is the 0-based index within the `relevantChunks` array
          videoId: chunk.videoId?.toString(), // Ensure it's a string
          videoUrl: chunk.videoUrl
        });
  
        relatedSourcesForResponse.push({
          videoTitle: chunk.title,
          timestampLink: `Relevant segment from video`,
          snippet: chunk.segment.substring(0, MAX_SNIPPET_LENGTH_IN_RESPONSE) + (chunk.segment.length > MAX_SNIPPET_LENGTH_IN_RESPONSE ? '...' : ''),
          publishedDate: chunk.publicationDate,
          tags: chunk.tags,
          channel: 'Sir Pickle', // As per PRD
          category: chunk.category,
          videoUrl: chunk.videoUrl,
        });
      });
  
      if (contextSegmentsForLLM.length === 0) { // Should not happen if relevantChunks has items
          return res.status(404).json({ message: "No suitable context segments prepared for the AI." });
      }
  
      // 4. Call the abstracted LLM service
      const llmResponsePayload = await generateAnswer(question, contextSegmentsForLLM);

      if (!llmResponsePayload || !llmResponsePayload.structuredAnswer || !llmResponsePayload.citations) {
        // Handle case where LLM call failed or returned unexpected/null structure
        console.error("[videoController:askQuestion] LLM service returned null or invalid payload:", llmResponsePayload);
        return res.status(500).json({ message: "Failed to get a valid response from the AI model." });
      }
  
      // The `sourceIndex` in `llmResponsePayload.citations` refers to the 0-based index
      // of the items in `contextSegmentsForLLM` (and thus `relatedSourcesForResponse`).
      const finalCitations = llmResponsePayload.citations.map((cit: {id: number, sourceIndex: number}) => ({
          id: cit.id, // This is the [Source X] number AI used in its text
          sourceIndex: cit.sourceIndex
      }));
  
      // Filter relatedSources to only include those actually cited by the AI
      // and ensure the sourceIndex is valid.
      const finalRelatedSources = finalCitations
        .filter(cit => cit.sourceIndex >= 0 && cit.sourceIndex < relatedSourcesForResponse.length)
        .map(cit => relatedSourcesForResponse[cit.sourceIndex]);
  
      const finalResponse = {
        answerTimeMs: Date.now() - startTime,
        structuredAnswer: llmResponsePayload.structuredAnswer,
        citations: finalCitations,
        relatedSources: finalRelatedSources,
      };
  
      res.status(200).json(finalResponse);
  
    } catch (error) {
      console.error('[videoController:askQuestion] Error:', error);
      next(error);
    }
  };

// --- searchVideosByKeyword (Non-AI, remains the same) ---
export const searchVideosByKeyword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const keyword = req.query.keyword as string;
  
      if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
        return res
          .status(400)
          .json({ message: 'Keyword query parameter is required.' });
      }
      const videos = await Video.find(
        { $text: { $search: keyword } },
        { score: { $meta: 'textScore' } }
      )
        .select('title publicationDate videoUrl category tags transcript createdAt')
        .sort({ score: { $meta: 'textScore' } })
        .lean();
  
      if (!videos || videos.length === 0) {
        return res
          .status(404)
          .json({ message: 'No videos found matching your keyword.' });
      }
  
      const results = videos.map((video) => {
        let snippet = '';
        const transcriptLower = video.transcript.toLowerCase();
        const keywordLower = keyword.toLowerCase();
        const firstIndex = transcriptLower.indexOf(keywordLower);
        const snippetContextLength = 50; // Characters before keyword
        const snippetTotalLength = 250; // Approx total length of snippet

        if (firstIndex !== -1) {
          const startIndex = Math.max(0, firstIndex - snippetContextLength);
          const endIndex = Math.min(
            video.transcript.length,
            firstIndex + keyword.length + (snippetTotalLength - keyword.length - snippetContextLength)
          );
          snippet = video.transcript.substring(startIndex, endIndex);
          if (startIndex > 0) snippet = '...' + snippet;
          if (endIndex < video.transcript.length) snippet = snippet + '...';
        } else {
          snippet = video.transcript.substring(0, snippetTotalLength) + (video.transcript.length > snippetTotalLength ? '...' : '');
        }
  
        return {
          videoTitle: video.title,
          timestampLink: `Snippet found`, // Placeholder
          snippet: snippet,
          publishedDate: video.publicationDate,
          tags: video.tags,
          channel: 'Sir Pickle', // As per PRD
          category: video.category,
          videoUrl: video.videoUrl,
        };
      });
  
      res.status(200).json({ results });
    } catch (error) {
      console.error('[videoController:searchVideosByKeyword] Error:', error);
      next(error);
    }
  };