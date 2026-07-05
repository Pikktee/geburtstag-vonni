import { config } from "dotenv";
import { fal } from "@fal-ai/client";
import { mkdir, writeFile, access } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { Readable } from "node:stream";

config();

const ASSETS_DIR = path.resolve("public/assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, "manifest.json");

const IMAGE_TARGETS = [
  {
    id: "bielefeld",
    prompt:
      "Bielefeld Germany city center Sparrenburg landmark, travel postcard style, slightly oversaturated, ironic tourist brochure aesthetic, photorealistic",
  },
  {
    id: "beirut",
    prompt:
      "Beirut Lebanon Mediterranean skyline at golden hour, travel poster style, vibrant colors, photorealistic cityscape",
  },
  {
    id: "sauna",
    prompt:
      "Luxurious Finnish sauna landscape with steam, wooden interior and outdoor snow, spa wellness atmosphere, warm cinematic lighting",
  },
  {
    id: "ao-hotel",
    prompt:
      "Budget A&O hostel hotel exterior at night with neon sign, cheap travel accommodation, slightly tacky promotional photo style",
  },
  {
    id: "absteige",
    prompt:
      "Run-down sketchy motel room, broken furniture, flickering neon through window, ironic sleazy travel aesthetic, cinematic",
  },
  {
    id: "love-hotel",
    prompt:
      "Japanese love hotel exterior at night, pink neon hearts, ironic romantic getaway vibe, cinematic urban night photo",
  },
  {
    id: "niedwald",
    prompt:
      "Niedwald forest near Frankfurt Germany, autumn forest path, golden leaves, peaceful nature trail, photorealistic",
  },
  {
    id: "thai-beach",
    prompt:
      "Thailand tropical beach paradise, turquoise water, limestone cliffs, palm trees, sunset, dreamy travel poster style",
  },
  {
    id: "koala",
    prompt:
      "Cute cartoon koala character with pink bow in hair, birthday party hat, kawaii style illustration on pastel background",
  },
  {
    id: "alpaka",
    prompt:
      "Cute cartoon alpaca character with party confetti, friendly birthday mascot, kawaii style illustration on pastel background",
  },
  {
    id: "koala-alpaka-frankfurt",
    image_size: "square_hd" as const,
    prompt:
      "Heartwarming portrait photograph of an adorable koala with a pink ribbon bow on its head standing beside a fluffy alpaca, both facing the camera like a romantic couple portrait, Frankfurt Germany skyline with Commerzbank Tower and Main river in soft golden-hour bokeh background, warm cinematic lighting, shallow depth of field, photorealistic professional photography",
  },
] as const;

const AUDIO_TARGETS = [
  {
    id: "birthday-soundtrack",
    type: "music" as const,
    prompt:
      "Playful quirky birthday party soundtrack, bouncy ukulele and glockenspiel, light accordion, funny infomercial energy, warm and joyful, koala party vibe, loop-friendly, 55 seconds",
    durationMs: 55000,
  },
  {
    id: "firework-whistle",
    type: "sfx" as const,
    prompt: "Firework rocket whistle launching into the sky, rising pitch, short",
    duration: 1.5,
  },
  {
    id: "firework-crackle",
    type: "sfx" as const,
    prompt: "Colorful firework burst explosion crackle pop, festive celebration, medium intensity",
    duration: 2.5,
  },
  {
    id: "firework-glitter",
    type: "sfx" as const,
    prompt: "Magical glitter sparkles shimmering tail after firework, twinkling fairy dust fade out",
    duration: 2.5,
  },
  {
    id: "firework-finale",
    type: "sfx" as const,
    prompt: "Grand firework finale multiple big booms layered, spectacular celebration climax",
    duration: 3.5,
  },
  {
    id: "firework-heart",
    type: "sfx" as const,
    prompt: "Soft romantic firework pop with gentle sparkle, pink celebration puff, cute and warm",
    duration: 2,
  },
  {
    id: "party-whoosh",
    type: "sfx" as const,
    prompt: "Fun party whoosh swoosh transition, cartoon celebration sweep, upbeat",
    duration: 1.5,
  },
  {
    id: "confetti-pop",
    type: "sfx" as const,
    prompt: "Party horn and confetti cannon pop, festive celebration sound effect",
    duration: 2,
  },
  {
    id: "win-fanfare",
    type: "sfx" as const,
    prompt:
      "Cheesy game show winner fanfare, triumphant brass horns, you have won jackpot sound, tacky TV commercial",
    duration: 3,
  },
  {
    id: "cash-register",
    type: "sfx" as const,
    prompt: "Old cash register cha-ching sound, slot machine win ding, commercial success sound",
    duration: 2,
  },
  {
    id: "magic-sparkle",
    type: "sfx" as const,
    prompt: "Magical verification success sparkle chime, cute positive ding, identity confirmed sound",
    duration: 2,
  },
];

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, dest: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${url} (${response.status})`);
  }
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(dest));
}

async function generateImage(
  id: string,
  prompt: string,
  imageSize: "landscape_4_3" | "square_hd" = "landscape_4_3",
) {
  const dest = path.join(ASSETS_DIR, "images", `${id}.jpg`);
  if (await fileExists(dest)) {
    console.log(`✓ Bild bereits vorhanden: ${id}`);
    return `/assets/images/${id}.jpg`;
  }

  console.log(`⏳ Generiere Bild: ${id}...`);
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: imageSize,
      num_inference_steps: 4,
      num_images: 1,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach((msg) => console.log(`  ${msg}`));
      }
    },
  });

  const imageUrl = result.data.images?.[0]?.url;
  if (!imageUrl) throw new Error(`Kein Bild für ${id}`);
  await downloadFile(imageUrl, dest);
  console.log(`✓ Bild gespeichert: ${id}`);
  return `/assets/images/${id}.jpg`;
}

async function generateMusic(id: string, prompt: string, durationMs: number, force = false) {
  const dest = path.join(ASSETS_DIR, "audio", `${id}.mp3`);
  if (!force && (await fileExists(dest))) {
    console.log(`✓ Musik bereits vorhanden: ${id}`);
    return `/assets/audio/${id}.mp3`;
  }

  const apiKey = process.env.ELEVEN_LABS_KEY;
  if (!apiKey) throw new Error("ELEVEN_LABS_KEY fehlt");

  console.log(`⏳ Generiere Musik: ${id}...`);
  const response = await fetch(
    "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: durationMs,
        model_id: "music_v1",
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ElevenLabs Musik fehlgeschlagen (${response.status}): ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(dest, buffer);
  console.log(`✓ Musik gespeichert: ${id}`);
  return `/assets/audio/${id}.mp3`;
}

async function generateSfx(id: string, prompt: string, duration: number, force = false) {
  const dest = path.join(ASSETS_DIR, "audio", `${id}.mp3`);
  if (!force && (await fileExists(dest))) {
    console.log(`✓ SFX bereits vorhanden: ${id}`);
    return `/assets/audio/${id}.mp3`;
  }

  const apiKey = process.env.ELEVEN_LABS_KEY;
  if (!apiKey) throw new Error("ELEVEN_LABS_KEY fehlt");

  console.log(`⏳ Generiere SFX: ${id}...`);
  const response = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        prompt_influence: 0.7,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ElevenLabs SFX fehlgeschlagen (${response.status}): ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(dest, buffer);
  console.log(`✓ SFX gespeichert: ${id}`);
  return `/assets/audio/${id}.mp3`;
}

async function main() {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY fehlt in .env");
  fal.config({ credentials: process.env.FAL_KEY });

  const forceAudio = process.argv.includes("--force-audio");
  if (forceAudio) console.log("🔊 Audio wird neu generiert (--force-audio)\n");

  await mkdir(path.join(ASSETS_DIR, "images"), { recursive: true });
  await mkdir(path.join(ASSETS_DIR, "audio"), { recursive: true });

  const manifest: {
    images: Record<string, string>;
    audio: Record<string, string>;
    generatedAt: string;
  } = {
    images: {},
    audio: {},
    generatedAt: new Date().toISOString(),
  };

  for (const target of IMAGE_TARGETS) {
    manifest.images[target.id] = await generateImage(
      target.id,
      target.prompt,
      "image_size" in target ? target.image_size : "landscape_4_3",
    );
  }

  for (const target of AUDIO_TARGETS) {
    if (target.type === "music") {
      manifest.audio[target.id] = await generateMusic(
        target.id,
        target.prompt,
        target.durationMs,
        forceAudio,
      );
    } else {
      manifest.audio[target.id] = await generateSfx(
        target.id,
        target.prompt,
        target.duration,
        forceAudio,
      );
    }
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log("\n🎉 Alle Assets generiert!");
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
