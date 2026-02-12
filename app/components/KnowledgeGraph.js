'use client';

import { useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import { buildMermaidGraph } from '../../lib/graph';

export default function KnowledgeGraph({ summary }) {
  const [svg, setSvg] = useState('');

  const graph = useMemo(() => (summary ? buildMermaidGraph(summary) : ''), [summary]);

  useEffect(() => {
    if (!graph) {
      setSvg('');
      return;
    }

    mermaid.initialize({ startOnLoad: false, theme: 'base' });
    mermaid
      .render(`graph-${Date.now()}`, graph)
      .then(({ svg }) => setSvg(svg))
      .catch(() => setSvg(''));
  }, [graph]);

  if (!graph) return null;

  const handleDownloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-graph.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    if (!svg) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return;
    if (!svgEl.getAttribute('xmlns')) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    const viewBox = svgEl.viewBox?.baseVal;
    const width = viewBox?.width || parseFloat(svgEl.getAttribute('width')) || 1200;
    const height = viewBox?.height || parseFloat(svgEl.getAttribute('height')) || 800;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
    const url = `data:image/svg+xml;base64,${svgBase64}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'knowledge-graph.png';
          link.click();
          URL.revokeObjectURL(pngUrl);
        });
      }
    };
    img.onerror = () => {
      console.warn('Không thể xuất PNG từ SVG.');
    };
    img.src = url;
  };

  return (
    <div className="graph-card">
      <div className="card-header-row">
        <h4>Sơ đồ tri thức</h4>
        <div className="graph-actions">
          <span className="badge">Mermaid</span>
          <button className="btn outline" type="button" onClick={handleDownloadSvg}>
            SVG
          </button>
          <button className="btn outline" type="button" onClick={handleDownloadPng}>
            PNG
          </button>
        </div>
      </div>
      {svg ? (
        <div className="graph-render" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <p className="muted-text">Không thể vẽ graph. Vui lòng thử lại.</p>
      )}
    </div>
  );
}
