// Fonds sonores des reels.
// Depuis le 29/10/2026 : « Floats » (Swoop), fourni par le propriétaire, pour TOUS les reels
// (KounKour et pages supplémentaires) : withTrack(). Le son généré « cristal » reste en secours.
// « cristal » : choisi le 29/10/2026 pour la page « حين تعرف الله » — une note claire et douce
// toutes les 3,5 s (ré, la, do, sol) sur une nappe très légère, avec un écho profond.
import { execFileSync } from 'node:child_process';

const CRISTAL = "0.06*sin(2*PI*146.83*t)+exp(-mod(t,3.5)/1.6)*(0.20*sin(2*PI*(587.33*lt(mod(t,14),3.5)+440*gte(mod(t,14),3.5)*lt(mod(t,14),7)+523.25*gte(mod(t,14),7)*lt(mod(t,14),10.5)+392*gte(mod(t,14),10.5))*t))";

// Écrit un fichier audio de `seconds` secondes (fondu d'entrée et de sortie, volume calme).
export function cristal(outFile, seconds) {
  const d = Math.max(6, Math.round(seconds));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc='${CRISTAL}|${CRISTAL}':s=48000:d=${d}`,
    '-af', `lowpass=f=2500,aecho=0.8:0.85:450|900|1400:0.4|0.28|0.18,afade=t=in:d=3,afade=t=out:st=${d - 4}:d=4,loudnorm=I=-24:TP=-4:LRA=6`,
    '-c:a', 'pcm_s16le', outFile]);
  return outFile;
}

// Remplace le son d'une vidéo par le fond « cristal ».
export function withCristal(videoIn, videoOut, seconds) {
  const wav = `${videoOut}.cristal.wav`;
  cristal(wav, seconds);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoIn, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', videoOut]);
  return videoOut;
}

// Morceau choisi par le propriétaire (extrait de 90 s rangé dans scripts/social/audio).
const TRACK = new URL('./audio/floats-swoop.mp3', import.meta.url).pathname;

// Remplace le son d'une vidéo par le morceau : coupé à la durée, fondu d'entrée et de sortie,
// volume doux (fond sonore, pas au premier plan).
export function withTrack(videoIn, videoOut, seconds) {
  const d = Math.max(6, Math.round(seconds * 10) / 10);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoIn, '-i', TRACK, '-map', '0:v', '-map', '1:a',
    '-af', `atrim=0:${d},afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, d - 3)}:d=3,loudnorm=I=-22:TP=-3:LRA=7`,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', videoOut]);
  return videoOut;
}
