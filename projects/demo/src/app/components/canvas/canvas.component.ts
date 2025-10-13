import { afterNextRender, Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent {
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;


  webcamVideoElement = input<HTMLVideoElement | undefined>(undefined);
  screenVideoElement = input<HTMLVideoElement | undefined>(undefined);

  constructor() {
    afterNextRender(() => {
      console.log(this.canvasElement()?.nativeElement);
      this.canvas = this.canvasElement()?.nativeElement;
      this.ctx = this.canvas?.getContext('2d');
    });
  }

  startDrawing() {
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  draw() {
    const videoEl = this.screenVideoElement();
    const webcamEl = this.webcamVideoElement();
    if (!this.ctx || !this.canvas || !videoEl || !webcamEl) {
      return;
    }
    const { width, height } = this.canvas;

    // clear out the entire canvas and paint from scratch
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillRect(0, 0, width, height);

    // draw our screen share in top-left
    // would need to do real math to get proper aspect ratio.

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(150, 150, 130, 0, Math.PI * 2, false);
    this.ctx.strokeStyle = '#2465D3';
    this.ctx.lineWidth = 20;
    this.ctx.stroke();
    this.ctx.clip();
    this.ctx.drawImage(videoEl, 0, 0, 300, 300);
    this.ctx.restore();

    // draw our webcam in bottom right.
    // would need to do real math to get proper aspect ratio.
    this.ctx.drawImage(webcamEl, width - 200, height - 100, 200, 100);
  }
}
