# JMComic WebUI

## 项目介绍

这是一个基于 [JMComic-Crawler-Python](https://github.com/hect0x7/JMComic-Crawler-Python/) 爬虫开发的本地化 WebUI，旨在提供更便捷、直观的操作界面，方便用户管理和浏览从 JMComic 爬取的资源。

目前已实现以下功能：

*   **下载本子:**  通过ID快速下载本子。
*   **搜索本子:**  根据关键词搜索本子。
*   **本子库:**  集中管理已下载的本子。
*   **多种浏览模式:**  提供单页模式、双页模式和日漫模式，满足不同的浏览习惯。

## 使用方法

1.  **安装 JMComic 爬虫 API:**  请务必先按照 [JMComic-Crawler-Python](https://github.com/hect0x7/JMComic-Crawler-Python/) 的说明进行安装和配置。这是本项目运行的基础。

2.  **运行 WebUI:**

    *   下载本项目代码。
    *   在项目文件夹空白处右键，选择 "在终端中打开" (或者使用你喜欢的命令行工具，进入项目目录)。
    *   输入 `py app.py` 并按 Enter 运行。
    *   如果终端输出类似 `* Running on http://127.0.0.1:5000` 的信息，则表示 WebUI 启动成功。
    *   按住 Ctrl 键并点击该网址 (`http://127.0.0.1:5000`)，即可在浏览器中打开 WebUI。

### 功能说明

*   **下载本子界面:**
    *   输入本子 ID  并按 Enter，将本子添加到预选库。
    *   点击 "获取本子信息"，等待信息加载完成。
    *   选中要下载的本子。
    *   点击 "下载"，将会默认下载到./Archive文件夹。

*   **搜索本子界面:**
    *   输入搜索关键词。
    *   选中要查看的本子。
    *   点击 "添加到预选库"。
    *   WebUI 将自动跳转到下载本子界面并开始获取本子信息。

*   **本子库界面:**
    *   点击本子卡片进入预览模式 (左键单击空白处退出)。
    *   在预览模式下，点击图片可以打开大图显示 (单击图片退出，使用 ← 和 → 键进行图片切换)。
    *   可以使用资源管理器进行文件夹分类嵌套，本子库能识别文件夹和本子（WebUI的资源管理器功能暂未实现）

## 声明

本人代码能力有限，项目中包含较多由 Gemini 生成的代码，可能存在代码冗余、结构臃肿以及潜在的 bug等问题。

未来有时间会继续添加更多功能，目标是完美实现爬虫提供的大部分插件。

## 预览

<img width="1274" alt="1744474974301" src="https://github.com/user-attachments/assets/6900244c-d401-4c89-88d6-c3af012a5e40" />
<img width="1274" alt="1744474987610" src="https://github.com/user-attachments/assets/350b902c-893d-4036-8aa7-b9f14c5fc083" />
<img width="1274" alt="1744475360523" src="https://github.com/user-attachments/assets/47a9b110-ee45-41be-b863-33fb7f75d8c0" />

## 感谢以下项目

### JMComic爬虫

<a href="https://github.com/hect0x7/JMComic-Crawler-Python">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api/pin/?username=hect0x7&repo=JMComic-Crawler-Python&theme=radical" />
    <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api/pin/?username=hect0x7&repo=JMComic-Crawler-Python" />
    <img alt="Repo Card" src="https://github-readme-stats.vercel.app/api/pin/?username=hect0x7&repo=JMComic-Crawler-Python" />
  </picture>
</a>

