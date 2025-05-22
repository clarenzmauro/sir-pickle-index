import { Request, Response, NextFunction } from 'express';
import Video, { IVideo } from '../models/Video'; 
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const MAX_SNIPPET_LENGTH = 2048; // Max characters for the snippet
const MAX_CONTEXT_SEGMENTS = 5;
const MAX_SEGMENT_LENGTH_FOR_AI = 3000;

const GEMMA_API_KEY = process.env.GEMMA_API_KEY;
const MODEL_NAME = 'gemma-3n-e4b-it'

if (!GEMMA_API_KEY) {
    console.warn('[videoController] GEMMA_API_KEY is not set. AI functionality will be disabled.');
}

const genAI = GEMMA_API_KEY ? new GoogleGenerativeAI(GEMMA_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: MODEL_NAME }) : null;

const callGemmaApi = async (question: string, contextSegments: Array<{ title: string, segment: string, originalIndex: number }>): Promise<any> => {
    if (!model) {
      console.error("Gemma AI Model not initialized. Check API Key.");
      // Return a structure that matches what the calling function expects, but indicates an error
      return {
        structuredAnswer: {
          introduction: "AI Model Error: Could not initialize Gemma.",
          explanation: "Please check the server configuration and API key.",
          examples: "", tips: "", caveats: ""
        },
        citations: [],
      };
    }
  
    console.log('\n--- Calling Real Gemma API ---');
    console.log('Question:', question);
  
    let promptContext = "You are an AI assistant for 'Sir Pickle', a trading influencer. Answer the user's question based *only* on the following provided context segments from Sir Pickle's video transcripts. Structure your answer clearly with headings like 'Introduction', 'Explanation', 'Examples from the Sources', 'Key Takeaways', and 'Important Considerations'. Cite sources using the format [Source X] where X is the 1-based index of the source segment provided below. If the answer cannot be found in the context, state that clearly. Format your entire response as a single JSON object. The JSON object should have two top-level keys: \"structuredAnswer\" and \"citations\". The \"structuredAnswer\" object should contain keys: \"introduction\", \"explanation\", \"examples\", \"tips\", \"caveats\", with their corresponding text content. The \"citations\" array should contain objects, each with an \"id\" (the 1-based source number you used, e.g., 1 for [Source 1]) and a \"sourceIndex\" (the 0-based original video segment index I provided in the prompt, like \"Originally video segment index 0\"). Example JSON output format: { \"structuredAnswer\": { \"introduction\": \"Text for introduction...\", \"explanation\": \"Text for explanation...\", \"examples\": \"Text for examples...\", \"tips\": \"Text for tips...\", \"caveats\": \"Text for caveats...\" }, \"citations\": [ { \"id\": 1, \"sourceIndex\": 0 }, { \"id\": 2, \"sourceIndex\": 1 } ] }\n\n";
  
    const contextForPromptMapping: Array<{ aiSourceIndex: number, originalSourceIndex: number }> = [];
  
    contextSegments.forEach((item, index) => {
      const aiSourceIndex = index + 1; // 1-based index for the AI prompt
      promptContext += `--- Source ${aiSourceIndex} (Originally video segment index ${item.originalIndex}) ---\n`;
      promptContext += `Title: ${item.title}\n`;
      promptContext += `Transcript Segment: "${item.segment}"\n---\n\n`;
      contextForPromptMapping.push({ aiSourceIndex, originalSourceIndex: item.originalIndex });
    });
  
    promptContext += `User's Question: "${question}"\n\nAnswer:`;
  
    // console.log("Full prompt being sent to Gemma:\n", promptContext);
  
    try {
      const generationConfig = {
        temperature: 0.6, 
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048, 
      };
  
      const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];
  
      const chat = model.startChat({
          generationConfig,
          safetySettings,
          history: [], // No prior history for this interaction model
      });
  
      const result = await chat.sendMessage(promptContext);
      const responseText = result.response.text();
  
      console.log('--- Gemma API Response Text ---');
      console.log(responseText);
  
      // --- PARSE THE JSON RESPONSE ---
      let parsedResponse;
      try {
        // Gemma might sometimes wrap its JSON in ```json ... ``` markdown.
        // Let's try to strip that if it exists.
        const cleanedResponseText = responseText.replace(/^```json\s*([\s\S]*?)\s*```$/, '$1').trim();
        parsedResponse = JSON.parse(cleanedResponseText);
        console.log('--- Successfully Parsed JSON from Gemma ---');
        console.log(parsedResponse);
      } catch (parseError) {
        console.error('--- Failed to parse JSON from Gemma API Response ---', parseError);
        console.error('Raw response was:', responseText);
        // Return an error structure if JSON parsing fails
        return {
          structuredAnswer: {
            introduction: "AI Parsing Error: Could not parse JSON response from Gemma.",
            explanation: "The AI's response was not valid JSON. Raw response: " + responseText.substring(0, 200) + "...",
            examples: "", tips: "", caveats: ""
          },
          citations: [],
        };
      }

      // Ensure the parsedResponse has the expected structure
      if (!parsedResponse || !parsedResponse.structuredAnswer || !parsedResponse.citations) {
        console.error('--- Parsed JSON from Gemma is missing expected keys ---');
        return {
            structuredAnswer: {
              introduction: "AI Structure Error: Parsed JSON missing expected keys.",
              explanation: "The AI's JSON response did not have structuredAnswer or citations.",
              examples: "", tips: "", caveats: ""
            },
            citations: [],
          };
      }
  
      return {
        structuredAnswer: parsedResponse.structuredAnswer,
        citations: parsedResponse.citations, // These should already have id and sourceIndex from Gemma
      };
  
    } catch (error) {
      console.error('--- Gemma API Call Error ---', error);
      return {
        structuredAnswer: {
          introduction: "AI API Error: Failed to get response from Gemma.",
          explanation: error instanceof Error ? error.message : "Unknown AI error",
          examples: "", tips: "", caveats: ""
        },
        citations: [],
      };
    }
  };
  
  // Modify askQuestion to pass an array of segment objects to callGemmaApi
  export const askQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const startTime = Date.now();
    try {
      const { question } = req.body;
  
      if (!question || typeof question !== 'string' || question.trim() === '') {
        return res
          .status(400)
          .json({
            message: 'Question is required and must be a non-empty string.',
          });
      }
  
      const keywordsForSearch = question.split(' ').filter(word => word.length > 2).join(' '); // slightly more inclusive keywords
  
      const relevantVideos = await Video.find(
        { $text: { $search: keywordsForSearch } },
        { score: { $meta: 'textScore' } }
      )
      .select('title publicationDate videoUrl category tags transcript')
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_CONTEXT_SEGMENTS)
      .lean();
  
      if (!relevantVideos || relevantVideos.length === 0) {
        return res
          .status(404)
          .json({ message: 'Could not find relevant context for your question.' });
      }
  
      const contextSegmentsForAI: Array<{ title: string, segment: string, originalIndex: number }> = [];
      const relatedSourcesForResponse: any[] = [];
  
      relevantVideos.forEach((video, index) => {
        const segment = video.transcript.substring(0, MAX_SEGMENT_LENGTH_FOR_AI) +
                      (video.transcript.length > MAX_SEGMENT_LENGTH_FOR_AI ? '...' : '');
  
        contextSegmentsForAI.push({ title: video.title, segment: segment, originalIndex: index }); // Pass original index for mapping later
  
        relatedSourcesForResponse.push({
          videoTitle: video.title,
          timestampLink: `Segment from video used`, // Placeholder
          snippet: segment.substring(0, MAX_SNIPPET_LENGTH) + (segment.length > MAX_SNIPPET_LENGTH ? '...' : ''),
          publishedDate: video.publicationDate,
          tags: video.tags,
          channel: 'Sir Pickle',
          category: video.category,
          videoUrl: video.videoUrl, // Added videoUrl here for the source display
        });
      });
  
      if (contextSegmentsForAI.length === 0) {
          return res.status(404).json({ message: "No suitable context segments found for the AI." });
      }
  
      const aiResponsePayload = await callGemmaApi(question, contextSegmentsForAI);
  
      // Map AI's citations (which refer to the 0-based index of contextSegmentsForAI)
      // back to the actual video sources in relatedSourcesForResponse.
      // The `aiResponsePayload.citations` should already contain `sourceIndex` which is the original index.
      const finalCitations = aiResponsePayload.citations.map((cit: {id: number, sourceIndex: number}) => ({
          id: cit.id, // This is the [Source X] number AI used
          sourceIndex: cit.sourceIndex // This is the index in the `relatedSourcesForResponse` array
      }));
  
      // Filter relatedSources to only include those actually cited by the AI
      const finalRelatedSources = finalCitations.map((cit: { id: number, sourceIndex: number }) => relatedSourcesForResponse[cit.sourceIndex]).filter((source: any) => source !== undefined);
  
  
      const finalResponse = {
        answerTimeMs: Date.now() - startTime,
        structuredAnswer: aiResponsePayload.structuredAnswer,
        citations: finalCitations,
        relatedSources: finalRelatedSources,
      };
  
      res.status(200).json(finalResponse);
  
    } catch (error) {
      console.error('[videoController:askQuestion] Error:', error);
      next(error);
    }
  };

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

    // MongoDB text search
    // The $meta: "textScore" allows sorting by relevance.
    // We also project only the fields needed as per PRD and performance considerations.
    const videos = await Video.find(
      { $text: { $search: keyword } },
      { score: { $meta: 'textScore' } } // For relevance sorting
    )
      .select(
        'title publicationDate videoUrl category tags transcript createdAt'
      ) // Select necessary fields
      .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
      .lean(); // .lean() returns plain JS objects, faster for read-only

    if (!videos || videos.length === 0) {
      return res
        .status(404)
        .json({ message: 'No videos found matching your keyword.' });
    }

    // Format results as per PRD (including snippet and placeholder for timestamp)
    const results = videos.map((video) => {
      let snippet = '';
      const transcriptLower = video.transcript.toLowerCase();
      const keywordLower = keyword.toLowerCase();
      const firstIndex = transcriptLower.indexOf(keywordLower);

      if (firstIndex !== -1) {
        const startIndex = Math.max(0, firstIndex - 50); // Show some context before
        const endIndex = Math.min(
          video.transcript.length,
          firstIndex + keyword.length + (MAX_SNIPPET_LENGTH - keyword.length - 50)
        );
        snippet = video.transcript.substring(startIndex, endIndex);
        if (startIndex > 0) snippet = '...' + snippet;
        if (endIndex < video.transcript.length) snippet = snippet + '...';
      } else {
        // Fallback if keyword not found in this specific way (should be rare with $text search)
        snippet = video.transcript.substring(0, MAX_SNIPPET_LENGTH) + (video.transcript.length > MAX_SNIPPET_LENGTH ? '...' : '');
      }

      return {
        videoTitle: video.title,
        // PRD: "Approximate timestamp of where the keyword first appears"
        // This is hard to get accurately from raw text without pre-processing.
        // For MVP, we'll use a placeholder or omit if too complex.
        // Let's use a generic indicator for now.
        timestampLink: `Snippet found`, // Placeholder
        snippet: snippet,
        publishedDate: video.publicationDate,
        tags: video.tags,
        channel: 'Sir Pickle', // As per PRD
        category: video.category,
        videoUrl: video.videoUrl,
        // _id: video._id // Optionally include if frontend needs it
      };
    });

    res.status(200).json({ results });
  } catch (error) {
    console.error(
      '[videoController:searchVideosByKeyword] Error:',
      error
    );
    next(error); // Pass to global error handler
  }
};