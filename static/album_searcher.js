// album_searcher.js
import { openTab } from './script.js';
export function setupSearcher(globalSelectedIds, downloader) {
    console.log("setupSearcher called with globalSelectedIds:", globalSelectedIds); // 添加这行
    // 获取搜索相关的元素
    const searchQueryInput = document.getElementById("search_query");
    const searchButton = document.getElementById("search-button");
    const searchResultsList = document.getElementById("search-results-list");
    const addToPreviewButton = document.getElementById("add-to-preview-button");
    const paginationContainer = document.getElementById('pagination'); // 获取分页容器
    const loadingMessage = document.getElementById('loading-message'); // 获取加载信息元素
    const searchSelectedCount = document.getElementById("search-selected-count"); // 获取搜索页面统计数量的元素

    let allSearchResults = []; // 存储所有搜索结果
    let currentSearchQuery = ""; // 存储当前的搜索关键词
    let selectedSearchIds = new Set(); // 保存搜索页选中的 albumId


    // 搜索本子
    searchButton.addEventListener("click", function() {
        const searchQuery = searchQueryInput.value.trim();
        if (searchQuery === "") {
            alert("请输入搜索关键词！");
            return;
        }
        // 重置所有搜索结果和当前搜索关键词
        allSearchResults = [];
        currentSearchQuery = searchQuery;
        fetchSearchResults(searchQuery, 1, true); // 初始加载第一页，并标记为首次搜索
    });


    // 更新搜索页面选中本子数量
    function updateSearchSelectedCount() {
        searchSelectedCount.textContent = `目前选中的本子数量： ${globalSelectedIds.size} `;
    }

    // 获取搜索结果
    function fetchSearchResults(searchQuery, page, isFirstSearch = false) {
        // 显示加载信息
        loadingMessage.style.display = 'block';
        // 清空之前的搜索结果
        searchResultsList.innerHTML = "";
        paginationContainer.innerHTML = ''; // 清空之前的分页按钮
        if (isFirstSearch) {
            // 首次搜索，从 API 获取所有结果
            fetch(`/search_album_api?query=${searchQuery}&page=1`) // 获取第一页，后端返回所有结果
                .then(response => response.json())
                .then(data => {
                    // 隐藏加载信息
                    loadingMessage.style.display = 'none';
                    if (data.error) {
                        searchResultsList.innerHTML = `<p>错误：${data.error}</p>`;
                        return;
                    }
                    allSearchResults = data.albums; // 存储所有搜索结果
                    displaySearchResults(getAlbumsForPage(allSearchResults, page));
                    displayPagination(data.total_pages, page, searchQuery);
                    updateSearchSelectedCount(); // 更新搜索页面统计数量
                })
                .catch(error => {
                    // 隐藏加载信息
                    loadingMessage.style.display = 'none';
                    searchResultsList.innerHTML = `<p>搜索失败。</p>`;
                });
        } else {
            // 非首次搜索，直接从 allSearchResults 中获取对应页面的数据
            loadingMessage.style.display = 'none'; // 立即隐藏加载信息
            displaySearchResults(getAlbumsForPage(allSearchResults, page));
            displayPagination(Math.ceil(allSearchResults.length / 20), page, searchQuery); // 重新计算总页数
            updateSearchSelectedCount(); // 更新搜索页面统计数量
        }
    }

    // 获取指定页面的本子
    function getAlbumsForPage(albums, page) {
        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        return albums.slice(startIndex, endIndex);
    }
    // 显示搜索结果
    function displaySearchResults(albums) {
        searchResultsList.innerHTML = ""; // 清空之前的搜索结果
        albums.forEach(result => {
            const albumId = result.album_id;
            const searchResultItem = document.createElement("div");
            searchResultItem.classList.add("search-result-item");
            searchResultItem.dataset.albumId = albumId; // 存储 albumId
            searchResultItem.innerHTML = `<h3>${result.title}</h3>`;
            // 检查该本子是否已经在 globalSelectedIds 中
            if (globalSelectedIds.has(albumId)) {
                searchResultItem.classList.add('blue', 'gradient', 'selected');
            }
            // 添加点击事件，实现选中效果
            searchResultItem.addEventListener("click", function() {
                const isSelected = searchResultItem.classList.contains('selected');
                const albumId = searchResultItem.dataset.albumId;
                console.log(`searchResultItem ${albumId} clicked, isSelected:`, isSelected); // 添加这行

                if (!isSelected) {
                    // 选中流程
                    searchResultItem.classList.add('blue'); // 1. 变为蓝色
                    setTimeout(() => {
                        searchResultItem.classList.add('gradient'); // 2. 渐变色侵入
                        setTimeout(() => {
                            searchResultItem.classList.add('selected'); // 3. 标记为选中
                            globalSelectedIds.add(albumId);
                            console.log(`Added ${albumId} to globalSelectedIds`); // 添加这行
                            updateSearchSelectedCount(); // 更新搜索页面统计数量
                        }, 300); // 渐变侵入的过渡时间
                    }, 300); // 变为蓝色的过渡时间
                } else {
                    // 取消选中流程
                    searchResultItem.classList.remove('blue', 'gradient', 'selected');
                    globalSelectedIds.delete(albumId);
                    console.log(`Removed ${albumId} from globalSelectedIds`); // 添加这行
                    updateSearchSelectedCount(); // 更新搜索页面统计数量
                }
            });

            searchResultsList.appendChild(searchResultItem);
        });
    }

    // 显示分页
    function displayPagination(totalPages, currentPage, searchQuery) {
        paginationContainer.innerHTML = ''; // 清空之前的分页按钮
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                fetchSearchResults(searchQuery, i, false); // 点击按钮时加载对应页面的结果，标记为非首次搜索
            });
            if (i === currentPage) {
                pageButton.classList.add('active'); // 标记当前页
            }
            paginationContainer.appendChild(pageButton);
        }
    }
    // 添加到预选库
    addToPreviewButton.addEventListener("click", function() {
        console.log("addToPreviewButton clicked"); // 添加这行
        console.log("globalSelectedIds before adding:", globalSelectedIds); // 添加这行

        // 1. 将 globalSelectedIds 中的所有 ID 添加到预选库
        globalSelectedIds.forEach(albumId => {
            downloader.addIdTag(albumId); // 添加 ID 标签到预选库
            console.log(`Added ${albumId} to downloader preview`); // 添加这行
        });

        // 2. 清空搜索页面选中的本子 (selectedSearchIds 和 visual state)
        const searchResultItems = document.querySelectorAll('.search-result-item.selected');
        searchResultItems.forEach(item => {
            const albumId = item.dataset.albumId;
            item.classList.remove('blue', 'gradient', 'selected');
        });
        selectedSearchIds.clear();


        // 3. 更新搜索页面统计数量
        updateSearchSelectedCount();
        console.log("globalSelectedIds after adding to preview:", globalSelectedIds); // 添加这行

        // 4. 切换到 "本子下载" 标签页
        openTab(event, 'Download');
    });

    /*---------------------- 全选/全不选 功能 ------------------------*/
    // 搜索页面全选/全不选 (当前页)
    document.getElementById('select-all-search').addEventListener('click', function() {
        const searchResults = document.querySelectorAll('#search-results-list .search-result-item');
        searchResults.forEach(searchResult => {
            const albumId = searchResult.dataset.albumId;
            if (albumId && !globalSelectedIds.has(albumId)) {
                globalSelectedIds.add(albumId);
                searchResult.classList.add('blue', 'gradient', 'selected');
            }
        });
        updateSearchSelectedCount();
    });

    document.getElementById('select-none-search').addEventListener('click', function() {
        const searchResults = document.querySelectorAll('#search-results-list .search-result-item');
        searchResults.forEach(searchResult => {
            const albumId = searchResult.dataset.albumId;
            if (albumId && globalSelectedIds.has(albumId)) {
                globalSelectedIds.delete(albumId);
                searchResult.classList.remove('blue', 'gradient', 'selected');
            }
        });
        updateSearchSelectedCount();
    });
    // 页面加载完成后立即更新 selectedCount
    window.addEventListener('load', updateSearchSelectedCount);
}
