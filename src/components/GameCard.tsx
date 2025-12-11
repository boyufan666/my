import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { GameData } from '../data/games';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star } from 'lucide-react';

interface GameCardProps {
  game: GameData;
  onClick?: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        <ImageWithFallback 
          src={game.image}
          alt={game.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3>{game.name}</h3>
          <Badge variant={game.category === '运动类' ? 'default' : 'secondary'}>
            {game.category}
          </Badge>
        </div>
        <p className="text-gray-600 text-sm mb-3">{game.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < game.difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span>{game.duration}分钟</span>
        </div>
      </CardContent>
    </Card>
  );
}
