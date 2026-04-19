import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/ai", async (req, res) => {
    const { prompt, model: modelId, systemInstruction, useSearch } = req.body;
    
    // Check key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.error("GEMINI_API_KEY is missing in server environment.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please add it to your environment variables." 
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      console.log(`Starting AI stream for model: ${modelId || "gemini-3-flash-preview"} (Search: ${!!useSearch})`);

      const result = await ai.models.generateContentStream({
        model: modelId || "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          tools: useSearch ? [{ googleSearch: {} }] : []
        }
      });

      let fullText = "";
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          res.write(chunkText);
        }
      }

      console.log(`AI stream completed. Length: ${fullText.length}`);
      res.end();
    } catch (error: any) {
      console.error("AI Server Error:", error);
      
      // If headers haven't been sent yet, we can send a 500
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: error.message || "An unexpected error occurred during AI generation." 
        });
      } else {
        // If we already started streaming, we just end the stream with the error info
        res.write(`\n\n[ERROR: ${error.message || "Connection lost during streaming"}]`);
        res.end();
      }
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'undefined';
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      config: {
        hasGeminiKey: hasKey,
        env: process.env.NODE_ENV || 'development'
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
