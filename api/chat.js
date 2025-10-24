// FILE: api/chat.js
// API Key Configuration
const GROQ_API_KEY = "gsk_9ksoIcGJRq51AqsIBBxJWGdyb3FYGdRp2HPmCKMijNZMRktyT24d2";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// System prompt yang tetap (tidak bisa diubah)
const SYSTEM_PROMPT = {
  role: "system",
  content: "anda adalah Chatbot VolatileAI, Diciptakan oleh Tim the founder of Volatile SMKN 26 JAKARTA, anda digunakan untuk tanya jawab tentang Tanaman. Layanan anda menciptakan iot yang dimana Dia bisa cek status Kelembapan tanah dan suhu. dan dia nanti tampilin di LCD I2C 16x2"
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // Validasi input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request. "messages" array is required' 
      });
    }

    // Filter hanya user dan assistant messages
    const filteredMessages = messages.filter(
      msg => msg.role === 'user' || msg.role === 'assistant'
    );

    // Gabungkan system prompt dengan messages
    const finalMessages = [SYSTEM_PROMPT, ...filteredMessages];

    // Prepare request untuk Groq API
    const groqPayload = {
      messages: finalMessages,
      model: "openai/gpt-oss-120b",
      temperature: 1,
      max_completion_tokens: 10641,
      top_p: 1,
      stream: false,
      reasoning_effort: "medium",
      stop: null,
      tools: [
        { type: "code_interpreter" },
        { type: "browser_search" }
      ]
    };

    // Forward request ke Groq API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(groqPayload)
    });

    // Cek jika response tidak OK
    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API Error:', errorData);
      return res.status(groqResponse.status).json({ 
        error: 'Groq API error',
        details: errorData 
      });
    }

    // Parse dan return response dari Groq
    const data = await groqResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
        }
