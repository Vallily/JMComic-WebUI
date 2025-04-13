# routes.py
from jmcomic import *
from flask import Blueprint, render_template, request, jsonify, send_from_directory
from utils import *
from config import OPTION_PATH
import threading
import os
import shutil
import subprocess
import time

bp = Blueprint('main', __name__)

ARCHIVE_PATH = 'Archive'

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/search_album_api')
def search_album_api():
    search_query = request.args.get('query', '')
    page_num = request.args.get('page', 1, type=int)
    if not search_query:
        return jsonify({"error": "搜索关键词不能为空"}), 400
    results = search_album(search_query, page_num=1)
    if results:
        total_albums = len(results["albums"])
        total_pages = (total_albums + 19) // 20
        return jsonify({
            "albums": results["albums"],
            "total_pages": total_pages,
            "current_page": page_num
        })
    else:
        return jsonify({"error": "搜索失败"}), 500

@bp.route('/download', methods=['POST'])
def download():
    album_id = request.form.get('album_id')
    threading.Thread(target=download_album_from_id, args=(album_id,)).start()
    return jsonify({"message": "正在下载本子，请稍候..."}), 202

@bp.route('/get_album_info_api/<int:album_id>')
def get_album_info_api(album_id):
    album_info = get_album_info(album_id)
    if album_info:
        return jsonify(album_info)
    else:
        return jsonify({"error": "本子信息获取失败"}), 404

@bp.route('/get_cover_api/<int:album_id>')
def get_cover_api(album_id):
    cover_url = load_cover_async(album_id, None, None, None, None)
    if cover_url:
        return jsonify({"cover_url": cover_url})
    else:
        return jsonify({"error": "封面获取失败"}), 404

@bp.route('/get_image_list_api')
def get_image_list_api():
    """提供 API 接口获取图片列表"""
    image_path = request.args.get('image_path')
    abs_path = os.path.join(os.getcwd(), image_path) # 使用绝对路径
    try:
        image_list = [f for f in os.listdir(abs_path) if f.endswith(('.jpg', '.jpeg', '.png', '.gif', 'webp'))]
        return jsonify(image_list)
    except Exception as e:
        return jsonify({'error': str(e)})

@bp.route('/get_archive_list_api')
def get_archive_list_api():
    """提供 API 接口获取本子库列表"""
    try:
        archive_list = [d for d in os.listdir(ARCHIVE_PATH) if os.path.isdir(os.path.join(ARCHIVE_PATH, d))]
        return jsonify({'archive_list': archive_list})
    except Exception as e:
        return jsonify({'error': str(e)})

@bp.route('/Archive/<path:filename>')
def get_archive_file(filename):
    """提供访问 Archive 文件夹中文件的接口"""
    ARCHIVE_PATH = os.path.abspath('Archive')  # Archive 文件夹的绝对路径
    return send_from_directory(ARCHIVE_PATH, filename)

import shutil

@bp.route('/delete_archive_api', methods=['POST'])
def delete_archive_api():
    """提供 API 接口删除本子"""
    archive_name = request.form.get('archive_name')
    if not archive_name:
        return jsonify({'success': False, 'error': '缺少 archive_name 参数'}), 400

    # 添加输出检测 archive_name 的值
    print(f"待删除的本子名称 (archive_name): {archive_name}")

    ARCHIVE_PATH = archive_name

    # 添加输出检测 ARCHIVE_PATH 的值
    print(f"待删除的本子路径 (ARCHIVE_PATH): {ARCHIVE_PATH}")

    if not os.path.exists(ARCHIVE_PATH):
        return jsonify({'success': False, 'error': '本子不存在'}), 404

    try:
        shutil.rmtree(ARCHIVE_PATH)  # 递归删除文件夹
        return jsonify({'success': True, 'message': '删除成功'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


#--------------------------本子库文件夹系统 获取文件目录并筛选---------------------
@bp.route('/get_directory_info_api')
def get_directory_info_api():
    """获取指定路径下的目录和文件信息"""
    path = request.args.get('path', ARCHIVE_PATH)  # 默认路径为 Archive 文件夹
    abs_path = os.path.join(os.getcwd(), path)  # 获取绝对路径
    if not os.path.exists(abs_path):
        return jsonify({'error': '路径不存在'}), 400
    try:
        items = []
        for name in os.listdir(abs_path):
            item_path = os.path.join(abs_path, name)
            item_rel_path = os.path.join(path, name)  # 相对路径，用于前端导航
            # 将 Windows 路径分隔符替换为正斜杠
            item_rel_path = item_rel_path.replace('\\', '/')
            if os.path.isdir(item_path):
                # 检测文件夹中是否存在图片
                has_images = any(f.endswith(('.jpg', '.jpeg', '.png', '.gif', 'webp')) for f in os.listdir(item_path))
                item_type = 'album' if has_images else 'folder'
                # 获取创建时间
                creation_time = os.path.getctime(item_path)
                items.append({
                    'name': name,
                    'type': item_type,
                    'path': item_rel_path,  # 相对路径
                    'creation_time': creation_time  # 添加创建时间
                })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'items': items, 'path': path})  # 返回当前路径

@bp.route('/open_folder_api', methods=['POST'])
def open_folder_api():
    """提供 API 接口打开文件夹"""
    folder_path = request.form.get('folder_path')
    if not folder_path:
        return jsonify({'success': False, 'error': '缺少 folder_path 参数'}), 400

    abs_path = os.path.abspath(folder_path)  # 获取绝对路径
    if not os.path.exists(abs_path):
        return jsonify({'success': False, 'error': '文件夹不存在'}), 404

    try:
        # 根据操作系统选择不同的打开方式
        if os.name == 'nt':  # Windows
            subprocess.Popen(['explorer', abs_path])
        elif os.name == 'posix':  # macOS
            subprocess.Popen(['open', abs_path])
        else:  # Linux
            subprocess.Popen(['xdg-open', abs_path])
        return jsonify({'success': True, 'message': '已打开文件夹'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
