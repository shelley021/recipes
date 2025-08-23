let cachedRecipes = null;
let currentFilteredList = [];
let currentPage = 1;
const itemsPerPage = 20;

// 辅助函数：判断菜谱是否有有效的做法
function hasValidDirections(recipe) {
    return recipe.directions && 
           !recipe.directions.includes('未能自动找到做法') &&
           !recipe.directions.includes('抓取失败') &&
           !recipe.directions.includes('已跳过');
}

async function searchRecipes() {
    currentPage = 1;
    const keyword = document.getElementById('search').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '正在从网络获取菜谱数据并搜索，请稍候...';
    
    document.getElementById('pagination').innerHTML = '';

    try {
        if (!cachedRecipes) {
            const dataUrl = 'https://raw.githubusercontent.com/shelley021/recipes/main/API/public/final_recipes_with_directions.json';
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`在线数据文件加载失败 (${response.status})，请检查网络连接。`);
            }
            cachedRecipes = await response.json();
        }
        
        const recipes = cachedRecipes;
        const ingredients = keyword.split(/[ \/\-,]+/).filter(Boolean);

        if (ingredients.length === 0) {
            resultsDiv.innerHTML = '请输入至少一种食材进行搜索。';
            return;
        }

        let filteredRecipes = recipes.filter(recipe =>
            ingredients.every(ing =>
                (recipe.name && recipe.name.toLowerCase().includes(ing)) ||
                (recipe.ingredients && recipe.ingredients.toLowerCase().includes(ing))
            )
        );

        if (filteredRecipes.length === 0) {
            resultsDiv.innerHTML = '未找到包含所有指定食材的菜谱。';
            return;
        }

        filteredRecipes.sort((a, b) => {
            const aHasDirections = hasValidDirections(a);
            const bHasDirections = hasValidDirections(b);
            if (aHasDirections === bHasDirections) return 0;
            return bHasDirections - aHasDirections;
        });

        currentFilteredList = filteredRecipes;
        renderList(currentFilteredList, currentPage);

    } catch (error) {
        resultsDiv.innerHTML = `出现错误: ${error.message}`;
        console.error(error);
    }
}

function renderList(list, page) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
    currentPage = Math.min(Math.max(1, page), totalPages);
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageRecipes = list.slice(start, end);

    pageRecipes.forEach(recipe => {
        const div = document.createElement('div');
        div.className = 'recipe';
        const title = document.createElement('h3');
        title.textContent = recipe.name || '无标题菜谱';
        div.appendChild(title);
        if (recipe.image) {
            const img = document.createElement('img');
            img.alt = recipe.name || '';
            img.src = recipe.image;
            div.appendChild(img);
        }
        const p = document.createElement('p');
        p.style.flexGrow = '1';
        const lines = (recipe.ingredients || '').split('\n').slice(0, 3);
        p.innerHTML = `<b>材料:</b><br>${lines.join('<br>')}`;
        div.appendChild(p);
        const buttonContainer = document.createElement('div');
        const directionsBtn = document.createElement('button');
        directionsBtn.textContent = '查看做法';
        directionsBtn.onclick = () => showDirectionsModal(recipe);
        buttonContainer.appendChild(directionsBtn);
        div.appendChild(buttonContainer);
        resultsDiv.appendChild(div);
    });

    renderPagination(totalPages, currentPage);
}

// ... showDirectionsModal 和 closeModal 函数保持不变 ...
let activeModal = null;
const handleEscKey = (e) => {
    if (e.key === 'Escape' && activeModal) {
        closeModal(activeModal);
    }
};

function showDirectionsModal(recipe) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    };
    activeModal = overlay;

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'modal-controls';

    const maximizeBtn = document.createElement('button');
    maximizeBtn.innerHTML = '&#9633;';
    maximizeBtn.title = '切换尺寸';
    maximizeBtn.className = 'modal-btn';
    maximizeBtn.onclick = () => {
        modal.classList.toggle('modal-content-maximized');
    };
    controlsDiv.appendChild(maximizeBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = '关闭';
    closeBtn.className = 'modal-btn';
    closeBtn.onclick = () => closeModal(overlay);
    controlsDiv.appendChild(closeBtn);
    
    modal.appendChild(controlsDiv);

    const title = document.createElement('h2');
    title.textContent = recipe.name || '无标题菜谱';
    modal.appendChild(title);
    if (recipe.image) {
        const img = document.createElement('img');
        img.src = recipe.image;
        img.alt = recipe.name || '';
        modal.appendChild(img);
    }
    
    const ingredientsTitle = document.createElement('h3');
    ingredientsTitle.textContent = '详细材料 (Ingredients)';
    modal.appendChild(ingredientsTitle);
    
    const ingredientsDiv = document.createElement('div');
    const ingredientsList = (recipe.ingredients || '暂无材料信息').split('\n').filter(line => line.trim() !== '').map(line => `<li>${line.trim()}</li>`).join('');
    ingredientsDiv.innerHTML = `<ol style="padding-left: 20px;">${ingredientsList}</ol>`;
    modal.appendChild(ingredientsDiv);

    const directionsTitle = document.createElement('h3');
    directionsTitle.textContent = '详细做法 (Directions)';
    modal.appendChild(directionsTitle);
    
    const directionsDiv = document.createElement('div');
    if (hasValidDirections(recipe)) {
        const sentences = recipe.directions.match(/[^.!?]+[.!?]+/g) || [recipe.directions];
        directionsDiv.innerHTML = sentences.map(s => s.trim()).join('<br><br>');
    } else {
        directionsDiv.innerHTML = '抱歉，该菜谱的做法未能自动获取。';
    }
    modal.appendChild(directionsDiv);

    if (recipe.url) {
        const detailsLink = document.createElement('a');
        detailsLink.href = recipe.url;
        detailsLink.target = '_blank';
        detailsLink.textContent = '查看原始网页（尊重版权）';
        detailsLink.style.display = 'block';
        detailsLink.style.marginTop = '20px';
        modal.appendChild(detailsLink);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscKey);
}

function closeModal(overlay) {
    document.body.removeChild(overlay);
    document.body.style.overflow = 'auto';
    activeModal = null;
    document.removeEventListener('keydown', handleEscKey);
}


function renderPagination(totalPages, cur) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.textContent = '上一页';
    prev.disabled = cur === 1;
    prev.onclick = () => renderList(currentFilteredList, cur - 1);
    paginationDiv.appendChild(prev);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` 第 ${cur} / ${totalPages} 页 `;
    paginationDiv.appendChild(pageInfo);

    const next = document.createElement('button');
    next.textContent = '下一页';
    next.disabled = cur === totalPages;
    next.onclick = () => renderList(currentFilteredList, cur + 1);
    paginationDiv.appendChild(next);
    
    const jumpContainer = document.createElement('span');
    jumpContainer.style.marginLeft = '10px';
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.value = cur;
    pageInput.style.width = '60px';
    pageInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            jumpToPage();
        }
    };
    jumpContainer.appendChild(pageInput);
    
    const jumpBtn = document.createElement('button');
    jumpBtn.textContent = '跳转';
    
    const jumpToPage = () => {
        const page = parseInt(pageInput.value, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            renderList(currentFilteredList, page);
        } else {
            alert(`请输入1到${totalPages}之间的有效页码`);
            pageInput.value = cur;
        }
    };

    jumpBtn.onclick = jumpToPage;
    jumpContainer.appendChild(jumpBtn);
    
    // --- 核心修改：确保将 jumpContainer 添加到 paginationDiv ---
    paginationDiv.appendChild(jumpContainer);
}