# Product Requirements Document (PRD)

## Product Name
**Visual Time Travel**

## Description
"Visual Time Travel" is a browser extension that captures and organizes a visual timeline of a user's browsing history. As users switch between tabs, the extension captures a screenshot, uploads it to a free image host, stores the metadata in a MongoDB database, and presents an interactive timeline UI with revisit options.

---

## Target Platforms
- Browsers: **Chrome, Edge, Firefox**
- Backend: **Express.js**
- Database: **MongoDB**
- Image Hosting: [https://freeimage.host/page/api?lang=en](https://freeimage.host/page/api?lang=en)

---

## Features

### 1. **Automatic Screenshot Capture**
- Detect tab switches in real time.
- Capture a screenshot of the visible tab.
- Upload the screenshot to freeimage.host via backend API.
- Store the image URL, timestamp, page title, favicon, and URL in MongoDB.

### 2. **User Authentication**
- Login/Signup via email and password.
- Sessions stored in local storage or browser secure cookie.
- JWT-based authentication.

### 3. **Visual Timeline Viewer**
- Responsive UI with a scrollable timeline.
- Each entry includes:
  - Screenshot thumbnail
  - URL
  - Timestamp
  - Revisit button
- Filter/search history by keyword or domain.

### 4. **Revisit Flow**
- Clicking an entry restores the original site.
- Optionally shows navigation breadcrumbs.

### 5. **User Preferences**
- Toggle screenshot capturing.
- Set custom history retention duration.

---

## Technical Requirements

### Frontend (extension/)
- **Manifest V3**
- **Technologies:** HTML, CSS, JS
- Background script for tab detection
- Content script for optional UI injection
- Popup for login and settings
- Secure storage of JWT
- Timeline UI with lazy loading

### Backend (backend/)
- **Express.js** server
- Routes:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/forgot-password`
  - `POST /api/upload-screenshot`
  - `GET /api/history`
- Middleware for JWT validation
- Screenshot upload to FreeImage.host via multipart/form-data
- MongoDB Models:
  - User: email, passwordHash
  - HistoryItem: userId, imageUrl, title, url, timestamp, favicon

### Image Hosting
- Use `https://freeimage.host/api/1/upload`
- Send screenshot as `base64` or `file`
- Store returned `display_url` in MongoDB

### MongoDB
- Collections:
  - `users`
  - `history`
- Use indexes for efficient search & retrieval

---

## Project Structure

```plaintext
visual-time-travel/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── styles/
│       └── popup.css
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── config/
│       └── db.js
└── README.md
```

---

## Libraries & Frameworks
- **Frontend:** None (Vanilla JS)
- **Backend:**
  - `express`
  - `mongoose`
  - `bcryptjs`
  - `jsonwebtoken`
  - `axios`
  - `multer` (if using file buffer)

---

## Security
- Secure JWT storage using browser storage API
- HTTPS enforcement for API requests
- Input validation and sanitization

---

## UX/UI Design
- Timeline cards with hover effects
- Pagination / infinite scroll for history
- Light/Dark mode toggle
- Login & settings in extension popup

---

## Deployment
- **Backend:** Render
- **Database:** MongoDB Atlas
- **GitHub Repo:** `https://github.com/chirag127/visual-time-travel`

---

## Testing
- Unit Tests: Mocha/Chai for backend
- Integration Tests: Postman collections
- Manual Testing across Chrome, Firefox, Edge

---

## Milestones
1. ✅ Project Setup (frontend + backend folder structure)
2. 🔒 Auth System (JWT + MongoDB)
3. 📸 Screenshot Capture on Tab Switch
4. ☁️ Image Upload API
5. 🧠 History Storage in DB
6. 🕓 Timeline View UI
7. 🎨 Polish UI/UX + Preferences
8. ✅ Full Testing & Cross-browser Support

---

## Final Deliverables
- Fully working browser extension (packed + source)
- Production-ready backend API
- README + Documentation
- All pushed to `chirag127/visual-time-travel`


const FormData = require("form-data");

/**
 * Uploads an image to freeimage.host
 * @param {string} imageBase64 - Base64 encoded image data (without the data:image/png;base64, prefix)
 * @returns {Promise<string>} - URL of the uploaded image
 */
const uploadToFreeImageHost = async (imageBase64) => {
    const api_key = "6d207e02198a847aa98d0a2a901485a5";
    const api_url = "https://freeimage.host/api/1/upload";
    const formData = new FormData();
    formData.append("key", api_key);
    formData.append("source", imageBase64);
    formData.append("action", "upload");
    formData.append("format", "json");

    try {
        const response = await axios.post(api_url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (response.status === 200) {
            return response.data.image.url;
        } else {
            throw new Error("Failed to upload image");
        }
    } catch (error) {
        console.error("Error uploading image:", error.message);
        throw error;
    }
};

module.exports = { uploadToFreeImageHost };


make the code as modular as possible, so that it can be reused in other projects. The code should be well-documented and follow best practices for readability and maintainability. Use ES6+ syntax where applicable.