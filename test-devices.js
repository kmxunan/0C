import fetch from 'node-fetch';

async function testDevicesAPI() {
  try {
    // 先登录获取令牌
    console.log('尝试登录获取令牌...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('登录失败:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('获取到令牌:', token);
    
    // 使用令牌请求设备列表API
    console.log('\n请求设备列表API...');
    
    const devicesResponse = await fetch('http://localhost:3000/api/devices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('状态码:', devicesResponse.status);
    
    const contentType = devicesResponse.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await devicesResponse.json();
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      const text = await devicesResponse.text();
      console.log('响应文本:', text);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testDevicesAPI();