const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');

const app = express();

// CORS 配置 - 允许所有来源（开发环境）
// 生产环境建议限制特定域名
app.use(cors({
  origin: '*', // 开发环境允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('build'));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers.origin
  });
  next();
});

// 星火大模型配置 - 从环境变量读取
// 注意：如果使用 HTTP 接口，需要修改 callSparkApi 函数
// X1.5 版本的 WebSocket 地址：wss://spark-api-qpe.n.xf-yun.com/v2.1/chat
const SPARK_CONFIG = {
    APPID: process.env.SPARK_APPID,
    API_SECRET: process.env.SPARK_API_SECRET,
    API_KEY: process.env.SPARK_API_KEY,
    SPARK_URL: process.env.SPARK_URL || "wss://spark-api-qpe.n.xf-yun.com/v2.1/chat",
    DOMAIN: process.env.SPARK_DOMAIN || "generalv1.5"
};

// 检查配置是否完整（仅在运行时检查，构建时不退出）
// 注意：在Render构建阶段，环境变量可能还未设置，所以这里只警告不退出
if (!SPARK_CONFIG.APPID || !SPARK_CONFIG.API_SECRET || !SPARK_CONFIG.API_KEY) {
    console.warn("⚠️ 星火大模型配置缺失！请在环境变量中设置：");
    console.warn("   SPARK_APPID");
    console.warn("   SPARK_API_SECRET");
    console.warn("   SPARK_API_KEY");
    console.warn("   (可选) SPARK_URL");
    console.warn("   (可选) SPARK_DOMAIN");
    console.warn("⚠️ 注意：如果这是构建阶段，请忽略此警告。");
    // 不在构建阶段退出，只在运行时检查
    // process.exit(1); // 已注释，避免构建失败
}

// 存储用户对话历史和MMSE状态
const userSessions = {};

// MMSE量表题目和评分标准
function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "春季";
    if (month >= 6 && month <= 8) return "夏季";
    if (month >= 9 && month <= 11) return "秋季";
    return "冬季";
}

function getCurrentWeekday() {
    const weekdayNum = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
    const fullNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const shortNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return { full: fullNames[weekdayNum], short: shortNames[weekdayNum] };
}

function getCurrentMonth() {
    const month = new Date().getMonth() + 1;
    const numNames = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const chineseNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    return { num: numNames[month - 1], chinese: chineseNames[month - 1] };
}

const mmseItems = [
    // 时间定向 (5分)
    {
        "id": 1,
        "category": "时间定向",
        "question": "现在是哪一年？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [new Date().getFullYear().toString()]
    },
    {
        "id": 2,
        "category": "时间定向",
        "question": "现在是什么季节？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [getCurrentSeason()]
    },
    {
        "id": 3,
        "category": "时间定向",
        "question": "现在是哪个月？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [getCurrentMonth().num, getCurrentMonth().chinese]
    },
    {
        "id": 4,
        "category": "时间定向",
        "question": "今天是几号？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [new Date().getDate().toString(), `${new Date().getDate()}号`]
    },
    {
        "id": 5,
        "category": "时间定向",
        "question": "今天是星期几？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [getCurrentWeekday().full, getCurrentWeekday().short]
    },
    // 地点定向 (5分)
    {
        "id": 6,
        "category": "地点定向",
        "question": "我们现在在哪个国家？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["中国", "China"]
    },
    {
        "id": 7,
        "category": "地点定向",
        "question": "我们现在在哪个省？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["广东", "北京", "上海", "浙江", "江苏"]
    },
    {
        "id": 8,
        "category": "地点定向",
        "question": "我们现在在哪个城市？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["深圳", "北京", "上海", "广州", "杭州"]
    },
    {
        "id": 9,
        "category": "地点定向",
        "question": "我们现在在什么地方？（医院、学校、商场等）",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["医院", "诊所", "康复中心"]
    },
    {
        "id": 10,
        "category": "地点定向",
        "question": "我们现在在第几层楼？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["1", "2", "3", "4", "5", "一楼", "二楼", "三楼", "四楼", "五楼"]
    },
    // 记忆力 (3分)
    {
        "id": 11,
        "category": "记忆力",
        "question": "我会说三个词，请您记住它们：苹果、桌子、诚实",
        "score_criteria": "记住三个词，重复正确得3分，少1个扣1分",
        "max_score": 3,
        "type": "memory_practice",
        "memory_items": ["苹果", "桌子", "诚实"]
    },
    // 注意力和计算 (5分)
    {
        "id": 12,
        "category": "注意力和计算",
        "question": "请您算一下：100减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["93"]
    },
    {
        "id": 13,
        "category": "注意力和计算",
        "question": "再从刚才的答案继续减去7，等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["86"]
    },
    {
        "id": 14,
        "category": "注意力和计算",
        "question": "再从刚才的答案继续减去7，等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["79"]
    },
    {
        "id": 15,
        "category": "注意力和计算",
        "question": "再从刚才的答案继续减去7，等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["72"]
    },
    {
        "id": 16,
        "category": "注意力和计算",
        "question": "最后从刚才的答案再减去7，等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["65"]
    },
    // 回忆 (3分)
    {
        "id": 17,
        "category": "回忆",
        "question": "还记得我刚才让您记住的三个词吗？请告诉我是什么？",
        "score_criteria": "记住三个词，回忆正确得3分，少1个扣1分",
        "max_score": 3,
        "type": "memory_recall",
        "memory_items": ["苹果", "桌子", "诚实"]
    },
    // 语言功能 (9分)
    {
        "id": 18,
        "category": "语言功能",
        "question": "请说出这是什么东西？(指向笔)",
        "score_criteria": "正确回答得1分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["笔", "钢笔", "铅笔"]
    },
    {
        "id": 19,
        "category": "语言功能",
        "question": "请重复说一遍：四十四只石狮子",
        "score_criteria": "正确重复得1分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["四十四只石狮子"]
    },
    {
        "id": 20,
        "category": "语言功能",
        "question": "现在请您闭上眼睛",
        "score_criteria": "正确执行得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["好的", "行", "可以", "完成了", "做完了"]
    },
    {
        "id": 21,
        "category": "语言功能",
        "question": "请您用右手拿这张纸",
        "score_criteria": "正确执行得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["好的", "行", "可以", "完成了", "做完了"]
    },
    {
        "id": 22,
        "category": "语言功能",
        "question": "然后对折这张纸",
        "score_criteria": "正确执行得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["好的", "行", "可以", "完成了", "做完了"]
    },
    {
        "id": 23,
        "category": "语言功能",
        "question": "最后把纸放在桌子上",
        "score_criteria": "正确执行得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["好的", "行", "可以", "完成了", "做完了"]
    },
    {
        "id": 24,
        "category": "语言功能",
        "question": "请您读这句话并照着做：'闭上眼睛'",
        "score_criteria": "正确执行得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["好的", "行", "可以", "完成了", "做完了"]
    },
    {
        "id": 25,
        "category": "语言功能",
        "question": "请您写一个完整的句子",
        "score_criteria": "写出有意义的句子得1分",
        "max_score": 1,
        "type": "action",
        "correct_answers": ["完成了", "做完了", "写好了"]
    },
    {
        "id": 26,
        "category": "语言功能",
        "question": "请您照着画这个图形(复杂五边形)",
        "score_criteria": "画出正确的图形得1分",
        "max_score": 1,
        "type": "drawing",
        "correct_answers": ["完成了", "做完了", "画好了"]
    }
];

class WsParam {
    constructor(APPID, APIKey, APISecret, gptUrl) {
        this.APPID = APPID;
        this.APIKey = APIKey;
        this.APISecret = APISecret;
        const url = new URL(gptUrl);
        this.host = url.host;
        this.path = url.pathname;
        this.gptUrl = gptUrl;
    }

    createUrl() {
        const now = new Date();
        const date = now.toUTCString();
        const signatureOrigin = `host: ${this.host}\ndate: ${date}\nGET ${this.path} HTTP/1.1`;
        
        const signatureSha = crypto.createHmac('sha256', this.APISecret)
            .update(signatureOrigin)
            .digest('base64');
            
        const authorizationOrigin = `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
        const authorization = Buffer.from(authorizationOrigin).toString('base64');
        
        const params = new URLSearchParams({
            authorization,
            date,
            host: this.host
        });
        
        return `${this.gptUrl}?${params.toString()}`;
    }
}

function callSparkApi(messages) {
    return new Promise((resolve, reject) => {
        try {
            const wsParam = new WsParam(
                SPARK_CONFIG.APPID,
                SPARK_CONFIG.API_KEY,
                SPARK_CONFIG.API_SECRET,
                SPARK_CONFIG.SPARK_URL
            );

            const wsUrl = wsParam.createUrl();
            let response = '';

            const ws = new WebSocket(wsUrl, {
                rejectUnauthorized: false
            });

            ws.on('open', () => {
                const data = JSON.stringify({
                    header: { app_id: SPARK_CONFIG.APPID, uid: "1234" },
                    parameter: {
                        chat: {
                            domain: SPARK_CONFIG.DOMAIN,
                            temperature: 0.7,
                            max_tokens: 2048,
                            auditing: "default",
                        }
                    },
                    payload: {
                        message: { text: messages }
                    }
                });
                ws.send(data);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    const code = message.header.code;
                    
                    if (code !== 0) {
                        response = `API错误: ${code}`;
                        ws.close();
                        return;
                    }

                    const choices = message.payload.choices;
                    const content = choices.text[0].content;
                    const status = choices.status;

                    response += content;

                    if (status === 2) {
                        console.log("AI回复完成");
                        ws.close();
                    }
                } catch (e) {
                    response = `处理错误: ${e.message}`;
                    ws.close();
                }
            });

            ws.on('error', (error) => {
                response = `连接错误: ${error.message}`;
                ws.close();
            });

            ws.on('close', () => {
                resolve(response || "抱歉，没有收到回复");
            });

        } catch (e) {
            reject(`服务异常: ${e.message}`);
        }
    });
}

function calculateMmseScore(answer, item) {
    try {
        answer = answer.trim();
        if (!answer) {
            console.log("❌ 空答案，得0分");
            return 0;
        }

        console.log(`🔍 开始评分: 问题类型=${item.type}, 答案='${answer}'`);
        console.log(`   正确答案: ${item.correct_answers || item.memory_items || '无'}`);

        let score = 0;

        if (item.type === "text" || item.type === "calculation") {
            const correctAnswers = item.correct_answers || [];
            for (const correct of correctAnswers) {
                const correctStr = String(correct).trim().toLowerCase();
                const answerLower = answer.toLowerCase();
                if (correctStr.includes(answerLower) || answerLower.includes(correctStr)) {
                    console.log(`✅ 匹配到正确答案: '${correct}'`);
                    score = 1;
                    break;
                }
            }
            if (score === 0) {
                console.log("❌ 未匹配到正确答案");
            }
        } else if (item.type === "memory_practice" || item.type === "memory_recall") {
            const memoryItems = item.memory_items || [];
            for (const memoryItem of memoryItems) {
                if (answer.toLowerCase().includes(memoryItem.toLowerCase())) {
                    score += 1;
                    console.log(`✅ 记忆项目正确: ${memoryItem}`);
                }
            }
            console.log(`📝 记忆得分: ${score}`);
            score = Math.min(score, 3);
        } else if (item.type === "action" || item.type === "drawing") {
            const actionKeywords = ["好的", "行", "可以", "完成了", "做完了", "闭上", "拿纸", "对折", "放在", "桌子上", "眼睛", "画好"];
            if (actionKeywords.some(keyword => answer.includes(keyword))) {
                console.log("✅ 动作题回答合适");
                score = 1;
            } else {
                console.log("❌ 动作题回答不合适");
                score = 0;
            }
        }

        console.log(`🎯 最终得分: ${score}`);
        return score;

    } catch (e) {
        console.log(`❌ 评分函数出错: ${e}`);
        return 0;
    }
}

function getMmseAssessmentResult(totalScore) {
    if (totalScore >= 27) return "认知功能正常";
    if (totalScore >= 21) return "轻度认知障碍";
    if (totalScore >= 10) return "中度认知障碍";
    return "重度认知障碍";
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default', isMMSEAnswer = false, currentMMSEIndex = -1 } = req.body;

        console.log(`📨 收到消息: '${message}', MMSE模式: ${isMMSEAnswer}, 当前题目索引: ${currentMMSEIndex}`);

        if (!message) {
            return res.status(400).json({ success: false, error: '消息内容不能为空' });
        }

        if (!userSessions[sessionId]) {
            userSessions[sessionId] = {
                conversation: [],
                mmse_state: null
            };
        }

        const session = userSessions[sessionId];
        const userHistory = session.conversation;

        userHistory.push({ role: "user", content: message });

        let aiResponse = "";
        let mmseMode = false;
        let currentIndex = -1;

        if (isMMSEAnswer && currentMMSEIndex >= 0) {
            console.log(`🔍 进入MMSE评估处理，当前索引: ${currentMMSEIndex}, 总题数: ${mmseItems.length}`);

            if (!session.mmse_state) {
                console.log("🔄 初始化MMSE状态");
                session.mmse_state = {
                    current_index: 0,
                    scores: [],
                    start_time: Date.now()
                };
            }

            let score = 0;
            if (currentMMSEIndex < mmseItems.length) {
                try {
                    const currentItem = mmseItems[currentMMSEIndex];
                    console.log(`📝 评分题目 ${currentMMSEIndex + 1}: ${currentItem.question.substring(0, 50)}...`);
                    score = calculateMmseScore(message, currentItem);

                    session.mmse_state.scores.push({
                        question_id: currentItem.id,
                        question: currentItem.question,
                        answer: message,
                        score: score,
                        max_score: currentItem.max_score
                    });

                    console.log(`✅ 第${currentMMSEIndex + 1}题得分: ${score}/${currentItem.max_score}`);
                } catch (e) {
                    console.log(`❌ 评分过程出错: ${e}`);
                    score = 0;
                }
            } else {
                console.log(`⚠️ 题目索引越界: ${currentMMSEIndex} >= ${mmseItems.length}`);
            }

            const nextIndex = currentMMSEIndex + 1;
            console.log(`🔍 下一个索引: ${nextIndex}, 总题数: ${mmseItems.length}`);

            if (nextIndex < mmseItems.length) {
                try {
                    const nextItem = mmseItems[nextIndex];
                    session.mmse_state.current_index = nextIndex;
                    aiResponse = nextItem.question;
                    mmseMode = true;
                    currentIndex = nextIndex;
                    console.log(`➡️ 继续下一题 #${nextIndex + 1}`);
                } catch (e) {
                    console.log(`❌ 准备下一题时出错: ${e}`);
                    aiResponse = "评估过程中出现错误，评估结束。";
                    mmseMode = false;
                    currentIndex = -1;
                    session.mmse_state = null;
                }
            } else {
                console.log("🎉 所有题目已完成，开始计算总分...");
                try {
                    const totalScore = session.mmse_state.scores.reduce((sum, item) => sum + (item.score || 0), 0);
                    const assessmentResult = getMmseAssessmentResult(totalScore);
                    const assessmentTime = (Date.now() - session.mmse_state.start_time) / 1000;

                    console.log(`📊 计算完成: 总分=${totalScore}, 结果=${assessmentResult}`);
                    console.log(`📋 得分记录数量: ${session.mmse_state.scores.length}`);

                    let resultSummary = "🎉 MMSE评估完成！\n\n";
                    resultSummary += `📊 总得分: ${totalScore}/30分\n`;
                    resultSummary += `📈 评估结果: ${assessmentResult}\n\n`;

                    const timeOrientation = session.mmse_state.scores.slice(0, 5).reduce((sum, item) => sum + item.score, 0);
                    const placeOrientation = session.mmse_state.scores.slice(5, 10).reduce((sum, item) => sum + item.score, 0);
                    const memory = session.mmse_state.scores[10].score + session.mmse_state.scores[16].score;
                    const attention = session.mmse_state.scores.slice(11, 16).reduce((sum, item) => sum + item.score, 0);
                    const language = session.mmse_state.scores.slice(17).reduce((sum, item) => sum + item.score, 0);

                    resultSummary += "🏆 分类得分:\n";
                    resultSummary += `• 时间定向: ${timeOrientation}/5分\n`;
                    resultSummary += `• 地点定向: ${placeOrientation}/5分\n`;
                    resultSummary += `• 记忆能力: ${memory}/6分\n`;
                    resultSummary += `• 注意计算: ${attention}/5分\n`;
                    resultSummary += `• 语言能力: ${language}/9分\n\n`;

                    if (totalScore >= 27) {
                        resultSummary += "💡 您的认知功能正常，请继续保持健康的生活方式！";
                    } else if (totalScore >= 21) {
                        resultSummary += "💡 存在轻度认知障碍，建议加强认知训练和社交活动。";
                    } else if (totalScore >= 10) {
                        resultSummary += "💡 存在中度认知障碍，建议尽快就医进行专业评估。";
                    } else {
                        resultSummary += "💡 存在重度认知障碍，请立即就医进行专业诊断和治疗。";
                    }

                    aiResponse = resultSummary;
                    mmseMode = false;
                    currentIndex = -1;
                    console.log(`✅ MMSE评估完成！总分: ${totalScore}/30`);
                    session.mmse_state = null;
                } catch (e) {
                    console.log(`❌ 生成评估报告时出错: ${e}`);
                    aiResponse = "评估已完成！感谢您的配合。由于技术原因无法显示详细结果，请联系管理员。";
                    mmseMode = false;
                    currentIndex = -1;
                    session.mmse_state = null;
                }
            }
        } else {
            console.log("💬 进入普通聊天模式");
            try {
                // 构建更丰富的对话上下文，让AI能够更好地理解用户意图
                const systemPrompt = `你是小忆，一个温暖、耐心、专业的AI康复助手。你的任务是：
1. 根据用户的语音内容，自由、自然地回答用户的问题
2. 用友好、亲切、温柔的语气与用户交流
3. 如果用户询问康复相关的问题，提供专业建议
4. 如果用户想要玩游戏或使用功能，引导用户
5. 如果用户只是闲聊，也要友好地回应
6. 回答要简洁自然，就像真正的朋友在对话一样
7. 根据用户的语音内容灵活回答，不要机械地重复`;

                const messagesToSend = [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    ...userHistory.slice(-6) // 增加上下文历史，从4条增加到6条
                ];

                console.log(`📝 发送给AI的消息:`, {
                    systemPrompt: systemPrompt.substring(0, 100) + '...',
                    userHistory: userHistory.slice(-6).map(m => ({
                        role: m.role,
                        content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
                    }))
                });

                aiResponse = await callSparkApi(messagesToSend);
                
                // 确保回复不为空
                if (!aiResponse || !aiResponse.trim()) {
                    aiResponse = "我理解了，请继续说吧。";
                }
                
                console.log(`✅ AI回复: ${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}`);
                
                mmseMode = false;
                currentIndex = -1;
            } catch (e) {
                console.log(`❌ 普通聊天出错: ${e}`);
                aiResponse = "抱歉，我刚才没有听清楚，请再说一遍好吗？";
                mmseMode = false;
                currentIndex = -1;
            }
        }

        userHistory.push({ role: "assistant", content: aiResponse });

        console.log(`🤖 返回响应: MMSE模式=${mmseMode}, 当前索引=${currentIndex}`);
        console.log(`📝 回复内容: ${aiResponse.substring(0, 100)}...`);

        res.json({
            success: true,
            data: {
                reply: aiResponse,
                sessionId: sessionId,
                isMMSE: mmseMode,
                currentMMSEIndex: currentIndex
            }
        });

    } catch (e) {
        console.log(`❌ 聊天API全局错误: ${e}`);
        res.json({
            success: true,
            data: {
                reply: "系统暂时遇到问题，请稍后重试。",
                sessionId: 'error',
                isMMSE: false,
                currentMMSEIndex: -1
            }
        });
    }
});

app.post('/api/start-mmse', (req, res) => {
    try {
        const { sessionId = 'default' } = req.body;
        console.log(`🎯 开始MMSE评估，会话ID: ${sessionId}`);
        console.log(`📋 请求详情:`, {
            method: req.method,
            path: req.path,
            body: req.body,
            headers: {
                origin: req.headers.origin,
                'content-type': req.headers['content-type']
            }
        });

        if (!userSessions[sessionId]) {
            userSessions[sessionId] = {
                conversation: [],
                mmse_state: null
            };
        }

        const session = userSessions[sessionId];
        session.mmse_state = {
            current_index: 0,
            scores: [],
            start_time: Date.now()
        };

        session.conversation = [];

        const firstQuestion = mmseItems[0].question;
        const welcomeMessage = "您好！现在开始进行简易智力状态检查(MMSE)。我会问您一些简单的问题，请根据您的实际情况回答。让我们开始吧！";
        
        session.conversation.push({ role: "assistant", content: welcomeMessage });
        session.conversation.push({ role: "assistant", content: firstQuestion });

        const responseData = {
            success: true,
            data: {
                first_question: firstQuestion,
                welcome_message: welcomeMessage,
                current_index: 0,
                total_questions: mmseItems.length,
                sessionId: sessionId
            }
        };

        console.log(`✅ MMSE评估启动成功，返回数据:`, responseData);
        
        res.json(responseData);

    } catch (e) {
        console.error(`❌ 开始MMSE评估错误:`, e);
        console.error(`❌ 错误堆栈:`, e.stack);
        res.status(500).json({
            success: false,
            error: `开始评估失败: ${e.message}`,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Pycn Chat with MMSE Assessment',
        timestamp: new Date().toISOString()
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();

// 在启动服务器前，再次检查环境变量（运行时检查）
if (!SPARK_CONFIG.APPID || !SPARK_CONFIG.API_SECRET || !SPARK_CONFIG.API_KEY) {
    console.error("=".repeat(60));
    console.error("❌ 错误：星火大模型配置缺失！");
    console.error("请在环境变量中设置以下变量：");
    console.error("   SPARK_APPID");
    console.error("   SPARK_API_SECRET");
    console.error("   SPARK_API_KEY");
    console.error("   (可选) SPARK_URL");
    console.error("   (可选) SPARK_DOMAIN");
    console.error("=".repeat(60));
    console.error("⚠️ 服务器无法启动，请配置环境变量后重试。");
    process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log("=".repeat(60));
    console.log("🚀 Pycn智能聊天服务启动成功！");
    console.log(`📍 本地访问: http://127.0.0.1:${PORT}`);
    console.log(`📍 局域网访问: http://${localIP}:${PORT}`);
    console.log("📊 功能: 智能聊天 + MMSE认知评估");
    console.log("=".repeat(60));
});

