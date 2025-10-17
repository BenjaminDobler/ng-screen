import { inject, Injectable } from '@angular/core';
import { Recording } from '../model/video';
import { VideoEditorComponent } from '../components/video-editor/video-editor.component';
import { Dialog, DialogRef, DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';

@Injectable({ providedIn: 'root' })
export class EditorService {
  dialog = inject(Dialog);

  open(recording: Recording) {
    const dialogRef = this.dialog.open(VideoEditorComponent, {
      height: '600px',
      width: '800px',
      panelClass: 'editor-dialog',
      data: recording
    });
  }
}
