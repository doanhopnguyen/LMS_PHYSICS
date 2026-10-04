import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GuardedVideoPlayer } from '../../src/components/GuardedVideoPlayer.jsx';
import { useMaterialProgress } from '../../src/hooks/useMaterialProgress.js';
window.__clock = 0;
Object.defineProperty(performance, 'now', { value: () => window.__clock });
localStorage.setItem('ptit-physics-demo-session', JSON.stringify({ role: 'STUDENT', userId: 'video-ui-student' }));
localStorage.removeItem('ptit-material-progress-v1:video-ui-student:class:topic');
window.__writes = [];
window.fetch = async (url, options = {}) => {
  if (options.body) window.__writes.push(JSON.parse(options.body));
  return Response.json({ data: {} });
};
Object.defineProperties(HTMLMediaElement.prototype, {
  duration: {
    configurable: true,
    get() {
      return 10;
    },
  },
  currentTime: {
    configurable: true,
    get() {
      return this.__time || 0;
    },
    set(value) {
      this.__time = value;
      this.dispatchEvent(new Event('seeking'));
    },
  },
  paused: {
    configurable: true,
    get() {
      return this.__paused !== false;
    },
  },
  playbackRate: {
    configurable: true,
    get() {
      return this.__rate || 1;
    },
    set(value) {
      this.__rate = value;
      this.dispatchEvent(new Event('ratechange'));
    },
  },
});
HTMLMediaElement.prototype.pause = function () {
  this.__paused = true;
};
HTMLMediaElement.prototype.play = function () {
  this.__paused = false;
  this.dispatchEvent(new Event('play'));
  return Promise.resolve();
};
window.YT = {
  Player: class {
    constructor(mount, options) {
      this.options = options;
      this.time = 0;
      this.rate = 1;
      this.state = 2;
      window.__yt = this;
      queueMicrotask(() => options.events.onReady());
    }
    getCurrentTime() {
      return this.time;
    }
    getDuration() {
      return 10;
    }
    getPlaybackRate() {
      return this.rate;
    }
    getPlayerState() {
      return this.state;
    }
    pauseVideo() {
      this.state = 2;
    }
    setPlaybackRate(value) {
      this.rate = value;
    }
    seekTo(value) {
      this.time = value;
    }
    destroy() {}
  },
};
window.__ytEvents = [];
window.Vimeo = {
  Player: class {
    constructor() {
      this.time = 0;
      this.rate = 1;
      this.paused = true;
      this.handlers = {};
      window.__vm = this;
    }
    on(name, callback) {
      this.handlers[name] = callback;
    }
    ready() {
      return Promise.resolve();
    }
    getCurrentTime() {
      return Promise.resolve(this.time);
    }
    getDuration() {
      return Promise.resolve(10);
    }
    getPlaybackRate() {
      return Promise.resolve(this.rate);
    }
    getPaused() {
      return Promise.resolve(this.paused);
    }
    pause() {
      this.paused = true;
      return Promise.resolve();
    }
    setPlaybackRate(value) {
      this.rate = value;
      return Promise.resolve();
    }
    setCurrentTime(value) {
      this.time = value;
      return Promise.resolve();
    }
    destroy() {
      return Promise.resolve();
    }
  },
};
const materials = [
  { materialId: 'video', topicId: 'topic', type: 'VIDEO', fileUrl: '/sample.mp4', createdAt: '2026-01-01T00:00:00Z' },
  { materialId: 'reading', type: 'TEXT', createdAt: '2026-01-01T00:00:00Z' },
];
window.__materials = materials;
function App() {
  const learning = useMaterialProgress();
  useEffect(() => {
    learning.initialize(materials, {}, 'class', 'topic');
  }, []);
  window.__learning = learning;
  return (
    <>
      <output>{learning.percent}</output>
      <GuardedVideoPlayer
        material={materials[0]}
        completed={learning.completed.includes('video')}
        watchedSeconds={learning.watched.video?.seconds || 0}
        onProgress={(record) => learning.watch('video', record)}
      />
      <GuardedVideoPlayer
        material={{ materialId: 'yt', type: 'VIDEO', sourceCitation: 'https://youtu.be/abcdefghijk' }}
        onProgress={(record) => {
          window.__ytRecord = record;
          window.__ytEvents.push(record);
        }}
      />
      <GuardedVideoPlayer
        material={{ materialId: 'vm', type: 'VIDEO', sourceCitation: 'https://vimeo.com/123456' }}
        onProgress={(record) => (window.__vmRecord = record)}
      />
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
window.__tick = (time, elapsed = 1) => {
  window.__clock += elapsed * 1000;
  const video = document.querySelector('video');
  video.__time = time;
  video.dispatchEvent(new Event('timeupdate'));
};
