'use client';

import { useEffect, useMemo, useState } from 'react';

const presets = [
  { label: '30p tìm bài báo', minutes: 30 },
  { label: '10p tạo ý tưởng', minutes: 10 },
  { label: '5p tổng hợp', minutes: 5 }
];

const MIN_MINUTES = 1;
const MAX_MINUTES = 240;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const minText = String(mins).padStart(2, '0');
  const secText = String(secs).padStart(2, '0');
  return `${minText}:${secText}`;
};

export default function TimerPopover() {
  const [seconds, setSeconds] = useState(30 * 60);
  const [totalSeconds, setTotalSeconds] = useState(30 * 60);
  const [running, setRunning] = useState(false);

  const minutesValue = useMemo(() => {
    const mins = Math.max(MIN_MINUTES, Math.round(totalSeconds / 60));
    return Math.min(MAX_MINUTES, mins);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const handlePreset = (minutes) => {
    const next = minutes * 60;
    setSeconds(next);
    setTotalSeconds(next);
    setRunning(false);
  };

  const handleMinuteChange = (value) => {
    const nextMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, value));
    const nextSeconds = nextMinutes * 60;
    setSeconds(nextSeconds);
    setTotalSeconds(nextSeconds);
    setRunning(false);
  };

  const progress = useMemo(() => {
    return totalSeconds ? (seconds / totalSeconds) * 100 : 0;
  }, [seconds, totalSeconds]);

  return (
    <details className="timer-popover">
      <summary className="timer-toggle" aria-label="Mở bấm giờ">
        <span className="timer-toggle-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation" focusable="false">
            <path
              d="M8 2h8v2h-3v1.05a8 8 0 1 1-2 0V4H8V2zm4 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-.8 2h1.6v3.6l2.6 1.6-.8 1.2-3.4-2V9z"
              fill="currentColor"
            />
          </svg>
        </span>
      </summary>
      <div className="timer-panel">
        <div className="timer-panel-header">
          <h4>Bấm giờ brainstorm</h4>
          <span className="badge">Đồng hồ nhóm</span>
        </div>
        <p className="muted-text">
          Canh thời gian tìm bài báo và tạo ý tưởng. Đặt mốc thời gian hoặc tự bắt đầu/dừng.
        </p>
        <div className="timer-config">
          <div className="timer-config-row">
            <label htmlFor="timer-minutes">Phút</label>
            <input
              id="timer-minutes"
              type="number"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              value={minutesValue}
              onChange={(event) => handleMinuteChange(Number(event.target.value) || MIN_MINUTES)}
            />
          </div>
          <input
            className="timer-slider"
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            value={minutesValue}
            onChange={(event) => handleMinuteChange(Number(event.target.value))}
          />
          <div className="timer-scale">
            <span>{MIN_MINUTES}p</span>
            <span>{Math.round(MAX_MINUTES / 2)}p</span>
            <span>{MAX_MINUTES}p+</span>
          </div>
        </div>
        <div className="timer-display">
          <span>{formatTime(seconds)}</span>
          <div className="timer-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="timer-actions">
          <button className="btn primary" type="button" onClick={() => setRunning(true)}>
            Bắt đầu
          </button>
          <button className="btn outline" type="button" onClick={() => setRunning(false)}>
            Tạm dừng
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setSeconds(30 * 60);
              setTotalSeconds(30 * 60);
            }}
          >
            Đặt lại
          </button>
        </div>
        <div className="timer-presets">
          {presets.map((preset) => (
            <button
              key={preset.label}
              className="btn outline"
              type="button"
              onClick={() => handlePreset(preset.minutes)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
