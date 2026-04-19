import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt, model: modelId, systemInstruction, useSearch } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      return new Response(JSON.stringify({ 
        error: "GEMINI_API_KEY is not configured on the server. Please add it to your Vercel Environment Variables." 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const result = await ai.models.generateContentStream({
      model: modelId || "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        tools: useSearch ? [{ googleSearch: {} }] : []
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (error: any) {
          console.error("Stream Error:", error);
          controller.enqueue(encoder.encode(`\n\n[ERROR: ${error.message || "Connection lost during streaming"}]`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error("AI Edge Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred during AI generation." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
