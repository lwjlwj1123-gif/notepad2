import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      className={`toolbar-btn ${active ? 'active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({ note, notebooks, onSave, onStar, onTrash }) {
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [notebookId, setNotebookId] = useState(null);
  const noteIdRef = useRef(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    onUpdate: ({ editor }) => {
      if (!noteIdRef.current) return;
      saveRef.current(noteIdRef.current, {
        title,
        content: editor.getHTML(),
        notebook_id: notebookId,
        tags,
      });
    },
  });

  const triggerSave = useCallback((overrides = {}) => {
    if (!noteIdRef.current || !editor) return;
    saveRef.current(noteIdRef.current, {
      title,
      content: editor.getHTML(),
      notebook_id: notebookId,
      tags,
      ...overrides,
    });
  }, [editor, title, notebookId, tags]);

  useEffect(() => {
    if (!note) {
      noteIdRef.current = null;
      setTitle('');
      setTags([]);
      setNotebookId(null);
      editor?.commands.setContent('');
      return;
    }
    noteIdRef.current = note.id;
    setTitle(note.title || '');
    setTags(note.tags?.map((t) => t.name || t) ?? []);
    setNotebookId(note.notebook_id || null);
    editor?.commands.setContent(note.content || '', false);
  }, [note?.id]);

  useEffect(() => { if (note) triggerSave(); }, [title, notebookId, tags]);

  const handleTitleChange = (e) => setTitle(e.target.value);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) setTags([...tags, val]);
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  if (!note) {
    return (
      <div className="editor-panel empty">
        <div className="editor-empty-msg">
          <span>📝</span>
          <p>노트를 선택하거나 새 노트를 만드세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="editor-top-bar">
        <div className="editor-meta">
          <select
            className="notebook-select"
            value={notebookId || ''}
            onChange={(e) => setNotebookId(e.target.value || null)}
          >
            <option value="">노트북 없음</option>
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>{nb.name}</option>
            ))}
          </select>
        </div>
        <div className="editor-actions">
          <button className={`icon-btn ${note.is_starred ? 'starred' : ''}`} onClick={() => onStar(note.id)} title="즐겨찾기">⭐</button>
          <button className="icon-btn" onClick={() => onTrash(note.id)} title="휴지통">🗑</button>
        </div>
      </div>

      <div className="editor-title-wrap">
        <input
          className="editor-title"
          type="text"
          placeholder="제목"
          value={title}
          onChange={handleTitleChange}
        />
      </div>

      <div className="tag-bar">
        {tags.map((t) => (
          <span key={t} className="tag-badge clickable">
            #{t}
            <button onClick={() => removeTag(t)}>×</button>
          </span>
        ))}
        <input
          className="tag-input"
          type="text"
          placeholder="태그 추가 (Enter)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </div>

      {editor && (
        <div className="toolbar">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게">B</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><i>I</i></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄"><u>U</u></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><s>S</s></ToolbarBtn>
          <div className="toolbar-divider" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목1">H1</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목2">H2</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목3">H3</ToolbarBtn>
          <div className="toolbar-divider" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호">•</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">1.</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="체크리스트">☑</ToolbarBtn>
          <div className="toolbar-divider" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록">&lt;/&gt;</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용문">"</ToolbarBtn>
          <div className="toolbar-divider" />
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="실행 취소">↩</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="다시 실행">↪</ToolbarBtn>
        </div>
      )}

      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
