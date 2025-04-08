# Visual Time Travel

A browser extension that captures and organizes a visual timeline of your browsing history. As you switch between tabs, the extension captures a screenshot, uploads it to a free image host, stores the metadata in a MongoDB database, and presents an interactive timeline UI with revisit options.

## Features

### 1. Automatic Screenshot Capture

-   Detects tab switches in real time
-   Captures a screenshot of the visible tab
-   Uploads the screenshot to freeimage.host
-   Stores the image URL, timestamp, page title, favicon, and URL in MongoDB

### 2. User Authentication

-   Login/Signup via email and password
-   JWT-based authentication
-   Secure storage of tokens

### 3. Visual Timeline Viewer

-   Responsive UI with a scrollable timeline
-   Each entry includes:
    -   Screenshot thumbnail
    -   URL
    -   Timestamp
    -   Revisit button
-   Filter/search history by keyword or domain

### 4. Revisit Flow

-   Clicking an entry restores the original site
-   Optional navigation breadcrumbs

### 5. User Preferences

-   Toggle screenshot capturing
-   Set custom history retention duration

## Project Structure

```
visual-time-travel/
├── extension/               # Browser extension
│   ├── manifest.json        # Extension manifest
│   ├── background.js        # Background script for tab detection
│   ├── content/             # Content scripts
│   │   └── content.js       # Content script for page interactions
│   ├── popup/               # Popup UI
│   │   ├── popup.html       # Popup HTML
│   │   ├── popup.css        # Popup styles
│   │   └── popup.js         # Popup script
│   ├── timeline/            # Timeline UI
│   │   ├── timeline.html    # Timeline HTML
│   │   ├── timeline.css     # Timeline styles
│   │   └── timeline.js      # Timeline script
│   ├── utils/               # Utility functions
│   │   ├── api.js           # API calls
│   │   ├── storage.js       # Browser storage
│   │   └── screenshot.js    # Screenshot capture
│   └── icons/               # Extension icons
│       ├── icon16.png       # 16x16 icon
│       ├── icon32.png       # 32x32 icon
│       ├── icon48.png       # 48x48 icon
│       └── icon128.png      # 128x128 icon
│
├── backend/                 # Express.js backend
│   ├── server.js            # Server entry point
│   ├── config/              # Configuration
│   │   ├── db.js            # MongoDB connection
│   │   └── env.js           # Environment variables
│   ├── controllers/         # Request handlers
│   │   ├── authController.js # Authentication controller
│   │   └── historyController.js # History controller
│   ├── middleware/          # Middleware
│   │   ├── authMiddleware.js # Authentication middleware
│   │   └── errorMiddleware.js # Error handling middleware
│   ├── models/              # MongoDB models
│   │   ├── userModel.js     # User model
│   │   └── historyModel.js  # History model
│   ├── routes/              # API routes
│   │   ├── authRoutes.js    # Authentication routes
│   │   └── historyRoutes.js # History routes
│   ├── services/            # Business logic
│   │   ├── authService.js   # Authentication service
│   │   ├── historyService.js # History service
│   │   └── imageUploadService.js # Image upload service
│   └── utils/               # Utility functions
│       ├── errorHandler.js  # Error handling
│       ├── logger.js        # Logging
│       └── validators.js    # Input validation
│
├── icons/                   # Project icons
└── README.md                # Project documentation
```

## Installation

### Prerequisites

-   Node.js (v14 or higher)
-   MongoDB
-   Chrome, Edge, or Firefox browser

### Backend Setup

1. Clone the repository:

    ```
    git clone https://github.com/chirag127/visual-time-travel.git
    cd visual-time-travel
    ```

2. Install backend dependencies:

    ```
    cd backend
    npm install
    ```

3. Create a `.env` file in the backend directory (use `.env.example` as a template):

    ```
    cp .env.example .env
    ```

4. Edit the `.env` file with your MongoDB connection string and other settings.

5. Start the backend server:
    ```
    npm start
    ```

### Extension Setup

1. The extension doesn't require any additional dependencies as it uses vanilla JavaScript.

2. Load the extension in your browser:

    - Chrome/Edge:

        1. Open `chrome://extensions/` or `edge://extensions/`
        2. Enable "Developer mode"
        3. Click "Load unpacked"
        4. Select the `extension` directory

    - Firefox:
        1. Open `about:debugging#/runtime/this-firefox`
        2. Click "Load Temporary Add-on..."
        3. Select any file in the `extension` directory

## Usage

1. Click the extension icon in your browser toolbar to open the popup.
2. Register a new account or log in with your existing account.
3. Browse the web as usual. The extension will automatically capture screenshots when you switch tabs.
4. Open the extension popup to view your visual browsing history.
5. Use the search and filter options to find specific history items.
6. Click the "Revisit" button to open a history item in a new tab.
7. Adjust your preferences in the Settings tab.

## API Endpoints

### Authentication

-   `POST /api/auth/signup` - Register a new user
-   `POST /api/auth/login` - Login a user
-   `GET /api/auth/me` - Get current user
-   `PUT /api/auth/preferences` - Update user preferences

### History

-   `POST /api/history/screenshot` - Upload a screenshot and add to history
-   `GET /api/history` - Get user history
-   `GET /api/history/domains` - Get user domains
-   `DELETE /api/history/:id` - Delete a history item
-   `DELETE /api/history` - Clear user history

## Technologies Used

### Backend

-   Express.js - Web framework
-   MongoDB/Mongoose - Database
-   JWT - Authentication
-   bcryptjs - Password hashing
-   axios - HTTP client
-   form-data - Multipart form data
-   winston - Logging

### Frontend

-   Vanilla JavaScript
-   Chrome Extension API
-   Fetch API

## Security

-   Passwords are hashed using bcrypt
-   JWT tokens are stored securely
-   HTTPS is enforced for API requests
-   Input validation and sanitization
-   Rate limiting to prevent abuse

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

-   [FreeImage.host](https://freeimage.host/) for providing free image hosting
-   [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) for browser extension capabilities
-   [Express.js](https://expressjs.com/) for the backend framework
-   [MongoDB](https://www.mongodb.com/) for the database

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

Chirag Singhal - [GitHub](https://github.com/chirag127)

Project Link: [https://github.com/chirag127/visual-time-travel](https://github.com/chirag127/visual-time-travel)
