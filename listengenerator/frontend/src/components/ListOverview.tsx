import { useState, useEffect } from 'react';
import type { ListConfig } from '../types';
import { fetchListsConfig, saveListsConfig } from '../api';

interface Props {
  onSelect: (name: string) => void;
  onLogout: () => void;
}

export default function ListOverview({ onSelect, onLogout }: Props) {
  const [lists, setLists] = useState<ListConfig[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<ListConfig | null>(null);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetchListsConfig();
    setLists(data);
  }

  async function save(updated: ListConfig[]) {
    await saveListsConfig(updated);
    // oldName nach Speicherung entfernen (nur lokales Tracking)
    setLists(updated.map(({ oldName: _, ...l }) => l));
    setStatus('✅ Gespeichert');
    setTimeout(() => setStatus(''), 2000);
  }

  async function addList() {
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    const title = newTitle.trim();
    if (!slug || !title) return;
    if (lists.find(l => l.name === slug)) {
      setStatus('❌ Name bereits vergeben');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    await save([...lists, { name: slug, title, archived: false }]);
    setNewName('');
    setNewTitle('');
  }

  async function updateList(updated: ListConfig) {
    try {
      await save(lists.map(l => l.name === (updated.oldName ?? updated.name) ? updated : l));
      setEditing(null);
    } catch (e: unknown) {
      setStatus(`❌ ${e instanceof Error ? e.message : 'Fehler beim Speichern'}`);
      setTimeout(() => setStatus(''), 3000);
    }
  }

  const visible = lists.filter(l => showArchived || !l.archived);
  const archivedCount = lists.filter(l => l.archived).length;

  return (
    <div className="overview">
      <header className="overview-header">
        <h1>🎁 Wunschlisten</h1>
        <div className="overview-toolbar">
          {archivedCount > 0 && (
            <label className="archived-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
              />
              Archivierte anzeigen ({archivedCount})
            </label>
          )}
          <button onClick={onLogout} className="btn-secondary">Abmelden</button>
        </div>
        {status && <p className="status-bar">{status}</p>}
      </header>

      <main className="overview-main">
        <ul className="list-cards">
          {visible.map(l => (
            <li key={l.name} className={`list-card${l.archived ? ' archived' : ''}`}>
              {editing?.name === l.name || editing?.oldName === l.name ? (
                <div className="list-card-edit">
                  <label>
                    Slug
                    <input
                      type="text"
                      value={editing.name}
                      onChange={e => {
                        const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
                        const original = editing.oldName ?? l.name;
                        setEditing({
                          ...editing,
                          name: newSlug,
                          oldName: newSlug !== original ? original : undefined,
                        });
                      }}
                    />
                  </label>
                  {editing.oldName && (
                    <p className="rename-warning">
                      ⚠️ Ordner wird von <code>{editing.oldName}</code> nach <code>{editing.name}</code> umbenannt
                    </p>
                  )}
                  <label>
                    Titel
                    <input
                      type="text"
                      value={editing.title}
                      onChange={e => setEditing({ ...editing, title: e.target.value })}
                    />
                  </label>
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={editing.archived}
                      onChange={e => setEditing({ ...editing, archived: e.target.checked })}
                    />
                    Archiviert
                  </label>
                  <div className="list-card-actions">
                    <button
                      className="btn-primary"
                      onClick={() => updateList(editing)}
                      disabled={!editing.name}
                    >
                      💾 Speichern
                    </button>
                    <button onClick={() => setEditing(null)}>Abbrechen</button>
                  </div>
                </div>
              ) : (
                <div className="list-card-view">
                  <div className="list-card-info">
                    <span className="list-card-title">{l.title}</span>
                    <span className="list-card-slug">{l.name}{l.archived && ' 📦'}</span>
                  </div>
                  <div className="list-card-actions">
                    <button className="btn-primary" onClick={() => onSelect(l.name)}>Öffnen</button>
                    <button onClick={() => setEditing({ ...l })}>✏️</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="list-add">
          <h2>Neue Liste</h2>
          <label>
            Slug
            <input
              type="text"
              placeholder="z.B. max"
              value={newName}
              onChange={e => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))}
            />
          </label>
          <label>
            Titel
            <input
              type="text"
              placeholder="z.B. Max' Wunschliste"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
          </label>
          <button
            className="btn-primary"
            disabled={!newName || !newTitle}
            onClick={addList}
          >
            ➕ Anlegen
          </button>
        </div>
      </main>

      <footer>© Stefan Temme 2026</footer>
    </div>
  );
}

