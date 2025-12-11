import { motion } from 'motion/react';
import { Page } from '../App';
import { ChevronLeft, Play, BookOpen, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardContent } from './ui/card';

interface HelpPageProps {
  onNavigate: (page: Page) => void;
}

export function HelpPage({ onNavigate }: HelpPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4">
          <button onClick={() => onNavigate('welcome')} className="p-2">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1>帮助中心</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Tutorial Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-purple-100 to-pink-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Play className="text-purple-600" size={24} />
                  <h2 className="text-purple-700">视频教程</h2>
                </div>
                <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-center text-white">
                    <Play size={48} className="mx-auto mb-2" />
                    <p>如何开始使用忆趣康元</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  观看简短视频，了解如何使用平台进行康复训练
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="text-blue-600" size={24} />
                  <h2 className="text-blue-700">快速入门</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">1</span>
                    </div>
                    <div>
                      <h4 className="mb-1">完成身体评估</h4>
                      <p className="text-sm text-gray-600">
                        告诉我们您的身体状况，我们会为您推荐合适的游戏
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">2</span>
                    </div>
                    <div>
                      <h4 className="mb-1">进行认知评估</h4>
                      <p className="text-sm text-gray-600">
                        通过简单的问答，了解您的认知状态
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">3</span>
                    </div>
                    <div>
                      <h4 className="mb-1">开始游戏训练</h4>
                      <p className="text-sm text-gray-600">
                        选择您喜欢的游戏，开始康复之旅
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">4</span>
                    </div>
                    <div>
                      <h4 className="mb-1">查看进度数据</h4>
                      <p className="text-sm text-gray-600">
                        在数据中心查看您的康复进展
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="text-green-600" size={24} />
                  <h2 className="text-green-700">常见问题</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>如何连接体感设备？</AccordionTrigger>
                    <AccordionContent>
                      进入"设置"页面，点击"体感设备连接"，按照屏幕提示进行设备配对。
                      确保设备已开启蓝牙功能。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>游戏难度如何调整？</AccordionTrigger>
                    <AccordionContent>
                      系统会根据您的评估结果和表现自动调整游戏难度。您也可以在游戏设置中手动调整。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>如何邀请家人查看我的进度？</AccordionTrigger>
                    <AccordionContent>
                      在"设置"中选择"管理家庭成员"，可以邀请家人绑定账号，共同查看康复数据。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>每天需要训练多长时间？</AccordionTrigger>
                    <AccordionContent>
                      建议每天进行30-60分钟的训练，可以分多次完成。系统会根据您的身体状况提供个性化建议。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>数据安全吗？</AccordionTrigger>
                    <AccordionContent>
                      您的所有数据都经过加密存储，仅用于改善您的康复体验。我们严格遵守隐私保护政策。
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-6 text-center">
                <h3 className="mb-2">还有其他问题？</h3>
                <p className="text-gray-600 mb-4">
                  我们的客服团队随时为您服务
                </p>
                <div className="space-y-2">
                  <div className="text-2xl text-purple-600">📞 400-123-4567</div>
                  <p className="text-sm text-gray-600">服务时间：24小时在线</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
