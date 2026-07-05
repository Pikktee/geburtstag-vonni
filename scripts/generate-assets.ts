import { config } from "dotenv";
import { fal } from "@fal-ai/client";
import { mkdir, writeFile, access, unlink, mkdtemp, rm, copyFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

config();

const ASSETS_DIR = path.resolve("public/assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, "manifest.json");
const CUSTOM_VOCAL_WAV = path.resolve("allesliebezumgeburtstag.wav");
const INTRO_INSTRUMENTAL_PATH = path.join(ASSETS_DIR, "audio", "birthday-intro-jingle-instrumental.mp3");
const INTRO_INSTRUMENTAL_LEGACY_PATH = path.join(ASSETS_DIR, "audio", "birthday-music.mp3");
const CUSTOM_VOCAL_MIX_VOLUME = 1.7;
const CUSTOM_INSTRUMENTAL_MIX_VOLUME = 0.68;
const CUSTOM_VOCAL_START_SEC = 3.2;
/** Pro erkanntem Sprach-Abschnitt wechselnde Cartoon-Tonlage (×). */
const SEGMENT_PITCH_FACTORS = [1.55, 1.2, 1.65, 1.32, 1.48] as const;
const SEGMENT_VIBRATO = [
  { f: 7.4, d: 0.34 },
  { f: 5.2, d: 0.26 },
  { f: 8.2, d: 0.4 },
  { f: 6.0, d: 0.3 },
] as const;

/** TTS: „W“ im Deutschen = leichtes V/W am Anfang von Wonnilein */
const INTRO_VOCAL_LINE =
  "Alles Gute zum Geburtstag!<break time=\"0.35s\" /> Wonnilein!";
const INTRO_VOCAL_TIMES_SEC = [2.5, 11.5, 20.5] as const;
const INTRO_INSTRUMENTAL_PROMPT =
  "Quirky eccentric 16-bit chiptune birthday instrumental, retro SNES and Mega Drive, unusual syncopations, catchy square-wave melody, fat bassline, absurd experimental party groove, offbeat freaky nostalgic vibe, STRICTLY INSTRUMENTAL absolutely no vocals no singing no voice no choir no lyrics, 30 seconds";
/** Warme deutsche Stimme — klare Aussprache */
const DEFAULT_TTS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

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
    id: "birthday-intro-jingle",
    type: "intro-composite" as const,
    durationMs: 30000,
  },
  {
    id: "birthday-finale-jingle",
    type: "music" as const,
    prompt:
      "Herzlicher romantischer Geburtstags-Abschluss-Jingle, 24 Sekunden, sanfte Musicbox und warme Glockenspiel-Melodie mit zartem Chiptune-Glanz, emotionaler Filmfinale-Überraschungsmoment, instrumental keine Vocals, zärtlich überraschend schön, langsamer warmer Ausklang, deutlich hörbar und melodisch",
    durationMs: 24000,
  },
  {
    id: "birthday-soundtrack",
    type: "music" as const,
    prompt:
      "Deutsche Geburtstags-Hintergrundmusik, verspieltes Akkordeon und Ukulele mit leichtem Polka-Groove, skurriler Werbesendungs- und Geschenk-Party-Vibe, fröhlich und warm, strikt instrumental, keinerlei Gesang, keine Lyrics, kein Englisch, keine indischen oder fremdsprachigen Vocals, nahtlos loopbar, 55 Sekunden",
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
    prompt:
      "Single clean party horn toot, smooth soft attack no click no pop, classic plastic birthday blower horn, one warm punchy celebratory honk, studio clean",
    duration: 1.4,
  },
  {
    id: "party-horn-2",
    type: "sfx" as const,
    prompt:
      "Playful double party horn toot-toot, smooth attack no harsh transient, cartoon birthday horn two gentle honks, clean festive plastic horn",
    duration: 1.5,
  },
  {
    id: "party-horn-3",
    type: "sfx" as const,
    prompt:
      "Festive party horn trill, smooth entry warm vibrato toot, carnival birthday horn wobble, joyful clean celebration honk no click",
    duration: 2,
  },
  {
    id: "ui-click",
    type: "sfx" as const,
    prompt:
      "Soft subtle UI button click, gentle retro 16-bit game menu blip, pleasant tactile feedback, short crisp tick, quiet friendly, not harsh",
    duration: 0.5,
  },
  {
    id: "decline-whaaat",
    type: "sfx" as const,
    prompt:
      "Exaggerated comedic cartoon voice gasping Whaaaat in shocked disbelief, funny surprised reaction, short punchy, slapstick comedy, no music",
    duration: 1.6,
  },
  {
    id: "decline-zonk",
    type: "sfx" as const,
    prompt:
      "Cartoon comedy zonk bonk sound, hollow metal bowl bonk on head, game show wrong answer fail sting, silly slapstick punchline, short",
    duration: 1.4,
  },
  {
    id: "warning-alert",
    type: "sfx" as const,
    prompt:
      "Urgent identity check alarm siren, three pulsing red-alert warning beeps in a row, security verification alarm, attention-grabbing cartoon danger signal, clear rhythmic pulses, not horror, 1.6 seconds",
    duration: 1.6,
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

async function runFfmpeg(args: string[]) {
  await execFileAsync("ffmpeg", ["-y", ...args], { stdio: "pipe" });
}

function getElevenLabsKey() {
  const apiKey = process.env.ELEVEN_LABS_KEY;
  if (!apiKey) throw new Error("ELEVEN_LABS_KEY fehlt");
  return apiKey;
}

async function getAudioDurationSec(file: string, padSec = 0): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const duration = Number.parseFloat(stdout.trim());
  return Number.isFinite(duration) ? duration + padSec : 3.5;
}

type VocalSegment = { startSec: number; endSec: number };

function mergeCloseVocalSegments(segments: VocalSegment[], maxGapSec = 0.9): VocalSegment[] {
  if (segments.length === 0) return segments;

  const merged: VocalSegment[] = [{ ...segments[0] }];
  for (let i = 1; i < segments.length; i += 1) {
    const prev = merged[merged.length - 1];
    const current = segments[i];
    if (current.startSec - prev.endSec <= maxGapSec) {
      prev.endSec = current.endSec;
    } else {
      merged.push({ ...current });
    }
  }

  return merged.filter((segment) => segment.endSec - segment.startSec >= 0.4);
}

function parseSpeechSegmentsFromSilenceDetect(stderr: string, totalDuration: number): VocalSegment[] {
  const events: { type: "start" | "end"; t: number }[] = [];

  for (const line of stderr.split("\n")) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);
    if (startMatch) events.push({ type: "start", t: Number.parseFloat(startMatch[1]) });
    if (endMatch) events.push({ type: "end", t: Number.parseFloat(endMatch[1]) });
  }

  events.sort((a, b) => a.t - b.t);

  const speech: VocalSegment[] = [];
  let cursor = 0;

  for (const event of events) {
    if (event.type === "start" && event.t > cursor + 0.05) {
      speech.push({ startSec: cursor, endSec: event.t });
    }
    if (event.type === "end") cursor = event.t;
  }

  if (cursor < totalDuration - 0.05) {
    speech.push({ startSec: cursor, endSec: totalDuration });
  }

  return speech;
}

async function detectVocalSegments(sourcePath: string): Promise<VocalSegment[]> {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    ["-hide_banner", "-i", sourcePath, "-af", "silencedetect=noise=-36dB:d=0.28", "-f", "null", "-"],
    { maxBuffer: 4 * 1024 * 1024 },
  );
  const duration = await getAudioDurationSec(sourcePath);
  return mergeCloseVocalSegments(parseSpeechSegmentsFromSilenceDetect(stderr, duration));
}

async function prepareCustomVocalFull(sourceWav: string, destMp3: string) {
  await runFfmpeg([
    "-i",
    sourceWav,
    "-af",
    [
      "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,",
      "highpass=f=70,lowpass=f=14000,",
      "acompressor=threshold=-22dB:ratio=5:attack=5:release=95,",
      "volume=3.1",
    ].join(""),
    "-ar",
    "44100",
    "-ac",
    "1",
    destMp3,
  ]);
}

/** Fallback: einheitlicher Cartoon-Effekt auf die ganze Spur. */
async function applyMickeyMouseVocal(source: string, dest: string) {
  await runFfmpeg([
    "-i",
    source,
    "-af",
    [
      "asetrate=44100*1.4,aresample=44100,",
      "vibrato=f=6.8:d=0.34,",
      "tremolo=f=9:d=0.18,",
      "highpass=f=95,lowpass=f=13000,",
      "equalizer=f=2600:width_type=o:width=2:g=2.2,",
      "acompressor=threshold=-19dB:ratio=3.2:attack=4:release=75:makeup=2,",
      "alimiter=limit=0.92,",
      "volume=1.15",
    ].join(""),
    dest,
  ]);
}

/** Pro Sprach-Abschnitt eigene Tonhöhe — erkannt per Stille-Analyse. */
async function applySegmentedCartoonVocal(
  source: string,
  dest: string,
  segments: VocalSegment[],
) {
  if (segments.length === 0) {
    await applyMickeyMouseVocal(source, dest);
    return;
  }

  const filters: string[] = [];
  const mixInputs: string[] = [];

  segments.forEach((segment, index) => {
    const pitch = SEGMENT_PITCH_FACTORS[index % SEGMENT_PITCH_FACTORS.length];
    const vibrato = SEGMENT_VIBRATO[index % SEGMENT_VIBRATO.length];
    const delayMs = Math.round(segment.startSec * 1000);
    const tag = `seg${index}`;

    console.log(
      `  Stimme Abschnitt ${index + 1}: ${segment.startSec.toFixed(1)}s–${segment.endSec.toFixed(1)}s (Tonhöhe ×${pitch.toFixed(2)})`,
    );

    filters.push(
      `[0:a]atrim=start=${segment.startSec.toFixed(3)}:end=${segment.endSec.toFixed(3)},asetpts=PTS-STARTPTS,asetrate=44100*${pitch.toFixed(3)},aresample=44100,vibrato=f=${vibrato.f}:d=${vibrato.d},highpass=f=95,lowpass=f=13000[t${index}]`,
    );
    filters.push(`[t${index}]adelay=${delayMs}|${delayMs}[${tag}]`);
    mixInputs.push(`[${tag}]`);
  });

  filters.push(
    `${mixInputs.join("")}amix=inputs=${segments.length}:duration=longest:dropout_transition=0:normalize=0,acompressor=threshold=-18dB:ratio=3:attack=4:release=80:makeup=2,alimiter=limit=0.92,volume=1.08[v]`,
  );

  await runFfmpeg(["-i", source, "-filter_complex", filters.join(";"), "-map", "[v]", dest]);
}

async function ensureIntroInstrumental(workDir: string, forceRegenerate: boolean): Promise<string> {
  if (!forceRegenerate && (await fileExists(INTRO_INSTRUMENTAL_PATH))) {
    console.log("✓ Nutze gespeichertes Intro-Instrumental");
    return INTRO_INSTRUMENTAL_PATH;
  }

  if (!forceRegenerate && (await fileExists(INTRO_INSTRUMENTAL_LEGACY_PATH))) {
    await copyFile(INTRO_INSTRUMENTAL_LEGACY_PATH, INTRO_INSTRUMENTAL_PATH);
    console.log("✓ Intro-Instrumental aus birthday-music.mp3 wiederhergestellt");
    return INTRO_INSTRUMENTAL_PATH;
  }

  const generatedPath = path.join(workDir, "instrumental.mp3");
  console.log("⏳ Generiere neues Intro-Instrumental (16-Bit, ohne Gesang)...");
  await generateMusic(
    "birthday-intro-jingle-instrumental",
    INTRO_INSTRUMENTAL_PROMPT,
    30_000,
    true,
    generatedPath,
  );
  await copyFile(generatedPath, INTRO_INSTRUMENTAL_PATH);
  console.log("✓ Intro-Instrumental gespeichert: birthday-intro-jingle-instrumental");
  return generatedPath;
}

async function generateTtsVocal(dest: string, text: string) {
  const apiKey = getElevenLabsKey();
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID ?? DEFAULT_TTS_VOICE_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        language_code: "de",
        voice_settings: {
          stability: 0.58,
          similarity_boost: 0.88,
          style: 0.42,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs TTS fehlgeschlagen (${response.status}): ${body}`);
  }

  await writeFile(dest, Buffer.from(await response.arrayBuffer()));
}

async function applyGentleVocoderVocal(source: string, dest: string, carrierHz: number) {
  const duration = await getAudioDurationSec(source, 0.35);
  const carrierExpr = [
    `0.48*sin(2*PI*${carrierHz}*t)`,
    `0.32*sin(2*PI*${carrierHz * 2}*t)`,
    `0.2*sin(2*PI*${carrierHz * 3}*t)`,
  ].join("+");

  await runFfmpeg([
    "-i",
    source,
    "-f",
    "lavfi",
    "-i",
    `aevalsrc='${carrierExpr}':duration=${duration.toFixed(2)}:sample_rate=44100`,
    "-filter_complex",
    [
      "[0:a]asplit=2[dry][mod];",
      "[dry]highpass=f=80,lowpass=f=10000,",
      "equalizer=f=2200:width_type=o:width=2:g=2,volume=0.5[d];",
      "[mod]highpass=f=130,lowpass=f=4400,",
      "compand=attacks=0.02:decays=0.11:points=-80/-80|-38/-14|-14/-4|0/-1,",
      "volume=2.3[m];",
      "[1:a]volume=0.4[c];",
      "[m][c]amultiply,lowpass=f=3500,highpass=f=160,",
      "equalizer=f=1050:width_type=o:width=2:g=6,",
      "equalizer=f=2000:width_type=o:width=2:g=3,",
      "volume=1.05[vo];",
      "[d][vo]amix=inputs=2:duration=first:normalize=0,",
      "alimiter=limit=0.93,volume=1.6[v]",
    ].join(""),
    "-map",
    "[v]",
    dest,
  ]);
}

async function generateBirthdayIntroJingle(force = false, forceInstrumental = false) {
  const dest = path.join(ASSETS_DIR, "audio", "birthday-intro-jingle.mp3");
  if (!force && (await fileExists(dest))) {
    console.log("✓ Intro-Jingle bereits vorhanden: birthday-intro-jingle");
    return `/assets/audio/birthday-intro-jingle.mp3`;
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "vonni-intro-"));
  const vocalPaths: string[] = [];
  const styledVocalPaths: string[] = [];
  let instrumentalPath = "";

  try {
    instrumentalPath = await ensureIntroInstrumental(workDir, forceInstrumental);

    const hasCustomVocal = await fileExists(CUSTOM_VOCAL_WAV);
    const carrierNotes = [172, 188, 180];

    if (hasCustomVocal) {
      console.log(`⏳ Nutze komplette Aufnahme: ${path.basename(CUSTOM_VOCAL_WAV)}`);
      const preparedVocal = path.join(workDir, "vocal-custom-prepared.mp3");
      const styledVocal = path.join(workDir, "vocal-custom-mickey.mp3");
      await prepareCustomVocalFull(CUSTOM_VOCAL_WAV, preparedVocal);
      const vocalSegments = await detectVocalSegments(preparedVocal);
      console.log(`⏳ ${vocalSegments.length} Sprach-Abschnitt(e) erkannt — variiere Tonhöhe pro Abschnitt…`);
      await applySegmentedCartoonVocal(preparedVocal, styledVocal, vocalSegments);
      vocalPaths.push(preparedVocal, styledVocal);
      styledVocalPaths.push(styledVocal);

      const startMs = Math.round(CUSTOM_VOCAL_START_SEC * 1000);
      const filterComplex = `[0:a]volume=${CUSTOM_INSTRUMENTAL_MIX_VOLUME}[bg];[1:a]adelay=${startMs}|${startMs},volume=${CUSTOM_VOCAL_MIX_VOLUME}[v];[bg][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`;

      console.log("⏳ Mische Intro-Jingle (Instrumental + deine Stimme)...");
      await runFfmpeg([
        "-i",
        instrumentalPath,
        "-i",
        styledVocal,
        "-filter_complex",
        filterComplex,
        "-map",
        "[out]",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        dest,
      ]);
    } else {
      console.log("⏳ Generiere Vocals per TTS (keine allesliebezumgeburtstag.wav gefunden)...");
      for (let i = 0; i < 3; i += 1) {
        const rawVocal = path.join(workDir, `vocal-${i}.mp3`);
        const styledVocal = path.join(workDir, `vocal-${i}-fx.mp3`);
        await generateTtsVocal(rawVocal, INTRO_VOCAL_LINE);
        await applyGentleVocoderVocal(rawVocal, styledVocal, carrierNotes[i] ?? 180);
        vocalPaths.push(rawVocal);
        styledVocalPaths.push(styledVocal);
      }

      console.log("⏳ Mische Intro-Jingle...");
      const delayFilters = INTRO_VOCAL_TIMES_SEC.map(
        (seconds, index) =>
          `[${index + 1}:a]adelay=${Math.round(seconds * 1000)}|${Math.round(seconds * 1000)},volume=1.95[v${index}]`,
      ).join(";");
      const mixInputs = styledVocalPaths.map((_, index) => `[v${index}]`).join("");
      const filterComplex = `[0:a]volume=0.78[bg];${delayFilters};[bg]${mixInputs}amix=inputs=4:duration=first:dropout_transition=2:normalize=0[out]`;

      await runFfmpeg([
        "-i",
        instrumentalPath,
        ...styledVocalPaths.flatMap((p) => ["-i", p]),
        "-filter_complex",
        filterComplex,
        "-map",
        "[out]",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        dest,
      ]);
    }

    console.log("✓ Intro-Jingle gespeichert: birthday-intro-jingle");
    return `/assets/audio/birthday-intro-jingle.mp3`;
  } finally {
    const tempFiles = [
      ...(instrumentalPath.startsWith(workDir) ? [instrumentalPath] : []),
      ...vocalPaths,
      ...styledVocalPaths,
    ];
    await Promise.all(tempFiles.map((file) => unlink(file).catch(() => undefined)));
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function generateMusic(
  id: string,
  prompt: string,
  durationMs: number,
  force = false,
  destOverride?: string,
) {
  const dest = destOverride ?? path.join(ASSETS_DIR, "audio", `${id}.mp3`);
  if (!force && !destOverride && (await fileExists(dest))) {
    console.log(`✓ Musik bereits vorhanden: ${id}`);
    return `/assets/audio/${id}.mp3`;
  }

  const apiKey = getElevenLabsKey();

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
  if (!destOverride) console.log(`✓ Musik gespeichert: ${id}`);
  return destOverride ? dest : `/assets/audio/${id}.mp3`;
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
  const forceMusic = process.argv.includes("--force-music");
  const onlyIndex = process.argv.indexOf("--only");
  const onlyIds =
    onlyIndex >= 0
      ? new Set(
          process.argv
            .slice(onlyIndex + 1)
            .filter((arg) => !arg.startsWith("--"))
            .flatMap((arg) => arg.split(",")),
        )
      : null;

  if (forceAudio) console.log("🔊 Audio wird neu generiert (--force-audio)\n");
  if (forceMusic) console.log("🎵 Musik wird neu generiert (--force-music)\n");
  if (onlyIds?.size) console.log(`🎯 Nur: ${[...onlyIds].join(", ")}\n`);

  const shouldProcess = (id: string) => !onlyIds?.size || onlyIds.has(id);
  const shouldForceAudio = (id: string) => forceAudio || Boolean(onlyIds?.has(id));
  const shouldForceMusic = (id: string) => forceMusic || Boolean(onlyIds?.has(id));

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
    if (!shouldProcess(target.id)) continue;
    manifest.images[target.id] = await generateImage(
      target.id,
      target.prompt,
      "image_size" in target ? target.image_size : "landscape_4_3",
    );
  }

  for (const target of AUDIO_TARGETS) {
    if (!shouldProcess(target.id)) continue;
    if (target.type === "intro-composite") {
      const wantsInstrumentalOnly = Boolean(onlyIds?.has("birthday-intro-jingle-instrumental"));
      if (!shouldProcess(target.id) && !wantsInstrumentalOnly) continue;

      const forceIntro =
        shouldForceMusic(target.id) ||
        shouldForceAudio(target.id) ||
        wantsInstrumentalOnly;
      const forceInstrumental = forceMusic || wantsInstrumentalOnly;

      manifest.audio[target.id] = await generateBirthdayIntroJingle(forceIntro, forceInstrumental);
    } else if (target.type === "music") {
      manifest.audio[target.id] = await generateMusic(
        target.id,
        target.prompt,
        target.durationMs,
        shouldForceMusic(target.id),
      );
    } else {
      manifest.audio[target.id] = await generateSfx(
        target.id,
        target.prompt,
        target.duration,
        shouldForceAudio(target.id),
      );
    }
  }

  if (onlyIds?.size) {
    const existing = await import("node:fs/promises").then((fs) =>
      fs.readFile(MANIFEST_PATH, "utf8").then((raw) => JSON.parse(raw) as typeof manifest).catch(() => null),
    );
    if (existing) {
      manifest.images = { ...existing.images, ...manifest.images };
      manifest.audio = { ...existing.audio, ...manifest.audio };
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
