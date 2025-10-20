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

    // this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  draw() {
    if (!this.analyser || !this.dataArray || !this.canvasCtx) {
      return;
    }
    const drawVisual = requestAnimationFrame(this.draw.bind(this));
    //this.analyser.getByteTimeDomainData(this.dataArray);

    this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    this.canvasCtx.fillRect(0, 0, this.width(), this.height());
    // // Begin the path
    // this.canvasCtx.lineWidth = 2;
    // this.canvasCtx.strokeStyle = 'rgb(0 0 0)';
    // this.canvasCtx.beginPath();
    // // Draw each point in the waveform
    // const sliceWidth = 80 / this.bufferLength;
    // let x = 0;
    // for (let i = 0; i < this.bufferLength; i++) {
    //   const v = this.dataArray[i] / 128.0;
    //   const y = v * (this.height() / 2);

    //   if (i === 0) {
    //     this.canvasCtx.moveTo(x, y);
    //   } else {
    //     this.canvasCtx.lineTo(x, y);
    //   }

    //   x += sliceWidth;
    // }

    // Finish the line
    this.canvasCtx.lineTo(this.width(), this.height() / 2);
    this.canvasCtx.stroke();

    this.analyser.getByteFrequencyData(this.dataArray);

    // let's loop through our frequencies and draw a vertical bar for each
    const barWidth = this.width() / this.bufferLength;
    console.log('barWidth', barWidth);
    for (let i = 0; i < this.bufferLength; i++) {
      const x = i * barWidth;
      const y = (1 - this.dataArray[i] / 255) * this.height();
      console.log('bar', i, x, y);

          this.canvasCtx.fillStyle = `rgb(${y + 100} 50 50)`;

      this.canvasCtx.fillRect(x, y, barWidth, this.height() - y);
    }
  }
}
