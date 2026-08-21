# Pathfinder AI 🗺️
A personalized, AI-powered learning navigator designed to create dynamic quizzes, analyze results, and generate custom study plans.

Pathfinder AI is a full-stack web application built for a hackathon to solve a common problem for students: inefficient studying. Instead of a one-size-fits-all approach, Pathfinder assesses a user's knowledge on any topic, identifies their specific weaknesses, and provides an actionable, AI-generated study plan to help them master the subject.

✨ Core Features
For Users:
Dynamic Quiz Generation: Enter any topic and receive a unique, 10-question quiz with varied difficulty levels (easy, medium, hard, and extreme).

Personalized Study Plans: Based on incorrect answers, the AI generates a custom study plan with targeted concepts, resource links, and practice tasks.

AI-Powered Explanations: Get instant, simple explanations for any quiz question you answered incorrectly.

Conversational AI Tutor: Ask follow-up questions and get answers from an AI tutor within the context of your study plan.

Secure Authentication: Full user registration and login system with persistent sessions.

Comprehensive Quiz History: Review every quiz you've taken, see your scores, and expand each result to view the full quiz and study plan.

Gamification: Earn points for correct answers and build a daily learning streak to stay motivated.

User Profile: Track your total points, current streak, and visualize your recent performance on a personal dashboard.

For Admins:
Admin Dashboard: A secure, role-protected page to view all platform activity.

User Management: See a list of all registered users and their roles.

Platform-Wide Results: View a complete history of every quiz taken by all users on the platform.

🛠️ Tech Stack
Backend
Framework: Python, FastAPI

Database: MongoDB (managed with MongoDB Compass)

AI: Google Gemini API

Authentication: JWT (JSON Web Tokens), passlib for hashing

Driver: Motor (Asynchronous MongoDB driver)

Frontend
Framework: React (using Vite)

Routing: React Router

API Calls: Axios

UI/Styling: Custom CSS with a professional dark theme and animated background

Charting: Recharts

🚀 Getting Started
Prerequisites
Python 3.8+

Node.js and npm

MongoDB Community Server installed and running locally

Installation & Setup
Clone the repository:

git clone [https://github.com/your-username/pathfinder-ai.git](https://github.com/your-username/pathfinder-ai.git)
cd pathfinder-ai

Backend Setup:

Navigate to the backend folder: cd backend

Create and activate a virtual environment:

python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

Install dependencies: pip install -r requirements.txt

Create a .env file in the backend directory and add your keys:

API_KEY="your_google_ai_api_key"
MONGO_URI="mongodb://localhost:27017"
SECRET_KEY="generate_a_strong_random_secret_key"

Frontend Setup:

Navigate to the frontend folder: cd ../frontend

Install dependencies: npm install

Running the Application
Start the Backend Server:

In a terminal (in the backend folder with venv active):

uvicorn main:app --reload

The server will be running at http://localhost:8000.

Start the Frontend Client:

In a second terminal (in the frontend folder):

npm run dev

The application will be accessible at http://localhost:5173.

Creating an Admin User
Sign up for a new account through the web interface.

Open MongoDB Compass and connect to your local database.

Navigate to the pathfinder_db database and open the users collection.

Find the user you just created, click the "edit" icon, and add a new field:

Field Name: role

Field Value: admin

Save the document. The next time this user logs in, they will have access to the "Admin" dashboard.

📄 License
This project is licensed under the MIT License.
