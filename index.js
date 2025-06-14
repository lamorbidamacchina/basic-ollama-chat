// ollama-chat.js
const https = require('http'); // Ollama typically runs on http://localhost:11434
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chatWithOllama(prompt) {
  const data = JSON.stringify({
    model: 'llama3.2',
    prompt: prompt,
    stream: true
  });

  const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let fullResponse = '';
      let tokensGenerated = 0;
      let totalDuration = 0;

      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const jsonResponse = JSON.parse(line);
            if (jsonResponse.response) {
              fullResponse += jsonResponse.response;
              process.stdout.write(jsonResponse.response);
            }
            if (jsonResponse.eval_count) tokensGenerated = jsonResponse.eval_count;
            if (jsonResponse.total_duration) totalDuration = jsonResponse.total_duration;
          } catch (error) {
            // Skip invalid JSON lines
            continue;
          }
        }
      });

      res.on('end', () => {
        resolve({
          response: fullResponse,
          eval_count: tokensGenerated,
          total_duration: totalDuration
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main function to test the chat
async function main() {
  try {
    // Get user input
    rl.question('Enter your prompt: ', async (userPrompt) => {
      console.log('\nSending prompt to Llama 3.2...\n');
      
      const response = await chatWithOllama(userPrompt);
      
      console.log('\n\n--- End Response ---');
      
      // Display metadata
      console.log(`\nTokens generated: ${response.eval_count || 'N/A'}`);
      console.log(`Generation time: ${response.total_duration ? (response.total_duration / 1000000).toFixed(2) + 'ms' : 'N/A'}`);
      
      // Close the readline interface
      rl.close();
    });
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Ollama is running (ollama serve)');
    console.log('2. Llama 3.2 model is installed (ollama pull llama3.2)');
    console.log('3. Ollama is accessible on localhost:11434');
    rl.close();
  }
}

// Run the main function
main();