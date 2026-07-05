function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
    image.src = src;
  });
}

export async function createKoalaAlpakaComposite(
  koalaSrc: string,
  alpakaSrc: string,
  size = 360,
): Promise<string> {
  const [koala, alpaka] = await Promise.all([loadImage(koalaSrc), loadImage(alpakaSrc)]);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas-Kontext nicht verfügbar");
  }

  ctx.fillStyle = "#fff7fb";
  ctx.fillRect(0, 0, size, size);

  const half = size / 2;
  ctx.drawImage(koala, 0, 0, half, size);
  ctx.drawImage(alpaka, half, 0, half, size);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half, size);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.92);
}
