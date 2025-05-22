# Product Requirements Document: "Sir Pickle AI" MVP

## 1. Introduction

*   **Project Name:** Sir Pickle Index (Influencer: Sir Pickle)
*   **Brief Description:** An AI-powered web application enabling users to ask questions (via AI) and perform direct keyword searches across Sir Pickle's video content, prioritizing speed and efficiency.
*   **Problem Statement:** Followers of Sir Pickle need an efficient way to find specific information and understand concepts from his video library without manually re-watching hours of footage.
*   **Proposed Solution:** A web application that provides:
    1.  An AI-driven Q&A interface (using Gemma 3n E4B via Google AI Studio with RAG) that answers user questions based on relevant segments from Sir Pickle's transcribed video content, including source citations.
    2.  A **non-AI, direct keyword search** functionality to quickly locate specific terms or phrases within the video transcripts, displaying results with context.
    3.  A simple admin interface for pasting video transcripts and associated metadata (title, publication date, video URL, category, tags).
*   **Templating Goal:** While initially for Sir Pickle, the MVP codebase should be structured to facilitate adaptation for other influencers in the future (e.g., through configuration for names, branding elements).

## 2. Goals & Objectives (MVP)

*   **Primary Goal:** Enable users to efficiently query (AI-assisted) and search (direct) Sir Pickle's video content with a highly responsive and fast application.
*   **Objective 1:** Develop a functional "Ask a Question" feature using a Retrieval Augmented Generation (RAG) approach with the Gemma model to provide structured, cited answers, optimized for speed.
*   **Objective 2:** Implement a fast, **non-AI "Keyword Search"** feature that returns relevant video segments with context based on exact keyword matches in transcripts via direct, optimized database queries.
*   **Objective 3:** Create a simple admin interface for uploading video transcripts (via textarea) and associated metadata.
*   **Objective 4:** Ensure the application is built using React (with Vite) and TypeScript for the frontend, and Node.js/Express.js with TypeScript for the backend, with MongoDB, focusing on performance best practices.
*   **Objective 5:** Implement a light mode/dark mode toggle for user preference with instant switching.

## 3. Target Audience

*   Followers and students of Sir Pickle.
*   Individuals seeking to quickly reference or understand concepts taught by Sir Pickle.

## 4. Product Features (MVP)

### 4.1 User-Facing Features

#### 4.1.1 Homepage / Main Interface
*   **Description:** A clean, single-page application interface, designed for speed and ease of use.
*   **User Story 1:** As a user, I want to see a clear input area where I can either type a question (for AI) or a keyword (for direct search).
*   **User Story 2:** As a user, I want to be able to switch between "Ask a Question" mode and "Keyword Search" mode (e.g., using tabs) with no perceptible lag.
*   **User Story 3:** As a user, I want to see a disclaimer: "The information provided by this bot is designed to help users better understand the concepts of Sir Pickle. It is not intended to constitute financial advice, nor should it be relied upon as such. Always double check the information provided as it may contain inaccuracies."
*   **User Story 4:** As a user, I want to see a section with pre-defined example questions or common search terms (e.g., "Not sure where to start?") to help me get started quickly.
*   **User Story 5:** As a user, I want to be able to toggle between light and dark themes for the application, with the change applied instantly.

#### 4.1.2 "Ask a Question" Functionality (RAG-based AI)
*   **Description:** Allows users to ask natural language questions. The system retrieves relevant transcript segments and uses Gemma to generate a structured, cited answer.
*   **User Story 1:** As a user, when I type a question and submit it, I want the system to quickly find the most relevant segments from Sir Pickle's transcripts (this is the 'Retrieval' part of RAG, optimized for speed).
*   **User Story 2:** As a user, I want the system to then use the Gemma AI model, providing these segments as context, to generate a comprehensive answer.
*   **User Story 3:** As a user, I want the answer to be structured with clear headings (e.g., Explanation, Why it Works, Examples from the Sources, Tips, Caveats).
*   **User Story 4:** As a user, I want to see in-text citations (e.g., `[1]`, `[2]`) within the AI-generated answer, corresponding to the "Related Sources."
*   **User Story 5:** As a user, below the answer, I want to see a "See Related Sources" section, listing the video segments used to generate the answer. Each source should display: Video Title, approximate timestamp of the snippet within the video (e.g., "@ ~30.4 min"), the relevant transcript snippet, PUBLISHED date, TAGS (associated with the video), CHANNEL (Sir Pickle), CATEGORY (associated with the video).
*   **User Story 6:** As a user, I want to see the time taken to generate the AI answer (e.g., "Answer (1156 ms)").
*   **User Story 7:** As a user, I want to see an indication that the answer is being generated (e.g., a loading spinner), ensuring the UI remains responsive.

#### 4.1.3 "Keyword Search" Functionality (Non-AI, Direct Search)
*   **Description:** Allows users to search for exact keywords or phrases using a **fast, direct text search algorithm against the stored transcripts in the database.**
*   **User Story 1:** As a user, when I type keyword(s) and submit, I want the system to perform a direct search (e.g., using MongoDB text search capabilities, heavily optimized with indexes) across all stored transcripts for exact matches, returning results very quickly.
*   **User Story 2:** As a user, I want to see a list of video results where the keyword(s) were found.
*   **User Story 3:** As a user, for each search result, I want to see: Video Title, approximate timestamp of where the keyword first appears (or a relevant segment) (e.g., "@ ~XX.X min"), a snippet of the transcript showing the context of the keyword, PUBLISHED date, TAGS, CHANNEL (Sir Pickle), CATEGORY, and a link to the original video.

#### 4.1.4 Search/Question Results Display
*   **User Story 1:** As a user, I want results to be displayed clearly and quickly below the input area.
*   **User Story 2:** As a user, I want to be able to easily clear previous results or ask a new question/perform a new search without page reloads.

### 4.2 Admin Features

#### 4.2.1 Admin Interface Access
*   **Description:** A simple, non-publicly linked page (e.g., `/admin`). For MVP, basic password protection or a secret URL is sufficient.
*   **User Story 1:** As an admin, I want to access a dedicated page to upload new video transcript data.

#### 4.2.2 Transcript Upload Interface
*   **Description:** A form to submit new video content.
*   **User Story 1:** As an admin, I want to be able to input the Video Title (text input).
*   **User Story 2:** As an admin, I want to be able to input/select the Original Publication Date (date picker).
*   **User Story 3:** As an admin, I want to be able to input the Video URL (text input).
*   **User Story 4:** As an admin, I want to be able to input the Video Category (text input, e.g., "Market Analysis", "Tutorial").
*   **User Story 5:** As an admin, I want to be able to input relevant Tags for the video (comma-separated text input, e.g., "Order Block, Liquidity, Wyckoff").
*   **User Story 6:** As an admin, I want to be able to paste the full video transcript text into a large textarea.
*   **User Story 7:** As an admin, upon submitting the form, I want the video data and transcript to be saved to the database efficiently.
*   **User Story 8:** As an admin, I want to receive clear feedback (success/error message) after attempting an upload.

### 4.3 Core Backend Features

#### 4.3.1 Transcript Storage & Management
*   **User Story 1:** As a developer, I need the system to store video metadata (title, date, URL, category, tags) and the full transcript text in a MongoDB database, structured for efficient querying.
*   **User Story 2:** As a developer, the system should ideally process/chunk transcripts upon upload (or dynamically during retrieval) to identify segments with approximate timestamps to support the RAG process and "Related Sources" display. *Challenge: Accurately determining timestamps from raw pasted text. For MVP, this might be an estimation or require manual input if precise timing is critical.*

#### 4.3.2 API Endpoints
*   **User Story 1:** As a developer, I need an API endpoint for submitting user questions, which orchestrates the RAG process (retrieve relevant transcript segments, pass to Gemma, format response). This is for the **AI "Ask a Question" feature** and must be optimized for minimal latency.
*   **User Story 2:** As a developer, I need an API endpoint for performing **direct keyword searches against the stored transcripts in the database.** This is for the **non-AI "Keyword Search" feature** and must be extremely fast.
*   **User Story 3:** As a developer, I need an API endpoint for the admin to upload new transcript data.

#### 4.3.3 Simple Analytics
*   **User Story 1:** As an admin, I want the system to log basic usage data, such as the number of questions asked and searches performed (e.g., simple counters or logs). No UI for viewing these analytics in MVP.

## 5. Design & UX Considerations (MVP)

*   **UI Theme:** Default dark mode, with a user-toggleable light mode. Theme switching should be instant.
*   **Layout:** Single-page application feel. Intuitive, uncluttered, and highly responsive.
*   **Responsiveness:** Excellent responsiveness for desktop and common tablet/mobile sizes.
*   **Feedback:** Clear and immediate visual cues for loading states (e.g., for AI response generation, search operations). Clear error messages.

## 6. Technical Requirements

### 6.1 Tech Stack
*   **Frontend:** React with TypeScript, built using Vite.
*   **Backend:** Node.js with Express.js and TypeScript.
*   **Database:** MongoDB (using Mongoose ODM).
*   **AI Model (for "Ask a Question" only):** Gemma 3n E4B (8K token limit) via Google AI Studio API.

### 6.2 Database Schema (MongoDB Collection: `videos`)
```json
{
  "_id": "ObjectId", // Auto-generated
  "title": "String", // Required
  "publicationDate": "Date", // Required, ISO Date format
  "videoUrl": "String", // Required, URL format
  "category": "String", // Required
  "tags": ["String"], // Array of strings
  "transcript": "String", // Required, Full text.
  "createdAt": "Date", // Auto-generated, Timestamp of DB entry
  "updatedAt": "Date" // Auto-generated, Timestamp of last update
}
```
*   A **text index** must be created on the `transcript` field for highly efficient keyword searching.
*   Consider indexing `tags`, `category`, and `publicationDate` if frequently used in queries or filters.

### 6.3 API Design (Key Endpoints - Backend)
*   `POST /api/ask`: (For AI Q&A)
    *   Request Body: `{ "question": "User's question string" }`
    *   Response:
        ```json
        {
          "answerTimeMs": 1156, // Example
          "structuredAnswer": { // Object representing headings and paragraphs
            "introduction": "...",
            "explanation": "...",
            // ... other sections
          },
          "citations": [ // Corresponds to in-text [1], [2]
            { "id": 1, "sourceIndex": 0 }, // sourceIndex maps to relatedSources array
            { "id": 2, "sourceIndex": 1 }
          ],
          "relatedSources": [
            {
              "videoTitle": "...",
              "timestampLink": "@ ~30.4 min", // Or just the time string
              "snippet": "...",
              "publishedDate": "...",
              "tags": ["..."],
              "channel": "Sir Pickle",
              "category": "..."
            }
            // ... other sources
          ]
        }
        ```
    *   Or `{ "error": "Error message" }`
*   `GET /api/search`: (For Non-AI Keyword Search)
    *   Request Query Params: `?keyword=searchterm`
    *   Response: `{ "results": [{ "videoTitle": "...", "timestampLink": "@ ~XX.X min", "snippet": "...", "publishedDate": "...", "tags": ["..."], "channel": "Sir Pickle", "category": "...", "videoUrl": "..." }] }` or `{ "error": "Error message" }`
    *   *This endpoint performs a direct, highly optimized database query (e.g., MongoDB text search leveraging indexes) on the `transcript` field.*
*   `POST /api/admin/upload`:
    *   Request Body: `{ "title": "...", "publicationDate": "...", "videoUrl": "...", "category": "...", "tags": ["..."], "transcript": "..." }`
    *   Response: `{ "message": "Upload successful", "videoId": "..." }` or `{ "error": "Error message" }`

### 6.4 AI Integration (RAG with Gemma - For "Ask a Question" Feature ONLY)
*   **Context Window:** Gemma 3n E4B has an 8K token limit.
*   **Retrieval (for AI Q&A context):**
    1.  User submits a question to the `/api/ask` endpoint.
    2.  Backend performs a fast search of stored transcripts for relevant segments/snippets to be used as context for the AI. This internal search can use keyword matching from the question or more advanced embedding-based similarity search if implemented later (for MVP, optimized keyword matching is fine).
    3.  The system must identify an approximate timestamp for each retrieved snippet.
*   **Augmentation & Generation (for AI Q&A):**
    1.  Select top N relevant snippets to form the context for Gemma, ensuring it fits within the token limit and prioritizes the most relevant information.
    2.  Construct a detailed prompt for Gemma: Include the user's question, the retrieved context snippets, and clear instructions to answer *based only on the provided context*, structure the answer, provide in-text citations, and indicate if the answer cannot be found.
    3.  Call Gemma API.
*   **Post-processing (for AI Q&A):**
    1.  Parse Gemma's response.
    2.  Format the "See Related Sources" section.
    3.  Record answer generation time.

### 6.5 Performance & Efficiency Considerations

*   **Overall Goal:** Prioritize application speed and responsiveness for both frontend and backend operations. The application must feel "snappy."
*   **Frontend (React/Vite):**
    *   **Build Optimization:** Leverage Vite for optimized production builds (minification, tree-shaking, efficient chunking).
    *   **Code Splitting:** Aggressively implement route-based and component-based code splitting (e.g., `React.lazy`, dynamic `import()`) to minimize initial JavaScript payload and ensure users only download what's necessary for the current view.
    *   **Memoization:** Utilize `React.memo`, `useMemo`, and `useCallback` judiciously and correctly to prevent unnecessary re-renders and expensive computations.
    *   **Efficient State Management:** Start with React Context/component state. If global state complexity grows, consider highly performant lightweight solutions like Zustand or Jotai.
    *   **Virtualization (If Applicable):** For potentially very long lists of search results or sources, consider using virtualization libraries (e.g., `react-window` or `react-virtualized`) to render only visible items.
    *   **Asset Optimization:** Ensure efficient loading and caching of any static assets (images, fonts, CSS).
*   **Backend (Node.js/Express/MongoDB):**
    *   **Database Indexing:** Critically important. Implement and verify text indexes on `transcript` fields for keyword search. Index other frequently queried fields (`tags`, `category`, `publicationDate`). Regularly review query performance.
    *   **Query Optimization:** Use MongoDB projections (`select()`) to fetch only necessary data fields. Ensure efficient query construction and avoid N+1 query problems.
    *   **Asynchronous Operations:** Consistently use `async/await` for all non-blocking I/O operations to maximize server throughput.
    *   **Lean Middleware:** Use only essential Express.js middleware.
    *   **Strategic Caching:**
        *   Consider server-side caching (e.g., in-memory like `node-cache` for small, frequently accessed data, or Redis for larger scale/distributed needs) for common keyword search results or stable RAG context snippets if profiling indicates significant benefits.
    *   **Efficient RAG Retrieval:** The retrieval step for AI Q&A context must be extremely fast, leveraging optimized database queries and potentially pre-computed embeddings if semantic search is added later.
    *   **Connection Pooling:** Ensure proper database connection pooling is configured.
*   **General:**
    *   **Minimize Dependencies:** Keep both frontend and backend dependencies lean and regularly audited.
    *   **Production Logging:** Use efficient, structured logging libraries (e.g., Pino for backend) in production environments, with appropriate log levels.
    *   **Compression:** Enable Gzip or Brotli compression for HTTP responses.
    *   **Monitoring & Profiling:** Plan for using browser developer tools (Lighthouse, Performance tab) and backend APM/profiling tools (e.g., Clinic.js, New Relic, Datadog) to identify and address bottlenecks post-MVP and ongoing.

## 7. Success Metrics (MVP)

*   Admin can successfully upload and store at least 10 video transcripts with all metadata.
*   Users can perform **non-AI keyword searches** and receive relevant video results (with snippets and timestamps) within **~1-2 seconds** (striving for sub-second where possible).
*   Users can ask questions and receive structured, cited **AI-generated answers** with related sources within **~8-15 seconds** (acknowledging RAG + AI latency, but optimizing retrieval).
*   Light/dark mode toggle functions correctly and instantly.
*   The application remains stable, responsive, and feels fast during basic usage across supported devices.
*   High Lighthouse performance scores (especially for Performance, Accessibility, Best Practices).

## 8. Future Considerations (Out of Scope for MVP)

*   User accounts and personalized history.
*   Advanced search filters (by date range, multiple tags/categories).
*   **Semantic search** for improved RAG retrieval (for AI Q&A) and potentially for an *advanced* keyword search option.
*   Direct video playback or transcript highlighting linked to timestamps.
*   More sophisticated admin dashboard with content management, analytics UI, and bulk operations.
*   Automated transcript fetching/generation from video URLs.
*   More robust and accurate timestamping for transcript segments (potentially involving more advanced processing or admin tools).
*   WebSockets for real-time updates if applicable (e.g., live progress for AI generation).