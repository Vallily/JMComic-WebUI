# utils.py
from jmcomic import *
from config import *  # 导入 OPTION_PATH
import threading
import os
import logging

# 获取根 Logger 实例
logger = logging.getLogger()  # 获取根 Logger 实例

if not os.path.exists(COVER_CACHE_DIR):
    os.makedirs(COVER_CACHE_DIR)

# 创建全局的 option 对象和client对象
option = create_option_by_file(OPTION_PATH)
client: JmcomicClient = option.build_jm_client()

def search_album(search_query, page_num=1, page_size=80):
    """搜索本子，并返回指定页面的结果"""
    try:
        page: JmSearchPage = client.search_site(search_query=search_query, page=page_num)
        results = []
        # 使用列表切片获取指定页面的结果
        album_list = list(page)
        total_albums = len(album_list) # 获取总的album数量
        for album_id, title in album_list:
            results.append({
                "album_id": album_id,
                "title": title
            })
        total_pages = (total_albums + page_size - 1) // page_size # 计算总页数
        return {"albums": results, "total_pages": total_pages, "current_page": page_num}
    except Exception as e:
        logger.exception(f"搜索本子失败: {e}")
        return None

def download_album_from_id(album_id):
    """下载本子"""
    logger.info(f"开始下载本子 ID: {album_id}")
    try:
        # 直接调用 jmcomic 库的 download_album 函数
        download_album(album_id, option)
        logger.info(f"本子 ID: {album_id} 下载完成")
    except Exception as e:
        logger.error(f"下载本子 ID: {album_id} 失败: {e}", exc_info=True)

def get_album_info(album_id):
    """获取本子信息，如果本地有封面则使用本地封面，否则下载"""
    print(f"get_album_info 函数被调用, album_id: {album_id}")
    try:
        photo: JmPhotoDetail = client.get_photo_detail(album_id, fetch_album=True) # 确保 fetch_album=True
        if not photo:
             logger.warning(f"获取本子 {album_id} 信息失败: photo 对象为空")
             return None
        album = photo.from_album  # 从 photo.from_album 获取 album 对象
        if not album:
            logger.warning(f"获取本子 {album_id} 信息失败: album 对象为空 (photo.from_album)")
            return None
        # 检查封面图片是否存在
        cover_path = os.path.join(COVER_CACHE_DIR, f"{album_id}.jpg")
        cover_exists = os.path.exists(cover_path)
        # 如果封面图片存在，则不下载
        if cover_exists:
            logger.info(f"封面图片已存在，使用本地文件: {cover_path}")
            cover_url = f"/static/covercache/{album_id}.jpg"
        else:
            # 爬取封面图片
            cover_url = f'https://{JmModuleConfig.DOMAIN_IMAGE_LIST[0]}/media/albums/{album_id}_3x4.jpg'
            try:
                client.download_image(cover_url, cover_path, decode_image=False)
                logger.info(f"成功下载封面图片: {cover_url} -> {cover_path}")
                cover_url = f"/static/covercache/{album_id}.jpg" # 下载成功后设置cover_url
            except Exception as e:
                logger.warning(f"下载封面图片失败: {e}")
                cover_url = ""  # 如果下载失败，则设置为空字符串
        info = {
            "title": album.title,
            "author": album.author,
            "chapter_count": len(album), #  章节数
            "page_count": len(photo),
            "tags": album.tags,
            "cover": cover_url  # 使用 cover_url 变量
        }
        logger.info(f"获取本子 {album_id} 信息成功")
        return info
    except Exception as e:
        logger.exception(f"获取本子信息失败: {e}")  # 记录异常信息
        return None

def load_cover_async(album_id, coveroption, image_info_frame, info_label, info_text):
    """异步加载封面 (简化版，只返回封面 URL)"""
    album_info = get_album_info(album_id)
    if album_info:
        return album_info["cover"]
    else:
        return None
