export interface Station {
  id: string;
  name: string;
  streamUrl: string;
}

export const STATIONS: Station[] = [
  { id: 'rp_mellow', name: 'Yacht Rock / Mellow', streamUrl: 'https://stream.radioparadise.com/mellow-128' },
  { id: 'rp_world', name: 'Caribbean / Reggae', streamUrl: 'https://stream.radioparadise.com/world-128' },
  { id: 'beatblender', name: 'Beat Blender (Beach)', streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3' },
  { id: 'groovesalad', name: 'Groove Salad (Chill)', streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3' },
  { id: 'illstreet', name: 'Illinois St Lounge', streamUrl: 'https://ice1.somafm.com/illstreet-128-mp3' },
  { id: 'secretagent', name: 'Secret Agent (Lounge)', streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3' },
  { id: 'leftcoast', name: 'Jimmy Buffett Vibes', streamUrl: 'https://ice1.somafm.com/leftcoast-128-mp3' },
  { id: 'u80s', name: '80s Mix', streamUrl: 'https://ice1.somafm.com/u80s-128-mp3' },
  { id: 'rp_main', name: 'RP Main Mix', streamUrl: 'https://stream.radioparadise.com/mp3-128' }
];

class RadioEngine {
  public audio: HTMLAudioElement;
  public audioContext: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  public currentStationIndex: number | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous'; // Important for CORS
    
    // In many browsers, AudioContext must be resumed or created after user gesture.
    // We'll initialize it lazily when a station is actually selected.
  }

  public initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64; // gives 32 frequency bins
      this.analyser.smoothingTimeConstant = 0.8;

      this.mediaSource = this.audioContext.createMediaElementSource(this.audio);
      this.mediaSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public playStation(stationIndex: number) {
    if (stationIndex < 0 || stationIndex >= STATIONS.length) return;
    this.initContext();

    if (this.currentStationIndex === stationIndex && !this.audio.paused) return;

    this.currentStationIndex = stationIndex;
    const station = STATIONS[stationIndex];
    this.audio.src = station.streamUrl;
    this.audio.play().catch(e => console.error('Audio playback failed:', e));
  }

  public stop() {
    this.audio.pause();
    this.audio.src = '';
    this.currentStationIndex = null;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public setVolume(volume: number) {
    this.audio.volume = volume;
  }
}

export const radioEngine = new RadioEngine();
