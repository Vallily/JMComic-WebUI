// album_searcher.js
import { openTab } from './script.js';

export function setupSearcher(globalSelectedIds, downloader) {
    console.log("setupSearcher called with globalSelectedIds:", globalSelectedIds);

    // 获取搜索相关的元素
    const searchQueryInput = document.getElementById("search_query");
    const searchButton = document.getElementById("search-button");
    const searchResultsList = document.getElementById("search-results-list");
    const addToPreviewButton = document.getElementById("add-to-preview-button");
    const paginationContainer = document.getElementById('pagination');
    const loadingMessage = document.getElementById('loading-message');
    const searchSelectedCount = document.getElementById("search-selected-count");

    let allSearchResults = [];
    let currentSearchQuery = "";
    let selectedIds = new Set(); // 提升 selectedIds 的作用域, 改为Set

    // 搜索本子
    searchButton.addEventListener("click", function() {
        const searchQuery = searchQueryInput.value.trim();
        if (searchQuery === "") {
            alert("请输入搜索关键词！");
            return;
        }
        allSearchResults = [];
        currentSearchQuery = searchQuery;
        // 清空 selectedIds Set
        selectedIds.clear();
        fetchSearchResults(searchQuery, 1, true);
    });

    // 更新搜索页面选中本子数量
    function updateSearchSelectedCount() {
        searchSelectedCount.textContent = `目前选中的本子数量： ${selectedIds.size} `; // 修改这里
    }

    // 获取搜索结果
    function fetchSearchResults(searchQuery, page, isFirstSearch = false) {
        loadingMessage.style.display = 'block';
        searchResultsList.innerHTML = "";
        paginationContainer.innerHTML = '';
        if (isFirstSearch) {
            fetch(`/search_album_api?query=${searchQuery}&page=1`)
                .then(response => response.json())
                .then(data => {
                    loadingMessage.style.display = 'none';
                    if (data.error) {
                        searchResultsList.innerHTML = `<p>错误：${data.error}</p>`;
                        return;
                    }
                    allSearchResults = data.albums;
                    displaySearchResults(getAlbumsForPage(allSearchResults, page));
                    displayPagination(data.total_pages, page, searchQuery);
                    updateSearchSelectedCount();
                })
                .catch(error => {
                    loadingMessage.style.display = 'none';
                    searchResultsList.innerHTML = `<p>搜索失败。</p>`;
                });
        } else {
            loadingMessage.style.display = 'none';
            displaySearchResults(getAlbumsForPage(allSearchResults, page));
            displayPagination(Math.ceil(allSearchResults.length / 20), page, searchQuery);
            updateSearchSelectedCount();
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
        searchResultsList.innerHTML = "";
        albums.forEach(result => {
            const albumId = result.album_id;
            const searchResultItem = document.createElement("div");
            searchResultItem.classList.add("search-result-item");
            searchResultItem.dataset.albumId = albumId;
            searchResultItem.innerHTML = `<h3>${result.title}</h3>`;

            // 检查该本子是否已经在 selectedIds 中 (注意，这里也要修改！)
            if (selectedIds.has(albumId)) {
                searchResultItem.classList.add('blue', 'gradient', 'selected');
            }

            searchResultItem.addEventListener("click", function() {
                const isSelected = searchResultItem.classList.contains('selected');
                const albumId = searchResultItem.dataset.albumId;
                console.log(`searchResultItem ${albumId} clicked, isSelected:`, isSelected);

                if (!isSelected) {
                    searchResultItem.classList.add('blue');
                    setTimeout(() => {
                        searchResultItem.classList.add('gradient');
                        setTimeout(() => {
                            searchResultItem.classList.add('selected');
                            console.log(`Added ${albumId} to selectedIds`);
                            selectedIds.add(albumId); // 将 albumId 添加到 selectedIds
                            updateSearchSelectedCount();
                        }, 300);
                    }, 300);
                } else {
                    searchResultItem.classList.remove('blue', 'gradient', 'selected');
                    // globalSelectedIds.delete(albumId); // 不再直接修改 globalSelectedIds
                    console.log(`Removed ${albumId} from selectedIds`);
                    selectedIds.delete(albumId); // 将 albumId 从 selectedIds 中移除
                    updateSearchSelectedCount();
                }
            });

            searchResultsList.appendChild(searchResultItem);
        });
    }

    // 显示分页
    function displayPagination(totalPages, currentPage, searchQuery) {
        paginationContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                fetchSearchResults(searchQuery, i, false);
            });
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationContainer.appendChild(pageButton);
        }
    }

    // 添加到预选库
    addToPreviewButton.addEventListener("click", function(event) {
        console.log("addToPreviewButton clicked");
        console.log("globalSelectedIds before adding:", globalSelectedIds);
        console.log("当前选中的ID：", selectedIds);

        // const searchResultItems = document.querySelectorAll('.search-result-item.selected');
        // const selectedIds = Array.from(searchResultItems).map(item => item.dataset.albumId);
        // console.log("当前选中的ID：", selectedIds);

        console.log("当前将添加的ID：", selectedIds);
        selectedIds.forEach(albumId => {
            // 添加重复检测
            if (!globalSelectedIds.has(albumId)) {
                globalSelectedIds.add(albumId);
                downloader.addIdTag(albumId);
                console.log(`添加了的ID: ${albumId}`);
            } else {
                console.log(`ID ${albumId} 已存在，跳过添加`);
            }
        });

        // 清空 visual state
        const searchResultItems = document.querySelectorAll('.search-result-item.selected');
        searchResultItems.forEach(item => {
            item.classList.remove('blue', 'gradient', 'selected');
        });

        selectedIds.clear(); // 使用clear()方法来清空Set
        console.log("选择ID清空，目前ID库：", selectedIds);

        updateSearchSelectedCount();
        console.log("globalSelectedIds after adding to preview:", globalSelectedIds);

        openTab(event, 'Download');
    });

/*---------------------- 全选/全不选 功能 ------------------------*/
    // 搜索页面全选/全不选 (当前页)
    document.getElementById('select-all-search').addEventListener('click', function() {
        const searchResults = document.querySelectorAll('#search-results-list .search-result-item');
        searchResults.forEach(searchResult => {
            const albumId = searchResult.dataset.albumId;
            if (albumId && !selectedIds.has(albumId)) { // 修改这里
                // globalSelectedIds.add(albumId); // 不再直接修改 globalSelectedIds
                selectedIds.add(albumId); // 将 albumId 添加到 selectedIds
                searchResult.classList.add('blue', 'gradient', 'selected');
            }
        });
        updateSearchSelectedCount();
    });

    document.getElementById('select-none-search').addEventListener('click', function() {
        // 直接清空 selectedIds
        selectedIds.clear();

        // 移除所有 search-result-item 的选中样式
        const searchResults = document.querySelectorAll('#search-results-list .search-result-item');
        searchResults.forEach(searchResult => {
            searchResult.classList.remove('blue', 'gradient', 'selected');
        });

        updateSearchSelectedCount();
    });

    // 页面加载完成后立即更新 selectedCount
    window.addEventListener('load', updateSearchSelectedCount);
}

