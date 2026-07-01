import React from 'react';
import { X, Download } from 'lucide-react';

export default function FilePreviewModal({ fileData, fileName, onClose }) {
  if (!fileData) return null;

  const isImage = fileData.startsWith('data:image');
  const isPdf = fileData.startsWith('data:application/pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName || 'undangan';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleDownload} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
              <Download size={14} /> Download
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem' }}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-card)' }}>
          {isImage ? (
            <img src={fileData} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : isPdf ? (
            <iframe src={fileData} style={{ width: '100%', height: '100%', border: 'none' }} title={fileName} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p>Pratinjau tidak tersedia untuk format file ini.</p>
              <button onClick={handleDownload} className="btn btn-primary" style={{ marginTop: '1rem' }}>Download File</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
