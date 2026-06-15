import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import NoteList from './components/NoteList.jsx';
import NoteEditor from './components/NoteEditor.jsx';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [view, setView] = useState({ type: 'all' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const saveTimeoutRef = useRef(null);

  const loadNotebooks = useCallback(async () => {
    const data = await api.notebooks.list();
    setNotebooks(data);
  }, []);

  const loadTags = useCallback(async () => {
    const data = await api.tags.list();
    setTags(data);
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (view.type === 'starred') params.view = 'starred';
      else if (view.type === 'trash') params.view = 'trash';
      else params.view = 'all';

      if (view.type === 'notebook') params.notebook_id = view.id;
      if (view.type === 'tag') params.tag_id = view.id;
      if (search) params.search = search;

      const data = await api.notes.list(params);
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }, [view, search]);

  useEffect(() => { loadNotes(); }, [loadNotes]);
  useEffect(() => { loadNotebooks(); loadTags(); }, []);

  const loadSelectedNote = useCallback(async (id) => {
    if (!id) { setSelectedNote(null); return; }
    const note = await api.notes.get(id);
    setSelectedNote(note);
  }, []);

  useEffect(() => { loadSelectedNote(selectedNoteId); }, [selectedNoteId, loadSelectedNote]);

  const handleNewNote = async () => {
    const notebookId = view.type === 'notebook' ? view.id : null;
    const note = await api.notes.create({ title: '', content: '', notebook_id: notebookId });
    await loadNotes();
    setSelectedNoteId(note.id);
  };

  const handleSave = useCallback(async (id, data) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await api.notes.update(id, data);
      await loadNotes();
      await loadTags();
    }, 800);
  }, [loadNotes, loadTags]);

  const handleStar = async (id) => {
    await api.notes.star(id);
    await loadNotes();
    if (selectedNoteId === id) loadSelectedNote(id);
  };

  const handleTrash = async (id) => {
    await api.notes.trash(id);
    await loadNotes();
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('완전히 삭제할까요?')) return;
    await api.notes.delete(id);
    await loadNotes();
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const handleCreateNotebook = async (name) => {
    await api.notebooks.create(name);
    await loadNotebooks();
  };

  const handleDeleteNotebook = async (id) => {
    if (!confirm('노트북을 삭제할까요? 노트는 유지됩니다.')) return;
    await api.notebooks.delete(id);
    await loadNotebooks();
    if (view.type === 'notebook' && view.id === id) setView({ type: 'all' });
  };

  return (
    <div className="app">
      <Sidebar
        notebooks={notebooks}
        tags={tags}
        view={view}
        onViewChange={(v) => { setView(v); setSelectedNoteId(null); }}
        onNewNote={handleNewNote}
        onCreateNotebook={handleCreateNotebook}
        onDeleteNotebook={handleDeleteNotebook}
      />
      <NoteList
        notes={notes}
        loading={loading}
        selectedId={selectedNoteId}
        search={search}
        onSearch={setSearch}
        onSelect={setSelectedNoteId}
        onStar={handleStar}
        onTrash={handleTrash}
        onDelete={handleDelete}
        isTrashView={view.type === 'trash'}
      />
      <NoteEditor
        note={selectedNote}
        notebooks={notebooks}
        onSave={handleSave}
        onStar={handleStar}
        onTrash={handleTrash}
      />
    </div>
  );
}
