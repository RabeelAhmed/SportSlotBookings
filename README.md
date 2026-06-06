# SportSlot Bookings

A web application for booking sports courts and grounds (like Cricket and Football) with real-time slot availability, live dashboard updates, and booking status management.

## Features

- **Real-Time Booking Status**: Updates slot availability dynamically across clients using WebSockets.
- **Dynamic Pricing**: Rates adjust based on the time slot selected (e.g., standard rates during daytime and premium rates for evening sessions under floodlights).
- **Interactive Booking Flow**: View available hourly slots for any date, check pricing details, and book slots instantly.
- **QR Code Confirmation**: A booking generates a unique 8-character confirmation code along with a QR code for check-in.
- **Booking Expiration**: Temporary or unpaid bookings automatically expire and release the slots back to the public if not confirmed within a set period.
- **Admin Dashboard**: View analytics, track active/pending bookings, cancel bookings, and mark bookings as checked-in.
- **User Dashboard**: Keep track of booking history and view active confirmation QR codes.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS (v4), Framer Motion, React Router, Socket.io Client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, JSON Web Tokens (JWT), QR Code Generator

## Project Structure

```text
SportSlotBookings/
├── client/          # Frontend React application
└── server/          # Backend Express server & database models
```

## Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### Setup & Installation

1. Clone or download this project.

2. **Set up the backend server:**
   - Go to the `server` directory:
     ```bash
     cd server
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file in the `server` directory and add your configurations:
     ```env
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/sportslot
     JWT_SECRET=your_jwt_secret_key_here
     ```
   - Seed the initial sports data (cricket court, football turf) to the database:
     ```bash
     node seedSports.js
     ```
   - Start the server in development mode:
     ```bash
     npm run dev
     ```

3. **Set up the frontend client:**
   - Open a new terminal window and navigate to the `client` directory:
     ```bash
     cd client
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the Vite development server:
     ```bash
     npm run dev
     ```
   - Open your browser and go to `http://localhost:5173`.

## Admin Access

To access the admin dashboard at `/admin`, log in with an account that has admin privileges.
To register or update an admin account, you can create a user through the client registration page and update their `role` field to `'admin'` directly in your MongoDB database (e.g., using MongoDB Compass or the Mongo shell).
