import { GoogleGenerativeAI, TaskType, Part } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMMA_API_KEY = process.env.GEMMA_API_KEY; // Your Google AI API Key
// Use the specific embedding model identifier
const EMBEDDING_MODEL_NAME = "text-embedding-004";

if (!GEMMA_API_KEY) {
  console.warn(
    '[EmbeddingService] GEMMA_API_KEY is not set. Embedding functionality will be disabled.'
  );
}

const genAI = GEMMA_API_KEY ? new GoogleGenerativeAI(GEMMA_API_KEY) : null;
const embeddingModel = genAI ? genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME }) : null;

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!embeddingModel) {
    console.error('Embedding model not initialized. Check API Key.');
    return null;
  }

  try {
    // Clean the text slightly: replace multiple newlines with a single space
    const cleanedText = text.replace(/(\r\n|\n|\r)+/gm, " ").trim();
    if (!cleanedText) {
        console.warn("Attempted to generate embedding for empty text.");
        return null; // Or return a zero vector of appropriate dimension
    }

    const result = await embeddingModel.embedContent(
        cleanedText
        // Optional: You can specify the task type if it helps the model
        // { taskType: TaskType.RETRIEVAL_DOCUMENT } // For chunks to be stored
        // { taskType: TaskType.RETRIEVAL_QUERY } // For user questions
    );
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

// Helper to generate embedding for a query (can specify task type)
export const generateQueryEmbedding = async (queryText: string): Promise<number[] | null> => {
    if (!embeddingModel) {
        console.error('Embedding model not initialized. Check API Key.');
        return null;
    }
    try {
        const cleanedText = queryText.replace(/(\r\n|\n|\r)+/gm, " ").trim();
        if (!cleanedText) return null;

        // Construct the request object
        const request = {
            content: { parts: [{ text: cleanedText }], role: "user" }, 
            taskType: TaskType.RETRIEVAL_QUERY
        };

        const result = await embeddingModel.embedContent(request);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating query embedding:', error);
        return null;
    }
};