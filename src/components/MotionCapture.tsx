import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Video, VideoOff, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface MotionCaptureProps {
  onMotionDetected?: (motion: { type: string; intensity: number; position: { x: number; y: number } }) => void;
  onPoseDetected?: (keypoints: Array<{ x: number; y: number; confidence: number }>) => void;
  enabled?: boolean;
}

// 简化的动作检测（使用 MediaPipe 或 TensorFlow.js 需要额外配置）
// 这里提供一个基础框架，实际部署时需要集成真实的姿态估计库
export function MotionCapture({
  onMotionDetected,
  onPoseDetected,
  enabled = true,
}: MotionCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);

  // 请求摄像头权限
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsActive(true);
        toast.success('摄像头已启动');
      }
    } catch (error: any) {
      console.error('获取摄像头权限失败:', error);
      toast.error('无法访问摄像头，请检查权限设置');
      setHasPermission(false);
    }
  }, []);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsActive(false);
  }, []);

  // 简化的动作检测（基于帧差法）
  const detectMotion = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (lastFrameRef.current) {
      // 计算帧差
      let diff = 0;
      let motionPixels = 0;
      const threshold = 30;

      for (let i = 0; i < currentFrame.data.length; i += 4) {
        const r = Math.abs(currentFrame.data[i] - lastFrameRef.current.data[i]);
        const g = Math.abs(currentFrame.data[i + 1] - lastFrameRef.current.data[i + 1]);
        const b = Math.abs(currentFrame.data[i + 2] - lastFrameRef.current.data[i + 2]);

        const pixelDiff = (r + g + b) / 3;
        if (pixelDiff > threshold) {
          motionPixels++;
          diff += pixelDiff;
        }
      }

      const motionIntensity = diff / (currentFrame.data.length / 4);
      const motionRatio = motionPixels / (currentFrame.data.length / 4);

      if (motionRatio > 0.05 && onMotionDetected) {
        // 检测到明显动作
        onMotionDetected({
          type: 'general',
          intensity: motionIntensity,
          position: { x: canvas.width / 2, y: canvas.height / 2 },
        });
      }

      // 简化的关键点检测（实际应使用 MediaPipe Pose 或 TensorFlow.js）
      // 这里提供一个占位实现
      if (onPoseDetected && motionRatio > 0.1) {
        // 模拟关键点（实际需要姿态估计模型）
        const mockKeypoints = [
          { x: canvas.width * 0.5, y: canvas.height * 0.2, confidence: 0.9 }, // 头部
          { x: canvas.width * 0.4, y: canvas.height * 0.4, confidence: 0.8 }, // 左肩
          { x: canvas.width * 0.6, y: canvas.height * 0.4, confidence: 0.8 }, // 右肩
          { x: canvas.width * 0.5, y: canvas.height * 0.6, confidence: 0.7 }, // 躯干
        ];
        onPoseDetected(mockKeypoints);
      }
    }

    lastFrameRef.current = currentFrame;
    animationFrameRef.current = requestAnimationFrame(detectMotion);
  }, [isActive, onMotionDetected, onPoseDetected]);

  useEffect(() => {
    if (isActive && enabled) {
      detectMotion();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, enabled, detectMotion]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="relative">
      <div className="relative bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-auto ${isActive ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && (
          <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm opacity-70">摄像头未启动</p>
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {!hasPermission || !isActive ? (
            <Button
              onClick={requestCameraPermission}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              size="sm"
            >
              <Video className="mr-2" size={16} />
              启动摄像头
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600"
              size="sm"
            >
              <VideoOff className="mr-2" size={16} />
              关闭摄像头
            </Button>
          )}
        </div>
      </div>

      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-center text-sm text-gray-600"
        >
          体感控制已激活
        </motion.div>
      )}
    </div>
  );
}

