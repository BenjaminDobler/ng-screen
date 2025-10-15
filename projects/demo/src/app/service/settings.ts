import { Injectable, signal } from '@angular/core';
import { VideoComponent } from '../components/video/video.component';

@Injectable({
  providedIn: 'root',
})
export class Settings {
  scale = signal(1);

  recordingWidth = signal(1920);
  recordingHeight = signal(1080);

  selectedVideo = signal<VideoComponent | null>(null);

  setSelectedVideo(v: VideoComponent) {
    this.selectedVideo.set(v);
  }
}
