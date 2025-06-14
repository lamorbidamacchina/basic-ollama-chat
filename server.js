const express = require('express');
const path = require('path');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 3000;

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const summariesDir = path.join(__dirname, 'summaries');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(summariesDir)) {
    fs.mkdirSync(summariesDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        // Keep original filename
        cb(null, file.originalname)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only pdf and text files
        if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and text files are allowed!'), false);
        }
    }
});

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Store conversation history
let conversationHistory = [];

// Proxy endpoint for Ollama API
app.post('/api/chat', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 11434,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Add the new message to conversation history
    conversationHistory.push({
        role: 'user',
        content: req.body.prompt
    });

    // Prepare the chat request
    const chatRequest = {
        model: 'llama3.2',
        messages: conversationHistory,
        stream: true
    };

    const ollamaReq = http.request(options, (ollamaRes) => {
        // Forward the status code
        res.status(ollamaRes.statusCode);
        
        // Forward the headers
        res.setHeader('Content-Type', 'application/json');
        
        // Pipe the response from Ollama to our response
        ollamaRes.pipe(res);
    });

    ollamaReq.on('error', (error) => {
        console.error('Error connecting to Ollama:', error.message);
        
        // Check if it's a connection refused error
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({ 
                error: 'Cannot connect to Ollama server',
                details: 'Please make sure Ollama is running (ollama serve)'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to connect to Ollama server',
                details: error.message
            });
        }
    });

    // Send the chat request
    ollamaReq.write(JSON.stringify(chatRequest));
    ollamaReq.end();
});

// Endpoint to clear conversation history
app.post('/api/clear', (req, res) => {
    conversationHistory = [];
    res.json({ status: 'Conversation history cleared' });
});

// Endpoint for file summarization
app.post('/api/summarize', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        let fileContent = '';
        
        // Read file content
        if (req.file.mimetype === 'text/plain') {
            fileContent = fs.readFileSync(req.file.path, 'utf8');
        } else if (req.file.mimetype === 'application/pdf') {
            // For PDF files, we'll need to use a PDF parsing library
            // For now, we'll just return an error
            return res.status(400).json({ error: 'PDF support coming soon!' });
        }

        // Prepare the prompt for summarization
        const prompt = `Please provide a concise summary of the following text:\n\n${fileContent}`;

        const options = {
            hostname: '127.0.0.1',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        let fullResponse = '';

        const ollamaReq = http.request(options, (ollamaRes) => {
            res.status(ollamaRes.statusCode);
            res.setHeader('Content-Type', 'application/json');

            ollamaRes.on('data', (chunk) => {
                try {
                    const jsonResponse = JSON.parse(chunk.toString());
                    if (jsonResponse.response) {
                        fullResponse += jsonResponse.response;
                    }
                } catch (error) {
                    // Ignore parsing errors for partial chunks
                }
            });

            ollamaRes.on('end', () => {
                // Save the summary to a file
                const summaryFileName = path.join(summariesDir, `summary_${req.file.originalname}`);
                fs.writeFileSync(summaryFileName, fullResponse);

                // Send the complete response to the client
                res.end(JSON.stringify({
                    response: fullResponse,
                    summaryFile: summaryFileName
                }));
            });
        });

        ollamaReq.on('error', (error) => {
            console.error('Error connecting to Ollama:', error.message);
            res.status(500).json({ 
                error: 'Failed to connect to Ollama server',
                details: error.message
            });
        });

        // Send the summarization request
        ollamaReq.write(JSON.stringify({
            model: 'llama3.2',
            prompt: prompt,
            stream: false // Changed to false to get complete response
        }));
        ollamaReq.end();

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ 
            error: 'Failed to process file',
            details: error.message
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Make sure Ollama is running (ollama serve)');
}); 