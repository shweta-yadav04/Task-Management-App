TEAM TASK MANAGER
=================

A full-stack project management application that enables teams to collaborate, assign tasks, and track progress securely. Built with the MERN stack and designed with a premium dark-themed UI.

FEATURES
--------
- Role-Based Access Control (RBAC): Secure authorization distinguishing between standard 'Members' and 'Admins'. Admins are securely assigned via environment variables.
- Project & Task Management: Create projects, assign tasks to members, and track status (Todo, In-Progress, Done).
- Secure Authentication: JWT-based authentication with bcrypt password hashing.
- Real-time Status Calculations: Automatic calculation of overdue tasks using MongoDB virtuals.
- Responsive Dark UI: A modern, dynamic, and responsive dark-themed user interface.

TECH STACK
----------
- Frontend: React.js, Vite, React Router DOM, Axios
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Security: JSON Web Tokens (JWT), bcryptjs, express-validator, CORS

PROJECT STRUCTURE
-----------------
team-task-manager/
├── backend/                  # Node.js & Express REST API
│   ├── controllers/          # Request handlers
│   ├── middleware/           # JWT verification, Role checks
│   ├── models/               # Mongoose schemas (User, Project, Task)
│   ├── routes/               # API endpoint definitions
│   ├── server.js             # Entry point & Express setup
│   └── .env                  # Backend secrets (not tracked)
│
├── frontend/                 # React.js Vite Application
│   ├── src/
│   │   ├── api/              # Axios configuration
│   │   ├── components/       # Reusable UI components & Layouts
│   │   ├── context/          # Global state (AuthContext)
│   │   ├── pages/            # Page-level components
│   │   ├── App.jsx           # Routing logic
│   │   └── index.css         # Global styles (Dark Theme)
│   ├── vite.config.js        # Vite configuration & dev proxy
│   └── .env                  # Frontend variables (not tracked)
│
├── .gitignore                # Global ignore rules
└── readme.txt                # Project documentation

SECURITY MEASURES
-----------------
- Password Hashing: Passwords are never stored in plaintext. They are hashed using bcryptjs (via a Mongoose pre-save hook) with a salt round of 12 before being saved to the database.
- JWT Authentication: Stateful sessions are avoided. Instead, jsonwebtoken is used to securely sign and verify user identity upon login. The token is passed in the Authorization header.
- Route Protection & RBAC: Custom Express middleware (auth.js) intercepts secure routes. It verifies the JWT and ensures that critical operations (like creating projects) are strictly limited to users with the 'admin' role.
- CORS Protection: Cross-Origin Resource Sharing is strictly configured to only accept requests from the designated CLIENT_URL, preventing malicious third-party sites from interacting with the API.
- Input Validation: Incoming request bodies are sanitized and validated using express-validator to prevent bad data and injection attacks.
- Environment Driven Admin Allocation: Admin rights are granted securely based on a server-side .env variable (ADMIN_EMAIL).

API ENDPOINTS
-------------
Authentication (/api/auth)
- POST /register : Register a new user
- POST /login : Authenticate user and return JWT

Projects (/api/projects)
- GET / : Retrieve all projects
- POST / : Create a new project (Admin only)
- GET /:id : Get details of a specific project
- PUT /:id : Update a project (Admin only)
- DELETE /:id : Delete a project (Admin only)

Tasks (/api/tasks)
- GET / : Retrieve tasks (filtered by project or assignee)
- POST / : Create a new task (Admin only)
- PUT /:id/status : Update task status (Assigned Member or Admin)
- DELETE /:id : Delete a task (Admin only)

Users (/api/users)
- GET / : Get a list of all team members (Admin only)

---------------------------------------------------------
GETTING STARTED LOCALLY

1. Prerequisites
- Node.js installed
- MongoDB (local or Atlas cluster)

2. Environment Variables
You need to create a .env file in the /backend directory:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=your_admin_email@example.com
CLIENT_URL=http://localhost:5173

3. Installation
Navigate to backend folder and run: npm install
Navigate to frontend folder and run: npm install

4. Run the Application
Open two terminals.
In backend folder run: npm run dev
In frontend folder run: npm run dev

---------------------------------------------------------
DEPLOYMENT (RAILWAY)

1. Create a new project on Railway and connect your GitHub repo.
2. Backend Service: Set Root Directory to /backend. Add your environment variables (MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, CLIENT_URL).
3. Frontend Service: Create a second service from the same repo. Set Root Directory to /frontend. Add the VITE_API_URL environment variable pointing to your backend service URL.
4. Update the backend CLIENT_URL to match the generated frontend domain for secure CORS.
