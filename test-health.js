import fetch from 'node-fetch';

async function testHealthAPI() {
  try {
    console.log('请求健康检查API...');
    
    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    const response = await fetch('http://localhost:3000/health', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
    if (error.name === 'AbortError') {
      console.error('请求超时');
    } else {
      console.error('请求失败:', error);
    }
  }
}

testHealthAPI();