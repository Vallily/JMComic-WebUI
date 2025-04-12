// imageviewer.js

/**
 * 图片查看器
 */
function imageView(image_path, image_name, mode, onClose) {
  //console.log("imageView 函数被调用!"); // 添加的日志 1
  //console.log("image_path:", image_path); // 添加的日志 2
  //console.log("image_name:", image_name); // 添加的日志 3
  //console.log("mode:", mode); // 添加的日志 4
  // 1. 获取图片列表并排序
  let image_list = getImageList(image_path);
  // console.log("获取图片列表并排序：", image_list);
  let current_index = image_list.indexOf(image_name); // 直接使用 image_name，它已经包含 ".jpg"
  console.log("获取图片索引：current_index=", current_index);
  // 2. 创建模态框 (Modal)
  const modal = createModal();
  document.body.appendChild(modal); //重要，将该图片查看器添加在body的末尾
  // 3. 根据模式显示图片
  displayImages(image_path, image_list, current_index, mode);
  // 4. 添加事件监听器
  addEventListeners(modal, image_path, image_list, current_index, mode, onClose);

  // 修改：在关闭时清除变量
  if (onClose) {
      const originalOnClose = onClose; // 保存原始的 onClose 函数
      onClose = function() {
          image_path = null;
          image_list = null;
          current_index = null;
          mode = null;
          originalOnClose(); // 调用原始的 onClose 函数
      };
  }
}


/**
 * 获取指定文件夹下的图片列表，并按文件名排序
 * @param {string} image_path 图片文件夹路径
 * @returns {string[]}  排序后的图片文件名列表
 */
function getImageList(image_path) {
  // 使用 AJAX 从服务器获取图片列表
  let image_list = [];
  //由于是同步请求，会阻塞UI线程，影响用户体验
  $.ajax({
      type: "GET",
      url: `/get_image_list_api?image_path=${image_path}`, //  API 端点
      async: false, // 同步请求
      dataType: "json",
      success: function(data) {
          image_list = data;
          console.log("成功加载列表：", image_list);
      },
      error: function(xhr, status, error) {
          console.error("获取图片列表失败:", error);
          alert("获取图片列表失败，请检查控制台。");
      }
  });
  //console.log(image_list)
  return image_list.sort((a, b) => {
      const numA = parseInt(a.replace(".jpg", ""));
      const numB = parseInt(b.replace(".jpg", ""));
      return numA - numB;
  });
}


/**
 * 创建模态框 (Modal)
 * @returns {HTMLElement}  模态框元素
 */
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
      align-items: center;
      z-index: 1000; /* 确保在最上层 */
  `;
  return modal;
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
                  if (image_width > window_width) {
                      scaled_width = window_width;
                      scaled_height = image_height * (window_width / image_width);
                  }
              } else {
                  // 竖向图
                  if (image_height > window_height) {
                      scaled_height = window_height;
                      scaled_width = image_width * (window_height / image_height);
                  }
              }

              img.width = scaled_width;
              img.height = scaled_height;
              container.appendChild(img);
              console.log("图片加载完成，尺寸：", img.width, img.height, "URL:", url); // 添加日志
              resolve({width: img.width, height: img.height}); // 图片加载完成，返回图片尺寸
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
      if (mode === 'single') {
          image_url = `${image_path}/${image_list[current_index]}`;
          container = nextImageContainer; // 使用主容器
          await loadImage(image_url, container);
      } else if (mode === 'double') { // 双页模式
          image_url_left = `${image_path}/${image_list[current_index]}`;
          image_url_right = `${image_path}/${image_list[current_index + 1] || image_list[0]}`;

          container = document.createElement('div');
          container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
        `;

          try {
              await loadImage(image_url_left, container);
              console.log("左侧（当前图片）加载完成，加载右侧（下一张图片）");
              await loadImage(image_url_right, container);
              console.log("右侧（下一张图片）加载完成");
          } catch (error) {
              console.error("图片加载失败:", error);
              alert("图片加载失败，请查看控制台。");
              return; // 停止加载
          }

          console.log("双页模式，图片加载完成");
          nextImageContainer.appendChild(container);
      } else if (mode === 'manga') { // 日漫模式
          image_url_left = `${image_path}/${image_list[current_index + 1] || image_list[0]}`; // 左边是下一张
          image_url_right = `${image_path}/${image_list[current_index]}`; // 右边是当前图片
          console.log("正在以日漫模式加载图片，左侧图片：", current_index + 1, "右侧图片：", current_index);

          container = document.createElement('div');
          container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
        `;

          try {
              await loadImage(image_url_left, container);
              console.log("左侧（下一张图片）加载完成，加载右侧（当前图片）");
              await loadImage(image_url_right, container);
              console.log("右侧（当前图片）加载完成");
          } catch (error) {
              console.error("图片加载失败:", error);
              alert("图片加载失败，请查看控制台。");
              return; // 停止加载
          }

          console.log("日漫模式，图片加载完成");
          nextImageContainer.appendChild(container);
      }
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








/**
 * 创建图片元素，并进行缩放处理
 * @param {string} image_url  图片 URL
 * @param {number} scaled_width  缩放后的宽度
 * @param {number} scaled_height 缩放后的高度
 * @returns {HTMLElement}  图片元素
 */
// 创建图片并添加到容器的辅助函数
function createImageAndAppend(image_url, container) {
  const img = document.createElement('img');
  img.onload = function() {
      const window_width = window.innerWidth;
      const window_height = window.innerHeight;
      const image_width = img.naturalWidth;
      const image_height = img.naturalHeight;
      let scaled_width = image_width;
      let scaled_height = image_height;
      if (image_width > image_height) {
          // 横向图
          if (image_width > window_width) {
              scaled_width = window_width;
              scaled_height = image_height * (window_width / image_width);
          }
      } else {
          // 竖向图
          if (image_height > window_height) {
              scaled_height = window_height;
              scaled_width = image_width * (window_height / image_height);
          }
      }
      img.width = scaled_width;
      img.height = scaled_height;
      // 在缩放完成后再添加到容器中
      container.appendChild(img);
  };
  img.src = image_url;
  return img;
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
//导出函数
export { imageView };
