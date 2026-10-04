let youtube;
let vimeo;
export function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youtube)
    youtube = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const previous = window.onYouTubeIframeAPIReady;
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Không thể kết nối trình phát YouTube.'));
      }, 20000);
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        previous?.();
        resolve(window.YT);
      };
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Không thể tải trình phát YouTube.'));
      };
      document.head.append(script);
    }).catch((error) => {
      youtube = null;
      throw error;
    });
  return youtube;
}
export function loadVimeo() {
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
  if (!vimeo)
    vimeo = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Không thể kết nối trình phát Vimeo.'));
      }, 20000);
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => {
        clearTimeout(timeout);
        resolve(window.Vimeo);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Không thể tải trình phát Vimeo.'));
      };
      document.head.append(script);
    }).catch((error) => {
      vimeo = null;
      throw error;
    });
  return vimeo;
}
