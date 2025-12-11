# coding: utf-8
import _thread as thread
import os
import time
import base64
import datetime
import hashlib
import hmac
import json
from urllib.parse import urlparse, urlencode
import ssl
from time import mktime
from wsgiref.handlers import format_date_time
import websocket


# MMSE量表题目和评分标准
def get_current_season():
    """根据当前月份判断季节（北半球）"""
    month = datetime.datetime.now().month
    if 3 <= month <= 5:
        return "春季"
    elif 6 <= month <= 8:
        return "夏季"
    elif 9 <= month <= 11:
        return "秋季"
    else:  # 12,1,2月
        return "冬季"

def get_current_weekday():
    """获取当前星期的正确表述（支持简写和全称）"""
    weekday_num = datetime.datetime.now().weekday()  # 0=周一, 6=周日
    full_names = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
    short_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    return full_names[weekday_num], short_names[weekday_num]

def get_current_month():
    """获取当前月份的正确表述（支持数字和中文）"""
    month = datetime.datetime.now().month
    num_names = [f"{i}月" for i in range(1, 13)]
    chinese_names = ["一月", "二月", "三月", "四月", "五月", "六月",
                     "七月", "八月", "九月", "十月", "十一月", "十二月"]
    return num_names[month-1], chinese_names[month-1]

mmse_items = [
    # 时间定向 (5分)
    {
        "id": 1,
        "category": "时间定向",
        "question": "现在是哪一年？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": [str(datetime.datetime.now().year)]
    },
    {
        "id": 2,
        "category": "时间定向",
        "question": "现在是什么季节？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        # 动态生成当前季节（唯一正确答案）
        "correct_answers": [get_current_season()]
    },
    {
        "id": 3,
        "category": "时间定向",
        "question": "现在是哪个月？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        # 动态生成当前月份（支持数字和中文表述）
        "correct_answers": [get_current_month()[0], get_current_month()[1]]
    },
    {
        "id": 4,
        "category": "时间定向",
        "question": "今天是几号？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        # 动态生成当前日期（唯一正确答案）
        "correct_answers": [str(datetime.datetime.now().day), f"{datetime.datetime.now().day}号"]
    },
    {
        "id": 5,
        "category": "时间定向",
        "question": "今天是星期几？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        # 动态生成当前星期（支持全称和简写）
        "correct_answers": [get_current_weekday()[0], get_current_weekday()[1]]
    },

    # 地点定向 (5分)
    {
        "id": 6,
        "category": "地点定向",
        "question": "我们现在在哪个国家？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["中国", "中华人民共和国"]
    },
    {
        "id": 7,
        "category": "地点定向",
        "question": "我们现在在哪个省/市？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": []  # 留空，由管理员后续确认
    },
    {
        "id": 8,
        "category": "地点定向",
        "question": "我们现在在哪个区/县？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": []  # 留空，由管理员后续确认
    },
    {
        "id": 9,
        "category": "地点定向",
        "question": "我们现在在哪个街道/乡？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": []  # 留空，由管理员后续确认
    },
    {
        "id": 10,
        "category": "地点定向",
        "question": "我们现在在哪个楼层/具体地址？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": []  # 留空，由管理员后续确认
    },

    # 语言即刻记忆 (3分)
    {
        "id": 11,
        "category": "语言即刻记忆",
        "question": "请记住这三样东西：皮球、国旗、树木。我会稍后问您。请您重复一遍这三样东西。",
        "score_criteria": "正确重复1个得1分，最多3分",
        "max_score": 3,
        "type": "memory_practice",
        "memory_items": ["皮球", "国旗", "树木"]
    },

    # 注意和计算 (5分)
    {
        "id": 12,
        "category": "注意和计算",
        "question": "请计算：100减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["93"]
    },
    {
        "id": 13,
        "category": "注意和计算",
        "question": "再减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["86"]
    },
    {
        "id": 14,
        "category": "注意和计算",
        "question": "再减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["79"]
    },
    {
        "id": 15,
        "category": "注意和计算",
        "question": "再减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["72"]
    },
    {
        "id": 16,
        "category": "注意和计算",
        "question": "再减去7等于多少？",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "calculation",
        "correct_answers": ["65"]
    },

    # 语言延迟记忆 (3分)
    {
        "id": 17,
        "category": "语言延迟记忆",
        "question": "刚才我让您记住的三样东西是什么？",
        "score_criteria": "正确回忆1个得1分，最多3分",
        "max_score": 3,
        "type": "memory_recall",
        "memory_items": ["皮球", "国旗", "树木"]
    },

    # 语言命名 (2分)
    {
        "id": 18,
        "category": "语言命名",
        "question": "这是什么？（请向患者出示手表）",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["手表", "表", "腕表"]
    },
    {
        "id": 19,
        "category": "语言命名",
        "question": "这是什么？（请向患者出示铅笔）",
        "score_criteria": "正确得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["铅笔", "笔"]
    },

    # 语言复述 (1分)
    {
        "id": 20,
        "category": "语言复述",
        "question": "请跟我说：'四十四只石狮子'",
        "score_criteria": "正确复述得1分，错误得0分",
        "max_score": 1,
        "type": "text",
        "correct_answers": ["四十四只石狮子"]
    },

    # 语言理解 (3分)
    {
        "id": 21,
        "category": "语言理解",
        "question": "请用右手拿纸。",
        "score_criteria": "正确完成得1分，错误得0分",
        "max_score": 1,
        "type": "action",
        "description": "观察患者是否能用右手拿纸"
    },
    {
        "id": 22,
        "category": "语言理解",
        "question": "请把纸对折。",
        "score_criteria": "正确完成得1分，错误得0分",
        "max_score": 1,
        "type": "action",
        "description": "观察患者是否能把纸对折"
    },
    {
        "id": 23,
        "category": "语言理解",
        "question": "请把纸放在桌子上。",
        "score_criteria": "正确完成得1分，错误得0分",
        "max_score": 1,
        "type": "action",
        "description": "观察患者是否能把纸放在桌子上"
    },

    # 语言阅读 (1分)
    {
        "id": 24,
        "category": "语言阅读",
        "question": "请念这句话并照着做：'闭上你的眼睛'",
        "score_criteria": "正确阅读并执行得1分，错误得0分",
        "max_score": 1,
        "type": "action",
        "description": "观察患者是否能正确阅读并闭上眼睛"
    },

    # 语言书写 (1分)
    {
        "id": 25,
        "category": "语言书写",
        "question": "请写一个完整的句子。",
        "score_criteria": "句子完整且有意义得1分，否则0分",
        "max_score": 1,
        "type": "text",
        "description": "需要管理员判断句子是否完整有意义"
    },

    # 语言结构 (1分)
    {
        "id": 26,
        "category": "语言结构",
        "question": "请模仿画这个图形。（出示交叉的五边形）",
        "score_criteria": "正确画出得1分，错误得0分",
        "max_score": 1,
        "type": "drawing",
        "description": "需要管理员判断图形是否正确"
    }
]


class Ws_Param(object):
    # 初始化
    def __init__(self, APPID, APIKey, APISecret, gpt_url):
        self.APPID = APPID
        self.APIKey = APIKey
        self.APISecret = APISecret
        self.host = urlparse(gpt_url).netloc
        self.path = urlparse(gpt_url).path
        self.gpt_url = gpt_url

    # 生成url
    def create_url(self):
        # 生成RFC1123格式的时间戳
        now = datetime.datetime.now()
        date = format_date_time(mktime(now.timetuple()))

        # 拼接字符串
        signature_origin = "host: " + self.host + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + self.path + " HTTP/1.1"

        # 进行hmac-sha256进行加密
        signature_sha = hmac.new(self.APISecret.encode('utf-8'), signature_origin.encode('utf-8'),
                                 digestmod=hashlib.sha256).digest()

        signature_sha_base64 = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = f'api_key="{self.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'

        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": self.host
        }
        # 拼接鉴权参数，生成url
        url = self.gpt_url + '?' + urlencode(v)
        return url


# 全局变量用于存储对话历史和当前回复
dialog_history = []
current_response = ""


# 收到websocket错误的处理
def on_error(ws, error):
    print("### error:", error)


# 收到websocket关闭的处理
def on_close(ws):
    global dialog_history, current_response
    # 将当前回复添加到对话历史
    if current_response:
        dialog_history.append({"role": "assistant", "content": current_response})
        current_response = ""
    print("\n 对话已关闭 ")


# 收到websocket连接建立的处理
def on_open(ws):
    thread.start_new_thread(run, (ws,))


def run(ws, *args):
    # 使用包含历史对话的参数
    data = json.dumps(gen_params(
        appid=ws.appid,
        messages=ws.messages,  # 传递完整消息列表
        domain=ws.domain
    ))
    ws.send(data)


# 收到websocket消息的处理
def on_message(ws, message):
    global current_response
    data = json.loads(message)
    code = data['header']['code']
    if code != 0:
        print(f'请求错误: {code}, {data}')
        ws.close()
    else:
        choices = data["payload"]["choices"]
        status = choices["status"]
        content = choices["text"][0]["content"]
        print(content, end='', flush=True)
        current_response += content  # 累积回复内容
        if status == 2:
            print("\n     本轮对话结束     ")
            ws.close()


def gen_params(appid, messages, domain):
    """生成请求参数，支持传入历史对话列表"""
    data = {
        "header": {
            "app_id": appid,
            "uid": "1234",
            # "patch_id": []    #接入微调模型，对应服务发布后的resourceid
        },
        "parameter": {
            "chat": {
                "domain": domain,
                "temperature": 0.5,
                "max_tokens": 4096,
                "auditing": "default",
            }
        },
        "payload": {
            "message": {
                "text": messages  # 使用完整的消息列表（包含历史）
            }
        }
    }
    return data


def send_message(appid, api_secret, api_key, Spark_url, domain, message):
    """发送消息并获取回复，维护对话历史"""
    global dialog_history

    # 将新消息添加到对话历史
    dialog_history.append({"role": "user", "content": message})

    wsParam = Ws_Param(appid, api_key, api_secret, Spark_url)
    websocket.enableTrace(False)
    wsUrl = wsParam.create_url()

    # 创建WebSocket连接并传递完整的对话历史
    ws = websocket.WebSocketApp(wsUrl,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close,
                                on_open=on_open)
    ws.appid = appid
    ws.messages = dialog_history  # 传递完整对话历史
    ws.domain = domain
    ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})


def get_location_info():
    """获取当前地点信息，用于判断地点定向题的正确性"""
    location_info = {}
    print("\n===== 请管理员输入当前地点信息 =====")
    location_info["country"] = "中国"  # 固定值
    location_info["province_city"] = input("当前所在省/市: ")
    location_info["district_county"] = input("当前所在区/县: ")
    location_info["street_township"] = input("当前所在街道/乡: ")
    location_info["floor_address"] = input("当前所在楼层/具体地址: ")

    # 更新题目中的正确答案
    for item in mmse_items:
        if item["id"] == 7:
            item["correct_answers"] = [location_info["province_city"]]
        elif item["id"] == 8:
            item["correct_answers"] = [location_info["district_county"]]
        elif item["id"] == 9:
            item["correct_answers"] = [location_info["street_township"]]
        elif item["id"] == 10:
            item["correct_answers"] = [location_info["floor_address"]]

    return location_info


def calculate_score(answer,  item):
    """根据回答计算得分"""

    answer = answer.strip()
    if not answer:
        return 0

    if item["type"] in ["calculation"]:
        answer_lower = answer.lower()
        # 只匹配当前时间的正确答案（列表中只有正确选项）
        for correct in item["correct_answers"]:
            if correct.lower() == answer_lower:  # 完全相等才正确
                return 1
        return 0  # 不在正确答案列表中则得0分
    # 文本/计算题：直接匹配正确答案
    elif item["type"] in ["text"]:
        answer_lower = answer.lower()
        for correct in item["correct_answers"]:
            if correct.lower() in answer_lower or answer_lower in correct.lower():
                return 1
        return 0

    elif item["type"] == "memory_practice":
        # 记忆练习，统计正确重复的项目
        score = 0
        answer_lower = answer.lower()
        for item in item["correct_answers"]:
            if item.lower() in answer_lower:
                score += 1
        return min(score, 3)  # 最多3分

    elif item["type"] == "memory_recall":
        # 记忆回忆，统计正确回忆的项目
        score = 0
        answer_lower = answer.lower()
        for item in item["correct_answers"]:
            if item.lower() in answer_lower:
                score += 1
        return min(score, 3)  # 最多3分

    elif item["type"] == "action" or item["type"] == "drawing":
        # 动作和绘画题，需要管理员判断
        print(f"\n患者回答: {answer}")
        while True:
            admin_input = input("请管理员判断患者是否正确完成？(y/n): ").lower()
            if admin_input in ['y', 'yes']:
                return 1
            elif admin_input in ['n', 'no']:
                return 0
            else:
                print("请输入 'y' 或 'n'")


def conduct_mmse_assessment():
    """执行MMSE量表评估，由患者直接回答问题"""
    total_score = 0
    results = []

    # 首先获取地点信息，用于后续评分
    location_info = get_location_info()

    print("\n===== 简易智力状态检查(MMSE)开始 =====")
    print("请患者根据提示回答问题。管理员请按回车键开始...")
    input()

    for item in mmse_items:
        print(f"\n问题: {item['question']}")

        # 对于需要实物展示的题目，提醒管理员
        if item["id"] in [18, 19, 26]:
            input(f"请管理员准备好所需物品，准备好后按回车键继续...")

        # 获取患者回答
        patient_answer = input("患者回答: ")

        # 计算得分
        if item["type"] in ["memory_practice", "memory_recall"]:
            score = calculate_score(
                patient_answer,
                item
            )
        else:
            score = calculate_score(
                patient_answer,
                item
            )

        total_score += score
        results.append({
            "id": item["id"],
            "category": item["category"],
            "question": item["question"],
            "patient_answer": patient_answer,
            "score": score,
            "max_score": item["max_score"]
        })

        print(f"本题得分: {score}/{item['max_score']}")
        input("按回车键继续下一题...")

    # 显示评估结果
    print("\n===== MMSE评估结果 =====")
    print(f"总得分: {total_score}/30分")

    # 根据得分给出认知功能评估
    if total_score >= 27:
        print("评估结果: 认知功能正常")
    elif 21 <= total_score <= 26:
        print("评估结果: 轻度认知障碍")
    elif 10 <= total_score <= 20:
        print("评估结果: 中度认知障碍")
    else:
        print("评估结果: 重度认知障碍")

    print("\n=========================")

    return total_score, results


def main():
    # 配置参数
    appid = "d15afc6f"
    api_secret = "NDcxMjA3NmE3YjE2MjI5MjczNWFiMGMw"
    api_key = "8bfed1a8b68e4c9b2f34565255a30297"
    Spark_url = "wss://spark-api.xf-yun.com/v3.5/chat"  # Max环境的地址
    domain = "generalv3.5"  # Max版本

    print("欢迎使用忆趣康元系统！")
    print("输入 'exit' 退出系统")
    print("输入 'mmse' 开始简易智力状态检查")
    print("输入其他内容与AI对话\n")

    # 设定AI任务
    global dialog_history
    dialog_history.append({
        "role": "system",
        "content": "你是一名专业的医疗助手，专注于认知障碍评估和相关咨询。请用通俗易懂的语言与患者交流，提供专业、准确的回答。"
    })

    while True:
        user_input = input("\n请输入指令: ")
        if user_input.lower() == 'exit':
            print("系统已退出，再见！")
            break
        elif user_input.lower() == 'mmse':
            # 执行MMSE评估
            total_score, results = conduct_mmse_assessment()

            # 询问是否需要AI分析结果
            analyze = input("\n是否需要让AI分析本次评估结果？(y/n): ").lower()
            if analyze == 'y' or analyze == 'yes':
                # 准备评估结果文本
                result_text = f"患者MMSE评估总得分为{total_score}/30分。"
                if total_score >= 27:
                    result_text += "评估结果为认知功能正常。"
                elif 21 <= total_score <= 26:
                    result_text += "评估结果为轻度认知障碍。"
                elif 10 <= total_score <= 20:
                    result_text += "评估结果为中度认知障碍。"
                else:
                    result_text += "评估结果为重度认知障碍。"

                result_text += "请分析这个结果并提供专业建议，用通俗易懂的语言表达。"

                print("\n正在请求AI分析评估结果...\n")
                send_message(appid, api_secret, api_key, Spark_url, domain, result_text)
        else:
            print("\nAI正在回复...\n")
            send_message(appid, api_secret, api_key, Spark_url, domain, user_input)


if __name__ == "__main__":
    main()
