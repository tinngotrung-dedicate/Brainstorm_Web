'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const presets = [
  { label: '30p tìm bài báo', minutes: 30 },
  { label: '10p tạo ý tưởng', minutes: 10 },
  { label: '5p tổng hợp', minutes: 5 },
  { label: '15s test', minutes: 0.25 }
];

const MIN_MINUTES = 0; // cho phép 0 phút, dùng input giây để tinh chỉnh
const MAX_MINUTES = 240;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const minText = String(mins).padStart(2, '0');
  const secText = String(secs).padStart(2, '0');
  return `${minText}:${secText}`;
};

const SOUND_PRESETS = [
  { value: 'beep', label: 'Beep mặc định (Web Audio)' },
  {
    value: 'airhorn',
    label: 'Airhorn (myinstants)',
    url: 'https://www.myinstants.com/media/sounds/airhorn.mp3'
  },
  {
    value: 'sadtrombone',
    label: 'Sad Trombone (myinstants)',
    url: 'https://www.myinstants.com/media/sounds/sadtrombone.swf.mp3'
  }
];

export default function TimerPopover() {
  const [seconds, setSeconds] = useState(30 * 60);
  const [totalSeconds, setTotalSeconds] = useState(30 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState('beep');
  const [customSound, setCustomSound] = useState('');
  const [hasAlerted, setHasAlerted] = useState(false);
  const audioRef = useRef(null);

  const minutesValue = useMemo(() => {
    const mins = Math.max(MIN_MINUTES, Math.floor(totalSeconds / 60));
    return Math.min(MAX_MINUTES, mins);
  }, [totalSeconds]);

  const secondsValue = useMemo(() => {
    return Math.max(0, Math.min(59, totalSeconds % 60));
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

  useEffect(() => {
    if (seconds === 0 && totalSeconds > 0 && !hasAlerted) {
      playAlert();
      setHasAlerted(true);
    }
  }, [seconds, totalSeconds, hasAlerted]);

  const handlePreset = (minutes) => {
    const next = minutes * 60;
    setSeconds(next);
    setTotalSeconds(next);
    setRunning(false);
    setHasAlerted(false);
  };

  const handleMinuteChange = (value) => {
    const intMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, Math.floor(value)));
    const nextSeconds = intMinutes * 60 + secondsValue;
    setSeconds(nextSeconds);
    setTotalSeconds(nextSeconds);
    setRunning(false);
    setHasAlerted(false);
  };

  const handleSecondChange = (value) => {
    const clamped = Math.max(0, Math.min(59, value));
    const mins = Math.floor(totalSeconds / 60);
    const nextSeconds = mins * 60 + clamped;
    setSeconds(nextSeconds);
    setTotalSeconds(nextSeconds);
    setRunning(false);
    setHasAlerted(false);
  };

  const progress = useMemo(() => {
    return totalSeconds ? (seconds / totalSeconds) * 100 : 0;
  }, [seconds, totalSeconds]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (error) {
      // ignore
    }
  };

  const playAlert = () => {
    const preset = SOUND_PRESETS.find((item) => item.value === sound);
    const url = sound === 'custom' ? customSound.trim() : preset?.url;
    if (sound === 'beep' || (!url && sound === 'custom')) {
      playBeep();
      return;
    }
    if (!url) return;
    try {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => playBeep());
    } catch (error) {
      playBeep();
    }
  };

  const stopAlert = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        // ignore
      }
      audioRef.current = null;
    }
  };

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
            <div className="timer-dual-input">
              <input
                id="timer-minutes"
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                step={1}
                value={minutesValue}
                onChange={(event) => handleMinuteChange(Number(event.target.value) || MIN_MINUTES)}
              />
              <span className="timer-sep">:</span>
              <input
                id="timer-seconds"
                type="number"
                min={0}
                max={59}
                value={secondsValue}
                onChange={(event) => handleSecondChange(Number(event.target.value) || 0)}
              />
            </div>
          </div>
          <input
            className="timer-slider"
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={1}
            value={minutesValue}
            onChange={(event) => handleMinuteChange(Number(event.target.value))}
          />
          <div className="timer-scale">
            <span>{MIN_MINUTES}p</span>
            <span>{Math.round(MAX_MINUTES / 2)}p</span>
            <span>{MAX_MINUTES}p+</span>
          </div>
        </div>
        <div className="timer-sound">
          <label htmlFor="timer-sound">Âm thanh báo</label>
          <select id="timer-sound" value={sound} onChange={(e) => setSound(e.target.value)}>
            {SOUND_PRESETS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
            <option value="custom">Custom URL</option>
          </select>
          {sound === 'custom' && (
            <input
              type="url"
              placeholder="Dán URL file âm thanh (mp3, wav...)"
              value={customSound}
              onChange={(e) => setCustomSound(e.target.value)}
            />
          )}
        </div>
        <div className="timer-display">
          <span>{formatTime(seconds)}</span>
          <div className="timer-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="timer-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              stopAlert();
              setRunning(true);
            }}
          >
            Bắt đầu
          </button>
          <button
            className="btn outline"
            type="button"
            onClick={() => {
              stopAlert();
              setRunning(false);
            }}
          >
            Tạm dừng
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              stopAlert();
              setSeconds(30 * 60);
              setTotalSeconds(30 * 60);
              setHasAlerted(false);
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
