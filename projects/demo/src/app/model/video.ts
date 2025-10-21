import { signal } from '@angular/core';
import { VideoComponent } from '../components/video/video.component';
import { VideoService } from '../service/video.service';

export class VideoDO {
  id: string = '';
  component?: VideoComponent;

  blured = signal(false);
  blurAmount = signal(5);
  edgeBlurAmount = signal(15);
  foregroundThreshold = signal(0.5);

  backgroundType = signal<'image' | 'blur' | 'none'>('none');

  public settings: MediaTrackSettings;

  constructor(public stream: MediaStream, public device: MediaDeviceInfo | undefined, public type: 'webcam' | 'screen') {
    this.settings = stream.getVideoTracks()[0].getSettings();
  }
}

export class AudioDO {

  constructor(public stream: MediaStream, public device: MediaDeviceInfo) {}
}

export class Recording {
  chunks: Blob[] = [];
  name?: string;
  convertedData = signal<Blob | null>(null);
  startTime?: number;
  endTime?: number;
  duration?: number;

  constructor(private videoService: VideoService) {}

  getRecordingUrl() {
    console.log('chunks', this.chunks);
    const recordedBlob = new Blob(this.chunks, { type: this.chunks[0].type });
    const data = URL.createObjectURL(recordedBlob);
    return data;
  }

  getConvertedUrl() {
    const blobData = this.convertedData();
    if (blobData) {
      const data = URL.createObjectURL(blobData);
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

  async convertRecording() {
    await this.videoService.loadFFmpeg();
    const data = await this.videoService.convert(this.chunks);
    if (data) {
      const blob = new Blob([(data as any).buffer], { type: 'video/mp4' });
      this.convertedData.set(blob);
    }
    console.log('conversion done!');
    return data;
  }
}
