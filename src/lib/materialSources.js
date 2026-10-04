export function videoSource(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const host = parsed.hostname.toLowerCase();
  let id;
  if (host === 'youtu.be') id = parsed.pathname.split('/')[1];
  if (
    ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(
      host
    )
  ) {
    id = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  }
  if (id && /^[\w-]{11}$/.test(id)) return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}` };
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const videoId = parsed.pathname.match(/^\/(?:video\/)?(\d+)(?:\/|$)/)?.[1];
    if (videoId) return { type: 'embed', url: `https://player.vimeo.com/video/${videoId}` };
  }
  if (/\.(mp4|webm|ogg|ogv|m4v)$/i.test(parsed.pathname)) return { type: 'video', url };
  return null;
}

export function materialSourceParts(value) {
  const text = typeof value === 'string' ? value : '';
  const parts = [];
  let offset = 0;
  for (const match of text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"']+/gi)) {
    const label = match[0].replace(/[.,;!?\)\]\}]+$/, '');
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    try {
      const url = new URL(label.startsWith('www.') ? `https://${label}` : label);
      parts.push({ text: label, url: url.href, video: videoSource(url.href) });
    } catch {
      parts.push({ text: label });
    }
    offset = match.index + label.length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}

export function materialVideoSource(material) {
  const citation = materialSourceParts(material?.sourceCitation).find((part) => part.url);
  const source = citation?.url || material?.downloadUrl || material?.fileUrl || material?.url;
  if (!source) return null;
  try {
    const url = new URL(source, 'http://local');
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const resolved = videoSource(url.href);
    return resolved?.type === 'embed' ? resolved : { type: 'video', url: source };
  } catch {
    return null;
  }
}

export function validateVideoMaterial(data, existing = {}) {
  if (data.get('type') !== 'VIDEO') return '';
  const file = data.get('file');
  if (file?.size)
    return file.type.startsWith('video/') || /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file.name)
      ? ''
      : 'Vui lòng chọn một tệp video.';
  if (materialVideoSource({ sourceCitation: data.get('sourceCitation'), fileUrl: existing.fileUrl })) return '';
  return 'Nhập đường dẫn nguồn video hoặc tải video lên.';
}
