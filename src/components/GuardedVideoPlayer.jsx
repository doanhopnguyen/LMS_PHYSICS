import React, { useEffect, useMemo, useRef, useState } from 'react';
import { materialVideoSource } from '../lib/materialSources.js';
import { createVideoWatchGuard } from '../lib/videoWatchGuard.js';
import { loadYouTube, loadVimeo } from '../lib/videoPlayerApi.js';
import { AuthAlert } from './AuthLayout.jsx';

export function GuardedVideoPlayer({ material, completed = false, watchedSeconds = 0, onProgress, fill = false }) {
  const source = materialVideoSource(material);
  const native = useRef(null);
  const container = useRef(null);
  const callback = useRef(onProgress);
  callback.current = onProgress;
  const guard = useMemo(() => createVideoWatchGuard({ watched: watchedSeconds, completed }), [source?.url]);
  guard.setCompleted(completed);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const resetting = useRef(false);
  const ended = useRef(false);
  const emit = (result) => callback.current?.(result);
  function check(result, reset) {
    if (result.violation) {
      resetting.current = true;
      ended.current = false;
      setMessage((previous) => ({
        id: (previous?.id ?? 0) + 1,
        text: 'Bạn đã tua đến phần chưa xem hoặc tăng tốc phần mới. Video được đặt lại từ đầu, hãy xem lại ở tốc độ 1×.',
      }));
      emit(result);
      reset();
      return false;
    }
    emit(result);
    return true;
  }
  function finish() {
    if (!ended.current && guard.finish()) {
      ended.current = true;
      emit({ watched: guard.watched, finished: true, violation: false });
    }
  }
  function nativeReset() {
    const video = native.current;
    if (!video) return;
    video.pause();
    video.playbackRate = 1;
    video.currentTime = 0;
    if (video.currentTime <= 0.15) {
      resetting.current = false;
      guard.baseline(0);
    }
  }
  function tickNative(isEnded = false) {
    const video = native.current;
    if (!video) return;
    if (resetting.current) {
      if (video.currentTime > 0.15) return;
      resetting.current = false;
      guard.baseline(0);
    }
    if (
      check(
        guard.sample({
          time: video.currentTime,
          length: video.duration,
          rate: video.playbackRate,
          playing: isEnded || !video.paused,
        }),
        nativeReset
      ) &&
      isEnded
    )
      finish();
  }

  useEffect(() => {
    if (!source || source.type !== 'embed') return;
    let active = true;
    let player;
    let interval;
    let polling = false;
    setError('');
    ended.current = false;
    resetting.current = false;
    const mount = document.createElement('div');
    container.current.replaceChildren(mount);
    const fail = (failure) => active && setError(failure?.message || 'Không thể phát video này.');
    const youtube = new URL(source.url).hostname.includes('youtube');
    const reset = () => {
      if (youtube) {
        player.pauseVideo();
        player.setPlaybackRate(1);
        player.seekTo(0, true);
      } else Promise.all([player.pause(), player.setPlaybackRate(1), player.setCurrentTime(0)]).catch(fail);
    };
    const sample = async (forceEnded = false) => {
      if (!active || !player || polling) return;
      polling = true;
      try {
        const [time, length, rate, playing] = youtube
          ? [player.getCurrentTime(), player.getDuration(), player.getPlaybackRate(), player.getPlayerState() === 1]
          : await Promise.all([
              player.getCurrentTime(),
              player.getDuration(),
              player.getPlaybackRate(),
              player.getPaused().then((paused) => !paused),
            ]);
        if (!active) return;
        if (resetting.current) {
          if (time > 0.15) return;
          resetting.current = false;
          guard.baseline(0);
        }
        if (
          check(guard.sample({ time, length, rate, playing: forceEnded || playing }), reset) &&
          (forceEnded || (length > 0 && time >= length - 0.1))
        )
          finish();
      } catch (failure) {
        fail(failure);
      } finally {
        polling = false;
      }
    };
    (async () => {
      if (youtube) {
        const YT = await loadYouTube();
        if (!active) return;
        player = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId: new URL(source.url).pathname.split('/').pop(),
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              if (active) {
                check(guard.seek(player.getCurrentTime()), reset);
                interval = setInterval(() => sample(), 250);
              }
            },
            onStateChange: (event) => {
              if (active && event.data === 0) sample(true);
            },
            onPlaybackRateChange: (event) => {
              if (active && !resetting.current) check(guard.rate(event.data, player.getCurrentTime()), reset);
            },
            onError: () => fail(new Error('Không thể phát video YouTube này.')),
          },
        });
      } else {
        const Vimeo = await loadVimeo();
        if (!active) return;
        player = new Vimeo.Player(mount, {
          id: Number(new URL(source.url).pathname.split('/').pop()),
          width: '100%',
          height: '100%',
          dnt: true,
        });
        player.on('seeking', ({ seconds }) => {
          if (active && !resetting.current) check(guard.seek(seconds), reset);
        });
        player.on('playbackratechange', ({ playbackRate }) => {
          if (active && !resetting.current)
            player
              .getCurrentTime()
              .then((time) => active && check(guard.rate(playbackRate, time), reset))
              .catch(fail);
        });
        player.on('ended', () => sample(true));
        player.on('error', fail);
        await player.ready();
        if (active) {
          check(guard.seek(await player.getCurrentTime()), reset);
          interval = setInterval(() => sample(), 250);
        }
      }
    })().catch(fail);
    return () => {
      active = false;
      clearInterval(interval);
      if (player) {
        const disposed = youtube ? player.destroy() : player.destroy();
        disposed?.catch?.(() => {});
      }
    };
  }, [source?.url, attempt, guard]);

  if (!source) return <p className="p-4 text-slate-500">Video bài giảng chưa được cung cấp.</p>;
  return (
    <div className={fill ? 'flex min-h-0 w-full flex-1 flex-col' : 'space-y-2'}>
      {message && (
        <AuthAlert key={message.id} error>
          {message.text}
        </AuthAlert>
      )}
      {error && (
        <div role="alert" className="p-3 text-primary">
          {error}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setError('');
              setAttempt((value) => value + 1);
              native.current?.load();
            }}
          >
            Thử lại
          </button>
        </div>
      )}
      {source.type === 'embed' ? (
        <div
          ref={container}
          className={`guarded-video-embed ${fill ? 'min-h-0 flex-1' : 'aspect-video'} w-full overflow-hidden bg-slate-950`}
        />
      ) : (
        <video
          key={source.url}
          ref={native}
          aria-label={material.title || 'Video bài giảng'}
          src={source.url}
          controls
          playsInline
          preload="metadata"
          className={fill ? 'min-h-0 w-full flex-1' : 'aspect-video w-full rounded-xl bg-slate-950'}
          onPlay={() => guard.baseline(native.current.currentTime)}
          onTimeUpdate={() => tickNative()}
          onEnded={() => tickNative(true)}
          onSeeking={() => {
            if (!resetting.current) check(guard.seek(native.current.currentTime), nativeReset);
          }}
          onRateChange={() => {
            if (!resetting.current)
              check(guard.rate(native.current.playbackRate, native.current.currentTime), nativeReset);
          }}
          onError={() => setError('Không thể phát video bài giảng.')}
        />
      )}
    </div>
  );
}
