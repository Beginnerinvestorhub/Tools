// Deployment Verification Script
// Run this after deployment to test all services

const axios = require('axios');

async function verifyDeployment() {
  const config = {
    backendUrl: process.env.BACKEND_URL || 'https://your-backend-service.railway.app',
    pythonEngineUrl: process.env.PYTHON_ENGINE_URL || 'https://your-python-engine.railway.app',
    frontendUrl: process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  };

  console.log('🚀 Verifying deployment...\n');

  // Test Backend API
  try {
    const backendHealth = await axios.get(`${config.backendUrl}/api/health`);
    console.log('✅ Backend API:', backendHealth.status === 200 ? 'HEALTHY' : 'ISSUES');
  } catch (error) {
    console.log('❌ Backend API: FAILED -', error.message);
  }

  // Test Python Engine
  try {
    const pythonHealth = await axios.get(`${config.pythonEngineUrl}/`);
    console.log('✅ Python Engine:', pythonHealth.status === 200 ? 'HEALTHY' : 'ISSUES');
  } catch (error) {
    console.log('❌ Python Engine: FAILED -', error.message);
  }

  // Test Frontend
  try {
    const frontendHealth = await axios.get(config.frontendUrl);
    console.log('✅ Frontend:', frontendHealth.status === 200 ? 'HEALTHY' : 'ISSUES');
  } catch (error) {
    console.log('❌ Frontend: FAILED -', error.message);
  }

  console.log('\n🎯 Deployment verification complete!');
}

if (require.main === module) {
  verifyDeployment().catch(console.error);
}

module.exports = { verifyDeployment };
