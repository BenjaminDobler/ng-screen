import { signal } from '@angular/core';
import { VideoComponent } from '../components/video/video.component';
import { VideoService } from '../service/video.service';
import { FileData } from '@ffmpeg/ffmpeg';

export class VideoDO {
  id: string = '';
  component?: VideoComponent;

  blured = signal(false);
  blurAmount = signal(5);
  edgeBlurAmount = signal(15);
  foregroundThreshold = signal(0.5);

  backgroundType = signal<'image' | 'blur' | 'none'>('none');

  public settings: MediaTrackSettings;

  constructor(
    public stream: MediaStream,
    public device: MediaDeviceInfo | undefined,
    public type: 'webcam' | 'screen',
  ) {
    this.settings = stream.getVideoTracks()[0].getSettings();
  }
}

export class AudioDO {
  constructor(
    public stream: MediaStream,
    public device: MediaDeviceInfo,
  ) {}
}

export class ConvertedVideo {
  data = signal<Blob | null>(null);
  width = 0;
  height = 0;
  startTime?: number;
  endTime?: number;
  codec: string = '';
  progress = signal<number>(0);
  file = signal<FileData | null>(null);
  state = signal<'pending' | 'processing' | 'done' | 'error'>('pending');

  constructor() {}
}

export class Recording {
  chunks: Blob[] = [];
  name?: string;
  convertedData = signal<Blob | null>(null);
  startTime?: number;
  endTime?: number;
  duration?: number;

  convertedVideos = signal<ConvertedVideo[]>([]);

  constructor(private videoService: VideoService) {}

  getRecordingUrl() {
    console.log('chunks', this.chunks);
    const recordedBlob = new Blob(this.chunks, { type: this.chunks[0].type });
    const data = URL.createObjectURL(recordedBlob);
    return data;
  }

  getConvertedUrl(c: ConvertedVideo) {
    const blob = new Blob([(c.file() as any).buffer], { type: 'video/mp4' });
    if (blob) {
      const data = URL.createObjectURL(blob);
      return data;
    }
    return null;
  }

  download() {
    const link = document.createElement('a');
    link.href = this.getRecordingUrl();
    link.download = this.name + '.webm';
    link.dispatchEvent(new MouseEvent('click', { view: window }));
  }

  async convertRecording(settings: ExportSettingsDO) {
    await this.videoService.loadFFmpeg();
    const data = await this.videoService.convert(this.chunks, settings);
    this.convertedVideos.update((prev) => [...prev, data]);
  }

  downloadConverted(c: ConvertedVideo) {
    const link = document.createElement('a');
    const convertedUrl = this.getConvertedUrl(c);
    if (convertedUrl) {
      link.href = convertedUrl;
      link.download = this.name + '.mp4';
      link.dispatchEvent(new MouseEvent('click', { view: window }));
    }
  }
}


export interface ExportSettingsDO {
  crf: number;
  preset:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow';
  frameRate: number;
  resolutionWidth: number;
  resolutionHeight: number;
  startTime?: number;
  endTime?: number;
}