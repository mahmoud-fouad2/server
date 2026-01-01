# Faheemly API Documentation

## Overview
This is the backend API for the Faheemly Chatbot platform. It provides endpoints for widget communication, dashboard management, authentication, and AI processing.

## Base URL
- **Production:** `https://fahimo-api.onrender.com`
- **Development:** `http://localhost:3001`

## Authentication
Most endpoints require a Bearer Token.
`Authorization: Bearer <token>`

## Key Endpoints

### Authentication
- `POST /api/auth/register` - Register a new business
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info

### Widget (Public)
- `GET /api/widget/config/:businessId` - Get widget configuration
- `POST /api/widget/chat/init` - Initialize a chat session
- `POST /api/widget/chat/send` - Send a message

### Dashboard
- `GET /api/dashboard/stats` - Get analytics
- `GET /api/conversations` - List conversations

## Development
To run the API locally:
```bash
npm install
npm run dev
```

## Error Handling
The API returns standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
- Global limit: 100 requests per 15 minutes
- API limit: 100 requests per 15 minutes
