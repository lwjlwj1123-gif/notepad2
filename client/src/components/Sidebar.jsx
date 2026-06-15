import { useState } from 'react';

export default function Sidebar({ notebooks, tags, view, onViewChange, onNewNote, onCreateNotebook, onDeleteNotebook }) {
  const [notebooksOpen, setNotebooksOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [addingNotebook, setAddingNotebook] = useState(false);

  const isActive = (v) => {
    if (v.type !== view.type) return false;
    if (v.id) return v.id === view.id;
    return true;
  };

  const handleAddNotebook = async (e) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    await onCreateNotebook(newNotebookName.trim());
    setNewNotebookName('');
    setAddingNotebook(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">📓</span>
        <span className="sidebar-title">내 메모장</span>
      </div>

      <button className="new-note-btn" onClick={onNewNote}>
        + 새 노트
      </button>

      <nav className="sidebar-nav">
        <button className={`nav-item ${isActive({ type: 'all' }) ? 'active' : ''}`} onClick={() => onViewChange({ type: 'all' })}>
          <span className="nav-icon">📋</span> 모든 노트
        </button>
        <button className={`nav-item ${isActive({ type: 'starred' }) ? 'active' : ''}`} onClick={() => onViewChange({ type: 'starred' })}>
          <span className="nav-icon">⭐</span> 즐겨찾기
        </button>
        <button className={`nav-item ${isActive({ type: 'trash' }) ? 'active' : ''}`} onClick={() => onViewChange({ type: 'trash' })}>
          <span className="nav-icon">🗑</span> 휴지통
        </button>
      </nav>

      <div className="sidebar-section">
        <div className="section-header" onClick={() => setNotebooksOpen((o) => !o)}>
          <span>{notebooksOpen ? '▾' : '▸'} 노트북</span>
          <button className="section-add" onClick={(e) => { e.stopPropagation(); setAddingNotebook(true); setNotebooksOpen(true); }}>+</button>
        </div>
        {notebooksOpen && (
          <div className="section-items">
            {addingNotebook && (
              <form onSubmit={handleAddNotebook} className="inline-form">
                <input
                  autoFocus
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="노트북 이름"
                  onBlur={() => setAddingNotebook(false)}
                />
              </form>
            )}
            {notebooks.map((nb) => (
              <div key={nb.id} className={`nav-item-group ${isActive({ type: 'notebook', id: nb.id }) ? 'active' : ''}`}>
                <button className="nav-item" onClick={() => onViewChange({ type: 'notebook', id: nb.id })}>
                  <span className="nav-icon">📁</span>
                  <span className="nav-label">{nb.name}</span>
                  <span className="nav-count">{nb.note_count}</span>
                </button>
                <button className="item-delete" onClick={() => onDeleteNotebook(nb.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-header" onClick={() => setTagsOpen((o) => !o)}>
          <span>{tagsOpen ? '▾' : '▸'} 태그</span>
        </div>
        {tagsOpen && (
          <div className="section-items">
            {tags.map((tag) => (
              <button key={tag.id} className={`nav-item ${isActive({ type: 'tag', id: tag.id }) ? 'active' : ''}`} onClick={() => onViewChange({ type: 'tag', id: tag.id })}>
                <span className="nav-icon">#</span>
                <span className="nav-label">{tag.name}</span>
                <span className="nav-count">{tag.note_count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
