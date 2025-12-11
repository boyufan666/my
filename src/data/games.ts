export interface GameData {
  id: string;
  name: string;
  category: '运动类' | '思维类';
  description: string;
  detailedDescription: string;
  image: string;
  difficulty: number;
  duration: number;
  requiresUpperBody?: boolean;
  requiresLowerBody?: boolean;
  abilities: string[];
  howToPlay: string[];
}

export const allGames: GameData[] = [
  // 运动类游戏
  {
    id: '1',
    name: '虚拟乒乓球',
    category: '运动类',
    description: '挥动双臂，享受乒乓球运动的乐趣',
    detailedDescription: '一起来活动手臂，打一场愉快的乒乓球吧！',
    image: 'https://images.unsplash.com/photo-1639650538792-ee5fad574d6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMGdhbWV8ZW58MXx8fHwxNzYwMDg2MzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 2,
    duration: 15,
    requiresUpperBody: true,
    abilities: ['手眼协调', '上肢运动', '反应速度'],
    howToPlay: [
      '站在体感设备前方',
      '挥动手臂击打虚拟乒乓球',
      '尽可能多地击中球来得分',
      '球速会随着得分逐渐加快'
    ]
  },
  {
    id: '2',
    name: '节奏光剑',
    category: '运动类',
    description: '跟随音乐节奏挥舞光剑',
    detailedDescription: '随着音乐的节奏，挥动您的双臂击中飞来的方块！',
    image: 'https://images.unsplash.com/photo-1612549354052-a91bd7d0bff6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaHl0aG0lMjBtdXNpY3xlbnwxfHx8fDE3NjAwODc1MTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 3,
    duration: 12,
    requiresUpperBody: true,
    abilities: ['节奏感', '手臂协调', '音乐感知'],
    howToPlay: [
      '跟随音乐节奏',
      '用对应颜色的光剑击中方块',
      '注意方块的方向指示',
      '连击会获得更高分数'
    ]
  },
  {
    id: '3',
    name: '虚拟园艺',
    category: '运动类',
    description: '在虚拟花园中种植和照料植物',
    detailedDescription: '在美丽的花园中，种植、浇水、收获您的植物！',
    image: 'https://images.unsplash.com/photo-1727358572955-3d66cd0d5876?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBwbGFudHN8ZW58MXx8fHwxNzYwMDg3NTE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 1,
    duration: 20,
    requiresUpperBody: true,
    abilities: ['精细动作', '耐心培养', '成就感'],
    howToPlay: [
      '选择您喜欢的种子',
      '挥手在土壤中种植',
      '定期为植物浇水',
      '收获成熟的植物获得奖励'
    ]
  },
  {
    id: '4',
    name: '虚拟羽毛球',
    category: '运动类',
    description: '体验羽毛球的乐趣',
    detailedDescription: '挥拍击球，享受羽毛球带来的运动快乐！',
    image: 'https://images.unsplash.com/photo-1616562007889-186b6cf7fb53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBzcG9ydHxlbnwxfHx8fDE3NjAwMDgwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 2,
    duration: 15,
    requiresUpperBody: true,
    requiresLowerBody: true,
    abilities: ['全身协调', '反应能力', '平衡感'],
    howToPlay: [
      '挥动手臂击打羽毛球',
      '注意球的飞行轨迹',
      '尽量让对方接不到球',
      '连续得分可获得额外奖励'
    ]
  },
  {
    id: '5',
    name: '虚拟家乡记忆',
    category: '运动类',
    description: '在熟悉的场景中漫步，唤醒美好回忆',
    detailedDescription: '在虚拟的家乡场景中散步，重温温暖的回忆！',
    image: 'https://images.unsplash.com/photo-1677614933115-fcef218a06fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21ldG93biUyMG1lbW9yeXxlbnwxfHx8fDE3NjAwODc1MTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 1,
    duration: 20,
    requiresLowerBody: true,
    abilities: ['记忆唤醒', '情感联结', '方向感'],
    howToPlay: [
      '在虚拟场景中自由移动',
      '寻找熟悉的地标和物品',
      '分享您的回忆和故事',
      '收集记忆碎片完成关卡'
    ]
  },
  {
    id: '6',
    name: '虚拟太极拳',
    category: '运动类',
    description: '缓慢而优雅的太极动作，舒展身心',
    detailedDescription: '跟随指导，练习传统太极拳，平衡身心！',
    image: 'https://images.unsplash.com/photo-1680019400425-719db6713415?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwemVufGVufDF8fHx8MTc2MDA0Nzk3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 1,
    duration: 20,
    requiresUpperBody: true,
    abilities: ['平衡能力', '身心放松', '姿势控制'],
    howToPlay: [
      '跟随虚拟教练的动作',
      '缓慢而平稳地移动',
      '保持呼吸均匀',
      '完成一套完整的太极动作'
    ]
  },
  
  // 思维类游戏
  {
    id: '7',
    name: '记忆配对',
    category: '思维类',
    description: '翻转卡片找到相同的图案，锻炼记忆力',
    detailedDescription: '翻开卡片，找到相同的图案配对！',
    image: 'https://images.unsplash.com/photo-1721333091271-2c488efcdc2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW1vcnklMjBjYXJkcyUyMGdhbWV8ZW58MXx8fHwxNzU5OTkxODM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 2,
    duration: 10,
    abilities: ['短期记忆', '注意力', '视觉识别'],
    howToPlay: [
      '点击卡片翻开查看图案',
      '记住每张卡片的位置',
      '找到两张相同的卡片配对',
      '在时间内完成所有配对'
    ]
  },
  {
    id: '8',
    name: '快速计算',
    category: '思维类',
    description: '简单的数学题，保持大脑活跃',
    detailedDescription: '快速计算简单的数学题目，锻炼计算能力！',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    difficulty: 2,
    duration: 10,
    abilities: ['计算能力', '反应速度', '逻辑思维'],
    howToPlay: [
      '查看屏幕上的数学题',
      '从选项中选择正确答案',
      '尽快作答获得更高分数',
      '连续答对可获得连击奖励'
    ]
  },
  {
    id: '9',
    name: '3D麻将',
    category: '思维类',
    description: '经典的麻将配对游戏',
    detailedDescription: '找到相同的麻将牌进行配对消除！',
    image: 'https://images.unsplash.com/photo-1643508522364-2724681026eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWhqb25nJTIwdGlsZXN8ZW58MXx8fHwxNzYwMDg3NTE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 3,
    duration: 15,
    abilities: ['空间认知', '图案识别', '策略思维'],
    howToPlay: [
      '点击两张相同的麻将牌',
      '只能选择没有被遮挡的牌',
      '消除所有的牌即可过关',
      '可以使用提示功能'
    ]
  },
  {
    id: '10',
    name: '虚拟扑克牌',
    category: '思维类',
    description: '玩简单的扑克游戏',
    detailedDescription: '玩纸牌接龙，锻炼思维和规划能力！',
    image: 'https://images.unsplash.com/photo-1636583133884-fbefc7ac3fb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGF5aW5nJTIwY2FyZHN8ZW58MXx8fHwxNzYwMDMzOTExfDA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 2,
    duration: 12,
    abilities: ['规划能力', '逻辑推理', '耐心'],
    howToPlay: [
      '按照花色和点数排列纸牌',
      '将所有牌移到目标位置',
      '可以使用撤销功能',
      '用最少步数完成获得高分'
    ]
  },
  {
    id: '11',
    name: '解谜游戏',
    category: '思维类',
    description: '完成拼图挑战，提升空间认知能力',
    detailedDescription: '拼接图片碎片，完成美丽的拼图！',
    image: 'https://images.unsplash.com/photo-1620098255118-a5e1a0ee92b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXp6bGUlMjBicmFpbnxlbnwxfHx8fDE3NjAwODYzNDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    difficulty: 3,
    duration: 15,
    abilities: ['空间感知', '图像识别', '问题解决'],
    howToPlay: [
      '查看完整的参考图',
      '拖动拼图碎片到正确位置',
      '旋转碎片以匹配方向',
      '完成整幅拼图'
    ]
  }
];

export function getGameById(id: string): GameData | undefined {
  return allGames.find(game => game.id === id);
}

export function getRecommendedGames(physicalCondition: string[], count: number = 4): GameData[] {
  return allGames.filter(game => {
    if (physicalCondition.includes('upper') && game.requiresUpperBody) {
      return false;
    }
    if (physicalCondition.includes('wheelchair') && game.requiresLowerBody) {
      return false;
    }
    return true;
  }).slice(0, count);
}
