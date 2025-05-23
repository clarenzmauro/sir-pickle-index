// A very basic text chunking strategy
// In a production system, you might use more sophisticated NLP-based sentence splitting
// or semantic chunking libraries.

interface Chunk {
  text: string;
  // You could add start/end character positions if needed
}

export const simpleChunker = (
  text: string,
  chunkSize: number = 1500, // Target characters per chunk (adjust based on token limits & desired granularity)
  overlap: number = 200    // Characters of overlap between chunks
): Chunk[] => {
  if (!text) return [];

  const chunks: Chunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push({ text: text.substring(startIndex, endIndex) });

    if (endIndex === text.length) {
      break; // Reached the end of the text
    }

    startIndex += chunkSize - overlap; // Move start index for the next chunk

    // Ensure startIndex doesn't go backward if overlap is too large for remaining text
    if (startIndex >= endIndex && endIndex < text.length) {
        startIndex = endIndex - Math.floor(overlap / 2); // Adjust to ensure progress
        if (startIndex < 0) startIndex = 0;
    }
     // Prevent infinite loops if chunking isn't progressing
    if (chunks.length > 0 && chunks[chunks.length -1].text.startsWith(text.substring(startIndex, endIndex)) && startIndex !== 0) {
        console.warn("Chunking might be stuck, breaking early.");
        break;
    }
  }
  return chunks.filter(chunk => chunk.text.trim() !== ""); // Remove empty chunks
};