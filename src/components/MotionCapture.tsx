import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Video, VideoOff, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { PoseDetector, PoseResult, PoseKeypoint } from '../lib/poseDetection';

interface MotionCaptureProps {
  onMotionDetected?: (motion: { type: string; intensity: number; position: { x: number; y: number } }) => void;
  onPoseDetected?: (keypoints: Array<{ x: number; y: number; confidence: number }>) => void;
  onPoseResult?: (poseResult: PoseResult) => void;
  enabled?: boolean;
}

export function MotionCapture({
  onMotionDetected,
  onPoseDetected,
  onPoseResult,
  enabled = true,
}: MotionCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseDetectorRef = useRef<PoseDetector | null>(null);
  const lastPoseRef = useRef<PoseResult | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 请求摄像头权限并启动姿态识别
  const requestCameraPermission = useCallback(async () => {
    try {
      setIsLoading(true);
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
        
        // 等待视频加载
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(null);
            };
          }
        });

        // 初始化姿态识别
        if (!poseDetectorRef.current) {
          poseDetectorRef.current = new PoseDetector();
        }

        if (videoRef.current && poseDetectorRef.current) {
          await poseDetectorRef.current.start(videoRef.current, (poseResult) => {
            // 处理姿态识别结果
            handlePoseResult(poseResult);
          });
        }

        setIsActive(true);
        setIsLoading(false);
        toast.success('体感控制已启动');
      }
    } catch (error: any) {
      console.error('获取摄像头权限失败:', error);
      toast.error('无法访问摄像头，请检查权限设置');
      setHasPermission(false);
      setIsLoading(false);
    }
  }, []);

  // 处理姿态识别结果
  const handlePoseResult = useCallback((poseResult: PoseResult) => {
    // 传递完整的姿态数据
    if (onPoseResult) {
      onPoseResult(poseResult);
    }

    // 转换关键点格式
    if (onPoseDetected) {
      const keypoints = poseResult.keypoints.map((kp, index) => ({
        x: kp.x,
        y: kp.y,
        confidence: kp.visibility || 0.5
      }));
      onPoseDetected(keypoints);
    }

    // 计算动作强度和位置
    if (lastPoseRef.current && onMotionDetected) {
      const intensity = PoseDetector.calculateMotionIntensity(lastPoseRef.current, poseResult);
      const isSwinging = PoseDetector.detectSwing(lastPoseRef.current, poseResult);

      if (intensity > 10 || isSwinging) {
        const position = poseResult.rightWrist || poseResult.leftWrist || { x: 0.5, y: 0.5 };
        onMotionDetected({
          type: isSwinging ? 'swing' : 'move',
          intensity: intensity,
          position: { x: position.x, y: position.y }
        });
      }
    }

    lastPoseRef.current = poseResult;

    // 在画布上绘制姿态（可选）
    drawPose(poseResult);
  }, [onMotionDetected, onPoseDetected, onPoseResult]);

  // 在画布上绘制姿态
  const drawPose = useCallback((poseResult: PoseResult) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制关键点
    poseResult.keypoints.forEach((kp, index) => {
      if (kp.visibility && kp.visibility > 0.5) {
        const x = kp.x * canvas.width;
        const y = kp.y * canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
      }
    });

    // 绘制连接线（主要关节）
    const drawConnection = (start: PoseKeypoint | null, end: PoseKeypoint | null) => {
      if (start && end && start.visibility && end.visibility && 
          start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // 绘制手臂连接
    if (poseResult.rightShoulder && poseResult.rightElbow) {
      drawConnection(poseResult.rightShoulder, poseResult.rightElbow);
    }
    if (poseResult.rightElbow && poseResult.rightWrist) {
      drawConnection(poseResult.rightElbow, poseResult.rightWrist);
    }
    if (poseResult.leftShoulder && poseResult.leftElbow) {
      drawConnection(poseResult.leftShoulder, poseResult.leftElbow);
    }
    if (poseResult.leftElbow && poseResult.leftWrist) {
      drawConnection(poseResult.leftElbow, poseResult.leftWrist);
    }
  }, []);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (poseDetectorRef.current) {
      poseDetectorRef.current.stop();
      poseDetectorRef.current = null;
    }
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
    lastPoseRef.current = null;
    setIsActive(false);
  }, []);


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
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-auto ${isActive ? 'block' : 'hidden'}`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full pointer-events-none ${isActive ? 'block' : 'hidden'}`}
            style={{ mixBlendMode: 'screen' }}
          />
        </div>

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
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              size="sm"
            >
              <Video className="mr-2" size={16} />
              {isLoading ? '正在启动...' : '启动体感控制'}
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

