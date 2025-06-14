# Basic Ollama Chat

A simple web interface for chatting with Ollama's Llama 3.2 model. The application provides a very basic UI for interacting with the model and includes features for file summarization.

![Basic Ollama Chat Interface](https://lamorbidamacchina.com/images/ollama/ollama-chat.png)

## Features

- Chat interface with Llama 3.2
- File upload and summarization (supports .txt files)
- Markdown formatting in responses
- Conversation history
- Token count and response time tracking

## Prerequisites

- Node.js (v14 or higher)
- Ollama installed and running
- Llama 3.2 model pulled in Ollama

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd basic-ollama-chat
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Ollama is running:
```bash
ollama serve
```

4. Verify Llama 3.2 is available:
```bash
ollama list
```
If Llama 3.2 is not listed, pull it:
```bash
ollama pull llama3.2
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Chat Interface
- Type your message in the text area
- Press Enter or click the send button to submit
- Use Shift+Enter for new lines

### File Summarization
1. Click "Upload File" to select a text file
2. Click "Summarize" to generate a summary
3. The summary will appear in the chat and be saved to the `summaries` folder

### Clearing Chat
- Click "Clear Chat" to reset the conversation history

## Project Structure

```
.
├── index.html          # Frontend interface
├── server.js           # Express server and API endpoints
├── styles.css          # Custom styles
├── uploads/           # Directory for uploaded files
└── summaries/         # Directory for generated summaries
```

## Notes

- The application uses Ollama's API at `http://localhost:11434`
- Uploaded files are stored in the `uploads` directory
- Generated summaries are saved in the `summaries` directory
- PDF support is planned for future updates

## Troubleshooting

If you encounter connection issues:
1. Ensure Ollama is running (`ollama serve`)
2. Verify Llama 3.2 is installed (`ollama list`)
3. Check that Ollama is accessible at `localhost:11434`
