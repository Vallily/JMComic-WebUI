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

// Get the element with id="defaultOpen" and click on it
// document.getElementById("defaultOpen").click();

// 全局选中的 ID 集合
export let globalSelectedIds = new Set(); // 保存所有页面选中的 albumId

// 页面加载完成后，调用 updateSearchSelectedCount 函数
window.addEventListener('load', function() {
    //updateSelectedCount();  现在在 album_downloader.js 中调用
    //updateSearchSelectedCount();  现在在 album_searcher.js 中调用
});


// 初始化下载器和搜索器
const downloader = setupDownloader(globalSelectedIds);
setupSearcher(globalSelectedIds, downloader);

export { openTab };
