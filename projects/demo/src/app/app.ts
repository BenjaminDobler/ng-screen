import { afterNextRender, Component, effect, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  video = viewChild<ElementRef<HTMLVideoElement>>('video');
  webcamVideo = viewChild<ElementRef<HTMLVideoElement>>('webcamVideo');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  videoDevices = signal<MediaDeviceInfo[]>([]);

  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;

  recorder: MediaRecorder | null = null;

  downloadData: string | null = null;

  audioStream: MediaStream | null = null;

  constructor() {
    afterNextRender(() => {
      console.log(this.canvasElement()?.nativeElement);
      this.canvas = this.canvasElement()?.nativeElement;
      this.ctx = this.canvas?.getContext('2d');
    });

    this.getVideoDevices();
  }

  startDrawing() {
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  draw() {
    const videoEl = this.video()?.nativeElement;
    const webcamEl = this.webcamVideo()?.nativeElement;
    if (!this.ctx || !this.canvas || !videoEl || !webcamEl) {
      return;
    }
    const { width, height } = this.canvas;

    // clear out the entire canvas and paint from scratch
    this.ctx.clearRect(0, 0, width, height);

    // draw our screen share in top-left
    // would need to do real math to get proper aspect ratio.
    this.ctx.drawImage(videoEl, 0, 0, 500, 400);

    // draw our webcam in bottom right.
    // would need to do real math to get proper aspect ratio.
    this.ctx.drawImage(webcamEl, width - 200, height - 100, 200, 100);
  }

  async getDesktopStream() {
    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      // we only want video for now, but can easily specify other options
      video: true,
    });

    const videoElement = this.video()?.nativeElement;
    if (videoElement) {
      console.log(videoElement);
      videoElement.srcObject = screenShareStream;
    }
  }

  async getVideoDevices() {
    // 💡 first, ensure user's given permission to "enumerate" their video devices
    const webcamStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    const videoElement = this.webcamVideo()?.nativeElement;
    if (videoElement) {
      console.log(videoElement);
      videoElement.srcObject = webcamStream;
    }

    // 💡 fetch all devices, and then filter for videoinput devices
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    this.videoDevices.set(allDevices.filter((device) => device.kind === 'videoinput'));
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
    if (!this.ctx || !this.canvas) {
      return;
    }
    const canvasStream = this.canvas.captureStream(30);

    // combine the canvas stream and mic stream (from above) by collecting
    //  tracks from each.
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...(this.audioStream?.getTracks() || [])]);

    const chunks: Blob[] = [];

    // create a recorder
    this.recorder = new MediaRecorder(combinedStream, {
      // requested media type, basically limited to webm 🤦‍♂️
      mimeType: 'video/webm;codecs=vp9',
    });

    // collect blobs when available
    this.recorder.ondataavailable = (evt) => {
      console.log('data available', evt.data);
      chunks.push(evt.data);
    };

    // when recorder stops (via recorder.stop()), handle blobs
    this.recorder.onstop = () => {
      console.log('on stop');
      const recordedBlob = new Blob(chunks, { type: chunks[0].type });
      const data = URL.createObjectURL(recordedBlob);
      this.downloadData = data;
      console.log(this.downloadData);

      const link = document.createElement('a');
      link.href = data;
      link.download = 'recording.webm';
      link.dispatchEvent(new MouseEvent('click', { view: window }));

      // 💡 don't forget to clean up!
      setTimeout(() => {
        URL.revokeObjectURL(data);
        link.remove();
      }, 500);

      // do something with this blob...
    };

    console.log('start recording');
    this.recorder.start();
  }

  stopRecording() {
    this.recorder?.stop();
  }
}
