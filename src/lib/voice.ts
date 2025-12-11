// 语音识别和合成工具
export class VoiceRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: string) => void;
  private onInterimResultCallback?: (text: string) => void; // 临时结果回调

  constructor() {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = false; // 单次识别
    this.recognition.interimResults = true; // 启用临时结果，可以实时显示识别过程
    this.recognition.maxAlternatives = 1; // 只返回最佳结果

    this.recognition.onresult = (event: any) => {
      try {
        // 检查结果是否存在
        if (!event.results || event.results.length === 0) {
          return;
        }

        // 处理所有结果（包括临时和最终）
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || result.length === 0) continue;

          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            // 最终结果
            finalTranscript += transcript;
          } else {
            // 临时结果 - 实时显示
            interimTranscript += transcript;
          }
        }

        // 实时显示临时结果
        if (interimTranscript && this.onInterimResultCallback) {
          this.onInterimResultCallback(interimTranscript.trim());
        }

        // 处理最终结果 - 立即响应，不等待
        if (finalTranscript && finalTranscript.trim()) {
          const cleanTranscript = finalTranscript.trim();
          console.log('✅ 识别到最终结果:', cleanTranscript);
          
          // 立即调用回调，不延迟
          if (this.onResultCallback) {
            this.onResultCallback(cleanTranscript);
          }
        }
      } catch (error) {
        console.error('❌ 处理语音识别结果时出错:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback('processing-error');
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      console.error('❌ 语音识别错误:', error, event);
      
      // 详细错误信息
      let errorMessage = error;
      switch (error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查权限';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许';
          break;
        case 'network':
          errorMessage = '网络错误，请检查网络连接';
          break;
        case 'aborted':
          errorMessage = '语音识别被中止';
          break;
        default:
          errorMessage = `语音识别错误: ${error}`;
      }
      
      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      console.log('🔚 语音识别结束');
      this.isListening = false;
      
      // 如果设置了onEnd回调，调用它
      if (this.onErrorCallback && this.onErrorCallback !== this.onResultCallback) {
        // onErrorCallback 可能被用作 onEnd
        // 这里不自动调用，由调用者决定
      }
    };

    // 添加开始事件监听
    this.recognition.onstart = () => {
      console.log('🎤 语音识别已开始');
    };

    // 添加音频开始事件
    this.recognition.onaudiostart = () => {
      console.log('🔊 开始接收音频');
    };

    // 添加音频结束事件
    this.recognition.onaudioend = () => {
      console.log('🔇 音频接收结束');
    };

    // 添加声音开始事件
    this.recognition.onsoundstart = () => {
      console.log('🔊 检测到声音');
    };

    // 添加声音结束事件
    this.recognition.onsoundend = () => {
      console.log('🔇 声音结束');
    };

    // 添加语音开始事件
    this.recognition.onspeechstart = () => {
      console.log('🗣️ 检测到语音');
    };

    // 添加语音结束事件
    this.recognition.onspeechend = () => {
      console.log('🗣️ 语音结束');
    };
  }

  /**
   * 开始语音识别（增强网络连接）
   */
  start(
    onResult: (text: string) => void, 
    onError?: (error: string) => void,
    onInterimResult?: (text: string) => void // 临时结果回调
  ) {
    if (!this.recognition) {
      console.error('❌ 浏览器不支持语音识别');
      onError?.('浏览器不支持语音识别');
      return;
    }

    // 如果正在监听，先停止
    if (this.isListening) {
      console.log('⚠️ 正在停止之前的识别...');
      this.stop();
      // 等待一小段时间确保完全停止
      setTimeout(() => {
        this.startListeningInternal(onResult, onError, onInterimResult);
      }, 100);
    } else {
      this.startListeningInternal(onResult, onError, onInterimResult);
    }
  }

  /**
   * 检查网络连接状态
   */
  static checkNetworkConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true; // 默认假设在线
  }

  private startListeningInternal(
    onResult: (text: string) => void, 
    onError?: (error: string) => void,
    onInterimResult?: (text: string) => void
  ) {
    try {
      this.onResultCallback = onResult;
      this.onErrorCallback = onError;
      this.onInterimResultCallback = onInterimResult; // 设置临时结果回调
      this.isListening = true;
      
      this.recognition.start();
    } catch (error: any) {
      console.error('❌ 启动语音识别失败:', error);
      this.isListening = false;
      onError?.(error.message || '启动语音识别失败');
    }
  }

  /**
   * 停止语音识别
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 检查是否正在监听
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}

export class VoiceSynthesis {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // 某些浏览器需要延迟加载语音列表
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
    
    // 优先选择温柔女声（中文）
    // 常见的中文女声名称关键词
    const femaleKeywords = ['女', 'female', 'Ting-Ting', 'Sin-Ji', 'Mei-Jia', 'Xiaoxiao', 'Xiaoyi', 'Yunyang'];
    
    // 先尝试找中文女声
    let chineseFemaleVoice = this.voices.find(voice => {
      const langMatch = voice.lang.includes('zh') || voice.lang.includes('CN');
      const nameMatch = femaleKeywords.some(keyword => 
        voice.name.toLowerCase().includes(keyword.toLowerCase())
      );
      return langMatch && nameMatch;
    });
    
    // 如果没找到，找任何中文女声
    if (!chineseFemaleVoice) {
      chineseFemaleVoice = this.voices.find(voice => {
        const langMatch = voice.lang.includes('zh') || voice.lang.includes('CN');
        // 排除明显是男声的
        const notMale = !voice.name.toLowerCase().includes('male') && 
                       !voice.name.toLowerCase().includes('男');
        return langMatch && notMale;
      });
    }
    
    // 如果还是没找到，找任何中文语音
    if (!chineseFemaleVoice) {
      chineseFemaleVoice = this.voices.find(
        voice => voice.lang.includes('zh') || voice.lang.includes('CN')
      );
    }
    
    this.currentVoice = chineseFemaleVoice || this.voices[0] || null;
    
    if (this.currentVoice) {
      console.log('🎤 已选择语音:', this.currentVoice.name, this.currentVoice.lang);
    }
  }

  /**
   * 语音合成并播放（温柔女声）
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('浏览器不支持语音合成');
      onEnd?.();
      return;
    }

    // 停止当前播放
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // 温柔女声参数：语速稍慢，音调稍高，音量适中
    utterance.rate = options?.rate || 0.9; // 稍慢，更温柔
    utterance.pitch = options?.pitch || 1.1; // 稍高，更女性化
    utterance.volume = options?.volume || 0.9; // 适中音量
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }

    // 添加播放结束回调
    if (onEnd) {
      utterance.onend = () => {
        console.log('🎶 语音播放结束');
        onEnd();
      };
      utterance.onerror = (error) => {
        console.error('❌ 语音播放错误:', error);
        onEnd();
      };
    }

    console.log(`🎤 播放语音: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    this.synth.speak(utterance);
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * 检查是否正在播放
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }
}

// 导出便捷函数
let voiceRecognitionInstance: VoiceRecognition | null = null;
let voiceSynthesisInstance: VoiceSynthesis | null = null;

export function startSpeechRecognition(
  onResult: (text: string) => void,
  onEnd?: () => void,
  onError?: (error: string) => void,
  onInterimResult?: (text: string) => void // 临时结果回调
) {
  if (!voiceRecognitionInstance) {
    voiceRecognitionInstance = new VoiceRecognition();
  }
  
  const wrappedOnEnd = () => {
    if (onEnd) onEnd();
  };
  
  voiceRecognitionInstance.start(onResult, onError || wrappedOnEnd, onInterimResult);
}

export function stopSpeechRecognition() {
  if (voiceRecognitionInstance) {
    voiceRecognitionInstance.stop();
  }
}

export function speakText(text: string, onEnd?: () => void, options?: { rate?: number; pitch?: number; volume?: number }) {
  if (!voiceSynthesisInstance) {
    voiceSynthesisInstance = new VoiceSynthesis();
  }
  
  // 使用温柔女声参数
  voiceSynthesisInstance.speak(text, options, onEnd);
}

export function stopSpeechSynthesis() {
  if (voiceSynthesisInstance) {
    voiceSynthesisInstance.stop();
  }
}

