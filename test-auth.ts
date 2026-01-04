import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './src/config/database.js';
import { User } from './src/models/user.model.js';
import { hashPassword, verifyPassword } from './src/utils/password.js';
import { TokenService } from './src/services/token.service.js';

async function test() {
  try {
    await connectDatabase();
    console.log('1. Database connected');
    
    const user = await User.findOne({ email: 'directtest1767092159775@test.com' });
    console.log('2. User found:', user ? 'yes' : 'no');
    
    if (user) {
      console.log('3. Verifying password...');
      const isValid = await verifyPassword(user.passwordHash, 'TestPass123!');
      console.log('4. Password valid:', isValid);
      
      if (isValid) {
        console.log('5. Generating access token...');
        const accessToken = TokenService.generateAccessToken(user._id.toString(), user.email);
        console.log('6. Access token generated:', accessToken.substring(0, 30) + '...');
        
        console.log('7. Generating refresh token...');
        const refreshToken = await TokenService.generateRefreshToken(user._id.toString(), user.email, 'test-agent');
        console.log('8. Refresh token generated:', refreshToken.substring(0, 30) + '...');
        
        console.log('SUCCESS - Login flow works!');
      }
    }
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}

test();
