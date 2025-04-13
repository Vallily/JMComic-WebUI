// imageviewer.js

/**
 * 图片查看器
 */
async function imageView(image_path, image_name, mode, onClose) {
    // 获取图片列表并排序
    let image_list = await getImageList(image_path); // 使用 await

    if (!Array.isArray(image_list)) {
        console.error("image_list 不是一个数组:", image_list);
        alert("获取到的图片列表不是一个数组，请检查 API。");
        return;
    }

    let current_index = image_list.indexOf(image_name);
    console.log("获取图片索引：current_index=", current_index);

    const modal = createModal();
    document.body.appendChild(modal);
    //displayImages(image_path, image_list, current_index, mode);
    switch (mode) {
        case 'vertical':
            displayVerticalImages(image_path, image_list, current_index);
            break;
        default:
            displayImages(image_path, image_list, current_index, mode);
            break;
    }
    addEventListeners(modal, image_path, image_list, current_index, mode, onClose);

    if (onClose) {
        const originalOnClose = onClose;
        onClose = function() {
            image_path = null;
            image_list = null;
            current_index = null;
            mode = null;
            originalOnClose();
        };
    }
}

/**
 * 获取指定文件夹下的图片列表，并按文件名排序
 * @param {string} image_path 图片文件夹路径
 * @returns {string[]}  排序后的图片文件名列表
 */
async function getImageList(image_path) {
    let image_list = [];
    try {
        const response = await fetch(`/get_image_list_api?image_path=${encodeURIComponent(image_path)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error("返回的数据不是一个数组:", data);
            alert("服务器返回的数据不是一个数组，请检查 API。");
            return [];
        }
        image_list = data;
        console.log("成功加载列表：", image_list);
    } catch (error) {
        console.error("获取图片列表失败:", error);
        alert("获取图片列表失败，请检查控制台。");
        return [];
    }
    // 等待 Promise resolve，然后排序并返回
    return image_list.sort((a, b) => {
        const nameA = a.replace(/\.[^/.]+$/, "");
        const nameB = b.replace(/\.[^/.]+$/, "");
        const numA = parseInt(nameA, 10);
        const numB = parseInt(nameB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return nameA.localeCompare(nameB);
    });
}

/**
 * 创建模态框 (Modal)
 * @returns {HTMLElement}  模态框元素
 */
let initialModalHeight = window.innerHeight; // 获取初始窗口高度
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'imageViewerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: flex-start; /* 修改这里，从顶部开始对齐 */
        z-index: 1000; /* 确保在最上层 */
        overflow-y: auto; /* 允许垂直滚动 */
        overflow-x: hidden; /* 隐藏水平滚动 */
    `;
    return modal;
}

/**
 * 添加事件监听器
 * @param {HTMLElement} modal          模态框元素
 * @param {string} image_path     图片文件夹路径
 * @param {string[]} image_list   图片列表
 * @param {number} current_index  当前图片索引
 * @param {string} mode          阅读模式
 */
function addEventListeners(modal, image_path, image_list, current_index, mode, onClose) {
    const keydownHandler = function(event) {
        let next_index = current_index;
        if (mode === 'manga') {
            // 日漫模式，调换左右方向键
            if (event.key === 'ArrowLeft') {
                // 下一张
                next_index = findNearestNextImage(image_list, current_index);
            } else if (event.key === 'ArrowRight') {
                // 上一张
                next_index = findNearestPreviousImage(image_list, current_index);
            }
        } else {
            // 其他模式，保持默认
            if (event.key === 'ArrowLeft') {
                // 上一张
                next_index = findNearestPreviousImage(image_list, current_index);
            } else if (event.key === 'ArrowRight') {
                // 下一张
                next_index = findNearestNextImage(image_list, current_index);
            }
        }

        if (next_index !== current_index) {
            // 只有当图片索引发生变化时才更新显示
            current_index = next_index; // 更新 current_index
            displayImages(image_path, image_list, current_index, mode); // 显示新的图片
        }
    };

    // 左键单击关闭
    const clickHandler = function() {
        modal.remove(); // 移除模态框
        document.removeEventListener('keydown', keydownHandler); // 移除键盘事件监听器
        modal.removeEventListener('click', clickHandler);
        if (onClose) {
            onClose(); // 调用回调函数
        }
    };
    modal.addEventListener('click', clickHandler);

    // 键盘事件
    document.addEventListener('keydown', keydownHandler);

}

function findNearestNextImage(image_list, current_index) {
    if (image_list.length === 0) return -1; // 列表为空
    if (current_index >= image_list.length - 1) return 0; // 已经是最后一张，回到第一张
    return current_index + 1; //  直接返回下一张图片的 index
}
// 辅助函数：查找列表中最接近的上一个图片索引
function findNearestPreviousImage(image_list, current_index) {
    if (image_list.length === 0) return -1; // 列表为空
    if (current_index <= 0) return image_list.length - 1; // 已经是第一张，回到最后一张
    return current_index - 1; // 直接返回上一张图片的 index
}

// 添加一个全局变量，用于存储图片宽度
let verticalModeImageWidth = 800;

/**
 * 在垂直阅读模式下显示图片
 * @param {string} image_path 图片文件夹路径
 * @param {string[]} image_list 图片列表
 * @param {number} startIndex  起始图片索引
 */
async function displayVerticalImages(image_path, image_list, startIndex) {
    const modal = document.getElementById('imageViewerModal');
    modal.innerHTML = ''; // 清空模态框
    // 创建一个容器，用于包裹所有图片
    const verticalContainer = document.createElement('div');
    verticalContainer.id = 'vertical-container'; // 添加 id
    verticalContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 20px;
        padding-bottom: 20px;
        transform-origin: top center;
        position: relative;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
    `;
    // 创建一个 DocumentFragment
    const fragment = document.createDocumentFragment();
    // 加载所有图片
    const imageElements = await Promise.all(
        image_list.map(async (imageName, index) => {
            const img = document.createElement('img');
            img.src = `/${image_path}/${imageName}`;
            img.style.width = `${verticalModeImageWidth}px`;
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${imageName}`);
                    reject();
                };
            });
        })
    );
    // 将图片按顺序添加到 DocumentFragment 中
    imageElements.forEach(img => {
        fragment.appendChild(img);
    });
    // 将 DocumentFragment 添加到 verticalContainer 中
    verticalContainer.appendChild(fragment);
    // 将 verticalContainer 添加到 modal 中
    modal.appendChild(verticalContainer);
    // 计算初始高度
    let initialHeight = verticalContainer.scrollHeight;
    verticalContainer.dataset.initialHeight = initialHeight;
    verticalContainer.style.height = `${initialHeight}px`;
    // 初始缩放比例
    let scale = 1;
    // 获取窗口宽度
    const windowWidth = window.innerWidth;
    // 计算缩放比例的最小值和最大值
    const minScale = (windowWidth * 0.05) / verticalModeImageWidth;
    const maxScale = (windowWidth * 0.8) / verticalModeImageWidth;
    // 添加 Ctrl + 滚轮事件监听器
    modal.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            // 保存滚动位置比例
            const scrollPositionRatio = modal.scrollTop / (modal.scrollHeight - modal.clientHeight);
            // 调整缩放比例
            scale += e.deltaY * -0.0005;
    
            // 限制缩放比例
            scale = Math.min(Math.max(scale, minScale), maxScale);
            console.log("当前缩放比例：", scale);
            // 应用缩放
            verticalContainer.style.transform = `scale(${scale})`;
    
            // 计算 "期望" 的高度
            const scaledHeight = initialHeight * scale;
    
            // 使用 offsetHeight 获取容器的实际高度
            const actualHeight = verticalContainer.offsetHeight;
            console.log("实际高度actualHeight = ", actualHeight, "期望高度 scaledHeight = ", scaledHeight);
    
            // 取两者中的较大值作为容器的高度 (保证滚动条正确)
            //verticalContainer.style.height = `${actualHeight}px`;
            //verticalContainer.style.height = `${scaledHeight}px`;
            
            verticalContainer.style.height = `${Math.min(scaledHeight, actualHeight)}px`;
    
            // 恢复滚动位置比例
            modal.scrollTop = scrollPositionRatio * (modal.scrollHeight - modal.clientHeight);
        }
    });
    
    // 滚动到起始图片
    if (startIndex >= 0 && startIndex < image_list.length) {
        // 等待所有图片加载完成后再滚动
        setTimeout(() => {
            const startImage = imageElements[startIndex];
            if (startImage) {
                startImage.scrollIntoView({
                    behavior: 'auto',
                    block: 'start'
                });
            }
        }, 0);
    }
}

/**
 * 根据模式显示图片
 * @param {string} image_path     图片文件夹路径
 * @param {string[]} image_list   图片列表
 * @param {number} current_index  当前图片索引
 * @param {string} mode          阅读模式
 */
function displayImages(image_path, image_list, current_index, mode) {
    const modal = document.getElementById('imageViewerModal');
    console.log("image_path:", image_path);
    console.log("image_list[current_index]:", image_list[current_index]);
    let image_url_left, image_url_right, image_url;
    let nextImageContainer = document.createElement('div'); // 创建新的容器
    nextImageContainer.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
  `;
    // 创建一个函数来加载图片并返回 Promise
    const loadImage = (url, container) => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => {
                const window_width = window.innerWidth;
                const window_height = window.innerHeight;
                const image_width = img.naturalWidth;
                const image_height = img.naturalHeight;
                let scaled_width = image_width;
                let scaled_height = image_height;
                if (image_width > image_height) {
                    // 横向图
                    scaled_height = window_height; // 高度与窗口对齐
                    scaled_width = image_width * (window_height / image_height); // 宽度等比缩放
                    if (scaled_width > window_width) {
                        // 二次缩放，宽度与窗口对齐
                        scaled_width = window_width;
                        scaled_height = image_height * (window_width / image_width);
                    }
                } else {
                    // 竖向图
                    scaled_height = window_height; // 高度与窗口对齐
                    scaled_width = image_width * (window_height / image_height); // 宽度等比缩放
                }
                img.width = scaled_width;
                img.height = scaled_height;
                console.log("图片加载完成，尺寸：", img.width, img.height, "URL:", url); // 添加日志
                resolve({width: img.width, height: img.height, isLandscape: image_width > image_height, img: img}); // 图片加载完成，返回图片尺寸和是否横向图
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image at ${url}`));
            };
            img.src = url;
        });
    };
    // 根据模式加载图片
    const loadImagesBasedOnMode = async () => {
        let container; // 声明容器变量
        const fragment = document.createDocumentFragment(); // 创建 DocumentFragment
        if (mode === 'single') {
            image_url = `${image_path}/${image_list[current_index]}`;
            container = nextImageContainer; // 使用主容器
            try {
                const imageInfo = await loadImage(image_url, fragment); // 加载图片到 fragment
                fragment.appendChild(imageInfo.img);
            } catch (error) {
                console.error("图片加载失败:", error);
                alert("图片加载失败，请查看控制台。");
                return;
            }
        } else if (mode === 'double' || mode === 'manga') { // 双页模式 和 日漫模式
            // 获取当前图片和下一张图片的 URL
            let image_url_current = `${image_path}/${image_list[current_index]}`;
            let image_url_next = `${image_path}/${image_list[current_index + 1] || image_list[0]}`;
            // 用于判断当前图片是横向还是纵向
            let currentImageInfo, nextImageInfo;
            // 加载当前图片信息
            container = document.createElement('div');
            container.style.cssText = `
              display: flex;
              justify-content: center;
              align-items: center;
            `;
            try {
                currentImageInfo = await new Promise((resolve, reject) => {
                    const img = document.createElement('img');
                    img.onload = () => {
                        const isLandscape = img.naturalWidth > img.naturalHeight;
                        resolve({isLandscape: isLandscape, url: image_url_current, img: img});
                    };
                    img.onerror = () => {
                        reject(new Error(`Failed to load image at ${image_url_current}`));
                    };
                    img.src = image_url_current;
                });
            } catch (error) {
                console.error("图片加载失败:", error);
                alert("图片加载失败，请查看控制台。");
                return; // 停止加载
            }
            // 加载下一张图片信息
            try {
                nextImageInfo = await new Promise((resolve, reject) => {
                    const img = document.createElement('img');
                    img.onload = () => {
                        const isLandscape = img.naturalWidth > img.naturalHeight;
                        resolve({isLandscape: isLandscape, url: image_url_next, img: img});
                    };
                    img.onerror = () => {
                        reject(new Error(`Failed to load image at ${image_url_next}`));
                    };
                    img.src = image_url_next;
                });
            } catch (error) {
                console.error("图片加载失败:", error);
                alert("图片加载失败，请查看控制台。");
                return; // 停止加载
            }
            if (currentImageInfo && nextImageInfo) {
                // 判断是否应该使用单页模式
                if (currentImageInfo.isLandscape || nextImageInfo.isLandscape) {
                    // 当前图片是横向图，或者下一张图片是横向图，使用单页模式
                    try {
                        const imageInfo = await loadImage(currentImageInfo.url, fragment); // 加载图片到 fragment
                        fragment.appendChild(imageInfo.img);
                    } catch (error) {
                        console.error("图片加载失败:", error);
                        alert("图片加载失败，请查看控制台。");
                        return;
                    }
                } else {
                    // 只有当前图片和下一张图片都不是横向图时，才使用双页模式
                    let image_url_left, image_url_right;
                    if (mode === 'double') {
                        image_url_left = currentImageInfo.url;
                        image_url_right = nextImageInfo.url;
                    } else { // manga
                        image_url_left = nextImageInfo.url; // 左边是下一张
                        image_url_right = currentImageInfo.url; // 右边是当前图片
                    }
                    try {
                        const leftImageInfo = await loadImage(image_url_left, fragment); // 加载图片到 fragment
                        fragment.appendChild(leftImageInfo.img);
                        console.log("左侧（当前图片/下一张图片）加载完成，加载右侧（下一张图片/当前图片）");
                        const rightImageInfo = await loadImage(image_url_right, fragment); // 加载图片到 fragment
                        fragment.appendChild(rightImageInfo.img);
                        console.log("右侧（下一张图片/当前图片）加载完成");
                    } catch (error) {
                        console.error("图片加载失败:", error);
                        alert("图片加载失败，请查看控制台。");
                        return; // 停止加载
                    }
                }
            }
            nextImageContainer.appendChild(container);
        }
        container.appendChild(fragment); // 将 DocumentFragment 添加到容器中
    };
    // 先加载图片，完成后再切换
    loadImagesBasedOnMode()
        .then(() => {
            // 图片加载完成后，删除旧的图片，添加新的图片
            modal.innerHTML = ''; // 清空模态框内容
            modal.appendChild(nextImageContainer); // 添加新的图片
        })
        .catch(error => {
            console.error("Error loading images:", error);
            alert("Error loading images. Please check the console.");
        });
}

//导出函数
export { imageView };
