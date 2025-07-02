import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('尝试登录...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    console.log('状态码:', response.status);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('响应文本:', text);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testLogin();