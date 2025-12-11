// API 客户端封装
const API_BASE = import.meta.env.VITE_API_BASE || '';

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
 * 发送聊天消息
 */
export async function sendChatMessage(
  message: string,
  sessionId: string = 'default',
  isMMSEAnswer: boolean = false,
  currentMMSEIndex: number = -1
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('发送聊天消息失败:', error);
    throw error;
  }
}

/**
 * 开始 MMSE 评估
 */
export async function startMMSEAssessment(
  sessionId: string = 'default'
): Promise<StartMMSEResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/start-mmse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('开始 MMSE 评估失败:', error);
    throw error;
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

