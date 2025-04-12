// album_downloader.js
import { imageView } from './imageviewer.js';

export function setupDownloader(globalSelectedIds) {
    console.log("setupDownloader called with globalSelectedIds:", globalSelectedIds); // 添加这行
    // 获取元素
    const albumIdInput = document.getElementById("album_id");
    const idPreview = document.getElementById("id-preview"); //预选库
    const getAlbumInfoButton = document.getElementById("get-album-info-button");
    const albumInfoList = document.getElementById("album-info-list");
    const downloadButton = document.getElementById("download-button");
    const selectedCount = document.getElementById("selected-count"); // 获取统计数量的元素

    // 添加 ID
    albumIdInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // 阻止表单提交
            const inputValue = albumIdInput.value.trim();
            // 检查是否是纯数字字符串
            if (/^\d+$/.test(inputValue)) {
                if (!globalSelectedIds.has(inputValue)) { // 使用 globalSelectedIds
                    globalSelectedIds.add(inputValue);
                    addIdTag(inputValue);
                }
            }
            // 检查是否是以逗号分隔的数字字符串
            else if (/^(\d+,)+\d+$/.test(inputValue)) {
                const ids = inputValue.split(",");
                ids.forEach(id => {
                    if (!globalSelectedIds.has(id)) { // 使用 globalSelectedIds
                        globalSelectedIds.add(id);
                        addIdTag(id);
                    }
                });
            }
            // 如果不符合以上两种格式，则提示用户
            else {
                alert("请输入有效的本子 ID（纯数字或以逗号分隔的数字）。");
            }
            albumIdInput.value = ""; // 清空输入框
        }
    });

    // 添加 ID 标签
    function addIdTag(albumId) {
        console.log(`addIdTag called with albumId: ${albumId}`); // 添加这行
        const idTag = document.createElement("div");
        idTag.classList.add("id-tag");
        idTag.textContent = albumId;
        // 添加点击事件，点击标签删除 ID
        idTag.addEventListener("click", function() {
            removeIdTag(albumId, idTag);
        });
        idPreview.appendChild(idTag);
    }

    // 移除 ID 标签
    function removeIdTag(albumId, idTag) {
        console.log(`removeIdTag called with albumId: ${albumId}`);
        globalSelectedIds.delete(albumId); // 确保从 globalSelectedIds 中删除
        idTag.remove();
        updateSelectedCount();  // 更新统计数量
        // 重新加载本子信息
        //loadAlbumInfo();
    }

    // 添加来自输入框的 ID
    function addIdFromInput() {
        const inputValue = albumIdInput.value.trim();
        if (inputValue === "") return;
        // 检查是否是纯数字字符串
        if (/^\d+$/.test(inputValue)) {
            if (!globalSelectedIds.has(inputValue)) { // 使用 globalSelectedIds
                globalSelectedIds.add(inputValue);
                addIdTag(inputValue);
            }
        }
        // 检查是否是以逗号分隔的数字字符串
        else if (/^(\d+,)+\d+$/.test(inputValue)) {
            const ids = inputValue.split(",");
            ids.forEach(id => {
                if (!globalSelectedIds.has(id)) { // 使用 globalSelectedIds
                    globalSelectedIds.add(id);
                    addIdTag(id);
                }
            });
        }
        // 如果不符合以上两种格式，则提示用户
        else {
            alert("请输入有效的本子 ID（纯数字或以逗号分隔的数字）。");
        }
        albumIdInput.value = ""; // 清空输入框
    }

    // 获取本子信息
    getAlbumInfoButton.addEventListener("click", function() {
        // 1. 获取输入框的值
        const inputValue = albumIdInput.value.trim();
        // 2. 检查输入框的值是否为空，不为空添加到预选库
        if (inputValue !== "") {
            addIdFromInput();
        }
        loadAlbumInfo();
    });

    function loadAlbumInfo() {
        albumInfoList.innerHTML = ""; // 清空之前的信息
        // 3. 检查预选库是否为空
        if (globalSelectedIds.size === 0) { // 使用 globalSelectedIds
            // alert("请先输入 ID 并添加到预选库！");
            return; // 阻止后续代码执行
        }
        globalSelectedIds.forEach(albumId => { // 使用 globalSelectedIds
            // 创建加载中的占位元素
            const loadingElement = document.createElement("div");
            loadingElement.classList.add("album-info", "loading");
            loadingElement.id = `album-info-${albumId}`; // 添加唯一的 ID
            loadingElement.innerHTML = `<p>正在加载本子 ${albumId} 的信息...</p>`;
            albumInfoList.appendChild(loadingElement);
            fetch(`/get_album_info_api/${albumId}`)
                .then(response => response.json())
                .then(data => {
                    // 获取对应的占位元素
                    const albumInfoElement = document.getElementById(`album-info-${albumId}`);
                    if (!albumInfoElement) return; // 如果元素不存在，则退出
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
                    albumInfoElement.classList.remove("loading"); // 移除 loading class
                    albumInfoElement.dataset.albumId = albumId; // 存储 albumId
                    // 如果该 albumId 之前被选中，则重新选中
                    if (globalSelectedIds.has(albumId)) {
                        albumInfoElement.classList.add('blue', 'gradient', 'selected');
                    }
                    updateSelectedCount();
                    // 添加点击事件监听器

                })
                .catch(error => {
                    // 获取对应的占位元素
                    const albumInfoElement = document.getElementById(`album-info-${albumId}`);
                    if (!albumInfoElement) return; // 如果元素不存在，则退出
                    albumInfoElement.innerHTML = `<p>加载本子 ${albumId} 信息失败。</p>`;
                });
        });
    }

    // 更新选中本子数量
    function updateSelectedCount() {
        selectedCount.textContent = `目前选中的本子数量：${globalSelectedIds.size}`;
    }
    // 点击本子信息卡片
    albumInfoList.addEventListener("click", function(event) {
        console.log("albumInfoList 点击事件触发!"); // 1. 确认事件监听器被触发

        // 检查点击事件是否发生在 album-info 元素上
        const albumInfo = event.target.closest('.album-info');
        if (albumInfo) {
            console.log("点击了 album-info 元素!"); // 2. 确认点击了 album-info

            const albumId = albumInfo.dataset.albumId;
            console.log("Album ID:", albumId); // 3. 确认 albumId 的值

            // 检查点击事件是否发生在封面图片上
            if (event.target.tagName === 'IMG' && event.target.id.startsWith('cover-')) {
                // 点击的是封面图片
                console.log("点击了封面图片!"); // 4. 确认点击了封面图片
                const image_path = './static/covercache'; // 图片文件夹路径
                const image_name = albumId + '.jpg'; // 确保文件名正确
                const mode = 'single';           // 单页阅读模式
                imageView(image_path, image_name, mode);
                return; // 停止执行复选逻辑
            } else {
                console.log("点击的不是封面图片!"); // 5. 确认点击的不是 album-info
            }


            const isSelected = albumInfo.classList.contains('selected');
            if (!isSelected) {
                // 选中流程
                albumInfo.classList.add('blue'); // 1. 变为蓝色
                setTimeout(() => {
                    albumInfo.classList.add('gradient'); // 2. 渐变色侵入
                    setTimeout(() => {
                        albumInfo.classList.add('selected'); // 3. 标记为选中
                        globalSelectedIds.add(albumId);
                        updateSelectedCount();
                    }, 300); // 渐变侵入的过渡时间
                }, 300); // 变为蓝色的过渡时间
            } else {
                // 取消选中流程
                albumInfo.classList.remove('blue', 'gradient', 'selected');
                globalSelectedIds.delete(albumId);
                updateSelectedCount();
            }
        } else {
            console.log("点击的不是 album-info 元素!"); // 6. 确认点击的不是 album-info
        }
    })
    // 下载本子
    downloadButton.addEventListener("click", function() {
        const selectedAlbums = document.querySelectorAll('.album-info.selected');
        // 检查是否有选中的本子
        if (selectedAlbums.length === 0) {
            alert("请选择要下载的本子！");
            return; // 停止执行
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
            if (albumId && !globalSelectedIds.has(albumId)) {
                globalSelectedIds.add(albumId);
                albumInfo.classList.add('blue', 'gradient', 'selected');
            }
        });
        updateSelectedCount();
    });

    document.getElementById('select-none-download').addEventListener('click', function() {
        const albumInfos = document.querySelectorAll('#album-info-list .album-info');
        albumInfos.forEach(albumInfo => {
            const albumId = albumInfo.dataset.albumId;
            if (albumId && globalSelectedIds.has(albumId)) {
                globalSelectedIds.delete(albumId);
                albumInfo.classList.remove('blue', 'gradient', 'selected');
            }
        });
        updateSelectedCount();
    });

    // 页面加载完成后立即更新 selectedCount
    window.addEventListener('load', updateSelectedCount);

    // 导出 addIdTag，不再导出 selectedIds
    return {
        addIdTag: addIdTag
    };
}
