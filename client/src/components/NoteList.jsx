function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(str) {
  const d = new Date(str);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('ko-KR', { weekday: 'short' });
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function NoteList({ notes, loading, selectedId, search, onSearch, onSelect, onStar, onTrash, onDelete, isTrashView }) {
  return (
    <div className="note-list">
      <div className="note-list-header">
        <input
          className="search-input"
          type="text"
          placeholder="검색..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <span className="note-count">{notes.length}개</span>
      </div>

      <div className="note-items">
        {loading && <div className="empty-state">불러오는 중...</div>}
        {!loading && notes.length === 0 && (
          <div className="empty-state">노트가 없습니다.</div>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note-item ${selectedId === note.id ? 'selected' : ''}`}
            onClick={() => onSelect(note.id)}
          >
            <div className="note-item-header">
              <span className="note-item-title">{note.title || '제목 없음'}</span>
              <div className="note-item-actions">
                {!isTrashView && (
                  <button
                    className={`icon-btn ${note.is_starred ? 'starred' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onStar(note.id); }}
                    title="즐겨찾기"
                  >⭐</button>
                )}
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); isTrashView ? onDelete(note.id) : onTrash(note.id); }}
                  title={isTrashView ? '완전 삭제' : '휴지통'}
                >🗑</button>
                {isTrashView && (
                  <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); onTrash(note.id); }}
                    title="복원"
                  >↩</button>
                )}
              </div>
            </div>
            <div className="note-item-preview">{stripHtml(note.content || '').slice(0, 120) || '내용 없음'}</div>
            <div className="note-item-meta">
              <span className="note-item-date">{formatDate(note.updated_at)}</span>
              {note.notebook_name && <span className="note-item-notebook">{note.notebook_name}</span>}
            </div>
            {note.tags?.length > 0 && (
              <div className="note-item-tags">
                {note.tags.map((t) => <span key={t} className="tag-badge">#{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
