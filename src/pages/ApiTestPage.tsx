import { useState } from 'react';
import { API } from '../api';

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; data?: unknown; error?: string }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFn: () => Promise<unknown>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: '获取分类列表',
      fn: () => API.categories.getCategories()
    },
    {
      name: '获取帖子列表',
      fn: () => API.posts.getPosts({ page: 1, limit: 5 })
    },
    {
      name: '管理员登录',
      fn: () => API.auth.login({ email: 'admin@example.com', password: 'password' })
    },
    {
      name: '用户注册',
      fn: () => API.auth.register({ 
        email: `test${Date.now()}@example.com`, 
        password: 'password123', 
        nickname: '测试用户',
        gender: 'male'
      })
    }
  ];

  const runAllTests = () => {
    tests.forEach(test => {
      runTest(test.name, test.fn);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API 接口测试</h1>
        
        <div className="mb-6">
          <button
            onClick={runAllTests}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            运行所有测试
          </button>
        </div>

        <div className="space-y-4">
          {tests.map(test => (
            <div key={test.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                <div className="flex items-center space-x-3">
                  {loading[test.name] && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                  <button
                    onClick={() => runTest(test.name, test.fn)}
                    disabled={loading[test.name]}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    测试
                  </button>
                </div>
              </div>

              {testResults[test.name] && (
                <div className={`p-4 rounded-lg ${
                  testResults[test.name].success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-sm font-medium ${
                      testResults[test.name].success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResults[test.name].success ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </div>
                  
                  <pre className="text-sm overflow-auto max-h-40">
                    {JSON.stringify(testResults[test.name], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">测试说明</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• 获取分类列表：测试基础数据接口</li>
            <li>• 获取帖子列表：测试帖子相关接口</li>
            <li>• 管理员登录：测试认证接口</li>
            <li>• 用户注册：测试用户注册功能</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 