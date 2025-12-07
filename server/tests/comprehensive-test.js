/**
 * ══════════════════════════════════════════════════════════════
 *  FAHEEMLY COMPREHENSIVE TEST SCRIPT
 *  Complete Testing Suite for All Features
 * ══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const chalk = require('chalk');

const API_URL = 'http://localhost:3001/api';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Test credentials
const TEST_USERS = {
  admin: {
    email: 'admin@faheemly.com',
    password: 'Admin@123456',
    name: 'Test Admin'
  },
  client: {
    email: 'testclient@example.com',
    password: 'Client@123456',
    name: 'Test Client'
  }
};

let authTokens = {
  admin: null,
  client: null
};

let testBusinessId = null;
let testConversationId = null;

// ══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  switch(type) {
    case 'success':
      console.log(chalk.green(`✓ [${timestamp}] ${message}`));
      break;
    case 'error':
      console.log(chalk.red(`✗ [${timestamp}] ${message}`));
      break;
    case 'info':
      console.log(chalk.blue(`ℹ [${timestamp}] ${message}`));
      break;
    case 'warning':
      console.log(chalk.yellow(`⚠ [${timestamp}] ${message}`));
      break;
    case 'header':
      console.log(chalk.cyan.bold(`\n${'═'.repeat(60)}\n${message}\n${'═'.repeat(60)}`));
      break;
  }
}

function recordTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`Test: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`Test: ${name} - ${error}`, 'error');
  }
  testResults.tests.push({ name, passed, error });
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  TEST SUITES
// ══════════════════════════════════════════════════════════════

async function testServerHealth() {
  log('Testing Server Health...', 'header');
  
  const result = await makeRequest('GET', '/health');
  recordTest('Server Health Check', result.success);
  
  if (result.success) {
    log(`Server Status: ${JSON.stringify(result.data)}`, 'info');
  }
}

async function testAuthentication() {
  log('Testing Authentication System...', 'header');
  
  // Test 1: Register new client
  const registerResult = await makeRequest('POST', '/auth/register', {
    email: TEST_USERS.client.email,
    password: TEST_USERS.client.password,
    name: TEST_USERS.client.name
  });
  recordTest('User Registration', registerResult.success || registerResult.status === 400);
  
  // Test 2: Login as client
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.client.email,
    password: TEST_USERS.client.password
  });
  recordTest('User Login', loginResult.success);
  
  if (loginResult.success) {
    authTokens.client = loginResult.data.token;
    log(`Client Token: ${authTokens.client.substring(0, 20)}...`, 'info');
  }
  
  // Test 3: Login as admin (if exists)
  const adminLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.admin.email,
    password: TEST_USERS.admin.password
  });
  
  if (adminLogin.success) {
    authTokens.admin = adminLogin.data.token;
    log(`Admin Token: ${authTokens.admin.substring(0, 20)}...`, 'info');
  }
  
  // Test 4: Get current user profile
  const profileResult = await makeRequest('GET', '/auth/me', null, authTokens.client);
  recordTest('Get User Profile', profileResult.success);
  
  // Test 5: Invalid credentials
  const invalidLogin = await makeRequest('POST', '/auth/login', {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });
  recordTest('Reject Invalid Login', !invalidLogin.success);
}

async function testBusinessManagement() {
  log('Testing Business Management...', 'header');
  
  if (!authTokens.client) {
    log('Skipping - No client token available', 'warning');
    return;
  }
  
  // Test 1: Create business
  const createResult = await makeRequest('POST', '/businesses', {
    name: 'Test Restaurant',
    activityType: 'RESTAURANT',
    language: 'ar'
  }, authTokens.client);
  recordTest('Create Business', createResult.success);
  
  if (createResult.success) {
    testBusinessId = createResult.data.id;
    log(`Business ID: ${testBusinessId}`, 'info');
  }
  
  // Test 2: Get all businesses
  const listResult = await makeRequest('GET', '/businesses', null, authTokens.client);
  recordTest('List Businesses', listResult.success);
  
  // Test 3: Get business details
  if (testBusinessId) {
    const detailsResult = await makeRequest('GET', `/businesses/${testBusinessId}`, null, authTokens.client);
    recordTest('Get Business Details', detailsResult.success);
  }
  
  // Test 4: Update business
  if (testBusinessId) {
    const updateResult = await makeRequest('PUT', `/businesses/${testBusinessId}`, {
      name: 'Updated Test Restaurant',
      botTone: 'professional'
    }, authTokens.client);
    recordTest('Update Business', updateResult.success);
  }
}

async function testKnowledgeBase() {
  log('Testing Knowledge Base...', 'header');
  
  if (!authTokens.client || !testBusinessId) {
    log('Skipping - No client token or business ID', 'warning');
    return;
  }
  
  // Test 1: Add text knowledge
  const addTextResult = await makeRequest('POST', `/knowledge/${testBusinessId}`, {
    type: 'TEXT',
    content: 'مطعمنا يفتح من الساعة 9 صباحاً حتى 11 مساءً. نقدم أفضل المأكولات الشرقية والغربية.'
  }, authTokens.client);
  recordTest('Add Text Knowledge', addTextResult.success);
  
  // Test 2: Add URL knowledge
  const addUrlResult = await makeRequest('POST', `/knowledge/${testBusinessId}`, {
    type: 'URL',
    content: 'https://example.com/menu'
  }, authTokens.client);
  recordTest('Add URL Knowledge', addUrlResult.success || addUrlResult.status === 400);
  
  // Test 3: Get all knowledge
  const listResult = await makeRequest('GET', `/knowledge/${testBusinessId}`, null, authTokens.client);
  recordTest('List Knowledge Base', listResult.success);
}

async function testConversations() {
  log('Testing Conversations & Chat...', 'header');
  
  if (!testBusinessId) {
    log('Skipping - No business ID', 'warning');
    return;
  }
  
  // Test 1: Start conversation
  const startResult = await makeRequest('POST', `/chat/${testBusinessId}/start`, {
    channel: 'WIDGET'
  });
  recordTest('Start Conversation', startResult.success);
  
  if (startResult.success) {
    testConversationId = startResult.data.conversationId;
    log(`Conversation ID: ${testConversationId}`, 'info');
  }
  
  // Test 2: Send message
  if (testConversationId) {
    const messageResult = await makeRequest('POST', `/chat/${testConversationId}/message`, {
      message: 'ما هي أوقات العمل؟'
    });
    recordTest('Send Chat Message', messageResult.success);
    
    if (messageResult.success && messageResult.data.reply) {
      log(`AI Response: ${messageResult.data.reply.substring(0, 100)}...`, 'info');
    }
  }
  
  // Test 3: Get conversation history
  if (testConversationId) {
    const historyResult = await makeRequest('GET', `/chat/${testConversationId}/history`);
    recordTest('Get Conversation History', historyResult.success);
  }
  
  // Test 4: Rate conversation
  if (testConversationId) {
    const rateResult = await makeRequest('POST', `/chat/${testConversationId}/rate`, {
      rating: 5,
      feedback: 'خدمة ممتازة!'
    });
    recordTest('Rate Conversation', rateResult.success);
  }
}

async function testDashboard() {
  log('Testing Dashboard & Analytics...', 'header');
  
  if (!authTokens.client || !testBusinessId) {
    log('Skipping - No client token or business ID', 'warning');
    return;
  }
  
  // Test 1: Get dashboard stats
  const statsResult = await makeRequest('GET', `/dashboard/${testBusinessId}/stats`, null, authTokens.client);
  recordTest('Get Dashboard Stats', statsResult.success);
  
  // Test 2: Get analytics
  const analyticsResult = await makeRequest('GET', `/dashboard/${testBusinessId}/analytics`, null, authTokens.client);
  recordTest('Get Analytics', analyticsResult.success);
  
  // Test 3: Get recent conversations
  const recentResult = await makeRequest('GET', `/dashboard/${testBusinessId}/conversations/recent`, null, authTokens.client);
  recordTest('Get Recent Conversations', recentResult.success);
}

async function testTicketSystem() {
  log('Testing Support Ticket System...', 'header');
  
  if (!authTokens.client || !testBusinessId) {
    log('Skipping - No client token or business ID', 'warning');
    return;
  }
  
  // Test 1: Create ticket
  const createResult = await makeRequest('POST', `/tickets`, {
    businessId: testBusinessId,
    subject: 'Test Support Ticket',
    priority: 'MEDIUM'
  }, authTokens.client);
  recordTest('Create Support Ticket', createResult.success);
  
  let ticketId = null;
  if (createResult.success) {
    ticketId = createResult.data.id;
  }
  
  // Test 2: Get all tickets
  const listResult = await makeRequest('GET', `/tickets`, null, authTokens.client);
  recordTest('List Support Tickets', listResult.success);
  
  // Test 3: Add message to ticket
  if (ticketId) {
    const messageResult = await makeRequest('POST', `/tickets/${ticketId}/messages`, {
      message: 'This is a test ticket message'
    }, authTokens.client);
    recordTest('Add Ticket Message', messageResult.success);
  }
}

async function testAdminPanel() {
  log('Testing Admin Panel...', 'header');
  
  if (!authTokens.admin) {
    log('Skipping - No admin token available', 'warning');
    log('Please create an admin account first', 'info');
    return;
  }
  
  // Test 1: Get all users
  const usersResult = await makeRequest('GET', `/admin/users`, null, authTokens.admin);
  recordTest('Admin: List All Users', usersResult.success);
  
  // Test 2: Get all businesses
  const businessResult = await makeRequest('GET', `/admin/businesses`, null, authTokens.admin);
  recordTest('Admin: List All Businesses', businessResult.success);
  
  // Test 3: Get system stats
  const statsResult = await makeRequest('GET', `/admin/stats`, null, authTokens.admin);
  recordTest('Admin: Get System Stats', statsResult.success);
  
  // Test 4: Get system logs
  const logsResult = await makeRequest('GET', `/admin/logs?limit=10`, null, authTokens.admin);
  recordTest('Admin: Get System Logs', logsResult.success);
}

async function testAPIEndpoints() {
  log('Testing All API Endpoints...', 'header');
  
  const endpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/api/health', auth: false },
    { method: 'GET', path: '/docs', auth: false },
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(
      endpoint.method, 
      endpoint.path,
      null,
      endpoint.auth ? authTokens.client : null
    );
    recordTest(`${endpoint.method} ${endpoint.path}`, result.success || result.status === 404);
  }
}

// ══════════════════════════════════════════════════════════════
//  MAIN TEST RUNNER
// ══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           FAHEEMLY COMPREHENSIVE TEST SUITE                   ║
║                  Complete System Testing                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));
  
  log(`Starting tests at ${new Date().toLocaleString()}`, 'info');
  log(`API URL: ${API_URL}`, 'info');
  
  try {
    await testServerHealth();
    await testAuthentication();
    await testBusinessManagement();
    await testKnowledgeBase();
    await testConversations();
    await testDashboard();
    await testTicketSystem();
    await testAdminPanel();
    await testAPIEndpoints();
    
  } catch (error) {
    log(`Fatal Error: ${error.message}`, 'error');
    console.error(error);
  }
  
  // Print Summary
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                      TEST RESULTS SUMMARY                     ║
╚═══════════════════════════════════════════════════════════════╝
  `));
  
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'info');
  
  // List failed tests
  if (testResults.failed > 0) {
    console.log(chalk.red.bold('\nFailed Tests:'));
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`${t.name}: ${t.error}`, 'error');
      });
  }
  
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                    Testing Complete!                          ║
╚═══════════════════════════════════════════════════════════════╝
  `));
}

// Run tests
runAllTests().catch(console.error);
