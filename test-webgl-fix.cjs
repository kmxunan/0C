/**
 * WebGL错误修复验证脚本
 * 用于测试WebGL纹理错误是否已修复
 */

const puppeteer = require('puppeteer');

async function testWebGLErrors() {
  console.log('🔍 开始测试WebGL错误修复...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    const page = await browser.newPage();

    // 监听控制台消息
    const consoleMessages = [];
    const webglErrors = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);

      // 检查WebGL错误
      if (
        text.includes('GL_INVALID_OPERATION') ||
        text.includes('texture is not a shared image') ||
        text.includes('invalid mailbox name')
      ) {
        webglErrors.push(text);
      }
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
      console.error('❌ 页面错误:', error.message);
    });

    console.log('🌐 导航到前端页面...');
    await page.goto('http://localhost:7240', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('⏳ 等待3D场景加载...');
    await page.waitForTimeout(5000);

    // 检查WebSocket连接状态
    const wsStatus = await page.evaluate(() => {
      return document.querySelector('[data-testid="websocket-status"]')?.textContent || 'Unknown';
    });

    console.log('📊 测试结果:');
    console.log(`   WebSocket状态: ${wsStatus}`);
    console.log(`   控制台消息数量: ${consoleMessages.length}`);
    console.log(`   WebGL错误数量: ${webglErrors.length}`);

    if (webglErrors.length > 0) {
      console.log('❌ 发现WebGL错误:');
      webglErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 未发现WebGL错误!');
    }

    // 检查3D场景是否正常渲染
    const canvasExists = await page.evaluate(() => {
      return document.querySelector('canvas') !== null;
    });

    console.log(`   Canvas元素存在: ${canvasExists ? '✅' : '❌'}`);

    if (canvasExists) {
      const canvasSize = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return {
          width: canvas.width,
          height: canvas.height,
        };
      });
      console.log(`   Canvas尺寸: ${canvasSize.width}x${canvasSize.height}`);
    }

    return {
      success: webglErrors.length === 0 && canvasExists,
      webglErrors,
      consoleMessages: consoleMessages.slice(-10), // 最后10条消息
      wsStatus,
      canvasExists,
    };
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  testWebGLErrors()
    .then((result) => {
      console.log('\n📋 最终结果:', result.success ? '✅ 通过' : '❌ 失败');
      if (!result.success && result.error) {
        console.log('错误详情:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = testWebGLErrors;
