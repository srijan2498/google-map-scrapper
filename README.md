# Google Maps Scraper

A full-stack web application that scrapes Google Maps data for businesses without websites. The application extracts comprehensive business information including contact details, ratings, reviews, and location data, then exports it to an Excel file.

## Project Structure

```
maps-scraper/
├── backend/          # Express.js server with Puppeteer scraper
│   ├── server.js     # API server (runs on port 3001)
│   ├── scraper.js    # Google Maps scraping logic
│   └── package.json
└── frontend/         # React + Vite frontend
    ├── src/
    └── package.json
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the Project

You need to run **both** the backend and frontend servers simultaneously.

### Option 1: Using Two Terminal Windows

**Terminal 1 - Backend Server:**
```bash
cd backend
node server.js
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

### Option 2: Using Background Process (macOS/Linux)

```bash
# Start backend in background
cd backend
node server.js &

# Start frontend
cd ../frontend
npm run dev
```

## Using the Application

1. Open your browser and navigate to the frontend URL (typically `http://localhost:5173`)
2. Enter the following information:
   - **Search Key**: What you're looking for (e.g., "restaurants", "dentists")
   - **Location**: Where to search (e.g., "New York, NY", "San Francisco")
   - **Number of Records**: How many matching businesses to scrape
3. Click the scrape button
4. Wait for the scraping to complete
5. An Excel file will be automatically downloaded with all the business data

## Data Extracted

The scraper collects the following information for businesses **without websites**:
- Business Name
- Address
- Phone Number
- Email (if available)
- Rating
- Number of Reviews
- Category/Type
- Business Hours
- Plus Code
- Coordinates (Latitude/Longitude)
- Claim Status
- Google Maps URL

## Tech Stack

### Backend
- **Express.js** - Web server framework
- **Puppeteer** - Headless browser for web scraping
- **ExcelJS** - Excel file generation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **JavaScript/JSX** - Programming language

## Development

### Backend Development with Auto-Reload

For development, you can use nodemon for automatic server restarts:

```bash
cd backend
npx nodemon server.js
```

### Frontend Development

The Vite dev server already includes hot module replacement (HMR), so changes will reflect immediately.

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Troubleshooting

### Port Already in Use

If port 3001 (backend) or 5173 (frontend) is already in use:

**Backend:** Set a different port
```bash
PORT=3001 node server.js
```

**Frontend:** Vite will automatically try the next available port

### Puppeteer Installation Issues

If Puppeteer fails to download Chromium:
```bash
cd backend
npm install puppeteer --unsafe-perm=true
```

### CORS Errors

Make sure the backend server is running before starting the frontend. The backend is configured to accept requests from any origin.

## API Endpoints

### POST `/api/scrape`

Scrapes Google Maps for business data.

**Request Body:**
```json
{
  "searchKey": "restaurants",
  "location": "New York, NY",
  "limit": 10
}
```

**Response:**
- Returns an Excel file (.xlsx) as a download

## Notes

- The scraper specifically targets businesses **without websites**
- Scraping may take time depending on the number of records requested
- Google Maps may implement rate limiting or anti-bot measures
- Use responsibly and in accordance with Google's Terms of Service
