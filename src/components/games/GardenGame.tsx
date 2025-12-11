import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface GardenGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
}

interface Plant {
  id: number;
  name: string;
  emoji: string;
  stage: number;
  waterLevel: number;
  sunLevel: number;
  x: number;
  y: number;
}

const plantTypes = [
  { name: '向日葵', emoji: '🌻' },
  { name: '玫瑰', emoji: '🌹' },
  { name: '郁金香', emoji: '🌷' }
];

export function GardenGame({ onScoreChange, onComplete, motionData }: GardenGameProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedTool, setSelectedTool] = useState<'water' | 'sun'>('water');
  const [score, setScore] = useState(0);
  const [harvestedPlants, setHarvestedPlants] = useState(0);
  
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    // Initialize with some plants
    const initialPlants: Plant[] = [
      { id: 1, ...plantTypes[0], stage: 0, waterLevel: 50, sunLevel: 50, x: 30, y: 60 },
      { id: 2, ...plantTypes[1], stage: 0, waterLevel: 50, sunLevel: 50, x: 50, y: 65 },
      { id: 3, ...plantTypes[2], stage: 0, waterLevel: 50, sunLevel: 50, x: 70, y: 55 },
    ];
    setPlants(initialPlants);
  }, []);

  // Update parent with score changes
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  // Plant growth timer
  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    const interval = setInterval(() => {
      setPlants(prev => prev.map(plant => {
        // Decrease levels over time
        let newWater = Math.max(0, plant.waterLevel - 2);
        let newSun = Math.max(0, plant.sunLevel - 2);
        let newStage = plant.stage;

        // Grow if both levels are sufficient
        if (newWater > 60 && newSun > 60 && plant.stage < 3) {
          newStage = plant.stage + 1;
          newWater = 50;
          newSun = 50;
        }

        return {
          ...plant,
          waterLevel: newWater,
          sunLevel: newSun,
          stage: newStage
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Game completion check
  useEffect(() => {
    if (harvestedPlants >= 3 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      onComplete({
        score: score,
        time: 180,
        accuracy: 100,
        previousScore: 80
      });
    }
  }, [harvestedPlants, score, onComplete]);

  const handlePlantClick = (plantId: number) => {
    setPlants(prev => prev.map(plant => {
      if (plant.id !== plantId) return plant;

      if (selectedTool === 'water') {
        return { ...plant, waterLevel: Math.min(100, plant.waterLevel + 30) };
      } else {
        return { ...plant, sunLevel: Math.min(100, plant.sunLevel + 30) };
      }
    }));
  };

  const handleHarvest = (plantId: number) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant && plant.stage === 3) {
      setScore(prev => prev + 50);
      setHarvestedPlants(prev => prev + 1);
      
      // Remove harvested plant
      setPlants(prev => prev.filter(p => p.id !== plantId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-green-300 to-green-500 relative overflow-hidden">
      {/* Sun */}
      <motion.div
        className="absolute top-8 right-8 text-6xl"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        ☀️
      </motion.div>

      {/* Clouds */}
      <motion.div
        className="absolute top-16 left-20 text-4xl opacity-70"
        animate={{ x: [0, 100, 0] }}
        transition={{ duration: 30, repeat: Infinity }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute top-32 right-32 text-3xl opacity-60"
        animate={{ x: [0, -80, 0] }}
        transition={{ duration: 25, repeat: Infinity }}
      >
        ☁️
      </motion.div>

      {/* Score */}
      <div className="absolute top-8 left-8 bg-white/90 rounded-2xl p-4 shadow-lg">
        <p className="text-sm text-gray-600">得分</p>
        <p className="text-2xl text-green-600">{score}</p>
        <p className="text-xs text-gray-500 mt-1">收获: {harvestedPlants}/3</p>
      </div>

      {/* Tools */}
      <div className="absolute top-32 left-8 bg-white/90 rounded-2xl p-4 shadow-lg space-y-3">
        <button
          onClick={() => setSelectedTool('water')}
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all ${
            selectedTool === 'water' 
              ? 'bg-blue-500 scale-110' 
              : 'bg-blue-200 hover:bg-blue-300'
          }`}
        >
          💧
        </button>
        <button
          onClick={() => setSelectedTool('sun')}
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all ${
            selectedTool === 'sun' 
              ? 'bg-yellow-500 scale-110' 
              : 'bg-yellow-200 hover:bg-yellow-300'
          }`}
        >
          ☀️
        </button>
      </div>

      {/* Garden Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-b from-green-600 to-green-700">
        {/* Grass texture */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              🌱
            </div>
          ))}
        </div>

        {/* Plants */}
        {plants.map((plant) => (
          <div
            key={plant.id}
            className="absolute"
            style={{ left: `${plant.x}%`, top: `${plant.y}%` }}
          >
            <motion.button
              onClick={() => handlePlantClick(plant.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              {/* Plant emoji based on stage */}
              <div className="text-6xl">
                {plant.stage === 0 && '🌱'}
                {plant.stage === 1 && '🌿'}
                {plant.stage === 2 && '🪴'}
                {plant.stage === 3 && plant.emoji}
              </div>

              {/* Status bars */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 space-y-1 w-20">
                {/* Water level */}
                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${plant.waterLevel}%` }}
                  />
                </div>
                {/* Sun level */}
                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${plant.sunLevel}%` }}
                  />
                </div>
              </div>
            </motion.button>

            {/* Harvest button */}
            {plant.stage === 3 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleHarvest(plant.id)}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm hover:bg-green-600"
              >
                收获
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl px-6 py-3 shadow-lg text-center">
        <p className="text-sm text-gray-700">
          选择工具后点击植物进行浇水或光照，成熟后收获！
        </p>
      </div>
    </div>
  );
}
