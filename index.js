const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/generate',
      data: {
        model: 'phi3',
        prompt,
        stream: true
      },
      responseType: 'stream'
    });

    let fullResponse = '';

    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      try {
        // Try to parse JSON from each chunk (may need to handle partial JSON)
        const json = JSON.parse(chunkStr);
        fullResponse += json.response;

        if (json.done) {
          // Once done, send full output
          res.json({ output: fullResponse });
          response.data.destroy(); // stop reading more
        }
      } catch (e) {
        // Handle partial JSON or split stream chunks here if needed
      }
    });

    response.data.on('end', () => {
      if (!res.headersSent) {
        // Fallback: send whatever is accumulated if done wasn't flagged
        res.json({ output: fullResponse });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ollama error' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Express server running at http://localhost:${PORT}`);
});
