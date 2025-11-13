import React, { useState, useEffect } from 'react';
import { GripVertical, ChevronRight, ChevronDown, Trash2, Plus } from 'lucide-react';

const PageArrangement = ({ pages, value = [], onChange }) => {
  const [pagesWithOrder, setPagesWithOrder] = useState([]);
  const [expandedPages, setExpandedPages] = useState(new Set());

  useEffect(() => {
    // Initialize pages with order
    console.log('📦 PageArrangement received value:', value);
    if (value && value.length > 0) {
      console.log('✅ Setting pagesWithOrder with', value.length, 'pages');
      setPagesWithOrder(value);
    } else {
      console.log('⚠️ Value is empty, starting with empty array');
      // Start with empty array - user must add pages
      setPagesWithOrder([]);
    }
  }, [value]);

  const getAvailablePages = () => {
    const selectedPageIds = pagesWithOrder.map(p => p.page_id);
    return pages.filter(page => !selectedPageIds.includes(page.id));
  };

  const addPage = (pageId, parentPageId = null) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newPage = {
      page_id: pageId,
      name: page.name,
      url: page.url,
      icon: page.icon,
      parent_page_id: parentPageId,
      display_order: pagesWithOrder.filter(p => p.parent_page_id === parentPageId).length,
    };

    const updated = [...pagesWithOrder, newPage];
    setPagesWithOrder(updated);
    onChange(updated);
  };

  const removePage = (pageId) => {
    // Remove the page and all its children
    const updated = pagesWithOrder.filter(p => 
      p.page_id !== pageId && p.parent_page_id !== pageId
    );
    
    // Reorder remaining pages
    const reordered = updated.map((page, index) => ({
      ...page,
      display_order: index,
    }));
    
    setPagesWithOrder(reordered);
    onChange(reordered);
  };

  const moveUp = (pageId) => {
    const index = pagesWithOrder.findIndex(p => p.page_id === pageId);
    if (index <= 0) return;

    const page = pagesWithOrder[index];
    const siblings = pagesWithOrder.filter(p => p.parent_page_id === page.parent_page_id);
    const siblingIndex = siblings.findIndex(p => p.page_id === pageId);
    
    if (siblingIndex <= 0) return;

    const updated = [...pagesWithOrder];
    const prevSibling = siblings[siblingIndex - 1];
    
    // Swap display orders
    const pageIndex = updated.findIndex(p => p.page_id === pageId);
    const prevIndex = updated.findIndex(p => p.page_id === prevSibling.page_id);
    
    const temp = updated[pageIndex].display_order;
    updated[pageIndex].display_order = updated[prevIndex].display_order;
    updated[prevIndex].display_order = temp;
    
    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);
    
    setPagesWithOrder(updated);
    onChange(updated);
  };

  const moveDown = (pageId) => {
    const page = pagesWithOrder.find(p => p.page_id === pageId);
    if (!page) return;

    const siblings = pagesWithOrder.filter(p => p.parent_page_id === page.parent_page_id);
    const siblingIndex = siblings.findIndex(p => p.page_id === pageId);
    
    if (siblingIndex >= siblings.length - 1) return;

    const updated = [...pagesWithOrder];
    const nextSibling = siblings[siblingIndex + 1];
    
    // Swap display orders
    const pageIndex = updated.findIndex(p => p.page_id === pageId);
    const nextIndex = updated.findIndex(p => p.page_id === nextSibling.page_id);
    
    const temp = updated[pageIndex].display_order;
    updated[pageIndex].display_order = updated[nextIndex].display_order;
    updated[nextIndex].display_order = temp;
    
    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);
    
    setPagesWithOrder(updated);
    onChange(updated);
  };

  const makeSubmenu = (pageId, newParentId) => {
    const updated = pagesWithOrder.map(p => {
      if (p.page_id === pageId) {
        return {
          ...p,
          parent_page_id: newParentId,
          display_order: pagesWithOrder.filter(
            pg => pg.parent_page_id === newParentId
          ).length,
        };
      }
      return p;
    });

    setPagesWithOrder(updated);
    onChange(updated);
  };

  const makeMainMenu = (pageId) => {
    makeSubmenu(pageId, null);
  };

  const toggleExpanded = (pageId) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const renderPage = (page, depth = 0) => {
    const children = pagesWithOrder.filter(p => p.parent_page_id === page.page_id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedPages.has(page.page_id);
    const mainMenuPages = pagesWithOrder.filter(p => p.parent_page_id === null && p.page_id !== page.page_id);

    return (
      <div key={page.page_id} className="mb-1">
        <div 
          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 group hover:bg-gray-100 dark:hover:bg-gray-600"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleExpanded(page.page_id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-4" />}

          {/* Drag handle (visual only for now) */}
          <GripVertical className="h-4 w-4 text-gray-400" />

          {/* Page info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {page.name}
              </span>
              {page.parent_page_id && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  Submenu
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{page.url}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Move up/down */}
            <button
              type="button"
              onClick={() => moveUp(page.page_id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveDown(page.page_id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              title="Move down"
            >
              ↓
            </button>

            {/* Convert to submenu or main menu */}
            {!page.parent_page_id ? (
              // It's a main menu - show submenu dropdown
              <select
                value=""
                onChange={(e) => makeSubmenu(page.page_id, parseInt(e.target.value))}
                className="text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title="Make submenu of..."
              >
                <option value="">Make Submenu...</option>
                {mainMenuPages.map(mp => (
                  <option key={mp.page_id} value={mp.page_id}>
                    ↪ {mp.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => makeMainMenu(page.page_id)}
                className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Make main menu"
              >
                ↖ Main
              </button>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removePage(page.page_id)}
              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
              title="Remove"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children
              .sort((a, b) => a.display_order - b.display_order)
              .map(child => renderPage(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const mainPages = pagesWithOrder
    .filter(p => p.parent_page_id === null)
    .sort((a, b) => a.display_order - b.display_order);

  const availablePages = getAvailablePages();

  return (
    <div className="space-y-4">
      {/* Add Page Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add Pages to Role
        </label>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              addPage(parseInt(e.target.value));
              e.target.value = '';
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a page to add --</option>
          {availablePages.map(page => (
            <option key={page.id} value={page.id}>
              {page.name} ({page.url})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {availablePages.length} pages available to add
        </p>
      </div>

      {/* Page List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Arrange & Organize Pages
        </label>
        
        {pagesWithOrder.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No pages added yet. Select pages from the dropdown above.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
            {mainPages.map(page => renderPage(page))}
          </div>
        )}

        {pagesWithOrder.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tips:</strong> Use ↑↓ to reorder • Use "Make Submenu..." to nest under another page • Use "↖ Main" to convert back to main menu • Click ▶/▼ to expand/collapse submenus
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageArrangement;
