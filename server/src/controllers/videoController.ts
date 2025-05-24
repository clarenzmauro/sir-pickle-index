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

// --- Utility functions for timestamp handling ---

/**
 * Extracts the first timestamp from a transcript chunk
 * @param text - The transcript text that may contain timestamps (HH:MM:SS format)
 * @returns The first timestamp string found or null if not found
 */
const extractTimestamp = (text: string): string | null => {
  // Match HH:MM:SS format anywhere in the text, prioritizing earlier occurrences
  const timestampMatch = text.match(/(\d{2}:\d{2}:\d{2})/);
  const result = timestampMatch ? timestampMatch[1] : null;
  console.log(`[extractTimestamp] Input: "${text.substring(0, 100)}..." -> Found: ${result}`);
  return result;
};

/**
 * Converts timestamp (HH:MM:SS) to seconds
 * @param timestamp - Timestamp in HH:MM:SS format
 * @returns Total seconds as number
 */
const timestampToSeconds = (timestamp: string): number => {
  try {
    // Ensure we have the correct format and clean the input
    const cleanTimestamp = timestamp.trim();
    const parts = cleanTimestamp.split(':');
    
    if (parts.length === 3) {
      // HH:MM:SS format
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      console.log(`[timestampToSeconds] Converting ${timestamp} -> Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds} -> Total: ${totalSeconds}s`);
      return totalSeconds;
    } else if (parts.length === 2) {
      // MM:SS format (no hours)
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      
      const totalSeconds = minutes * 60 + seconds;
      console.log(`[timestampToSeconds] Converting ${timestamp} -> Minutes: ${minutes}, Seconds: ${seconds} -> Total: ${totalSeconds}s`);
      return totalSeconds;
    } else {
      console.warn(`[timestampToSeconds] Invalid timestamp format: ${timestamp}`);
      return 0;
    }
  } catch (error) {
    console.error(`[timestampToSeconds] Error converting timestamp ${timestamp}:`, error);
    return 0;
  }
};

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url - YouTube URL
 * @returns Video ID or null if not found
 */
const extractYouTubeVideoId = (url: string): string | null => {
  console.log(`[extractYouTubeVideoId] Processing URL: ${url}`);
  
  const patterns = [
    // youtu.be/VIDEO_ID (with or without query params)
    /(?:youtu\.be\/)([^?&\n#]+)/,
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    // youtube.com/v/VIDEO_ID
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      console.log(`[extractYouTubeVideoId] Found video ID: ${videoId}`);
      return videoId;
    }
  }
  
  console.warn(`[extractYouTubeVideoId] No video ID found in URL: ${url}`);
  return null;
};

/**
 * Generates a timestamped YouTube URL
 * @param videoUrl - Original YouTube URL
 * @param timestamp - Timestamp in HH:MM:SS format
 * @returns Timestamped YouTube URL or original URL if processing fails
 */
const generateTimestampedUrl = (videoUrl: string, timestamp: string): string => {
  try {
    console.log(`[generateTimestampedUrl] Processing: videoUrl=${videoUrl}, timestamp=${timestamp}`);
    
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      console.warn(`[generateTimestampedUrl] Could not extract video ID from: ${videoUrl}`);
      return videoUrl;
    }
    
    const seconds = timestampToSeconds(timestamp);
    if (seconds === 0) {
      console.warn(`[generateTimestampedUrl] Timestamp conversion resulted in 0 seconds for: ${timestamp}`);
      return videoUrl;
    }
    
    // Use the simple seconds format which is most reliable
    const finalUrl = `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
    console.log(`[generateTimestampedUrl] Generated URL: ${finalUrl}`);
    
    return finalUrl;
  } catch (error) {
    console.error('[generateTimestampedUrl] Failed to generate timestamped URL:', error);
    return videoUrl;
  }
};

/**
 * Gets timestamp link text and URL from chunk text and video URL
 * @param chunkText - The transcript chunk text
 * @param videoUrl - The video URL
 * @returns Object with linkText and timestampedUrl
 */
const getTimestampInfo = (chunkText: string, videoUrl: string): { linkText: string; timestampedUrl: string } => {
  console.log(`[getTimestampInfo] Processing chunk: "${chunkText.substring(0, 50)}..." with videoUrl: ${videoUrl}`);
  
  const timestamp = extractTimestamp(chunkText);
  
  if (timestamp && videoUrl) {
    const result = {
      linkText: `${timestamp}`,
      timestampedUrl: generateTimestampedUrl(videoUrl, timestamp)
    };
    console.log(`[getTimestampInfo] Result: linkText="${result.linkText}", timestampedUrl="${result.timestampedUrl}"`);
    return result;
  }
  
  const fallback = {
    linkText: 'Watch video',
    timestampedUrl: videoUrl || '#'
  };
  console.log(`[getTimestampInfo] Fallback result: linkText="${fallback.linkText}", timestampedUrl="${fallback.timestampedUrl}"`);
  return fallback;
};

/**
 * Processes the AI answer to extract citation markers and create a structured format
 * @param structuredAnswer - The AI-generated structured answer object with multiple fields
 * @param citations - Array of citation objects with id and sourceIndex
 * @returns Object with processed answer parts and citation mapping for each field
 */
const processAnswerWithCitations = (structuredAnswer: any, citations: Array<{id: number, sourceIndex: number}>) => {
  console.log('[processAnswerWithCitations] Starting processing with citations:', citations);
  
  // Create a map of citation IDs to sourceIndex for quick lookup
  const citationMap = new Map(citations.map(c => [c.id, c.sourceIndex]));
  console.log('[processAnswerWithCitations] Citation map:', Object.fromEntries(citationMap));
  
  /**
   * Process a single text field to extract citations
   */
  const processTextField = (text: string) => {
    console.log(`[processAnswerWithCitations] Processing field with text: "${text.substring(0, 100)}..."`);
    
    const parts: Array<{type: 'text' | 'citation', content: string, sourceIndex?: number}> = [];
    const citationRegex = /\[Source (\d+)\]/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        const textContent = text.substring(lastIndex, match.index);
        if (textContent.trim()) {
          parts.push({ type: 'text', content: textContent });
        }
      }
      
      // Add citation
      const citationId = parseInt(match[1]);
      const sourceIndex = citationMap.get(citationId);
      console.log(`[processAnswerWithCitations] Found citation [Source ${citationId}] -> sourceIndex: ${sourceIndex}`);
      
      parts.push({ 
        type: 'citation', 
        content: `[${citationId}]`,
        sourceIndex: sourceIndex 
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last citation
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    // If no citations found, return the whole text as one part
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }
    
    console.log(`[processAnswerWithCitations] Processed field into ${parts.length} parts:`, parts.map(p => ({type: p.type, content: p.content.substring(0, 50), sourceIndex: p.sourceIndex})));
    return parts;
  };
  
  // Process each field of the structured answer
  const processedFields: any = {};
  
  Object.keys(structuredAnswer).forEach(field => {
    if (typeof structuredAnswer[field] === 'string') {
      processedFields[field] = processTextField(structuredAnswer[field]);
    } else {
      // If it's not a string, keep as is
      processedFields[field] = structuredAnswer[field];
    }
  });
  
  return {
    original: structuredAnswer,
    processed: processedFields
  };
};

// --- askQuestion function MODIFIED to use Vector Search and llmService ---
export const askQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const overallStartTime = Date.now(); // Renamed for clarity
    try {
      const { question } = req.body;
  
      if (!question || typeof question !== 'string' || question.trim() === '') {
        res.status(400).json({ message: 'Question is required and must be a non-empty string.' });
        return;
      }
  
      // 1. Generate embedding for the user's question
      console.time('[Timing] generateQueryEmbedding');
      const queryEmbedding = await generateQueryEmbedding(question);
      console.timeEnd('[Timing] generateQueryEmbedding');

      if (!queryEmbedding) {
        res.status(500).json({ message: 'Failed to generate embedding for the question.' });
        return;
      }
  
      // 2. Perform Vector Search on `videochunks` collection
      console.time('[Timing] vectorSearch');
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
      console.timeEnd('[Timing] vectorSearch');

      if (!relevantChunks || relevantChunks.length === 0) {
        res.status(404).json({ message: 'Could not find relevant context for your question using vector search.' });
        return;
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
  
        // Get timestamp information for this chunk
        const timestampInfo = getTimestampInfo(chunk.segment, chunk.videoUrl);
  
        relatedSourcesForResponse.push({
          videoTitle: chunk.title,
          timestampLink: timestampInfo.linkText,
          timestampUrl: timestampInfo.timestampedUrl, // Add the actual timestamped URL
          snippet: chunk.segment.substring(0, MAX_SNIPPET_LENGTH_IN_RESPONSE) + (chunk.segment.length > MAX_SNIPPET_LENGTH_IN_RESPONSE ? '...' : ''),
          publishedDate: chunk.publicationDate,
          tags: chunk.tags,
          channel: 'Sir Pickle', // As per PRD
          category: chunk.category,
          videoUrl: chunk.videoUrl,
        });
      });
  
      if (contextSegmentsForLLM.length === 0) { // Should not happen if relevantChunks has items
          res.status(404).json({ message: "No suitable context segments prepared for the AI." });
          return;
      }
  
      // 4. Call the abstracted LLM service
      console.time('[Timing] generateAnswer LLM call');
      const llmResponsePayload = await generateAnswer(question, contextSegmentsForLLM);
      console.timeEnd('[Timing] generateAnswer LLM call');

      if (!llmResponsePayload || !llmResponsePayload.structuredAnswer || !llmResponsePayload.citations) {
        // Handle case where LLM call failed or returned unexpected/null structure
        console.error("[videoController:askQuestion] LLM service returned null or invalid payload:", llmResponsePayload);
        res.status(500).json({ message: "Failed to get a valid response from the AI model." });
        return;
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
  
      // Process the answer to create structured citation parts
      const processedAnswer = processAnswerWithCitations(llmResponsePayload.structuredAnswer, finalCitations);
  
      const finalResponse = {
        answerTimeMs: Date.now() - overallStartTime, // Use overallStartTime
        structuredAnswer: llmResponsePayload.structuredAnswer,
        processedAnswer: processedAnswer, // Add structured answer with clickable citation data
        citations: finalCitations,
        relatedSources: finalRelatedSources,
      };
  
      res.status(200).json(finalResponse);
      return;
  
    } catch (error) {
      console.error('[videoController:askQuestion] Error:', error);
      next(error);
    }
  };

// --- searchVideosByKeyword (Enhanced with better keyword matching) ---
export const searchVideosByKeyword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const keyword = req.query.keyword as string;
  
      if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
        res
          .status(400)
          .json({ message: 'Keyword query parameter is required.' });
        return;
      }

      // First get videos using MongoDB text search
      const videos = await Video.find(
        { $text: { $search: keyword } },
        { score: { $meta: 'textScore' } }
      )
        .select('title publicationDate videoUrl category tags transcript createdAt')
        .sort({ score: { $meta: 'textScore' } })
        .lean();
  
      if (!videos || videos.length === 0) {
        res
          .status(404)
          .json({ message: 'No videos found matching your keyword.' });
        return;
      }

      // Helper function to find the best match position in text
      const findBestMatchPosition = (text: string, searchTerms: string[]): { position: number; matchedTerms: string[] } => {
        const textLower = text.toLowerCase();
        let bestPosition = -1;
        let bestScore = 0;
        let bestMatchedTerms: string[] = [];
        
        // Look for exact phrase first
        const exactPhraseIndex = textLower.indexOf(keyword.toLowerCase());
        if (exactPhraseIndex !== -1) {
          return { 
            position: exactPhraseIndex, 
            matchedTerms: [keyword.toLowerCase()] 
          };
        }
        
        // Look for positions where multiple search terms appear close together
        for (let i = 0; i < text.length - 50; i++) {
          const window = textLower.substring(i, i + 200); // 200-char window
          const matchedInWindow = searchTerms.filter(term => window.includes(term));
          
          if (matchedInWindow.length > bestScore) {
            bestScore = matchedInWindow.length;
            bestPosition = i;
            bestMatchedTerms = matchedInWindow;
          }
        }
        
        // If we found at least one term, return that position
        if (bestScore > 0) {
          return { position: bestPosition, matchedTerms: bestMatchedTerms };
        }
        
        // Last resort: look for any single term
        for (const term of searchTerms) {
          const termIndex = textLower.indexOf(term);
          if (termIndex !== -1) {
            return { position: termIndex, matchedTerms: [term] };
          }
        }
        
        return { position: -1, matchedTerms: [] };
      };

      // Split keyword into individual terms for better matching
      const searchTerms = keyword.toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 2); // Filter out very short words like "a", "is", etc.

      const results = videos.map((video) => {
        let snippet = '';
        let timestampInfo = { linkText: 'Watch video', timestampedUrl: video.videoUrl };
        
        const transcriptLower = video.transcript.toLowerCase();
        const titleLower = video.title.toLowerCase();
        
        // Check if keywords appear in title first (higher relevance)
        const titleMatch = searchTerms.some(term => titleLower.includes(term));
        
        // Find the best match position in transcript
        const matchResult = findBestMatchPosition(video.transcript, searchTerms);
        
        if (matchResult.position !== -1) {
          // Extract snippet around the matched content
          const snippetContextLength = 50;
          const snippetTotalLength = 250;
          const matchPosition = matchResult.position;
          
          const startIndex = Math.max(0, matchPosition - snippetContextLength);
          const endIndex = Math.min(
            video.transcript.length,
            matchPosition + snippetTotalLength - snippetContextLength
          );
          
          snippet = video.transcript.substring(startIndex, endIndex);
          if (startIndex > 0) snippet = '...' + snippet;
          if (endIndex < video.transcript.length) snippet = snippet + '...';

          // Extract timestamp from the snippet context
          const snippetTimestamp = extractTimestamp(snippet);
          
          if (snippetTimestamp) {
            timestampInfo = {
              linkText: `${snippetTimestamp}`,
              timestampedUrl: generateTimestampedUrl(video.videoUrl, snippetTimestamp)
            };
          } else {
            // Look backwards from match position to find nearest timestamp
            const precedingText = video.transcript.substring(0, matchPosition);
            const timestampMatches = precedingText.match(/(\d{2}:\d{2}:\d{2})/g);
            
            if (timestampMatches && timestampMatches.length > 0) {
              const nearestTimestamp = timestampMatches[timestampMatches.length - 1];
              timestampInfo = {
                linkText: `${nearestTimestamp}`,
                timestampedUrl: generateTimestampedUrl(video.videoUrl, nearestTimestamp)
              };
            }
          }
        } else if (titleMatch) {
          // If keywords are in title but not found in transcript content, 
          // still include but use beginning of transcript
          snippet = video.transcript.substring(0, 250) + (video.transcript.length > 250 ? '...' : '');
          console.log(`[searchVideosByKeyword] Title match but no transcript match for: ${video.title}`);
        } else {
          // This video probably shouldn't be in results, but MongoDB text search included it
          // Log this case and use beginning of transcript
          snippet = video.transcript.substring(0, 250) + (video.transcript.length > 250 ? '...' : '');
          console.log(`[searchVideosByKeyword] No clear match found for "${keyword}" in: ${video.title}`);
        }
  
        return {
          videoTitle: video.title,
          timestampLink: timestampInfo.linkText,
          timestampUrl: timestampInfo.timestampedUrl,
          snippet: snippet,
          publishedDate: video.publicationDate,
          tags: video.tags,
          channel: 'Sir Pickle',
          category: video.category,
          videoUrl: video.videoUrl,
        };
      });

      // Filter out results that have no clear relevance (optional - you might want to keep this for debugging)
      const filteredResults = results.filter(result => {
        const hasKeywordInTitle = searchTerms.some(term => 
          result.videoTitle.toLowerCase().includes(term)
        );
        const hasKeywordInSnippet = searchTerms.some(term => 
          result.snippet.toLowerCase().includes(term)
        );
        
        const isRelevant = hasKeywordInTitle || hasKeywordInSnippet;
        
        if (!isRelevant) {
          console.log(`[searchVideosByKeyword] Filtering out irrelevant result: ${result.videoTitle}`);
        }
        
        return isRelevant;
      });
  
      res.status(200).json({ results: filteredResults });
      return;
    } catch (error) {
      console.error('[videoController:searchVideosByKeyword] Error:', error);
      next(error);
    }
  };