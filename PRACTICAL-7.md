# Practical 7: Authentication and Middleware Pipeline

**Course:** B.Tech (IT/CE/CSE/AIML) – Advanced Web Development Frameworks (ITUE301)  
**Institution:** Faculty of Technology & Engineering, Charotar University of Science and Technology (CHARUSAT) / CSPIT / DEPSTAR  
**Course Outcomes:** CO2, CO6 | **Program Outcomes:** PO3, PO5  
**Deliverable:** Working Authentication & Middleware Pipeline with Task Management  

---

## 1. Objective

To implement a secure, stateless **JWT (JSON Web Token)**-based authentication flow, password hashing using **bcrypt**, and request input validation as part of an **Express.js middleware pipeline** guarding a full-stack Task Management application.

---

## 2. Architecture & Pipeline Flow

```
+---------------------------------------------------------------------------------------+
|                               AUTHENTICATION FLOW                                      |
+---------------------------------------------------------------------------------------+

  1. Registration:
     Client POST /register (email, password)
       --> [Validation Middleware] (valid email format, password length >= 6)
       --> bcrypt.hash(password, 10) [salt rounds = 10]
       --> User.create({ email, password: hashedPassword })
       --> Response: 201 Created

  2. Login:
     Client POST /login (email, password)
       --> [Validation Middleware] (email & password present)
       --> User.findOne({ email })
       --> bcrypt.compare(password, user.password)
       --> jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' })
       --> Response: 200 OK (returns token & user object)

+---------------------------------------------------------------------------------------+
|                            PROTECTED ROUTE PIPELINE                                   |
+---------------------------------------------------------------------------------------+

  Client Request: GET/POST/PUT/DELETE /tasks
  Header: Authorization: Bearer <token>
       |
       v
  [Auth Middleware (middleware/auth.js)]
       |-- Check header: 'Bearer <token>'
       |-- jwt.verify(token, process.env.JWT_SECRET)
       |-- IF missing/invalid/expired: return 401 Unauthorized (safe try/catch)
       |-- IF valid: req.user = decoded payload
       v
  [Validation Middleware (middleware/validate.js)]
       |-- Validates request payload before controller
       |-- e.g. POST /tasks: title required, non-empty, min 3 chars
       |-- IF invalid: return 400 Bad Request
       v
  Controller Handler (server.js)
       |-- Performs MongoDB queries / mutations linked to req.user.id
       v
  Database (MongoDB: users, tasks collections)
```

---

## 3. Key Questions & Analysis (Viva Preparation)

### Question 1: Why must passwords be hashed before storage instead of saved as plain text, even in a lab/demo project?
* **Defense in Depth & Blast Radius Limitation:** Storing plaintext passwords leaves users vulnerable in the event of database dumps, unauthorized backups access, or SQL/NoSQL injection vulnerabilities. Even in lab or demonstration projects, developers frequently use passwords similar to their personal accounts.
* **Why `bcrypt` over plain SHA-256 / MD5?** Plain hashing algorithms like SHA-256 are designed to be fast (calculating billions of hashes per second), which makes them susceptible to brute-force and precomputed **rainbow table** attacks. In contrast:
  1. `bcrypt` automatically generates a **unique cryptographically secure salt** for every password, preventing rainbow table attacks.
  2. `bcrypt` is an **adaptive key-derivation function** with a configurable work factor (`cost = 10`). It intentionally introduces computational delay, rendering brute-force attacks computationally infeasible.

### Question 2: What does the authentication middleware actually verify, and what happens if the token is missing or expired?
* **Verification Process:** The authentication middleware (`auth.js`):
  1. Checks for the presence of the `Authorization` HTTP header adhering to the `Bearer <token>` convention.
  2. Extracts the signed token substring.
  3. Uses `jwt.verify(token, process.env.JWT_SECRET)` to cryptographically verify the digital signature using HMAC-SHA256, ensuring the payload has not been tampered with in transit.
  4. Inspects token claims, specifically `exp` (expiration timestamp) and `iat` (issued at).
* **Missing or Expired Tokens:**
  - If the header or token is missing, the middleware immediately rejects the request with HTTP `401 Unauthorized`.
  - If the token is expired (`TokenExpiredError`) or forged (`JsonWebTokenError`), `jwt.verify()` throws an exception.
  - **Crucial Implementation Note:** Token verification **must** be wrapped inside a `try/catch` block. Unhandled throws crash the Node.js event loop. Wrapping it allows the server to safely return HTTP `401 Unauthorized` without downtime.

### Question 3: Why should input validation happen on the server even if the frontend already validates the same fields?
* **Frontend Validation is for UX, Server Validation is for Security & Integrity:**
  - Client-side validation improves user experience by providing instantaneous visual feedback before a network round-trip.
  - However, frontend validation can be effortlessly bypassed using tools such as **Postman, cURL, browser DevTools, or custom automated scripts**.
  - The server is the single authoritative gatekeeper of the database. Server-side validation middleware (`middleware/validate.js`) guarantees that malformed, malicious, or incomplete payloads are rejected with HTTP `400 Bad Request` before touching database models or triggering database driver exceptions.

---

## 4. Implementation Details

### A. Environment & Packages
* Dependencies installed: `bcryptjs` and `jsonwebtoken`.
* Secret management in `Backend/.env`:
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/Tasks
  JWT_SECRET=awdf_practical7_jwt_secret_key_2026
  ```
* Environment files are excluded from version control via `.gitignore`.

### B. User Schema (`Backend/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    }
}, { timestamps: true });
```

### C. Authentication Middleware (`Backend/middleware/auth.js`)
```javascript
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Authorization header must be in format: Bearer <token>"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: err.name === "TokenExpiredError" 
                ? "Token has expired. Please log in again." 
                : "Invalid token. Authorization failed."
        });
    }
};

module.exports = auth;
```

### D. Input Validation Middleware (`Backend/middleware/validate.js`)
* `validateTask`: Enforces non-empty string title with `>= 3` characters on creation and updates.
* `validateRegister`: Enforces valid email pattern and password length `>= 6`.
* `validateLogin`: Enforces required presence of email and password.

### E. Supplementary Features Implemented
1. **`/me` Endpoint**:
   - Protected route `GET /me` returns `{ success: true, data: { _id, email, createdAt } }` excluding password (`.select("-password")`).
2. **Frontend 401 & Token Expiry Handling**:
   - `Frontend/src/pages/Todo.jsx` automatically catches `401 Unauthorized` responses on all task operations, purges `localStorage`, and transitions the UI back to the login card with an informative session alert.
3. **Logout Mechanism**:
   - Dedicated client-side **Logout** button purges the JWT token and user record from `localStorage` and resets application state.

---

## 5. Verification Test Suite & Evidence

All 8 test cases were executed against the live server (`http://localhost:5000`):

| Test Case | Method & Endpoint | Payload / Header | Expected Status | Actual Result | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **1. Missing Token Protection** | `GET /tasks` | None | `401 Unauthorized` | `401 Unauthorized` | **PASS** |
| **2. User Registration** | `POST /register` | Valid email & password | `201 Created` | `201 Created` (hashed in DB) | **PASS** |
| **3. User Login & Token Issue** | `POST /login` | Registered credentials | `200 OK` | `200 OK` (Signed JWT) | **PASS** |
| **4. Supplementary /me Endpoint** | `GET /me` | `Bearer <token>` | `200 OK` | `200 OK` (User info) | **PASS** |
| **5. Input Validation Middleware** | `POST /tasks` | Empty title `""` | `400 Bad Request` | `400 Bad Request` | **PASS** |
| **6. Authenticated Task Creation** | `POST /tasks` | Valid title + `Bearer <token>` | `201 Created` | `201 Created` (Linked to user) | **PASS** |
| **7. Authenticated Collection Fetch** | `GET /tasks` | `Bearer <token>` | `200 OK` | `200 OK` (Tasks retrieved) | **PASS** |
| **8. Tampered / Malformed Token** | `GET /tasks` | `Bearer invalid_token` | `401 Unauthorized` | `401 Unauthorized` (Safe catch) | **PASS** |

---

## 6. Postman Testing Guide

The Postman collection is located at:  
[`Backend/postman/collections/Practical_7_Authentication_Pipeline.postman_collection.json`](file:///d:/Study/AWDF/Portfolio/Backend/postman/collections/Practical_7_Authentication_Pipeline.postman_collection.json)

1. Open Postman and click **Import**.
2. Select the collection JSON file.
3. Execute request **1. Register User** followed by **2. Login User**.
4. The test script in `POST /login` automatically saves the JWT into the collection variable `{{jwt_token}}`.
5. Execute protected routes (**3. /me**, **5. GET /tasks**, **7. POST /tasks**) seamlessly.
