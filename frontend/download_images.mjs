import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES = [
  // ── Level 1: Bollywood ──────────────────────────────────────────────
  { file: 'level-1-bollywood/q01.jpg', prompt: 'Cinematic movie frame of two men in a dusty Indian village 1975 action film' },
  { file: 'level-1-bollywood/q02.jpg', prompt: 'Cinematic movie frame of a man reaching out from a moving train to a woman in a yellow dress' },
  { file: 'level-1-bollywood/q03.jpg', prompt: 'Cinematic movie frame of three indian college students sitting on a water tank' },
  { file: 'level-1-bollywood/q04.jpg', prompt: 'Cinematic black and white movie frame of a beautiful indian dancer in a grand palace' },
  { file: 'level-1-bollywood/q05.jpg', prompt: 'Cinematic movie frame of a wealthy indian man drinking alcohol in a grand classic room' },
  { file: 'level-1-bollywood/q06.jpg', prompt: 'Cinematic movie frame of two indian female wrestlers in a dirt ring' },
  { file: 'level-1-bollywood/q07.jpg', prompt: 'Cinematic movie frame of an indian man and a little girl in snowy mountains' },
  { file: 'level-1-bollywood/q08.jpg', prompt: 'Cinematic movie frame of indian villagers playing cricket against british soldiers in 1890s' },
  { file: 'level-1-bollywood/q09.jpg', prompt: 'Cinematic movie frame of a young indian boy painting on a canvas in a classroom' },
  { file: 'level-1-bollywood/q10.jpg', prompt: 'Cinematic movie frame of an indian woman walking alone in paris streets' },

  // ── Level 2: Hollywood ──────────────────────────────────────────────
  { file: 'level-2-hollywood/q01.jpg', prompt: 'Cinematic movie frame of a glowing red robot eye computer in a spaceship' },
  { file: 'level-2-hollywood/q02.jpg', prompt: 'Cinematic movie frame of an italian mafia boss in a dark room wearing a tuxedo' },
  { file: 'level-2-hollywood/q03.jpg', prompt: 'Cinematic black and white movie frame of a little girl in a bright red coat' },
  { file: 'level-2-hollywood/q04.jpg', prompt: 'Cinematic movie frame of a man in a light suit sitting on a park bench with a box of chocolates' },
  { file: 'level-2-hollywood/q05.jpg', prompt: 'Cinematic movie frame of a clown villain with messy makeup standing in a city street' },
  { file: 'level-2-hollywood/q06.jpg', prompt: 'Cinematic movie frame of two men in black suits holding guns in a retro diner' },
  { file: 'level-2-hollywood/q07.jpg', prompt: 'Cinematic movie frame of a city street folding upside down in the sky' },
  { file: 'level-2-hollywood/q08.jpg', prompt: 'Cinematic movie frame of a man dodging bullets in slow motion with a green tint' },
  { file: 'level-2-hollywood/q09.jpg', prompt: 'Cinematic movie frame of an astronaut floating near a massive glowing black hole' },
  { file: 'level-2-hollywood/q10.jpg', prompt: 'Cinematic movie frame of a modern minimalist house with large glass windows at night' },

  // ── Level 3: Eyes ───────────────────────────────────────────────────
  { file: 'level-3-eyes/q01.jpg', prompt: 'Extreme close up photograph of the eyes of indian actor Shah Rukh Khan' },
  { file: 'level-3-eyes/q02.jpg', prompt: 'Extreme close up photograph of the eyes of indian actress Priyanka Chopra' },
  { file: 'level-3-eyes/q03.jpg', prompt: 'Extreme close up photograph of the eyes of actor Antony Starr as Homelander' },
  { file: 'level-3-eyes/q04.jpg', prompt: 'Extreme close up photograph of the eyes of indian actress Deepika Padukone' },
  { file: 'level-3-eyes/q05.jpg', prompt: 'Extreme close up photograph of the eyes of indian actor Ranveer Singh' },
  { file: 'level-3-eyes/q06.jpg', prompt: 'Extreme close up photograph of the eyes of indian actress Alia Bhatt' },
  { file: 'level-3-eyes/q07.jpg', prompt: 'Extreme close up photograph of the eyes of indian actor Akshay Kumar' },
  { file: 'level-3-eyes/q08.jpg', prompt: 'Extreme close up photograph of the eyes of indian actress Katrina Kaif' },
  { file: 'level-3-eyes/q09.jpg', prompt: 'Extreme close up photograph of the light green eyes of indian actor Hrithik Roshan' },
  { file: 'level-3-eyes/q10.jpg', prompt: 'Extreme close up photograph of the eyes of indian actress Kangana Ranaut' },
];

const BASE_URL = 'https://image.pollinations.ai/prompt';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'levels');

async function downloadImage(item) {
  const targetPath = path.join(ASSETS_DIR, item.file);
  const promptEncoded = encodeURIComponent(item.prompt);
  const url = `${BASE_URL}/${promptEncoded}?width=800&height=450&nologo=true`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        https.get(res.headers.location, (redirectRes) => {
          const fileStream = fs.createWriteStream(targetPath);
          redirectRes.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(targetPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => { fileStream.close(); resolve(); });
      } else {
        reject(new Error(`Failed to download ${item.file}: Status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  console.log('🎬 Generating 30 cinematic AI images for Guess the Frame...');
  for (let i = 0; i < IMAGES.length; i++) {
    const item = IMAGES[i];
    console.log(`[${i + 1}/30] Generating: ${item.file}`);
    try {
      await downloadImage(item);
      console.log(`  ✓ Success`);
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
    }
  }
  console.log('✅ All images generated and saved to public/assets/levels!');
}

run();
