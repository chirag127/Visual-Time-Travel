/**
 * Test script for Visual Time Travel extension
 * 
 * This script can be run in the browser console to test the extension functionality.
 * It simulates tab switches and verifies that screenshots are captured correctly.
 */

// Test API functionality
async function testAPI() {
  console.log('Testing API functionality...');
  
  try {
    // Import API module
    const api = await import(chrome.runtime.getURL('utils/api.js')).then(module => module.default);
    
    // Test authentication
    console.log('Testing authentication...');
    const isAuth = await api.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('Please log in first to test the API functionality.');
      return;
    }
    
    // Test getting user data
    console.log('Testing getting user data...');
    const user = await api.auth.getCurrentUser();
    console.log('User data:', user);
    
    // Test getting history
    console.log('Testing getting history...');
    const history = await api.history.getUserHistory({ limit: 5 });
    console.log('History data:', history);
    
    // Test getting domains
    console.log('Testing getting domains...');
    const domains = await api.history.getUserDomains();
    console.log('Domains data:', domains);
    
    console.log('API tests completed successfully!');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Test screenshot functionality
async function testScreenshot() {
  console.log('Testing screenshot functionality...');
  
  try {
    // Import screenshot module
    const screenshot = await import(chrome.runtime.getURL('utils/screenshot.js')).then(module => module.default);
    
    // Capture screenshot
    console.log('Capturing screenshot...');
    const base64 = await screenshot.captureVisibleTab();
    console.log('Screenshot captured, length:', base64.length);
    
    // Display screenshot
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${base64}`;
    img.style.maxWidth = '300px';
    img.style.border = '1px solid #ccc';
    
    console.log('Screenshot preview:');
    console.log(img);
    
    console.log('Screenshot test completed successfully!');
  } catch (error) {
    console.error('Screenshot test failed:', error);
  }
}

// Test storage functionality
async function testStorage() {
  console.log('Testing storage functionality...');
  
  try {
    // Import storage module
    const storage = await import(chrome.runtime.getURL('utils/storage.js')).then(module => module.default);
    
    // Test getting preferences
    console.log('Testing getting preferences...');
    const preferences = await storage.preferences.get();
    console.log('Preferences:', preferences);
    
    // Test setting a test value
    console.log('Testing setting a test value...');
    await storage.set('test_key', { value: 'test_value', timestamp: Date.now() });
    
    // Test getting the test value
    console.log('Testing getting the test value...');
    const testValue = await storage.get('test_key');
    console.log('Test value:', testValue);
    
    // Test removing the test value
    console.log('Testing removing the test value...');
    await storage.remove('test_key');
    
    // Verify removal
    const removedValue = await storage.get('test_key');
    console.log('Removed value (should be null):', removedValue);
    
    console.log('Storage tests completed successfully!');
  } catch (error) {
    console.error('Storage test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('Running all tests for Visual Time Travel extension...');
  
  await testStorage();
  console.log('-----------------------------------');
  
  await testAPI();
  console.log('-----------------------------------');
  
  await testScreenshot();
  console.log('-----------------------------------');
  
  console.log('All tests completed!');
}

// Export test functions
window.visualTimeTravel = {
  testAPI,
  testScreenshot,
  testStorage,
  runAllTests
};

console.log('Visual Time Travel test script loaded. Run tests using:');
console.log('- visualTimeTravel.testAPI()');
console.log('- visualTimeTravel.testScreenshot()');
console.log('- visualTimeTravel.testStorage()');
console.log('- visualTimeTravel.runAllTests()');
