// 语音识别和合成工具
export class VoiceRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  /**
   * 开始语音识别
   */
  start(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('浏览器不支持语音识别');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;
    this.recognition.start();
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
    // 优先选择中文语音
    const chineseVoice = this.voices.find(
      voice => voice.lang.includes('zh') || voice.lang.includes('CN')
    );
    this.currentVoice = chineseVoice || this.voices[0] || null;
  }

  /**
   * 语音合成并播放
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synth) {
      console.warn('浏览器不支持语音合成');
      return;
    }

    // 停止当前播放
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 1.0;
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }

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

