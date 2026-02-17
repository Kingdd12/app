
// Simple synth for game sound effects without external assets
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, startTime: number, vol: number = 0.1) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playSound = (type: 'move' | 'roll' | 'capture' | 'win' | 'ui') => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;

  switch (type) {
    case 'move':
      createOscillator('sine', 400, 0.1, t);
      createOscillator('triangle', 600, 0.05, t + 0.05);
      break;
    case 'roll':
      // Rattle sound
      for(let i=0; i<5; i++) {
          createOscillator('square', 200 + Math.random()*200, 0.05, t + i*0.06, 0.05);
      }
      break;
    case 'capture':
      createOscillator('sawtooth', 150, 0.3, t, 0.2);
      createOscillator('square', 100, 0.4, t, 0.2);
      // Noise burst simulation using multiple oscillators
      createOscillator('sawtooth', 80, 0.4, t, 0.3);
      break;
    case 'win':
      createOscillator('triangle', 523.25, 0.2, t);       // C5
      createOscillator('triangle', 659.25, 0.2, t + 0.1); // E5
      createOscillator('triangle', 783.99, 0.2, t + 0.2); // G5
      createOscillator('triangle', 1046.50, 0.4, t + 0.3);// C6
      break;
    case 'ui':
      createOscillator('sine', 800, 0.05, t, 0.05);
      break;
  }
};
