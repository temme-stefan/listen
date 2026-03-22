import { useState, useEffect, useCallback } from 'react';
import { fetchList, saveList, fetchMeta, downloadImage, deployList, listExists } from '../api';
import type { Card } from '../types';
import CardComponent from './CardComponent';

interface Props {
  listName: string;
  onBack: () => void;
  onLogout: () => void;
}

let nextId = 1;

function newCard(): Card & { _id: number } {
  return { _id: nextId++, sort: 0, url: '', title: '', image: '', comment: '', bought: false };
}

export default function Editor({ listName, onBack, onLogout }: Props) {
  const [cards, setCards] = useState<(Card & { _id: number })[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  // Liste laden + prüfen ob index.html bereits existiert
  useEffect(() => {
    fetchList(listName).then(data => {
      setCards(data.map(c => ({ ...c, _id: nextId++ })));
    });
    listExists(listName).then(setDeployed);
  }, [listName]);

  function showStatus(msg: string, duration = 3000) {
    setStatus(msg);
    if (duration > 0) setTimeout(() => setStatus(''), duration);
  }

  function updateCard(index: number, card: Card) {
    setCards(prev => prev.map((c, i) => i === index ? { ...c, ...card } : c));
    setDirty(true);
  }

  function deleteCard(index: number) {
    setCards(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function moveCard(index: number, dir: 'up' | 'down') {
    setCards(prev => {
      const next = [...prev];
      const swap = dir === 'up' ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    setDirty(true);
  }

  function addManual() {
    setCards(prev => [...prev, newCard()]);
    setDirty(true);
  }

  async function addFromUrl() {
    const url = urlInput.trim();
    if (!url) { addManual(); return; }

    setAdding(true);
    showStatus('Lade Metadaten…', 0);
    const card = newCard();
    card.url = url;

    try {
      const meta = await fetchMeta(url);
      if (meta.ok) {
        card.title = meta.title;
        if (meta.image) {
          try {
            card.image = await downloadImage(listName, meta.image, meta.title, cards.length);
          } catch { /* Bild optional */ }
        }
        showStatus('✅ Metadaten geladen');
      } else {
        showStatus(`⚠️ ${meta.error ?? 'Keine Metadaten'} – Karte manuell ausfüllen`);
      }
    } catch {
      showStatus('❌ Fehler beim Laden – Karte manuell ausfüllen');
    } finally {
      setCards(prev => [...prev, card]);
      setUrlInput('');
      setAdding(false);
      setDirty(true);
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addFromUrl(); }
  }, [urlInput, cards.length]);

  async function save() {
    showStatus('Speichern…', 0);
    try {
      await saveList(listName, cards.map((c, i) => ({ ...c, sort: i + 1 })));
      setDirty(false);
      showStatus('✅ Gespeichert');
    } catch {
      showStatus('❌ Fehler beim Speichern');
    }
  }

  async function deploy() {
    if (dirty) await save();
    setDeploying(true);
    showStatus('Baue Liste…', 0);
    try {
      await deployList(listName);
      setDeployed(true);
      showStatus(`✅ Liste "${listName}" veröffentlicht`);
    } catch (e: unknown) {
      showStatus(`❌ ${e instanceof Error ? e.message : 'Deploy fehlgeschlagen'}`);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <h1>🎁 {listName}</h1>

        <div className="url-bar">
          <input
            type="text"
            placeholder="URL eingeben und Enter drücken…"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={adding}
          />
          <button onClick={addFromUrl} disabled={adding}>Mit URL</button>
          <button onClick={addManual}>➕ Manuell</button>
        </div>

        <div className="toolbar">
          <button onClick={onBack} className="btn-secondary">← Übersicht</button>
          <button onClick={save} disabled={!dirty} className={dirty ? 'btn-primary' : ''}>
            💾 Speichern{dirty ? ' *' : ''}
          </button>
          <button onClick={deploy} disabled={deploying} className="btn-deploy">
            🚀 Veröffentlichen
          </button>
          {deployed && (
            <a
              href={`/listen/${listName}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              🔗 Liste ansehen
            </a>
          )}
          <button onClick={onLogout} className="btn-secondary">Abmelden</button>
        </div>

        {status && <p className="status-bar">{status}</p>}
      </header>

      <main className="cards-container">
        {cards.length === 0 && (
          <p className="empty-state">Noch keine Einträge. URL eingeben oder manuell hinzufügen.</p>
        )}
        {cards.map((card, index) => (
          <CardComponent
            key={card._id}
            card={card}
            index={index}
            listName={listName}
            total={cards.length}
            onChange={c => updateCard(index, c)}
            onDelete={() => deleteCard(index)}
            onMove={dir => moveCard(index, dir)}
          />
        ))}
      </main>

      <footer>© Stefan Temme 2026</footer>
    </div>
  );
}

