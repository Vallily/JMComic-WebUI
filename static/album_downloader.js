// album_downloader.js
import { imageView } from './imageviewer.js';

export function setupDownloader(globalSelectedIds) {
    console.log("setupDownloader called with globalSelectedIds:", globalSelectedIds);

    // 获取元素
    const albumIdInput = document.getElementById("album_id");
    const idPreview = document.getElementById("id-preview"); // 预选库
    const getAlbumInfoButton = document.getElementById("get-album-info-button");
    const albumInfoList = document.getElementById("album-info-list");
    const downloadButton = document.getElementById("download-button");
    const selectedCount = document.getElementById("selected-count"); // 获取统计数量的元素

    // 新增：用于存储信息栏中选中的本子 ID
    const infoPanelSelectedIds = new Set();

    // 获取清空按钮
    const clearButton = document.getElementById("clear-button");
    clearButton.addEventListener("click", () => {
        globalSelectedIds.clear();
        // 清空 idPreview 里的标签
        while (idPreview.firstChild) {
            idPreview.removeChild(idPreview.firstChild);
        }
        updateInfoPanelSelectedCount();
    });

    // 添加 ID
    albumIdInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const inputValue = albumIdInput.value.trim();
            if (/^\d+$/.test(inputValue)) {
                if (!globalSelectedIds.has(inputValue)) {
                    globalSelectedIds.add(inputValue);
                    addIdTag(inputValue);
                }
            } else if (/^(\d+,)+\d+$/.test(inputValue)) {
                const ids = inputValue.split(",");
                ids.forEach(id => {
                    if (!globalSelectedIds.has(id)) {
                        globalSelectedIds.add(id);
                        addIdTag(id);
                    }
                });
            } else {
                alert("请输入有效的本子 ID（纯数字或以逗号分隔的数字）。");
            }
            albumIdInput.value = "";
        }
    });

    // 添加 ID 标签
    function addIdTag(albumId) {
        console.log(`addIdTag called with albumId: ${albumId}`);
        const idTag = document.createElement("div");
        idTag.classList.add("id-tag");
        idTag.textContent = albumId;
        idTag.addEventListener("click", function() {
            removeIdTag(albumId, idTag);
        });
        idPreview.appendChild(idTag);
    }

    // 移除 ID 标签
    function removeIdTag(albumId, idTag) {
        console.log(`removeIdTag called with albumId: ${albumId}`);
        globalSelectedIds.delete(albumId);
        idTag.remove();
        //updateSelectedCount();  // 不更新全局计数，只管预选库
        updateInfoPanelSelectedCount()
        //loadAlbumInfo(); //refresh to clear
    }

    // 添加来自输入框的 ID
    function addIdFromInput() {
        const inputValue = albumIdInput.value.trim();
        if (inputValue === "") return;
        if (/^\d+$/.test(inputValue)) {
            if (!globalSelectedIds.has(inputValue)) {
                globalSelectedIds.add(inputValue);
                addIdTag(inputValue);
            }
        } else if (/^(\d+,)+\d+$/.test(inputValue)) {
            const ids = inputValue.split(",");
            ids.forEach(id => {
                if (!globalSelectedIds.has(id)) {
                    globalSelectedIds.add(id);
                    addIdTag(id);
                }
            });
        } else {
            alert("请输入有效的本子 ID（纯数字或以逗号分隔的数字）。");
        }
        albumIdInput.value = "";
    }

    // 获取本子信息
    getAlbumInfoButton.addEventListener("click", function() {
        const inputValue = albumIdInput.value.trim();
        if (inputValue !== "") {
            addIdFromInput();
        }
        loadAlbumInfo();
    });

    function loadAlbumInfo() {
        albumInfoList.innerHTML = "";
        if (globalSelectedIds.size === 0) {
            // alert("请先输入 ID 并添加到预选库！");
            return;
        }
        globalSelectedIds.forEach(albumId => {
            const loadingElement = document.createElement("div");
            loadingElement.classList.add("album-info", "loading");
            loadingElement.id = `album-info-${albumId}`;
            loadingElement.innerHTML = `<p>正在加载本子 ${albumId} 的信息...</p>`;
            albumInfoList.appendChild(loadingElement);
            fetch(`/get_album_info_api/${albumId}`)
                .then(response => response.json())
                .then(data => {
                    const albumInfoElement = document.getElementById(`album-info-${albumId}`);
                    if (!albumInfoElement) return;
                    if (data.error) {
                        albumInfoElement.innerHTML = `<p>错误：${data.error}</p>`;
                        return;
                    }
                    const albumInfoHtml = `
                        <h3>${data.title}</h3>
                        <img src="${data.cover}" alt="封面" id="cover-${albumId}" style="cursor: pointer;">
                        <div class="info-list">
                            <p>作者: ${data.author}</p>
                            <p>章节数: ${data.chapter_count}</p>
                            <p>总页数: ${data.page_count}</p>
                            <p>标签: ${data.tags}</p>
                        </div>
                    `;
                    albumInfoElement.innerHTML = albumInfoHtml;
                    albumInfoElement.classList.remove("loading");
                    albumInfoElement.dataset.albumId = albumId;
                    // 检查是否在 infoPanelSelectedIds 中，更新选中状态
                    if (infoPanelSelectedIds.has(albumId)) {
                        albumInfoElement.classList.add('blue', 'gradient', 'selected');
                    }
                    updateInfoPanelSelectedCount();

                })
                .catch(error => {
                    const albumInfoElement = document.getElementById(`album-info-${albumId}`);
                    if (!albumInfoElement) return;
                    albumInfoElement.innerHTML = `<p>加载本子 ${albumId} 信息失败。</p>`;
                });
        });
    }

    // 更新选中本子数量
    function updateInfoPanelSelectedCount() {
        selectedCount.textContent = `目前选中的本子数量：${infoPanelSelectedIds.size}`;
    }

    // 点击本子信息卡片
    albumInfoList.addEventListener("click", function(event) {
        console.log("albumInfoList 点击事件触发!");

        const albumInfo = event.target.closest('.album-info');
        if (albumInfo) {
            console.log("点击了 album-info 元素!");

            const albumId = albumInfo.dataset.albumId;
            console.log("Album ID:", albumId);

            if (event.target.tagName === 'IMG' && event.target.id.startsWith('cover-')) {
                console.log("点击了封面图片!");
                const image_path = './static/covercache';
                const image_name = albumId + '.jpg';
                const mode = 'single';
                imageView(image_path, image_name, mode);
                return;
            } else {
                console.log("点击的不是封面图片!");
            }

            const isSelected = albumInfo.classList.contains('selected');
            if (!isSelected) {
                // 选中流程
                albumInfo.classList.add('blue');
                setTimeout(() => {
                    albumInfo.classList.add('gradient');
                    setTimeout(() => {
                        albumInfo.classList.add('selected');
                        //  infoPanelSelectedIds  添加
                        infoPanelSelectedIds.add(albumId);
                        updateInfoPanelSelectedCount();
                    }, 300);
                }, 300);
            } else {
                // 取消选中流程
                albumInfo.classList.remove('blue', 'gradient', 'selected');
                // infoPanelSelectedIds 删除
                infoPanelSelectedIds.delete(albumId);
                updateInfoPanelSelectedCount();
            }
        } else {
            console.log("点击的不是 album-info 元素!");
        }
    });

    // 下载本子
    downloadButton.addEventListener("click", function() {
        const selectedAlbums = document.querySelectorAll('.album-info.selected');
        if (selectedAlbums.length === 0) {
            alert("请选择要下载的本子！");
            return;
        }
        selectedAlbums.forEach(albumInfo => {
            const albumId = albumInfo.dataset.albumId;
            fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `album_id=${albumId}`
            })
                .then(response => {
                    console.log(`本子 ${albumId} 下载开始...`);
                });
        });
        alert("开始下载选中的本子，请稍后...");
    });

    /*---------------------- 全选/全不选 功能 ------------------------*/
    // 下载页面全选/全不选
    document.getElementById('select-all-download').addEventListener('click', function() {
        const albumInfos = document.querySelectorAll('#album-info-list .album-info');
        albumInfos.forEach(albumInfo => {
            const albumId = albumInfo.dataset.albumId;
            if (albumId && !infoPanelSelectedIds.has(albumId)) {
                infoPanelSelectedIds.add(albumId);
                albumInfo.classList.add('blue', 'gradient', 'selected');
            }
        });
        updateInfoPanelSelectedCount();
    });

    document.getElementById('select-none-download').addEventListener('click', function() {
        const albumInfos = document.querySelectorAll('#album-info-list .album-info');
        albumInfos.forEach(albumInfo => {
            const albumId = albumInfo.dataset.albumId;
            if (albumId && infoPanelSelectedIds.has(albumId)) {
                infoPanelSelectedIds.delete(albumId);
                albumInfo.classList.remove('blue', 'gradient', 'selected');
            }
        });
        updateInfoPanelSelectedCount();
    });

    // 页面加载完成后立即更新 selectedCount
    window.addEventListener('load', updateInfoPanelSelectedCount);

    // 导出 addIdTag，不再导出 selectedIds
    return {
        addIdTag: addIdTag
    };
}
