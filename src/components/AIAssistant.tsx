import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface AIAssistantProps {
  size?: 'small' | 'medium' | 'large';
  showWave?: boolean;
}

export function AIAssistant({ size = 'large', showWave = false }: AIAssistantProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  const sizeMap = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* AI Avatar Circle */}
        <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden`}>
          {/* Face */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white rounded-full">
              <motion.div
                className="w-1.5 h-1.5 bg-gray-800 rounded-full absolute top-0.5 left-0.5"
                animate={{
                  scaleY: isBlinking ? 0.1 : 1,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full">
              <motion.div
                className="w-1.5 h-1.5 bg-gray-800 rounded-full absolute top-0.5 left-0.5"
                animate={{
                  scaleY: isBlinking ? 0.1 : 1,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            {/* Smile */}
            <div className="absolute bottom-1/3 w-8 h-4 border-b-2 border-white rounded-b-full" />
          </div>
        </div>

        {/* Glow effect */}
        <motion.div
          className={`${sizeMap[size]} rounded-full bg-purple-300 absolute top-0 -z-10 blur-xl`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {showWave && (
        <div className="flex gap-1 items-center justify-center">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-purple-500 rounded-full"
              animate={{
                height: [20, 40, 20],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
