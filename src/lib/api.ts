// API 客户端封装
// 开发环境：如果未设置环境变量，默认使用后端服务地址
// 生产环境：使用环境变量或相对路径（同域部署）
const getApiBase = () => {
  // 如果设置了环境变量，使用环境变量
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // 开发环境：默认使用后端服务地址
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // 生产环境：使用相对路径（同域部署）
  return '';
};

const API_BASE = getApiBase();

export interface ChatResponse {
  success: boolean;
  data: {
    reply: string;
    sessionId: string;
    isMMSE: boolean;
    currentMMSEIndex: number;
  };
}

export interface StartMMSEResponse {
  success: boolean;
  data: {
    first_question: string;
    welcome_message: string;
    current_index: number;
    total_questions: number;
    sessionId: string;
  };
}

/**
 * 发送聊天消息（带重试机制和超时控制）
 */
export async function sendChatMessage(
  message: string,
  sessionId: string = 'default',
  isMMSEAnswer: boolean = false,
  currentMMSEIndex: number = -1,
  retries: number = 3,
  timeout: number = 30000
): Promise<ChatResponse> {
  const apiUrl = `${API_BASE}/api/chat`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 发送聊天消息 (尝试 ${attempt}/${retries}):`, {
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        sessionId,
        apiUrl
      });

      // 创建带超时的AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            isMMSEAnswer,
            currentMMSEIndex,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ 聊天消息响应成功:', {
          reply: data.data?.reply?.substring(0, 50) + (data.data?.reply?.length > 50 ? '...' : ''),
          isMMSE: data.data?.isMMSE
        });

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`请求超时 (${timeout}ms)`);
        }
        throw fetchError;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ 发送聊天消息失败 (尝试 ${attempt}/${retries}):`, error);

      // 如果是最后一次尝试，抛出错误
      if (attempt === retries) {
        break;
      }

      // 等待后重试（指数退避）
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ ${delay}ms后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 所有重试都失败
  console.error('❌ 所有重试都失败，最后错误:', lastError);
  throw lastError || new Error('发送聊天消息失败');
}

/**
 * 开始 MMSE 评估
 */
export async function startMMSEAssessment(
  sessionId: string = 'default'
): Promise<StartMMSEResponse> {
  try {
    const apiUrl = `${API_BASE}/api/start-mmse`;
    console.log('📡 发送MMSE评估请求:', { 
      API_BASE, 
      apiUrl,
      sessionId,
      env: {
        VITE_API_BASE: import.meta.env.VITE_API_BASE,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD
      }
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log('📡 MMSE评估响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MMSE评估API错误:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ MMSE评估响应数据:', data);
    
    if (!data.success) {
      throw new Error(data.message || '服务器返回失败');
    }

    return data;
  } catch (error: any) {
    console.error('❌ 开始 MMSE 评估失败:', error);
    
    // 提供更详细的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接和服务器状态');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error(`启动评估失败: ${error.message || '未知错误'}`);
    }
  }
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('健康检查失败:', error);
    throw error;
  }
}

