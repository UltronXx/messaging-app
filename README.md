# Messaging Web App

A real-time messaging web application built with Node.js, Express, Socket.io, and Neon Postgres with a mobile-first layout.

## Features

- 📱 Mobile-first responsive design
- 🔐 User authentication with JWT
- 💬 Real-time messaging with Socket.io
- 👥 Add and manage contacts
- 🚀 Message read receipts and typing indicators
- 🔍 Search for users and conversations

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: Neon Postgres (serverless PostgreSQL)
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Prerequisites

- Node.js (v14+)
- A Neon Postgres database (or any PostgreSQL database)

## Setup and Installation

1. Clone the repository or download the code
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your configuration:
   ```
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   DATABASE_URL=your_neon_postgres_connection_string
   NODE_ENV=development
   ```
4. Initialize the database tables:
   ```
   npm run init-db
   ```
5. Start the application:
   ```
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
messaging-app/
├── public/              # Static files
│   ├── css/             # CSS styles
│   ├── js/              # Client-side JavaScript
│   ├── img/             # Images
│   └── index.html       # Main HTML file
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── db.js            # Database connection
│   └── socket.js        # Socket.io handlers
├── .env                 # Environment variables
├── .env.example         # Example environment file
├── database.sql         # SQL schema
├── init-db.js           # Database initialization script
├── package.json         # Project dependencies
├── README.md            # Project documentation
└── server.js            # Main application entry point
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/contacts` - Get user contacts
- `POST /api/users/contacts` - Add a new contact
- `GET /api/users/search` - Search for users

### Messages
- `GET /api/messages/conversation/:contactId` - Get conversation messages
- `POST /api/messages` - Send a message
- `PUT /api/messages/:messageId/read` - Mark message as read
- `GET /api/messages/unread` - Get unread message counts

## Deployment

To deploy to production:

1. Set environment variables for production
2. Build and start the application:
   ```
   npm start
   ```

## License

MIT
