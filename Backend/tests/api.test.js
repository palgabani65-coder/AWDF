const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server");

// Mock or fallback JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_practical12_awdf";

// Generate signed test token for authenticated route testing
const testToken = jwt.sign(
  {
    id: "6612ab34cd56ef7890123456",
    email: "ci-tester@example.com",
    role: "user"
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

describe("Practical 12: CI/CD Automated API Test Suite", () => {
  afterAll(async () => {
    // Gracefully close MongoDB connection after tests complete
    await mongoose.connection.close();
  });

  // Test 1: Root Health Check Endpoint
  test("GET / returns status 200 and confirms API is running", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Task Management API is running");
  });

  // Test 2: In-Memory Cache Monitoring Endpoint (Practical 9 Verification)
  test("GET /cache/stats returns status 200 and cache diagnostics", async () => {
    const res = await request(app).get("/cache/stats");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("hits");
    expect(res.body.data).toHaveProperty("misses");
  });

  // Test 3: Middleware Pipeline Security Check - Unauthenticated Request
  test("GET /tasks without token returns status 401 Unauthorized", async () => {
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test 4: Primary Endpoint - Authenticated Task Retrieval
  test("GET /tasks with valid Bearer token returns status 200", async () => {
    const res = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${testToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
