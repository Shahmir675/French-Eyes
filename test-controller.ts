import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './src/config/database.js';
import { AuthService } from './src/services/auth.service.js';

async function test() {
  try {
    await connectDatabase();
    console.log('1. Database connected');
    
    console.log('2. Testing login...');
    const result = await AuthService.login(
      { email: 'directtest1767092159775@test.com', password: 'TestPass123!' },
      'test-agent'
    );
    console.log('3. Login successful!');
    console.log('   User ID:', result.user.id);
    console.log('   Access Token:', result.accessToken.substring(0, 30) + '...');
    console.log('   Refresh Token:', result.refreshToken.substring(0, 30) + '...');
    
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}

test();
