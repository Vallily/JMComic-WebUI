// script.js
import { loadArchive } from './archive.js';
import { imageView } from './imageviewer.js';
import { setupDownloader } from './album_downloader.js';
import { setupSearcher } from './album_searcher.js';

// 切换标签页时加载本子信息
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    if (tabName === 'Library') {
        loadArchive(); // 加载本子库内容
    }
}

// 获取所有 tablinks 元素
const tablinks = document.querySelectorAll('.tablinks');

// 为每个 tablinks 元素添加事件监听器
tablinks.forEach(tablink => {
    tablink.addEventListener('click', (event) => {
        const tabName = event.currentTarget.dataset.tab;
        openTab(event, tabName);
    });
});

// 全局选中的 ID 集合
export let globalSelectedIds = new Set(); // 保存所有页面选中的 albumId

// 页面加载完成后，调用 updateSearchSelectedCount 函数
window.addEventListener('load', function() {
    // 创建一个 img 元素
    const emergencyImage = document.createElement('img');
    emergencyImage.src = 'static/img/background.png';
    emergencyImage.id = 'emergency-image';
    emergencyImage.style.display = 'none'; // 初始状态隐藏
    emergencyImage.style.position = 'fixed'; // 绝对定位
    emergencyImage.style.top = '0';
    emergencyImage.style.left = '0';
    emergencyImage.style.width = '100%';
    emergencyImage.style.height = '100%';
    emergencyImage.style.objectFit = 'cover'; // 填充画面
    emergencyImage.style.zIndex = '9999'; // 置于最顶层
    emergencyImage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // 添加半透明背景
    document.body.appendChild(emergencyImage);

    let isImageVisible = false;

    // 添加 ESC 按键监听器
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            isImageVisible = !isImageVisible;
            console.log("按下ESC,执行紧急回避")
            emergencyImage.style.display = isImageVisible ? 'block' : 'none'; // 切换显示状态
        }
    });
});

// 初始化下载器和搜索器
const downloader = setupDownloader(globalSelectedIds);
setupSearcher(globalSelectedIds, downloader);

export { openTab };
