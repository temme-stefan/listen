import { useRef, useState } from 'react';
import type { Card } from '../types';
import { fetchMeta, downloadImage, uploadImage } from '../api';

interface Props {
  card: Card;
  index: number;
  listName: string;
  total: number;
  onChange: (card: Card) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

export default function CardComponent({ card, index, listName, total, onChange, onDelete, onMove }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<Card>) {
    onChange({ ...card, ...patch });
  }

  async function refreshMeta() {
    if (!card.url) return;
    setLoading(true);
    setMsg('Lade Metadaten…');
    try {
      const meta = await fetchMeta(card.url);
      if (meta.ok) {
        let newImage = card.image;
        if (meta.image) {
          try {
            newImage = await downloadImage(listName, meta.image, meta.title || card.title, index);
          } catch {
            // Bild-Download gescheitert – trotzdem Titel übernehmen
          }
        }
        update({ title: meta.title || card.title, image: newImage });
        setMsg('✅ Aktualisiert');
      } else {
        setMsg(`⚠️ ${meta.error ?? 'Metadaten nicht verfügbar'}`);
      }
    } catch {
      setMsg('❌ Fehler beim Laden');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const filename = await uploadImage(listName, file, card.title, index);
      update({ image: filename });
    } catch {
      setMsg('❌ Upload fehlgeschlagen');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  const imgSrc = card.image
    ? `/listen/${listName}/img/${card.image}`
    : '/noimg.svg';

  return (
    <article className={`card${card.bought ? ' bought' : ''}`}>
      <div className="card-image">
        <img src={imgSrc} alt="Produktbild" />
        <button className="card-image-btn" title="Bild ändern" onClick={() => fileRef.current?.click()}>📷</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="card-body">
        <input
          className="card-title"
          type="text"
          placeholder="Titel / Beschreibung"
          value={card.title}
          onChange={e => update({ title: e.target.value })}
        />

        <input
          className="card-url"
          type="url"
          placeholder="URL (optional)"
          value={card.url}
          onChange={e => update({ url: e.target.value })}
        />

        <textarea
          className="card-comment"
          placeholder="Bemerkung"
          value={card.comment}
          onChange={e => update({ comment: e.target.value })}
        />

        <label className="card-bought">
          <input
            type="checkbox"
            checked={card.bought}
            onChange={e => update({ bought: e.target.checked })}
          />
          Gekauft
        </label>

        {msg && <p className="card-msg">{msg}</p>}

        <div className="card-actions">
          {card.url && (
            <button onClick={refreshMeta} disabled={loading} title="Metadaten aktualisieren">🔄</button>
          )}
          <button onClick={() => onMove('up')} disabled={index === 0} title="Nach oben">⬆️</button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} title="Nach unten">⬇️</button>
          <button className="btn-danger" onClick={onDelete} title="Löschen">🗑️</button>
        </div>
      </div>
    </article>
  );
}

