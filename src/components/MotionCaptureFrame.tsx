import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Video, VideoOff, Camera, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { PoseDetector, PoseResult, PoseKeypoint } from '../lib/poseDetection';

interface MotionCaptureFrameProps {
  onPoseResult?: (poseResult: PoseResult) => void;
  enabled?: boolean;
  showOverlay?: boolean; // 是否显示关键点覆盖层
}

export function MotionCaptureFrame({
  onPoseResult,
  enabled = true,
  showOverlay = true,
}: MotionCaptureFrameProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseDetectorRef = useRef<PoseDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 在画布上绘制姿态关键点 - 必须先定义，因为handlePoseResult会调用它
  const drawPose = useCallback((poseResult: PoseResult) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制关键点 - 增强显示效果
    poseResult.keypoints.forEach((kp, index) => {
      if (kp.visibility && kp.visibility > 0.5) {
        const x = kp.x * canvas.width;
        const y = kp.y * canvas.height;

        // 重要关键点（手腕、肩膀、手肘）用更大更亮的点
        const isImportant = index === 15 || index === 16 || // 左右手腕
                           index === 11 || index === 12 || // 左右肩膀
                           index === 13 || index === 14;   // 左右手肘
        
        const pointSize = isImportant ? 8 : 5;
        const pointColor = isImportant ? '#00ff00' : '#00ff88';
        
        // 绘制关键点外圈（发光效果）
        ctx.beginPath();
        ctx.arc(x, y, pointSize + 2, 0, 2 * Math.PI);
        ctx.fillStyle = pointColor + '40';
        ctx.fill();
        
        // 绘制关键点
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
        ctx.fillStyle = pointColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标注重要关键点
        if (index === 15) { // 左手腕
          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText('左手', x + 12, y - 12);
          ctx.fillText('左手', x + 12, y - 12);
        } else if (index === 16) { // 右手腕
          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText('右手', x + 12, y - 12);
          ctx.fillText('右手', x + 12, y - 12);
        }
      }
    });

    // 绘制连接线（主要关节）
    const drawConnection = (start: PoseKeypoint | null, end: PoseKeypoint | null, color: string = '#00ff00') => {
      if (start && end && start.visibility && end.visibility &&
          start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };

    // 绘制手臂连接
    if (poseResult.rightShoulder && poseResult.rightElbow) {
      drawConnection(poseResult.rightShoulder, poseResult.rightElbow, '#ff0000');
    }
    if (poseResult.rightElbow && poseResult.rightWrist) {
      drawConnection(poseResult.rightElbow, poseResult.rightWrist, '#ff0000');
    }
    if (poseResult.leftShoulder && poseResult.leftElbow) {
      drawConnection(poseResult.leftShoulder, poseResult.leftElbow, '#0000ff');
    }
    if (poseResult.leftElbow && poseResult.leftWrist) {
      drawConnection(poseResult.leftElbow, poseResult.leftWrist, '#0000ff');
    }
  }, []);

  // 请求摄像头权限并启动姿态识别
  const requestCameraPermission = useCallback(async () => {
    // 如果已经在加载或已激活，避免重复请求
    if (isLoading || isActive) {
      console.log('⏭️ 摄像头已在加载或已激活，跳过重复请求');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🎥 正在请求摄像头权限...');
      
      // 先检查是否已有活动的摄像头流
      try {
        const existingStreams = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = existingStreams.filter(d => d.kind === 'videoinput');
        console.log('📹 可用摄像头设备数量:', videoDevices.length);
        if (videoDevices.length === 0) {
          throw new Error('未检测到摄像头设备');
        }
      } catch (err) {
        console.warn('⚠️ 枚举设备失败（可能需要权限）:', err);
      }
      
      console.log('📹 请求摄像头流...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('✅ 摄像头权限已获取！');
      console.log('📹 视频流信息:', {
        tracks: stream.getVideoTracks().length,
        active: stream.active,
        id: stream.id
      });

      if (videoRef.current) {
        console.log('🎬 设置视频源...');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        console.log('✅ 视频源已设置');

        // 等待视频加载
        await new Promise((resolve) => {
          if (videoRef.current) {
            const onLoaded = () => {
              console.log('视频元数据已加载，尺寸:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
              videoRef.current?.play().then(() => {
                console.log('视频播放已启动');
                resolve(true);
              }).catch((err) => {
                console.error('视频播放失败:', err);
                resolve(true);
              });
            };
            
            if (videoRef.current.readyState >= 2) {
              // 如果已经加载完成
              onLoaded();
            } else {
              videoRef.current.onloadedmetadata = onLoaded;
            }
          } else {
            resolve(true);
          }
        });

        // 初始化并启动姿态检测器
        console.log('🤖 正在初始化姿态检测器...');
        if (!poseDetectorRef.current) {
          poseDetectorRef.current = new PoseDetector();
          console.log('✅ PoseDetector实例已创建');
        }
        
        // 确保视频元素已准备好
        const startPoseDetection = async () => {
          if (!videoRef.current) {
            console.error('❌ videoRef.current 为空');
            setIsLoading(false);
            return;
          }

          const video = videoRef.current;
          console.log('📹 视频状态检查:', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
            ended: video.ended
          });

          // 等待视频准备好（readyState >= 2 表示已加载元数据）
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ 视频已准备好，启动姿态检测器...');
            try {
              if (poseDetectorRef.current) {
                await poseDetectorRef.current.start(video, (poseResult) => {
                  handlePoseResult(poseResult);
                });
                console.log('✅ 姿态检测器已启动');
                setIsActive(true);
                setIsLoading(false);
                console.log('🎉 体感控制已成功启动！');
                toast.success('体感控制已启动');
              } else {
                throw new Error('PoseDetector实例不存在');
              }
            } catch (error) {
              console.error('❌ 启动姿态检测器失败:', error);
              setIsLoading(false);
              toast.error('姿态识别启动失败，请重试');
            }
          } else {
            console.warn('⏳ 视频未准备好，等待加载...', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
            
            // 等待视频加载
            const onVideoReady = async () => {
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                console.log('✅ 视频已准备好（延迟启动）');
                video.removeEventListener('loadeddata', onVideoReady);
                video.removeEventListener('canplay', onVideoReady);
                video.removeEventListener('loadedmetadata', onVideoReady);
                
                try {
                  if (poseDetectorRef.current) {
                    await poseDetectorRef.current.start(video, (poseResult) => {
                      handlePoseResult(poseResult);
                    });
                    console.log('✅ 姿态检测器已启动（延迟启动）');
                    setIsActive(true);
                    setIsLoading(false);
                    console.log('🎉 体感控制已成功启动！');
                    toast.success('体感控制已启动');
                  }
                } catch (error) {
                  console.error('❌ 延迟启动姿态检测器失败:', error);
                  setIsLoading(false);
                  toast.error('姿态识别启动失败，请重试');
                }
              }
            };
            
            video.addEventListener('loadeddata', onVideoReady, { once: true });
            video.addEventListener('canplay', onVideoReady, { once: true });
            video.addEventListener('loadedmetadata', onVideoReady, { once: true });
            
            // 超时保护
            setTimeout(() => {
              if (!isActive && isLoading) {
                console.warn('⏰ 视频加载超时，尝试强制启动...');
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  onVideoReady();
                } else {
                  console.error('❌ 视频加载超时，无法启动姿态识别');
                  setIsLoading(false);
                  toast.error('视频加载超时，请刷新页面重试');
                }
              }
            }, 10000); // 10秒超时
          }
        };

        // 立即尝试启动
        startPoseDetection();
      } else {
        console.error('videoRef.current 为空');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('获取摄像头权限失败:', error);
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = '无法访问摄像头';
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许访问';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用';
      }
      
      toast.error(errorMessage);
      setHasPermission(false);
      setIsLoading(false);
    }
  }, []);

  // 处理姿态识别结果 - 必须在drawPose定义之后
  const handlePoseResult = useCallback((poseResult: PoseResult) => {
    // 检查姿态数据是否有效
    if (!poseResult || !poseResult.keypoints || poseResult.keypoints.length === 0) {
      return;
    }

    // 检查是否有有效的手腕关键点
    const hasValidHands = (poseResult.leftWrist && poseResult.leftWrist.visibility && poseResult.leftWrist.visibility > 0.5) ||
                          (poseResult.rightWrist && poseResult.rightWrist.visibility && poseResult.rightWrist.visibility > 0.5);

    // 传递完整的姿态结果给父组件
    if (onPoseResult) {
      onPoseResult(poseResult);
    }

    // 在画布上绘制姿态关键点
    if (showOverlay) {
      try {
        drawPose(poseResult);
      } catch (error) {
        console.error('绘制姿态失败:', error);
      }
    }
  }, [onPoseResult, showOverlay, drawPose]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
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
    setIsActive(false);
    toast.info('体感控制已关闭');
  }, []);

  useEffect(() => {
    if (!enabled && isActive) {
      stopCamera();
    }
  }, [enabled, isActive, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 检查摄像头权限状态并自动启动
  useEffect(() => {
    if (enabled && !isActive && !isLoading) {
      console.log('🔍 检查摄像头权限和自动启动条件...', {
        enabled,
        isActive,
        isLoading,
        hasPermission
      });

      // 方法1: 使用Permissions API检查
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'camera' as PermissionName })
          .then((result) => {
            console.log('📷 摄像头权限状态:', result.state);
            if (result.state === 'granted') {
              console.log('✅ 检测到已有摄像头权限，自动启动...');
              // 延迟一点启动，确保组件完全挂载
              setTimeout(() => {
                requestCameraPermission();
              }, 500);
            } else if (result.state === 'prompt') {
              console.log('⚠️ 摄像头权限待确认，等待用户操作');
            } else {
              console.log('❌ 摄像头权限被拒绝，需要用户手动授权');
            }
            
            // 监听权限变化
            result.onchange = () => {
              console.log('📷 摄像头权限状态变化:', result.state);
              if (result.state === 'granted' && !isActive) {
                setTimeout(() => {
                  requestCameraPermission();
                }, 500);
              }
            };
          })
          .catch((error) => {
            console.warn('⚠️ 权限查询API不支持或失败:', error);
            // 降级方案：尝试直接请求（某些浏览器不支持权限查询）
            console.log('🔄 尝试直接请求摄像头（降级方案）...');
            setTimeout(() => {
              requestCameraPermission().catch(err => {
                console.log('❌ 直接请求失败，等待用户手动点击:', err);
              });
            }, 1000);
          });
      } else {
        // 方法2: 浏览器不支持Permissions API，直接尝试请求
        console.log('⚠️ 浏览器不支持Permissions API，尝试直接请求摄像头...');
        setTimeout(() => {
          requestCameraPermission().catch(err => {
            console.log('❌ 自动请求失败，等待用户手动点击:', err);
          });
        }, 1000);
      }
    }
  }, [enabled, isActive, isLoading, hasPermission, requestCameraPermission]);

  // 即使未启用，也显示占位界面
  if (!enabled) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center rounded-xl">
        <div className="text-center text-white">
          <Camera size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm opacity-70">摄像头未启用</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
      />
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        style={{ display: isActive && showOverlay ? 'block' : 'none' }} 
      />

      {!isActive && (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            {isLoading ? (
              <Loader2 size={48} className="mx-auto mb-4 opacity-50 animate-spin" />
            ) : (
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
            )}
            <p className="text-sm opacity-70">{isLoading ? '正在加载模型...' : '摄像头未启动'}</p>
          </div>
        </div>
      )}

      {/* 控制按钮 - 始终显示，确保可见 */}
      <div 
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-50"
        style={{ 
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {!isActive ? (
          <Button
            onClick={requestCameraPermission}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg border-2 border-white/50"
            size="sm"
            disabled={isLoading}
            style={{ 
              minWidth: '120px',
              pointerEvents: 'auto',
              zIndex: 10000
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                启动中...
              </>
            ) : (
              <>
                <Video className="mr-2" size={16} />
                启动识别
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopCamera}
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white/50"
            size="sm"
            style={{ 
              minWidth: '120px',
              pointerEvents: 'auto',
              zIndex: 10000
            }}
          >
            <VideoOff className="mr-2" size={16} />
            关闭识别
          </Button>
        )}
      </div>

      {/* 识别状态指示 */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-lg z-20 flex items-center gap-1 shadow-lg"
        >
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
          识别中
        </motion.div>
      )}
    </div>
  );
}

