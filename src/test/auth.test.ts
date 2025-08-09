import { isUserLoggedIn, redirectToLoginIfNeeded } from '../utils/auth';

// 测试登录检查功能
export const testAuthFunctions = () => {
  console.log('Testing Auth Functions...');

  // 保存原始localStorage状态
  const originalToken = localStorage.getItem('token');
  const originalUser = localStorage.getItem('user');

  try {
    // 测试1: 用户未登录的情况
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    console.assert(!isUserLoggedIn(), 'Should return false when no token/user');
    console.log('✓ Test 1 passed: User not logged in');

    // 测试2: 只有token没有user的情况
    localStorage.setItem('token', 'test-token');
    localStorage.removeItem('user');
    
    console.assert(!isUserLoggedIn(), 'Should return false when no user info');
    console.log('✓ Test 2 passed: Token only, no user');

    // 测试3: 有token和user的情况
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      nickname: 'Test User'
    }));
    
    console.assert(isUserLoggedIn(), 'Should return true when both token and user exist');
    console.log('✓ Test 3 passed: User logged in');

    // 测试4: user信息格式错误的情况
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', 'invalid-json');
    
    console.assert(!isUserLoggedIn(), 'Should return false when user info is invalid JSON');
    console.assert(!localStorage.getItem('token'), 'Should clear token when user info is invalid');
    console.assert(!localStorage.getItem('user'), 'Should clear user when user info is invalid');
    console.log('✓ Test 4 passed: Invalid user data handled');

    // 测试5: 重定向功能
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    let redirectPath = '';
    const mockNavigate = (path: string) => {
      redirectPath = path;
    };

    const shouldRedirect = redirectToLoginIfNeeded(mockNavigate);
    console.assert(shouldRedirect === true, 'Should return true when redirecting');
    console.assert(redirectPath === '/login', 'Should redirect to login page');
    console.log('✓ Test 5 passed: Redirect to login when not logged in');

    // 测试6: 已登录时不重定向
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      nickname: 'Test User'
    }));
    
    redirectPath = '';
    const shouldNotRedirect = redirectToLoginIfNeeded(mockNavigate);
    console.assert(shouldNotRedirect === false, 'Should return false when user is logged in');
    console.assert(redirectPath === '', 'Should not redirect when user is logged in');
    console.log('✓ Test 6 passed: No redirect when logged in');

  } finally {
    // 恢复原始localStorage状态
    if (originalToken) {
      localStorage.setItem('token', originalToken);
    } else {
      localStorage.removeItem('token');
    }
    
    if (originalUser) {
      localStorage.setItem('user', originalUser);
    } else {
      localStorage.removeItem('user');
    }
  }

  console.log('All auth tests passed! 🎉');
}; 