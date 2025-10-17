import { Injectable, signal } from '@angular/core';
import { Recording, VideoDO } from '../model/video';
import { CanvasComponent } from '../components/canvas/canvas.component';

@Injectable({ providedIn: 'root' })
export class RecordingService {
  recorder: MediaRecorder | null = null;
  recordingCount = signal(0);
  isRecording = signal(false);
  recordings = signal<Recording[]>([]);
  videos = signal<VideoDO[]>([]);
  audioStream: MediaStream | null = null;
  canvasComponent: CanvasComponent | null = null;

  constructor() {}

  async getDesktopStream() {
    const video = new VideoDO();

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
  }

  startRecording() {
    this.isRecording.set(true);
    if (this.canvasComponent) {
      this.canvasComponent.startDrawing();
    }
    const name = `recording-${this.recordingCount()}`;
    this.recordingCount.set(this.recordingCount() + 1);

    const recording: Recording = {
      chunks: [],
      name,
    };

    this.recordings.update((prev) => [...prev, recording]);

    if (!this.canvasComponent || !this.canvasComponent.ctx || !this.canvasComponent.canvas) {
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
}
