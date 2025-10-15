import { afterNextRender, Component, ElementRef, inject, input, model, output } from '@angular/core';
import { Settings } from '../../service/settings';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent {


  settings = inject(Settings);
  contentWidth = model(400);
  contentHeight = model(300);
  contentScale = model(1);

  scaleChange = output<number>();

  el = inject(ElementRef);

  background = input<string>('#000000');

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.watchResize();
    });
  }

  watchResize() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          const width = contentBoxSize.inlineSize;
          const height = contentBoxSize.blockSize;
          console.log('resize', width, height);


          const ratio = this.contentWidth() / this.contentHeight();
          let newHeight = width / ratio;

          const scale = Math.min(width / this.contentWidth(), height / this.contentHeight());
          this.contentScale.set(scale);
          this.scaleChange.emit(scale);
          // this.settings.scale.set(scale);

          this.el.nativeElement.style.height = `${newHeight}px`;
          

        // const h1Elem = this.el.nativeElement.querySelector('h1');
        // const pElem = this.el.nativeElement.querySelector('p');
        // if (contentBoxSize) {
        //   h1Elem.style.fontSize = `${Math.max(1.5, contentBoxSize.inlineSize / 200)}rem`;
        //   pElem.style.fontSize = `${Math.max(1, contentBoxSize.inlineSize / 600)}rem`;
        // } else {
        //   h1Elem.style.fontSize = `${Math.max(1.5, entry.contentRect.width / 200)}rem`;
        //   pElem.style.fontSize = `${Math.max(1, entry.contentRect.width / 600)}rem`;
        // }
        }
      }

      console.log('Size changed');
    });

    this.resizeObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}
