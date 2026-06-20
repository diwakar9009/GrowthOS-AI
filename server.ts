import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

dotenv.config();

// Standard resilient production process handlers
process.on("uncaughtException", (err) => {
  console.error("Resilient Server: Uncaught Exception caught:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Resilient Server: Unhandled Rejection at:", promise, "reason:", reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to verify Firebase ID Token and check Firestore approval status
async function verifyUserApproval(authHeader?: string): Promise<{ uid: string; email: string; isApproved: boolean }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid authentication token format.");
  }

  const idToken = authHeader.substring(7);
  const firebaseApiKey = "AIzaSyBhsQdR73dG9cyzKgnHay1LyklYx59_Rqo";

  // 1. Verify token with Google's Identity Toolkit API
  const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
  const verifyRes = await fetch(lookupUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });

  if (!verifyRes.ok) {
    throw new Error("Unauthorized: Invalid, expired, or corrupted session token. Please re-login.");
  }

  const data = await verifyRes.json();
  if (!data.users || data.users.length === 0) {
    throw new Error("Unauthorized: User profile not found in directory.");
  }

  const user = data.users[0];
  const uid = user.localId;
  const email = user.email;

  // Root creator is always approved
  if (email === "diwakarvishwakarma9009@gmail.com") {
    return { uid, email, isApproved: true };
  }

  // 2. Query Firestore via Google REST APIs to retrieve the user's specific registration record
  const projectId = "gen-lang-client-0000812465";
  const databaseId = "ai-studio-fa9cb849-d36c-40ae-b748-05e4aab7e40f";
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${uid}`;

  const docRes = await fetch(docUrl, {
    headers: {
      "Authorization": `Bearer ${idToken}`
    }
  });

  if (!docRes.ok) {
    throw new Error("Forbidden: User profile is missing or you don't have reading privileges.");
  }

  const docData = await docRes.json();
  const fields = docData.fields || {};
  const isApproved = fields.isApproved?.booleanValue === true;

  return { uid, email, isApproved };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable("x-powered-by");

  // Global HTTP Security Headers Middleware
  app.use((req, res, next) => {
    // Clickjacking, Content Sniffing and XSS injection defense
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com 'unsafe-hashes'; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https://*.googleusercontent.com https://images.unsplash.com referrer; " +
      "connect-src 'self' ws: wss: * https://*.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com; " +
      "frame-ancestors 'self' https://*.google.com https://ai.studio https://*.run.app https://localhost:* http://localhost:*"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  app.use(cors());
  app.use(express.json());

  // Setup robust DDoS in-depth security rate limiting for all API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 150, // Limit each IP address to 150 requests per window
    standardHeaders: true, // Use standard headers for rate limit info
    legacyHeaders: false, // Turn off old headers
    message: { error: "Too many requests from this IP address, please try again in 15 minutes." }
  });
  app.use("/api/", apiLimiter);

  // API Routes
  app.post("/api/ai", async (req, res) => {
    const userApiKey = req.headers["x-user-gemini-api-key"] as string | undefined;

    // 1. Authorization & Token validation
    try {
      if (!userApiKey) {
        const authHeader = req.headers.authorization;
        const { email, isApproved } = await verifyUserApproval(authHeader);
        
        if (!isApproved) {
          return res.status(403).json({
            error: "Access Pending: Your GrowthOS AI features access requires manual approval by the site administrator diwakarvishwakarma9009@gmail.com."
          });
        }
      }
    } catch (authError: any) {
      console.error("API Authentication Gate Triggered:", authError.message);
      return res.status(401).json({
        error: authError.message || "Unauthorized: Valid credentials required to access GrowthOS AI endpoints."
      });
    }

    const { prompt, model: modelId, systemInstruction, useSearch } = req.body;

    // Rigorous security validation of inputs to prevent buffer overload or injection attacks
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ error: "Invalid input: Positive non-empty string prompt is required." });
    }
    if (prompt.length > 30000) {
      return res.status(400).json({ error: "Invalid input: Prompt is too long (must be under 30,000 characters)." });
    }
    if (systemInstruction !== undefined && (typeof systemInstruction !== "string" || systemInstruction.length > 5000)) {
      return res.status(400).json({ error: "Invalid input: systemInstruction must be a string under 5,000 characters." });
    }
    if (modelId !== undefined && (typeof modelId !== "string" || modelId.length > 100)) {
      return res.status(400).json({ error: "Invalid input: model ID must be a string under 100 characters." });
    }
    
    // Check key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.error("GEMINI_API_KEY is missing in server environment.");
      return res.status(400).json({ 
        error: "GEMINI_API_KEY is not configured on the server and no custom user key was provided. Please add it to your environment variables or provide your own key." 
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      console.log(`Starting AI stream for model: ${modelId || "gemini-3.5-flash"} (Search: ${!!useSearch})`);

      const result = await ai.models.generateContentStream({
        model: modelId || "gemini-3.5-flash",
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
      
      let errMsg = error.message || "An unexpected error occurred during AI generation.";
      if (
        errMsg.includes("API key expired") || 
        errMsg.includes("API_KEY_INVALID") || 
        errMsg.includes("expired") || 
        errMsg.includes("renew the API key") ||
        errMsg.includes("INVALID_ARGUMENT")
      ) {
        errMsg = "The Gemini API Key has expired or is invalid. Please go to Google AI Studio, open 'Settings > Secrets' in the top-right corner, and renew or replace your GEMINI_API_KEY secret.";
      }
      
      // If headers haven't been sent yet, we can send a 500
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: errMsg
        });
      } else {
        // If we already started streaming, we just end the stream with the error info
        res.write(`\n\n[ERROR: ${errMsg}]`);
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
