# Task Manager API

A simple REST API for managing tasks, built using Node.js, Express, and MongoDB.

This project started as an in-memory API and was later upgraded to use MongoDB. The structure was improved to follow best practices using controllers, routes, and models.

---

## Features

- Create a task
- Retrieve all tasks
- Retrieve a single task by ID
- Update a task
- Delete a task
- Input validation and error handling

---

## Tech Stack

- Node.js
- Express
- MongoDB (Mongoose)

---

## Setup Instructions

### 1. Clone the repository

- git clone https://github.com/ViGi02/task-manager-api.git
- cd task-manager-api

---

### 2. Install dependencies
- npm install

---

### 3. Create a .env file in the root folder and add the following:
- MONGO_URI=your_mongodb_connection_string
- PORT=3001

---

### 4. Start the server
- npm start

- Server runs at: http://localhost:3001

---

### API Endpoints

| Method | Endpoint    | Description        |
|--------|------------|--------------------|
| GET    | /tasks     | Get all tasks      |
| GET    | /tasks/:id | Get a single task  |
| POST   | /tasks     | Create a task      |
| PUT    | /tasks/:id | Update a task      |
| DELETE | /tasks/:id | Delete a task      |

---

### Project Structure

task-manager-api/
|
|-- config/         Database connection
|-- controllers/    Business logic
|-- models/         Mongoose schemas
|-- routes/         API routes
|-- server.js       Entry point

---

### Notes

- MongoDB Atlas is used for the database
- Ensure your IP is whitelisted in MongoDB Atlas
- The .env file is excluded using .gitignore for security