export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const secs = `${whole % 60}`.padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function getViewTransform(viewWidth, viewHeight, world) {
  const scale = Math.max(viewWidth / world.width, viewHeight / world.height);
  return {
    scale,
    offsetX: (viewWidth - world.width * scale) * 0.5,
    offsetY: (viewHeight - world.height * scale) * 0.5
  };
}

export function worldFromPointer(event, canvas, world) {
  const rect = canvas.getBoundingClientRect();
  const { scale, offsetX, offsetY } = getViewTransform(rect.width, rect.height, world);
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale
  };
}
