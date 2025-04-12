# app.py
from jmcomic import *
from flask import Flask
from routes import bp  # 导入蓝图
from config import DEBUG #导入debug变量
import logging
import utils  # 导入 utils 模块

app = Flask(__name__, static_folder='static', template_folder='templates') 
app.register_blueprint(bp)  # 注册蓝图
app.config['DEBUG'] = DEBUG

# 配置 Flask 日志
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s') # 设置日志级别为 DEBUG
app.logger.setLevel(logging.DEBUG) #设置flask app的logger等级为DEBUG

# 将 Flask 的 logger 传递给 utils 模块 (不再需要传递，utils使用根logger)
# utils.logger = app.logger  # 将 Flask 的 logger 传递给 utils 模块

if __name__ == '__main__':
    app.run(debug=DEBUG, port=5000) #是否开启debug模式
