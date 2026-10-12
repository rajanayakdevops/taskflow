/**
 * TaskFlow Automated Backend Test Suite
 * Validates authentication, validations, CRUD operations, IDOR authorization security,
 * and dashboard statistics calculation.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { disconnectDB } = require('../config/db');

let server;
const BASE_URL = 'http://localhost:5001';

// Test state
let userAToken = '';
let userBToken = '';
let userAId = '';
let userBId = '';
let projectId = '';
let taskId = '';

// Helper for making HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Simple test runner helper
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('       RUNNING TASKFLOW BACKEND TEST SUITE');
  console.log('======================================================\n');

  // Wait for mongoose connection
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 20) {
    await new Promise((r) => setTimeout(r, 500));
    attempts++;
  }

  // Clear test collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Start HTTP server on port 5001
  server = app.listen(5001);

  try {
    console.log('\n[Group 1: Health & System Diagnostics]');
    await test('GET /api/health returns 200 and healthy status', async () => {
      const res = await request('GET', '/api/health');
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.status === 'ok', 'Expected status to be ok');
    });

    console.log('\n[Group 2: Authentication & Input Validation]');
    await test('POST /api/auth/register fails on missing fields', async () => {
      const res = await request('POST', '/api/auth/register', { email: 'bad' });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(res.body.success === false, 'Expected success=false');
    });

    await test('POST /api/auth/register fails on short password (<6 chars)', async () => {
      const res = await request('POST', '/api/auth/register', {
        name: 'Alex',
        email: 'alex@example.com',
        password: '123',
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('POST /api/auth/register succeeds with valid user credentials', async () => {
      const res = await request('POST', '/api/auth/register', {
        name: 'Alice Cooper',
        email: 'alice@taskflow.dev',
        password: 'Password123!',
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.token, 'Expected JWT token in response');
      assert(res.body.user.email === 'alice@taskflow.dev', 'User email mismatch');
      assert(!res.body.user.password, 'Password must not be returned');
      userAToken = res.body.token;
      userAId = res.body.user._id;
    });

    await test('POST /api/auth/register prevents duplicate email registration', async () => {
      const res = await request('POST', '/api/auth/register', {
        name: 'Alice Impostor',
        email: 'alice@taskflow.dev',
        password: 'Password123!',
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(res.body.message.includes('already exists'), 'Duplicate message missing');
    });

    await test('POST /api/auth/login fails with wrong password', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'alice@taskflow.dev',
        password: 'WrongPassword!',
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /api/auth/login succeeds with correct password', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'alice@taskflow.dev',
        password: 'Password123!',
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.token, 'Token expected');
    });

    console.log('\n[Group 3: Token Verification & Route Protection]');
    await test('GET /api/auth/me rejects request without Authorization header', async () => {
      const res = await request('GET', '/api/auth/me');
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('GET /api/auth/me rejects invalid / tampered token', async () => {
      const res = await request('GET', '/api/auth/me', null, 'invalid.token.here');
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('GET /api/auth/me returns user profile with valid Bearer token', async () => {
      const res = await request('GET', '/api/auth/me', null, userAToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.user.email === 'alice@taskflow.dev', 'User email mismatch');
    });

    console.log('\n[Group 4: Project Management CRUD]');
    await test('POST /api/projects creates project scoped to user', async () => {
      const res = await request(
        'POST',
        '/api/projects',
        {
          name: 'Mobile App Redesign',
          description: 'Revamp UI for iOS & Android',
          color: '#10b981',
        },
        userAToken
      );
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.name === 'Mobile App Redesign', 'Project name mismatch');
      projectId = res.body.data._id;
    });

    await test('GET /api/projects returns user projects with metrics', async () => {
      const res = await request('GET', '/api/projects', null, userAToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.length === 1, 'Expected 1 project');
      assert(res.body.data[0].totalTasks === 0, 'Expected 0 tasks initially');
    });

    console.log('\n[Group 5: Task Management CRUD & Filtering]');
    await test('POST /api/tasks creates task assigned to project', async () => {
      const res = await request(
        'POST',
        '/api/tasks',
        {
          title: 'Design high-fidelity Figma components',
          description: 'Include design system tokens and dark mode variants',
          priority: 'high',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          project: projectId,
        },
        userAToken
      );
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.title.includes('Figma'), 'Task title mismatch');
      taskId = res.body.data._id;
    });

    await test('POST /api/tasks creates a second task (completed)', async () => {
      const res = await request(
        'POST',
        '/api/tasks',
        {
          title: 'Review user personas and journey maps',
          priority: 'medium',
          status: 'completed',
          project: projectId,
        },
        userAToken
      );
      assert(res.status === 201, `Expected 201, got ${res.status}`);
    });

    await test('GET /api/tasks filters by status=completed', async () => {
      const res = await request('GET', '/api/tasks?status=completed', null, userAToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.length === 1, 'Expected 1 completed task');
    });

    await test('GET /api/tasks searches by title query', async () => {
      const res = await request('GET', '/api/tasks?search=Figma', null, userAToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.length === 1, 'Expected 1 matching task');
    });

    await test('PUT /api/tasks/:id updates task status', async () => {
      const res = await request(
        'PUT',
        `/api/tasks/${taskId}`,
        { status: 'completed' },
        userAToken
      );
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'completed', 'Expected status to update');
    });

    console.log('\n[Group 6: Authorization & IDOR Security Testing]');
    // Create User B
    const userBRes = await request('POST', '/api/auth/register', {
      name: 'Bob Hacker',
      email: 'bob@competitor.com',
      password: 'Password123!',
    });
    userBToken = userBRes.body.token;
    userBId = userBRes.body.user._id;

    await test('IDOR Protection: User B cannot access User A task', async () => {
      const res = await request('GET', `/api/tasks/${taskId}`, null, userBToken);
      assert(res.status === 404, `Expected 404 unauthorized, got ${res.status}`);
    });

    await test('IDOR Protection: User B cannot modify User A task', async () => {
      const res = await request(
        'PUT',
        `/api/tasks/${taskId}`,
        { title: 'Hacked Title' },
        userBToken
      );
      assert(res.status === 404, `Expected 404 unauthorized, got ${res.status}`);
    });

    await test('IDOR Protection: User B cannot delete User A task', async () => {
      const res = await request('DELETE', `/api/tasks/${taskId}`, null, userBToken);
      assert(res.status === 404, `Expected 404 unauthorized, got ${res.status}`);
    });

    await test('IDOR Protection: User B cannot access User A project', async () => {
      const res = await request('GET', `/api/projects/${projectId}`, null, userBToken);
      assert(res.status === 404, `Expected 404 unauthorized, got ${res.status}`);
    });

    console.log('\n[Group 7: Dashboard Live Metric Calculation]');
    await test('GET /api/stats/dashboard computes real database metrics for User A', async () => {
      const res = await request('GET', '/api/stats/dashboard', null, userAToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.counts.total === 2, `Expected 2 total tasks, got ${res.body.data.counts.total}`);
      assert(res.body.data.counts.completed === 2, `Expected 2 completed tasks, got ${res.body.data.counts.completed}`);
      assert(res.body.data.counts.completionRate === 100, 'Expected 100% completion rate');
      assert(res.body.data.totalProjects === 1, 'Expected 1 total project');
    });

    await test('GET /api/stats/dashboard isolates metrics for User B (zeros)', async () => {
      const res = await request('GET', '/api/stats/dashboard', null, userBToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.counts.total === 0, 'User B should have 0 tasks');
      assert(res.body.data.totalProjects === 0, 'User B should have 0 projects');
    });

  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
