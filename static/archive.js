/*--------------------------------本子库--------------------------------- */
import { imageView } from './imageviewer.js';

let currentPath = './Archive'; // 保存当前路径

function loadArchive(path = './Archive') { // 添加path参数，可以指定加载的目录
    path = path.replace(/\\/g, '/');

    currentPath = path; // 更新当前路径
    const archiveContent = document.getElementById('Library');
    archiveContent.innerHTML = ''; // 清空之前的内容

    // 创建路径显示和返回按钮
    const pathDisplayDiv = document.createElement('div');
    pathDisplayDiv.classList.add('path-display');
    pathDisplayDiv.innerHTML = `
        <span id="current-path">${path}</span>
        <button id="back-button" class="styled-button small">⬆️</button>
        <button id="open-folder-button" class="styled-button small">打开文件夹</button>
    `;
    archiveContent.appendChild(pathDisplayDiv);

    // 为路径添加样式
    const currentPathSpan = document.getElementById('current-path');
    currentPathSpan.style.cssText = `
        font-size: 1.1em;
        color: #b6c6d6;
        text-shadow: 0 0 2px #512e6b, 0 0 4px #6486a1, 0 0 6px #6486a1, 0 0 8px #6486a1;
    `;

    // 打开文件夹按钮事件
    const openFolderButton = document.getElementById('open-folder-button');
    openFolderButton.addEventListener('click', () => {
        // 调用后端 API 打开文件夹
        fetch('/open_folder_api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `folder_path=${encodeURIComponent(currentPath)}`, // 编码 folder_path
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(`打开文件夹失败：${data.error || '未知错误'}`);
            }
        })
        .catch(error => {
            console.error('打开文件夹失败:', error);
            alert('打开文件夹失败，请检查控制台。');
        });
    });

    // 返回按钮事件
    document.getElementById('back-button').addEventListener('click', () => {
        const parentPath = getParentPath(currentPath);
        loadArchive(parentPath);
    });

    // 创建阅读模式选择器
    const readingModeSelectorDiv = document.createElement('div');
    readingModeSelectorDiv.classList.add('reading-mode-selector');
    readingModeSelectorDiv.innerHTML = `
        <label>阅读模式：</label>
        <select id="reading-mode">
            <option value="single">单页模式</option>
            <option value="double">双页模式</option>
            <option value="manga">日漫模式</option>
        </select>
    `;
    archiveContent.appendChild(readingModeSelectorDiv);

    // 从 localStorage 加载阅读模式
    const savedReadingMode = localStorage.getItem('readingMode');
    if (savedReadingMode) {
        const readingModeSelector = readingModeSelectorDiv.querySelector('#reading-mode');
        readingModeSelector.value = savedReadingMode;
    }

    // 添加加载中的提示
    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = '正在加载本子库，请稍候...';
    archiveContent.appendChild(loadingMessage);

    // 调用新的 API 获取目录信息
    fetch(`/get_directory_info_api?path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            archiveContent.innerHTML = ''; // 清空加载提示

            archiveContent.appendChild(pathDisplayDiv); // 重新添加路径显示
            archiveContent.appendChild(readingModeSelectorDiv); // 重新添加阅读模式选择器

            // 重新应用样式
            const currentPathSpan = document.getElementById('current-path');
            currentPathSpan.style.cssText = `
                font-size: 1.1em;
                color: #b6c6d6;
                text-shadow: 0 0 2px #512e6b, 0 0 4px #6486a1, 0 0 6px #6486a1, 0 0 8px #6486a1;
            `;

            if (data.error) {
                archiveContent.innerHTML += `<p>错误：${data.error}</p>`;  // 使用 += 追加错误信息
                return;
            }

            const items = data.items; // 获取目录项
            if (items.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = '这里空空如也……';
                archiveContent.appendChild(emptyMessage);
                return;
            }

            // 创建一个容器来存放所有本子卡片
            const archiveContainer = document.createElement('div');
            archiveContainer.classList.add('archive-container');
            archiveContent.appendChild(archiveContainer);

            items.forEach(item => {
                // 创建本子卡片
                const archiveCard = createArchiveCard(item);
                archiveContainer.appendChild(archiveCard);
            });

            // 添加阅读模式选择器的事件监听器
            const readingModeSelector = archiveContent.querySelector('#reading-mode');
            if (readingModeSelector) {
                readingModeSelector.addEventListener('change', function() {
                    const selectedMode = this.value;
                    console.log("选择的阅读模式：", selectedMode);
                    localStorage.setItem('readingMode', selectedMode);  // 保存到 localStorage
                });
            }
        })
        .catch(error => {
            archiveContent.innerHTML = `<p>加载本子库失败。</p>`;
        });
}



function createArchiveCard(item) {
    const archiveCard = document.createElement('div');
    archiveCard.classList.add('archive-card');

    // 创建一个容器来包含图片/图标和标题
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('archive-card-content');

    if (item.type === 'album') {
        // 创建封面图片
        const coverImage = document.createElement('img');
        findCoverImage(item.path)
            .then(coverImageName => {
                coverImage.src = `/${item.path}/${coverImageName}`;  // 使用 item.path
                coverImage.alt = item.name;
                contentContainer.appendChild(coverImage);
            })
            .catch(() => {
                coverImage.src = '/static/default_cover.jpg'; // 或者其他默认图片
                coverImage.alt = '默认封面';
                contentContainer.appendChild(coverImage);
            });

        // 添加点击事件，打开本子库预览
        archiveCard.addEventListener('click', () => {
            openArchivePreview(item.path); // 使用 item.path
        });
    } else if (item.type === 'folder') {
        // 显示文件夹图标
        const folderIcon = document.createElement('img');
        folderIcon.src = '/static/img/folder_icon.gif'; // 替换为你的文件夹图标路径
        folderIcon.alt = '文件夹';
        contentContainer.appendChild(folderIcon); // 使用 img 标签

        // 添加点击事件，加载文件夹内容
        archiveCard.addEventListener('click', () => {
            loadArchive(item.path); // 加载文件夹内容
        });
    }

    // 创建本子名称/文件夹名称
    const archiveTitle = document.createElement('h3');
    archiveTitle.textContent = item.name;
    contentContainer.appendChild(archiveTitle);

    archiveCard.appendChild(contentContainer);

    return archiveCard;
}



// 修改：异步查找封面图片的函数
async function findCoverImage(archiveName) {
    try {
        const response = await fetch(`/get_image_list_api?image_path=${encodeURIComponent(archiveName)}`);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        const imageList = data;
        const coverImageName = imageList.find(imageName => /^(00000|00001|00002|00003|00004|00005|00006|00007|00008|00009|00010)\.(jpg|jpeg|png|webp|gif)$/i.test(imageName));
        if (coverImageName) {
            return coverImageName;
        } else {
            throw new Error('未找到封面图片');
        }
    } catch (error) {
        console.error('查找封面图片失败:', error);
        throw error; // 抛出错误，让调用者处理
    }
}

// 获取阅读模式选择器
const readingModeSelector = document.getElementById('reading-mode');
function openArchivePreview(archiveName) {
    // 创建预览容器
    const previewContainer = document.createElement('div');
    previewContainer.id = 'archivePreviewContainer';
    previewContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        overflow-y: auto; /* 允许垂直滚动 */
        z-index: 1001; /* 确保在 imageView 之上 */
    `;

    // 添加点击事件监听器，点击容器外部关闭预览
    previewContainer.addEventListener('click', (event) => {
        if (event.target === previewContainer) {
            previewContainer.remove();
        }
    });

    document.body.appendChild(previewContainer);

    // 创建删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除本子';
    deleteButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(255, 0, 0, 0.7);
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1002;
    `;

    // 添加删除按钮点击事件
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止事件冒泡，防止触发预览容器的点击事件
        const confirmation = confirm(`确定要删除本子 "${archiveName}" 吗？`);
        if (confirmation) {
            // 调用后端 API 删除本子
            fetch('/delete_archive_api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `archive_name=${encodeURIComponent(archiveName)}`, // 编码 archiveName
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`本子 "${archiveName}" 删除成功！`);
                    previewContainer.remove(); // 删除预览界面
                    loadArchive(currentPath); // 刷新本子库
                } else {
                    alert(`删除失败：${data.error || '未知错误'}`);
                }
            })
            .catch(error => {
                console.error('删除本子失败:', error);
                alert('删除本子失败，请检查控制台。');
            });
        }
    });

    previewContainer.appendChild(deleteButton);

    // 加载图片列表
    fetch(`/get_image_list_api?image_path=${encodeURIComponent(archiveName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                previewContainer.innerHTML = `<p>错误：${data.error}</p>`;
                return;
            }
            const imageList = data;
            imageList.forEach(imageName => {
                const imageElement = document.createElement('img');
                imageElement.src = `/${archiveName}/${imageName}`;
                imageElement.style.cssText = `
                    width: 150px;
                    height: 200px;
                    object-fit: cover;
                    margin: 5px;
                    cursor: pointer;
                `;
                imageElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    // 从 localStorage 中读取阅读模式
                    const savedReadingMode = localStorage.getItem('readingMode') || 'single'; // 默认值为 'single'

                    const imagePath = archiveName;
                    // 获取预览容器
                    const previewContainer = document.getElementById('archivePreviewContainer');
                    // 1. 隐藏预览容器
                    previewContainer.style.display = 'none';
                    // 2. 显示图片查看器
                    imageView(imagePath, imageName, savedReadingMode, () => {
                        // 3. 在图片查看器关闭后，重新显示预览容器
                        previewContainer.style.display = 'flex';
                    });
                });
                previewContainer.appendChild(imageElement);
            });
        })
        .catch(error => {
            previewContainer.innerHTML = `<p>加载图片列表失败。</p>`;
        });
}


function getParentPath(path) {
    // 将反斜杠替换为正斜杠，确保路径分隔符一致
    path = path.replace(/\\/g, '/');

    if (!path || path === './Archive') return './Archive'; // 已经在根目录

    const parts = path.split('/');
    if (parts.length <= 2 && parts[0] === '.' && parts[1] === 'Archive') {
        return './Archive';  // 如果已经是 ./Archive，则返回根目录
    }
    parts.pop(); // 移除最后一项
    const parentPath = parts.join('/');
    return parentPath ? parentPath : './Archive';  // 如果有父路径，则返回父路径，否则返回根目录
}





// 导出函数
export { loadArchive };
