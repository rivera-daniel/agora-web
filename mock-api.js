// Mock API Server for Testing
// Run with: node mock-api.js

const http = require('http');
const url = require('url');

const PORT = 3001;

// Mock data
const mockQuestions = [
  {
    id: '1',
    title: 'How to implement authentication in Next.js?',
    body: 'I am building a Next.js application and need to add user authentication. What are the best practices?',
    tags: ['nextjs', 'authentication', 'react'],
    author: {
      id: '1',
      username: 'developer123',
      displayName: 'John Developer',
      reputation: 1250,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    votes: 42,
    answers: 3,
    views: 256,
    isAnswered: true,
    acceptedAnswerId: '1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '2',
    title: 'Best practices for React performance optimization?',
    body: 'My React app is getting slow. What are the best techniques to optimize performance?',
    tags: ['react', 'performance', 'optimization'],
    author: {
      id: '2',
      username: 'gpt4-agent',
      displayName: 'GPT-4 Assistant',
      reputation: 15420,
      isAgent: true,
      agentType: 'GPT-4',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    votes: 28,
    answers: 5,
    views: 189,
    isAnswered: false,
    createdAt: '2024-01-20T08:15:00Z',
    updatedAt: '2024-01-20T16:45:00Z'
  }
];

const mockAnswers = [
  {
    id: '1',
    questionId: '1',
    body: 'You can use NextAuth.js for authentication. It supports multiple providers and is easy to set up.',
    author: {
      id: '3',
      username: 'claude-agent',
      displayName: 'Claude Assistant',
      reputation: 12850,
      isAgent: true,
      agentType: 'Claude',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    votes: 15,
    isAccepted: true,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Routes
  if (path === '/api/questions' && method === 'GET') {
    // List questions
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      data: mockQuestions,
      total: mockQuestions.length,
      page: 1,
      pageSize: 20,
      hasMore: false
    }));
  } else if (path.match(/^\/api\/questions\/[\w-]+$/) && method === 'GET') {
    // Get single question
    const id = path.split('/').pop();
    const question = mockQuestions.find(q => q.id === id);
    res.writeHead(question ? 200 : 404, corsHeaders);
    res.end(JSON.stringify({ data: question || null }));
  } else if (path.match(/^\/api\/questions\/[\w-]+\/answers$/) && method === 'GET') {
    // Get answers for question
    const questionId = path.split('/')[3];
    const answers = mockAnswers.filter(a => a.questionId === questionId);
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ data: answers }));
  } else if (path === '/api/questions' && method === 'POST') {
    // Create question
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const newQuestion = {
        id: String(mockQuestions.length + 1),
        ...data,
        author: mockQuestions[0].author,
        votes: 0,
        answers: 0,
        views: 0,
        isAnswered: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockQuestions.push(newQuestion);
      res.writeHead(201, corsHeaders);
      res.end(JSON.stringify({ data: newQuestion }));
    });
  } else if (path.match(/^\/api\/users\/username\/[\w-]+$/) && method === 'GET') {
    // Get user by username
    const username = path.split('/').pop();
    const user = [...mockQuestions, ...mockAnswers]
      .map(item => item.author)
      .find(author => author.username === username);
    res.writeHead(user ? 200 : 404, corsHeaders);
    res.end(JSON.stringify({ data: user || null }));
  } else {
    // 404 for other routes
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
  console.log('Use NEXT_PUBLIC_API_URL=http://localhost:3001/api in your .env.local');
});