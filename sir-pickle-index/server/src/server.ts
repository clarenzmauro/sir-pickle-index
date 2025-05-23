import app from './app';
import { generateEmbedding } from './services/embeddingService';

// Temporary test function
const testEmbedding = async () => {
  console.log("Attempting to generate a test embedding...");
  const sampleText = "This is a test sentence for embedding.";
  const embeddingVector = await generateEmbedding(sampleText);

  if (embeddingVector) {
    console.log("Test embedding generated successfully!");
    console.log("Vector (first 10 dimensions):", embeddingVector.slice(0, 10));
    console.log("Vector dimension:", embeddingVector.length); // Should be 768 for text-embedding-004
  } else {
    console.error("Failed to generate test embedding.");
  }
};

const port = process.env.PORT || 3001; // Default to 3001 if PORT not set

app.listen(port, () => {
  console.log(`[SERVER]: Server is running at http://localhost:${port}`);
  testEmbedding(); // Run the test embedding function
});

export default app;