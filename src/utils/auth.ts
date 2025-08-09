// 检查用户是否已登录
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // 检查是否有token和用户信息
  if (!token || !user) {
    return false;
  }
  
  try {
    // 验证用户信息是否为有效JSON
    JSON.parse(user);
    return true;
  } catch {
    // 如果用户信息不是有效JSON，清理localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

// 如果用户未登录则跳转到登录页
export const redirectToLoginIfNeeded = (navigate: (path: string) => void): boolean => {
  if (!isUserLoggedIn()) {
    navigate('/login');
    return true; // 表示已重定向
  }
  return false; // 表示用户已登录，无需重定向
}; 