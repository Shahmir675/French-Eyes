import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './src/config/database.js';
import { AuthService } from './src/services/auth.service.js';

async function test() {
  try {
    await connectDatabase();
    console.log('1. Database connected');
    
    const email = 'regtest' + Date.now() + '@test.com';
    console.log('2. Testing registration with:', email);
    
    const result = await AuthService.register(
      { 
        email, 
        password: 'TestPass123!',
        name: 'Register Test',
        phone: '+33123456789',
        gdprConsent: true,
        language: 'de'
      },
      'test-agent'
    );
    console.log('3. Registration successful!');
    console.log('   User ID:', result.user.id);
    console.log('   Access Token:', result.accessToken.substring(0, 30) + '...');
    console.log('   Refresh Token:', result.refreshToken.substring(0, 30) + '...');
    
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}

test();
