import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StrategyOption, ShortConcept, ChatMessage } from "../types";

// Initialize the client
const getAiClient = () => {
    // Check if API key is present in environment (injected by the runtime)
    // We access process.env.API_KEY directly so it can be replaced by the bundler/vite
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        throw new Error("API Key not found. Please select a key.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to clean and parse JSON from model output that might contain Markdown
const cleanAndParseJson = <T>(text: string | undefined): T => {
    if (!text) throw new Error("No text response from AI");

    let cleanText = text;

    // Remove markdown code blocks if present
    if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
    }

    // Attempt to find the JSON structure
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');

    // Determine if we are looking for an object or an array
    let startIndex = -1;
    let endIndex = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        // It's likely an object
        startIndex = firstBrace;
        endIndex = cleanText.lastIndexOf('}');
    } else if (firstBracket !== -1) {
        // It's likely an array
        startIndex = firstBracket;
        endIndex = cleanText.lastIndexOf(']');
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
    }

    // --- FIX COMMON JSON MALFORMATIONS ---

    // Fix 1: Replace missing array/object values after colons (e.g., "dataPoints":, -> "dataPoints":[],)
    cleanText = cleanText.replace(/:\s*,/g, ': [],');

    // Fix 2: Replace missing values before closing braces/brackets (e.g., "field":} -> "field":null})
    cleanText = cleanText.replace(/:\s*([}\]])/g, ': null$1');

    // Fix 3: Remove trailing commas before closing braces/brackets
    cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');

    // Fix 4: Replace empty array definitions that might have been over-corrected
    cleanText = cleanText.replace(/:\s*\[\]\s*\[\]/g, ': []');

    try {
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error("Failed to parse JSON after cleaning. Original text:", text);
        console.error("Cleaned text:", cleanText);
        console.error("Parse error:", e);
        throw new Error("AI response was not valid JSON even after cleaning attempts.");
    }
};

/**
 * brainstormStrategies
 * Asks Gemini to come up with 6 distinct architectural approaches based on tag combinations.
 * Uses Google Search Grounding to ensure recommendations are based on real statistics and trends.
 */
export const brainstormStrategies = async (keywords: string[], locations: string[], categories: string[]): Promise<StrategyOption[]> => {
    const ai = getAiClient();

    // Format inputs for the prompt
    const locationStr = locations.length > 0 ? locations.join(", ") : "Global";
    const categoryStr = categories.length > 0 ? categories.join(", ") : "General";
    const keywordStr = keywords.join(", ");

    const prompt = `
    You are a Strategic Content Architect for Short-form Video (YouTube Shorts, TikTok).
    
    INPUT SIGNALS:
    - Target Markets: [${locationStr}]
    - Category Focus: [${categoryStr}]
    - Signal Keywords: [${keywordStr}]

    TASK:
    1. Analyze real-time trends across Google Search, YouTube Trends, and TikTok Creative Center for these keywords in the specified regions.
    2. Identify specific "Content Gaps" or "Trending Formats" (e.g., "Oddly Satisfying", "Fact/Fiction", "Quiz", "Visual ASMR", "Local News").
    3. Generate 6 distinct, high-potential strategies.

    CRITERIA:
    - Focus on specific "Keywords" and "Hooks" rather than generic descriptions.
    - Evaluate cross-platform potential (TikTok + Shorts).
    - Provide a "Why it Trends" explanation grounded in current user behavior.

    OUTPUT FORMAT:
    Strictly output a valid JSON array of objects. Do not include markdown code blocks.
    Structure:
    [
      {
        "title": "Strategy Title (e.g. 'History Paradoxes')",
        "description": "Short description of the format and hook.",
        "pros": ["Why it works on TikTok/Shorts", "Viral driver"],
        "cons": ["Production risk", "Saturation level"],
        "estimatedCost": "$0 - $100/mo",
        "automationLevel": "High", 
        "trendMetrics": {
           "score": 85,
           "dataPoints": [20, 30, 45, 60, 80, 75, 85, 90, 85, 95, 100, 90],
           "searchVolume": "High"
        },
        "searchQuery": "Keyword string to validate on TikTok/Google",
        "trendingReason": "Explanation of the psychological or market driver behind this trend."
      }
    ]
    
    Ensure "automationLevel" is "High", "Medium", or "Low".
    "trendMetrics.dataPoints" must be 12 numbers (0-100) simulating the last 12 months trend.
  `;

    // Helper to validate and fix strategy objects
    const validateStrategy = (strategy: any): StrategyOption => {
        return {
            title: strategy.title || "Untitled Strategy",
            description: strategy.description || "No description provided",
            pros: Array.isArray(strategy.pros) ? strategy.pros : ["Innovative approach"],
            cons: Array.isArray(strategy.cons) ? strategy.cons : ["Requires planning"],
            estimatedCost: strategy.estimatedCost || "$0 - $50/mo",
            automationLevel: strategy.automationLevel || "Medium",
            trendMetrics: {
                score: strategy.trendMetrics?.score || 75,
                dataPoints: Array.isArray(strategy.trendMetrics?.dataPoints) && strategy.trendMetrics.dataPoints.length === 12
                    ? strategy.trendMetrics.dataPoints
                    : [30, 40, 50, 55, 60, 65, 70, 75, 80, 82, 85, 90], // Default trending upward
                searchVolume: strategy.trendMetrics?.searchVolume || "Medium"
            },
            searchQuery: strategy.searchQuery || "",
            trendingReason: strategy.trendingReason || "Emerging trend with growth potential"
        };
    };

    try {
        // Attempt with Google Search Grounding
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        const strategies = cleanAndParseJson<StrategyOption[]>(response.text);
        return strategies.map(validateStrategy);

    } catch (error) {
        console.warn("Google Search Grounding failed, falling back to standard generation.", error);

        // Fallback without tools
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt + "\n\n(Note: Perform analysis using your internal knowledge base as search is unavailable.)",
        });
        const strategies = cleanAndParseJson<StrategyOption[]>(response.text);
        return strategies.map(validateStrategy);
    }
};

/**
 * chatAboutStrategy
 * Allows the user to have a conversation with Gemini about a specific strategy to refine it.
 * Capable of requesting updates to the strategy object via structured output.
 */
export const chatAboutStrategy = async (strategy: StrategyOption, history: ChatMessage[], newMessage: string): Promise<string> => {
    const ai = getAiClient();

    const systemInstruction = `
        You are an expert Content Strategist assisting a user in refining a specific YouTube Shorts/TikTok idea.
        
        CURRENT STRATEGY CONTEXT:
        Title: ${strategy.title}
        Description: ${strategy.description}
        Niche/Keywords: ${strategy.searchQuery}
        Why it Trends: ${strategy.trendingReason}
        
        GOAL:
        Answer the user's questions, suggest content angles, or help expand the idea.
        
        UPDATING THE STRATEGY:
        If the user asks to change the title, description, or focus of the strategy (e.g., "Change the title to 'Eco Hacks'"), 
        you MUST append a JSON block to the end of your text response with the updates.
        
        Format for updates:
        [YOUR CONVERSATIONAL RESPONSE HERE]
        
        ~~~UPDATE_JSON
        {
          "title": "New Title",
          "description": "New Description",
          "searchQuery": "New Query" 
        }
        ~~~
        
        Only include the JSON block if a change is explicitly requested or agreed upon.
    `;

    // Convert history to Gemini format
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction },
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
};

/**
 * generateShortConcept
 * Simulates the "Backend" of the user's future app.
 * Generates a script and visual plan based on a trending topic.
 */
export const generateShortConcept = async (topic: string, genre: string, strategy: string, stylePreset?: string): Promise<ShortConcept> => {
    const ai = getAiClient();

    const contentPrompt = `
        Generate a YouTube Short concept for the genre/keywords "${genre}" using the strategy "${strategy}".
        The specific topic is: "${topic}".
        
        ${stylePreset ? `CRITICAL INSTRUCTION: The user has requested a specific Visual Style: "${stylePreset}". Ensure the "visualStyle" field and all "imagePrompts" strictly adhere to this aesthetic.` : ''}

        1. Write a 45-second engaging script (approx 120 words).
        2. Define a visual style.
        3. Create 3 image generation prompts that would serve as the background for the video segments.

        Output ONLY a JSON object. Do not include Markdown formatting or explanations.
        Structure:
        {
            "topic": "string",
            "script": "string",
            "visualStyle": "string",
            "imagePrompts": ["string", "string", "string"]
        }
    `;

    try {
        // Try with Search Grounding to get relevant info
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contentPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const concept = cleanAndParseJson<ShortConcept>(response.text);

        // Extract sources if available
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) as string[] || [];
        concept.sources = sources;

        return concept;

    } catch (error) {
        console.warn("Concept generation with Search failed, falling back.", error);

        // Fallback without search
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contentPrompt,
        });

        const concept = cleanAndParseJson<ShortConcept>(response.text);
        concept.sources = []; // No sources in fallback
        return concept;
    }
};

/**
 * generateMoreImagePrompts
 * Generates additional image prompts based on the existing concept.
 */
export const generateMoreImagePrompts = async (topic: string, script: string, visualStyle: string): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
      Based on the following YouTube Short concept:
      Topic: "${topic}"
      Visual Style: "${visualStyle}"
      Script: "${script}"

      Generate 3 MORE distinct, high-quality image generation prompts that would serve as background visuals for different segments of this video.
      Output ONLY a JSON array of strings. Example: ["prompt 1", "prompt 2", "prompt 3"]
    `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    try {
        return cleanAndParseJson<string[]>(response.text);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        return [];
    }
};

/**
 * generateVideoAsset
 * Uses Veo to generate a short video background for the concept.
 * Note: This requires a paid key and Veo access.
 */
export const generateVideoAsset = async (prompt: string, duration?: string, resolution: '720p' | '1080p' = '1080p'): Promise<string> => {
    const ai = getAiClient();

    try {
        // Append duration to the prompt if provided.
        const finalPrompt = duration ? `${prompt}. Target duration: ${duration}.` : prompt;

        // Using fast-generate for quicker feedback in a prototype
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution, // Can be 720p or 1080p.
                aspectRatio: '9:16'
            }
        });

        // Polling mechanism (10s recommended for Veo)
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("Failed to generate video URI");

        // Append API key for download access as per guidelines
        const apiKey = process.env.API_KEY || '';
        return `${uri}&key=${apiKey}`;
    } catch (error: any) {
        // Handle quota/rate limit errors with helpful message
        if (error?.message?.includes('quota') || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
            throw new Error(
                "Veo quota exceeded. Try using Imagen for images instead, or check your API quotas at https://ai.dev/usage?tab=rate-limit"
            );
        }
        throw error;
    }
};

/**
 * generateImageAsset
 * Uses Imagen to generate a static image background for the concept.
 */
export const generateImageAsset = async (prompt: string): Promise<string> => {
    const ai = getAiClient();

    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',  // Updated to correct model name
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '9:16',
            outputMimeType: 'image/jpeg',
        }
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64) throw new Error("No image generated");

    return `data:image/jpeg;base64,${base64}`;
};

/**
 * generateVoiceover
 * Generates a speech audio for the given text using Gemini TTS.
 */
export const generateVoiceover = async (text: string): Promise<string> => {
    const ai = getAiClient();

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
            parts: [{ text: `Read this script with an engaging, energetic narrator voice suitable for a YouTube Short:\n\n${text}` }]
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    return base64Audio;
};