// src/services/llmService.ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import axios from 'axios'; // For making HTTP requests to OpenRouter
import dotenv from 'dotenv';

dotenv.config();

// --- Provider Configuration ---
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'GEMMA'; // Default to Gemma

// --- Gemma Configuration ---
const GOOGLE_AI_STUDIO_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY;
const GGOOGLE_AI_STUDIO_GENERATION_MODEL_NAME = process.env.GOOGLE_AI_STUDIO_GENERATION_MODEL_NAME || 'gemma-3n-e4b-it';
let gemmaGenAI: GoogleGenerativeAI | null = null;
let gemmaModel: any = null; // Using 'any' for simplicity, can be more specific

if (LLM_PROVIDER === 'GEMMA') {
    if (!GOOGLE_AI_STUDIO_API_KEY) {
        console.warn('[LLMService] GOOGLE_AI_STUDIO_API_KEY is not set. Gemma functionality will be disabled if selected.');
    } else {
        gemmaGenAI = new GoogleGenerativeAI(GOOGLE_AI_STUDIO_API_KEY);
        gemmaModel = gemmaGenAI.getGenerativeModel({ model: GGOOGLE_AI_STUDIO_GENERATION_MODEL_NAME });
    }
}

// --- OpenRouter Configuration ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL_NAME = process.env.OPENROUTER_MODEL_NAME || "nousresearch/deephermes-3-mistral-24b-preview:free";
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';



if (LLM_PROVIDER === 'OPENROUTER' && !OPENROUTER_API_KEY) {
    console.warn('[LLMService] OPENROUTER_API_KEY is not set. OpenRouter functionality will be disabled if selected.');
}

interface LLMContextSegment {
    title: string;
    segment: string;
    originalIndex: number;
    videoId?: string;
    videoUrl?: string;
}

interface LLMResponse {
    structuredAnswer: {
        introduction: string;
        explanation: string;
        examples: string;
        tips: string;
        caveats: string;
    };
    citations: Array<{ id: number; sourceIndex: number }>;
}

const constructPrompt = (question: string, contextSegments: LLMContextSegment[]): string => {
    // Start of the refined prompt
    let prompt = `You are 'Sir Pickle AI', an expert AI assistant for the trading influencer Sir Pickle. Your knowledge is strictly limited to the video transcript segments provided below. Your primary goal is to answer the user's question accurately and concisely using *solely and exclusively* the information contained within these segments. Do not use any external knowledge or make assumptions beyond what is written in the context.

Your entire response MUST be formatted as a single, valid JSON object. This JSON object MUST have exactly two top-level keys: "structuredAnswer" and "citations".

The "structuredAnswer" object MUST contain the following keys, and their string values must be derived *only* from the provided context segments:
- "introduction": A brief introduction that directly addresses or rephrases the user's question, based on the context.
- "explanation": The main explanation or answer to the question, using only information from the context.
- "examples": Specific examples from the provided sources, if any, that illustrate the point. If no direct examples are found in the context, state "No specific examples were found in the provided context."
- "tips": Actionable tips or key takeaways directly mentioned in the sources. If none, state "No specific tips or key takeaways were found in the provided context."
- "caveats": Important considerations, warnings, or limitations explicitly mentioned in the sources. If none, state "No specific caveats or important considerations were found in the provided context."

Cite relevant sources within the text of your "structuredAnswer" values using the format [Source X], where X is the 1-based index of the source segment as listed below in the context.

If the provided segments do not contain enough information to answer the question fully or if the answer cannot be found in the context, clearly state this within the "explanation" field of the "structuredAnswer". For instance, "The provided context does not contain specific information about [topic of the question]."

Example of the required JSON output format:
{
  "structuredAnswer": {
    "introduction": "Sir Pickle discusses X based on the provided information [Source 1].",
    "explanation": "The explanation derived from the context goes here. If the information isn't present, state that the context doesn't cover it.",
    "examples": "An example from the context is Y [Source 2].",
    "tips": "A key takeaway is Z [Source 1].",
    "caveats": "One consideration is A [Source 3]."
  },
  "citations": [
    { "id": 1, "sourceIndex": 0 },
    { "id": 2, "sourceIndex": 1 },
    { "id": 3, "sourceIndex": 2 }
  ]
}

Okay, here is the context from Sir Pickle's videos:
`; // End of the main instruction block

    // Append context segments
    contextSegments.forEach((item, index) => {
        const aiSourceIndex = index + 1; // 1-based index for the AI prompt
        prompt += `\n--- Source ${aiSourceIndex} (Originally video chunk index ${item.originalIndex}) ---\n`;
        prompt += `Title: ${item.title}\n`;
        prompt += `Transcript Segment: "${item.segment}"\n---`; // Removed the extra \n\n here to make context block tighter
    });

    // Append the user's question and instruction for the JSON answer
    prompt += `\n\nUser's Question: "${question}"\n\nJSON Answer (strictly follow the JSON format described above):`;

    return prompt;
};

const parseLLMJsonResponse = (responseText: string): LLMResponse | null => {
    try {
        const cleanedResponseText = responseText.replace(/^```json\s*([\s\S]*?)\s*```$/, '$1').trim();
        let parsed = JSON.parse(cleanedResponseText);

        // Check if parsed itself is the full response (e.g. from OpenRouter an Azure OpenAI which might return the whole thing directly)
        // And also handle the case where Gemma might incorrectly nest citations
        let finalStructuredAnswer = parsed.structuredAnswer;
        let finalCitations = parsed.citations;

        if (finalStructuredAnswer && finalStructuredAnswer.citations && !finalCitations) {
            console.warn('[LLMService] Found citations nested under structuredAnswer. Attempting to correct.');
            finalCitations = finalStructuredAnswer.citations;
            // Optionally, remove it from structuredAnswer if your downstream code doesn't expect it there
            // delete finalStructuredAnswer.citations; 
            // For now, let's assume it's okay to leave it there if the top-level one is also populated.
        }

        if (finalStructuredAnswer && finalCitations) {
            return { structuredAnswer: finalStructuredAnswer, citations: finalCitations };
        }

        console.error('[LLMService] Parsed JSON from LLM is missing expected top-level keys (structuredAnswer or citations) even after attempting to correct for nesting.');
        console.log('[LLMService] Original parsed object:', parsed); 
        return null;
    } catch (parseError) {
        console.error('[LLMService] Failed to parse JSON from LLM API Response:', parseError);
        console.error('Raw response was:', responseText);
        return null;
    }
};


export const generateAnswer = async (question: string, contextSegments: LLMContextSegment[]): Promise<LLMResponse | null> => {
    const fullPrompt = constructPrompt(question, contextSegments);
    console.log(`[LLMService] Using provider: ${LLM_PROVIDER}`);
    // console.log("[LLMService] Full prompt being sent:\n", fullPrompt); // Verbose, enable for debugging

    if (LLM_PROVIDER === 'GEMMA') {
        if (!gemmaModel) {
            console.error("[LLMService] Gemma AI Model not initialized. Check API Key.");
            return null;
        }
        try {
            console.log('\n--- Calling Gemma API ---');
            const generationConfig = { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 2048 };
            const safetySettings: Array<{ category: HarmCategory; threshold: HarmBlockThreshold }> = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ];
            const chat = gemmaModel.startChat({ generationConfig, safetySettings, history: [] });
            const result = await chat.sendMessage(fullPrompt);
            const responseText = result.response.text();
            console.log('--- Gemma API Response Text (Raw JSON String) ---');
            console.log(responseText);
            return parseLLMJsonResponse(responseText);
        } catch (error) {
            console.error('--- Gemma API Call Error ---', error);
            return null;
        }
    } else if (LLM_PROVIDER === 'OPENROUTER') {
        if (!OPENROUTER_API_KEY) {
            console.error("[LLMService] OpenRouter API Key not set.");
            return null;
        }
        try {
            console.log('\n--- Calling OpenRouter API ---');
            const response = await axios.post(
                OPENROUTER_API_URL,
                {
                    model: OPENROUTER_MODEL_NAME,
                    messages: [
                        // For chat completions, the prompt often goes into a "user" message.
                        // Some models might prefer the full prompt directly if they are not chat-tuned.
                        // LLMs usually work well with a system prompt + user prompt.
                        // Let's try a simple user message with the full constructed prompt.
                        { role: "user", content: fullPrompt }
                    ],
                    // You might need to adjust parameters like temperature, max_tokens for OpenRouter
                    temperature: 0.7,
                    max_tokens: 2048,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        // 'HTTP-Referer': OPENROUTER_SITE_URL, // Optional
                        // 'X-Title': OPENROUTER_SITE_NAME, // Optional
                    },
                }
            );
            const responseText = response.data.choices[0]?.message?.content;
            if (!responseText) {
                console.error('--- OpenRouter API: No response text found ---', response.data);
                return null;
            }
            console.log('--- OpenRouter API Response Text (Raw JSON String) ---');
            console.log(responseText);
            return parseLLMJsonResponse(responseText);
        } catch (error: any) {
            console.error('--- OpenRouter API Call Error ---', error.response ? error.response.data : error.message);
            return null;
        }
    } else {
        console.error(`[LLMService] Unknown LLM_PROVIDER: ${LLM_PROVIDER}`);
        return null;
    }
};