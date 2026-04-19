export const config = {
  runtime: 'edge',
};

export default function handler(req: Request) {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'undefined';
  return new Response(JSON.stringify({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    config: {
      hasGeminiKey: hasKey,
      vercelEdge: true
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
