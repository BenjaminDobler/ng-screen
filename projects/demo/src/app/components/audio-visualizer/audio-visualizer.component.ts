import { afterNextRender, Component, ElementRef, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-audio-visualizer',
  imports: [],
  templateUrl: './audio-visualizer.component.html',
  styleUrl: './audio-visualizer.component.scss',
})
export class AudioVisualizerComponent {
  stream = input.required<MediaStream>();
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  canvasCtx: CanvasRenderingContext2D | null = null;

  audioCtx?: AudioContext;
  analyser?: AnalyserNode;
  dataArray?: Uint8Array<ArrayBuffer>;
  bufferLength: number = 0;

  width = signal(160);
  height = signal(20);

  constructor() {
    afterNextRender(() => {
      const canvas = this.canvas()?.nativeElement;
      if (canvas) {
        this.canvasCtx = canvas.getContext('2d');
        this.prepare();
        this.draw();
      }
    });
  }

  prepare() {
    const stream = this.stream();
    if (!stream) {
      return;
    }
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();

    const source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.analyser.fftSize = 64;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -15;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  draw() {
    if (!this.analyser || !this.dataArray || !this.canvasCtx) {
      return;
    }
    const drawVisual = requestAnimationFrame(this.draw.bind(this));

    this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    this.canvasCtx.fillRect(0, 0, this.width(), this.height());

    this.canvasCtx.lineTo(this.width(), this.height() / 2);
    this.canvasCtx.stroke();

    this.analyser.getByteFrequencyData(this.dataArray);

    const barWidth = this.width() / this.bufferLength;
    for (let i = 0; i < this.bufferLength; i++) {
      const x = i * barWidth;
      const y = (1 - this.dataArray[i] / 255) * this.height();

      this.canvasCtx.fillStyle = `rgb(${y + 100} 50 50)`;

      this.canvasCtx.fillRect(x, y, barWidth, this.height() - y);
    }
  }
}
