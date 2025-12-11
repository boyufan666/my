import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('游戏组件错误:', error);
    console.error('错误信息:', errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="text-red-500" size={48} />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">游戏加载失败</h2>
                <p className="text-gray-600 mt-1">游戏组件遇到了错误</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-red-800 mb-2">错误信息：</p>
              <p className="text-sm text-red-700 font-mono break-all">
                {this.state.error?.message || '未知错误'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  查看详细错误堆栈
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4">
              <Button
                onClick={this.handleReset}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                重试
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-gray-300"
              >
                刷新页面
              </Button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>如果问题持续存在，请：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>检查浏览器控制台（F12）查看详细错误</li>
                <li>确认摄像头权限已授予</li>
                <li>尝试刷新页面或清除浏览器缓存</li>
                <li>检查网络连接是否正常</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

