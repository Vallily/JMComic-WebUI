import os
from jmcomic import *

# 定义全局变量 OPTION_PATH
OPTION_PATH = os.path.join(os.getcwd(), "option.yml")  #用于下载的option.yml文件
COVER_CACHE_DIR = "./static/covercache" #用于存储封面缓存的文件夹
DEBUG = True  #是否开启debug模式
