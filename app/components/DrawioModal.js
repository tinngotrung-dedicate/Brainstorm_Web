'use client';

import { useEffect, useMemo, useRef } from 'react';
import { buildMermaidGraph } from '../../lib/graph';

const DRAWIO_ORIGIN = 'https://embed.diagrams.net';
const DRAWIO_URL = `${DRAWIO_ORIGIN}/?embed=1&ui=min&spin=1&proto=json&libraries=1&saveAndExit=1`;

const parseMessage = (data) => {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  if (typeof data === 'object') return data;
  return null;
};

export default function DrawioModal({ open, graphXml, summary, onClose, onSave }) {
  const frameRef = useRef(null);
  const mermaid = useMemo(() => buildMermaidGraph(summary), [summary]);

  useEffect(() => {
    if (!open) return;

    const handleMessage = (event) => {
      if (event.origin !== DRAWIO_ORIGIN) return;
      const message = parseMessage(event.data);
      if (!message) return;

      if (message.event === 'init') {
        const payload = graphXml
          ? { action: 'load', xml: graphXml }
          : mermaid
            ? { action: 'load', descriptor: { format: 'mermaid', data: mermaid } }
            : { action: 'load', xml: '' };

        frameRef.current?.contentWindow?.postMessage(JSON.stringify(payload), DRAWIO_ORIGIN);
      }

      if (message.event === 'save' && message.xml) {
        onSave?.(message.xml);
      }

      if (message.event === 'exit') {
        onClose?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [open, graphXml, mermaid, onClose, onSave]);

  if (!open) return null;

  return (
    <div className="graph-modal" role="dialog" aria-modal="true">
      <div className="graph-modal__panel">
        <div className="graph-modal__header">
          <div>
            <h4>Chỉnh sửa sơ đồ (draw.io)</h4>
            <p className="muted-text">Nhấn Lưu để cập nhật sơ đồ vào dự án.</p>
          </div>
          <button className="btn outline" type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
        <iframe
          ref={frameRef}
          className="graph-modal__frame"
          title="Draw.io editor"
          src={DRAWIO_URL}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
