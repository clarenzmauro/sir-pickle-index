// src/services/embeddingService.ts
import { GoogleGenerativeAI, TaskType, Part, Content } from '@google/generative-ai'; // Added Content
import dotenv from 'dotenv';

dotenv.config(); // Ensure .env variables are loaded

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY; // Using a more generic name, ensure your .env matches
const EMBEDDING_MODEL_NAME = "text-embedding-004"; // Or your preferred embedding model

if (!GOOGLE_AI_API_KEY) {
  console.warn(
    '[EmbeddingService] GOOGLE_AI_API_KEY (expected as GOOGLE_AI_STUDIO_API_KEY in .env) is not set. Embedding functionality will be disabled.'
  );
}

const genAIEmbed = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;
const embeddingModel = genAIEmbed ? genAIEmbed.getGenerativeModel({ model: EMBEDDING_MODEL_NAME }) : null;

// Corrected generateEmbedding function (for document chunks)
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!embeddingModel) {
    console.error('[EmbeddingService] Embedding model not initialized. Check API Key.');
    return null;
  }

  try {
    const cleanedText = text.replace(/(\r\n|\n|\r)+/gm, " ").trim();
    if (!cleanedText) {
        console.warn("[EmbeddingService] Attempted to generate embedding for empty text.");
        return null;
    }

    // Construct the request object, similar to generateQueryEmbedding
    const request = {
        content: { parts: [{ text: cleanedText }], role: "user" } as Content, // Explicitly cast to Content
        taskType: TaskType.RETRIEVAL_DOCUMENT // Specify task type for document chunks
    };

    const result = await embeddingModel.embedContent(request);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('[EmbeddingService] Error generating document embedding:', error);
    return null;
  }
};

// Corrected generateQueryEmbedding function (for user questions)
export const generateQueryEmbedding = async (queryText: string): Promise<number[] | null> => {
    if (!embeddingModel) {
        console.error('[EmbeddingService] Embedding model not initialized. Check API Key.');
        return null;
    }
    try {
        const cleanedText = queryText.replace(/(\r\n|\n|\r)+/gm, " ").trim();
        if (!cleanedText) {
            console.warn("[EmbeddingService] Attempted to generate query embedding for empty text.");
            return null;
        }

        const request = {
            content: { parts: [{ text: cleanedText }], role: "user" } as Content, // Explicitly cast to Content
            taskType: TaskType.RETRIEVAL_QUERY
        };

        const result = await embeddingModel.embedContent(request);
        return result.embedding.values;
    } catch (error) {
        console.error('[EmbeddingService] Error generating query embedding:', error);
        return null;
    }
};