import { inject, Injectable, signal } from '@angular/core';
import { AudioDO, Recording, VideoDO } from '../model/video';
import { CanvasComponent } from '../components/canvas/canvas.component';
import { VideoService } from './video.service';

@Injectable({ providedIn: 'root' })
export class RecordingService {
  videoService = inject(VideoService);
  recorder: MediaRecorder | null = null;
  recordingCount = signal(1);
  isRecording = signal(false);
  recordings = signal<Recording[]>([]);
  videos = signal<VideoDO[]>([]);
  audioSources = signal<AudioDO[]>([]);
  audioStream: MediaStream | null = null;
  canvasComponent: CanvasComponent | undefined = undefined;
  videoCount = 0;
  constructor() {}

  async getDesktopStream() {
    const video = new VideoDO();
    video.id = `video-${this.videoCount++}`;

    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    screenShareStream.getVideoTracks().forEach((track) => {
      console.log('track', track.getSettings());
      track.onended = () => {
        console.log('track ended');
        video.stream = undefined;
      };
    });
    video.stream = screenShareStream;
    this.videos.update((prev) => [...prev, video]);
  }

  async getWebcamDevices() {
    const webcamStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const video = new VideoDO();
    video.id = `video-${this.videoCount++}`;
    video.stream = webcamStream;
    this.videos.update((prev) => [...prev, video]);
  }

  async getAudioStream() {
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const audioDO = new AudioDO(this.audioStream);
    

    this.audioSources.update((prev) => [
      ...prev,
      audioDO,
    ]);
  }

  startRecording() {
    console.log('startRecording called', this.canvasComponent);
    this.isRecording.set(true);
    if (this.canvasComponent) {
      console.log('start drawing');
      this.canvasComponent.startDrawing();
    }
    const name = `recording-${this.recordingCount()}`;
    this.recordingCount.set(this.recordingCount() + 1);

    const recording = new Recording(this.videoService);
    recording.name = name;

    this.recordings.update((prev) => [...prev, recording]);

    if (!this.canvasComponent || !this.canvasComponent.ctx || !this.canvasComponent.canvas) {
      console.log('no canvas component');
      return;
    }
    const canvasStream = this.canvasComponent.canvas.captureStream(30);

    const combinedStream = new MediaStream([
      ...canvasStream.getTracks(),
      ...(this.audioStream?.getTracks() || []),
    ]);

    const chunks: Blob[] = [];

    this.recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    this.recorder.ondataavailable = (evt) => {
      console.log('data available', evt.data);
      chunks.push(evt.data);
    };

    this.recorder.onstop = () => {
      this.isRecording.set(false);
      if (this.canvasComponent) {
        this.canvasComponent.stopDrawing();
      }

      this.recordings.update((prev) => {
        const lastRecording = prev[prev.length - 1];
        if (lastRecording) {
          lastRecording.chunks = chunks;
        }
        return [...prev];
      });
    };

    console.log('start recording');
    this.recorder.start();
  }

  stopRecording() {
    this.recorder?.stop();
  }

  bringToFront(video: VideoDO) {
    const otherVids = this.videos().filter((v) => v !== video);
    this.videos.set([...otherVids, video]);
    return [...otherVids];
    // this.videos.update((prev) => {
    //   const index = prev.indexOf(video);
    //   if (index > -1) {
    //     prev.splice(index, 1);
    //     prev.push(video);
    //   }
    //   return [...prev];
    // });
  }
}
