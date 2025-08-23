import React, { useState, useEffect } from 'react';

// 将CSS样式直接写在JS文件中，这是React的常见做法
const styles = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f4f7f6; margin: 0; padding: 20px; }
  .search-container { margin-bottom: 20px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
  #search { padding: 10px; width: 250px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
  .results { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 15px; justify-content: center; }
  .recipe { border: 1px solid #ddd; padding: 15px; background: white; width: 300px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius: 8px; display: flex; flex-direction: column; transition: transform 0.2s; }
  .recipe:hover { transform: translateY(-5px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .recipe h3 { margin-top: 0; color: #333; }
  .recipe img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; }
  .recipe p { flex-grow: 1; color: #555; font-size: 14px; }
  button { padding: 8px 15px; margin: 0 5px; cursor: pointer; border: none; background-color: #007bff; color: white; border-radius: 4px; font-size: 14px; transition: background-color 0.2s; }
  button:hover { background-color: #0056b3; }
  button:disabled { background-color: #ccc; cursor: not-allowed; }
  .pagination { margin-top: 20px; width: 100%; text-align: center; }
  .pagination span, .pagination input { margin: 0 5px; }
  .pagination input { padding: 5px; width: 50px; text-align: center; }
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 1000; display: flex; justify-content: center; align-items: center; }
  .modal-content { background: white; padding: 25px; border-radius: 8px; max-width: 90%; width: 700px; max-height: 85%; overflow-y: auto; position: relative; line-height: 1.6; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: width 0.3s, height 0.3s; }
  .modal-content-maximized { width: 95%; max-width: 95%; height: 95%; max-height: 95%; }
  .modal-content h2 { margin-top: 0; color: #333; padding-right: 70px; }
  .modal-content h3 { margin-top: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; color: #007bff; }
  .modal-content img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px; }
  .modal-controls { position: absolute; top: 10px; right: 15px; display: flex; gap: 10px; }
  .modal-btn { cursor: pointer; background: #e0e0e0; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; line-height: 30px; text-align: center; color: #555; }
  .modal-btn:hover { background: #d0d0d0; }
`;

function App() {
    const [allRecipes, setAllRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [status, setStatus] = useState('请搜索菜谱');
    const [isLoading, setIsLoading] = useState(true);

    // useEffect 会在组件第一次加载时运行一次，用于获取数据
    useEffect(() => {
        const dataUrl = 'https://raw.githubusercontent.com/shelley021/recipes/main/API/public/final_recipes_with_directions.json';
        fetch(dataUrl)
            .then(response => {
                if (!response.ok) throw new Error('在线数据文件加载失败');
                return response.json();
            })
            .then(data => {
                setAllRecipes(data);
                setIsLoading(false);
                setStatus('菜谱数据加载成功，请输入食材搜索。');
            })
            .catch(error => {
                setIsLoading(false);
                setStatus(`错误: ${error.message}`);
                console.error(error);
            });
    }, []); // 空数组表示只运行一次

    const searchRecipes = () => {
        const keyword = document.getElementById('search').value.toLowerCase().trim();
        if (isLoading) return;
        if (!keyword) {
            setFilteredRecipes([]);
            setStatus('请输入至少一种食材进行搜索。');
            return;
        }

        setStatus('正在搜索...');
        const ingredients = keyword.split(/[ \/\-,]+/).filter(Boolean);
        
        const results = allRecipes.filter(recipe =>
            ingredients.every(ing =>
                (recipe.name && recipe.name.toLowerCase().includes(ing)) ||
                (recipe.ingredients && recipe.ingredients.toLowerCase().includes(ing))
            )
        );

        if (results.length === 0) {
            setStatus('未找到包含所有指定食材的菜谱。');
            setFilteredRecipes([]);
            return;
        }

        // 排序逻辑
        results.sort((a, b) => {
            const aHas = hasValidDirections(a);
            const bHas = hasValidDirections(b);
            if (aHas === bHas) return 0;
            return bHas - aHas;
        });

        setFilteredRecipes(results);
        setStatus(`找到了 ${results.length} 个菜谱。`);
    };

    const hasValidDirections = (recipe) => {
        return recipe.directions && !['未能自动找到做法', '抓取失败', '已跳过'].some(term => recipe.directions.includes(term));
    };

    return (
        <div>
            <style>{styles}</style>
            <h1>智能食谱APP</h1>
            <div className="search-container">
                <input 
                    type="text" 
                    id="search" 
                    placeholder="输入食材..." 
                    onKeyDown={(e) => e.key === 'Enter' && searchRecipes()}
                    disabled={isLoading}
                />
                <button onClick={searchRecipes} disabled={isLoading}>
                    {isLoading ? '加载中...' : '搜索'}
                </button>
            </div>
            
            <div className="results">
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.slice(0, 20).map(recipe => ( // 只显示前20个作为示例
                        <div key={recipe._id.$oid} className="recipe">
                            <h3>{recipe.name || '无标题'}</h3>
                            {recipe.image && <img src={recipe.image} alt={recipe.name || ''} />}
                            <p style={{flexGrow: 1}}>
                                <b>材料:</b><br/>
                                {(recipe.ingredients || '').split('\n').slice(0, 3).join('<br>')}
                            </p>
                            <button>查看做法</button>
                        </div>
                    ))
                ) : (
                    <p>{status}</p>
                )}
            </div>
        </div>
    );
}

export default App;