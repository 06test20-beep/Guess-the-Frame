import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

// Set the ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// Set the ffprobe path (requires @ffprobe-installer/ffprobe which I should install)
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const router = express.Router();

const tmpDir = path.join(process.cwd(), 'tmp');
const videosDir = path.join(tmpDir, 'videos');
const framesDir = path.join(tmpDir, 'frames');

// Ensure directories exist
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/extract', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const videoPath = req.file.path;
  const jobId = path.basename(req.file.filename, path.extname(req.file.filename));
  const jobFramesDir = path.join(framesDir, jobId);
  fs.mkdirSync(jobFramesDir, { recursive: true });

  // Get duration first
  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      console.error('[FFMPEG] ffprobe error:', err);
      // Clean up video
      fs.unlinkSync(videoPath);
      return res.status(500).json({ error: 'Failed to read video metadata' });
    }

    const duration = metadata.format.duration;
    if (!duration) {
      fs.unlinkSync(videoPath);
      return res.status(500).json({ error: 'Could not determine video duration' });
    }

    // We want roughly 50 frames
    const numFrames = 50;
    // Calculate interval, but ensure we don't go below 1 second
    const interval = Math.max(1, duration / numFrames);

    console.log(`[FFMPEG] Starting extraction for ${req.file?.originalname}. Duration: ${duration}s, interval: ${interval}s`);

    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=1/${interval}`, // 1 frame every 'interval' seconds
        '-vsync vfr',
        '-q:v 5' // JPEG quality
      ])
      .output(path.join(jobFramesDir, 'frame-%03d.jpg'))
      .on('end', () => {
        console.log(`[FFMPEG] Extraction finished for job ${jobId}`);
        // Clean up original video file
        fs.unlinkSync(videoPath);

        // Read generated frames
        fs.readdir(jobFramesDir, (err, files) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to read generated frames' });
          }

          const frameUrls = files
            .filter(f => f.endsWith('.jpg'))
            .sort() // frame-001.jpg, frame-002.jpg
            .map(f => `/tmp/frames/${jobId}/${f}`);

          res.json({ frames: frameUrls, jobId });
        });
      })
      .on('error', (err) => {
        console.error('[FFMPEG] Extraction error:', err);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        res.status(500).json({ error: 'Video extraction failed' });
      })
      .run();
  });
});

// Endpoint to delete a job's frames when user is done
router.delete('/cleanup/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const jobFramesDir = path.join(framesDir, jobId);
  
  if (fs.existsSync(jobFramesDir)) {
    fs.rmSync(jobFramesDir, { recursive: true, force: true });
  }
  res.json({ success: true });
});

export default router;
