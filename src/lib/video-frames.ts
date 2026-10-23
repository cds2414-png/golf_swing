// 브라우저에서 동영상 길이를 읽고 프레임을 JPEG로 추출한다.

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => resolve(video);
    video.onerror = () =>
      reject(new Error("이 브라우저에서 재생할 수 없는 영상 형식이에요. MP4(H.264)로 변환해 올려 주세요."));
  });
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = time;
  });
}

export async function getVideoDuration(file: File): Promise<number> {
  const video = await loadVideo(file);
  const duration = video.duration;
  URL.revokeObjectURL(video.src);
  return duration;
}

export async function extractFrames(
  file: File,
  count: number,
  maxWidth: number,
): Promise<{ blob: Blob; time: number }[]> {
  const video = await loadVideo(file);
  const duration = video.duration;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d")!;

  const frames: { blob: Blob; time: number }[] = [];
  for (let i = 0; i < count; i++) {
    // 마지막 프레임이 영상 끝을 넘지 않도록 살짝 안쪽에서 자른다.
    const time = Math.min(duration - 0.05, (duration * i) / (count - 1));
    await seek(video, Math.max(0, time));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("프레임 추출 실패"))), "image/jpeg", 0.85),
    );
    frames.push({ blob, time: Math.max(0, time) });
  }

  URL.revokeObjectURL(video.src);
  return frames;
}
