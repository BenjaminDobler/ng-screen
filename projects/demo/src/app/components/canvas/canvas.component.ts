import { afterNextRender, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { VideoDO } from '../../model/video';

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

  canvasWidth = input<number>(800);
  canvasHeight = input<number>(600);

  videos = input<VideoDO[]>([]);

  background = input<string>('#000000');

  constructor() {
    afterNextRender(() => {
      console.log(this.canvasElement()?.nativeElement);
      this.canvas = this.canvasElement()?.nativeElement;
      this.ctx = this.canvas?.getContext('2d');
    });

    effect(() => {
      const bg = this.background();
      this.draw();
    });
  }

  requestId: number | null = null;

  stopDrawing() {
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  }

  startDrawing() {
    const loop = () => {
      this.draw();
      this.requestId = requestAnimationFrame(loop);
    };

    this.requestId = requestAnimationFrame(loop);
  }

  draw() {
    if (!this.ctx || !this.canvas) {
      return;
    }
    const { width, height } = this.canvas;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = this.background();
    this.ctx.fillRect(0, 0, width, height);

    this.videos().forEach((video) => {
      const component = video.component;
      const element = component?.video()?.nativeElement;
      if (element) {
        if (component && component?.clipType() === 'circle') {
          this.ctx?.save();
          this.ctx?.beginPath();
          const { cx, cy, r } = component.circleProps();
          this.ctx?.arc(cx + component.x(), cy + component.y(), r, 0, Math.PI * 2, false);
          this.ctx!.strokeStyle = component.borderColor();
          this.ctx!.lineWidth = component.borderWidth();
          this.ctx?.stroke();
          this.ctx?.clip();
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height(),
          );
          this.ctx?.restore();
        } else if (component?.clipType() === 'rectangle') {
          this.ctx?.save();
          this.ctx?.beginPath();
          const { x, y, width, height } = component.rectProps();
          this.ctx?.moveTo(x + component.x() + 20, y + component.y());
          this.ctx?.lineTo(x + component.x() + width - 20, y + component.y());
          this.ctx?.quadraticCurveTo(
            x + component.x() + width,
            y + component.y(),
            x + component.x() + width,
            y + component.y() + 20,
          );
          this.ctx?.lineTo(x + component.x() + width, y + component.y() + height - 20);
          this.ctx?.quadraticCurveTo(
            x + component.x() + width,
            y + component.y() + height,
            x + component.x() + width - 20,
            y + component.y() + height,
          );
          this.ctx?.lineTo(x + component.x() + 20, y + component.y() + height);
          this.ctx?.quadraticCurveTo(
            x + component.x(),
            y + component.y() + height,
            x + component.x(),
            y + component.y() + height - 20,
          );
          this.ctx?.lineTo(x + component.x(), y + component.y() + 20);
          this.ctx?.quadraticCurveTo(
            x + component.x(),
            y + component.y(),
            x + component.x() + 20,
            y + component.y(),
          );
          this.ctx?.closePath();
          this.ctx!.strokeStyle = component.borderColor();
          this.ctx!.lineWidth = component.borderWidth();
          this.ctx?.stroke();
          this.ctx?.clip();
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height(),
          );
          this.ctx?.restore();
        } else {
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height(),
          );
        }
      }
    });
  }
}
