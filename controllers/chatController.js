require('dotenv').config();
const fs = require('fs');
const path = require('path');

let fetch;
(async () => { fetch = (await import('node-fetch')).default; })();

exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Markdown file read karo
  const mdFilePath = path.join(__dirname, './healNovaSystemPrompt.md'); // file ka correct path
  const systemPrompt = fs.readFileSync(mdFilePath, 'utf-8');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt }, // full HealNova.ai context
          { role: 'user', content: message }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
