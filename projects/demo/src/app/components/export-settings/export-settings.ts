import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EdSelectComponent,
  EdSelectOptionComponent,
  InputComponent,
} from '@richapps/ui-components';
import { ExportSettingsDO } from '../../model/video';

@Component({
  selector: 'app-export-settings',
  imports: [InputComponent, FormsModule, EdSelectComponent, EdSelectOptionComponent],
  templateUrl: './export-settings.html',
  styleUrl: './export-settings.scss',
})
export class ExportSettings {
  data = inject(DIALOG_DATA);
  dialogRef = inject<DialogRef<{ data: ExportSettingsDO }>>(DialogRef<{ data: ExportSettingsDO }>);

  crf = signal(23);
  preset = signal<
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
  >('medium');
  frameRate = signal(20);
  resolutionWidth = signal(480);
  resolutionHeight = signal(360);

  exportVideo() {
    // Implement video export logic here
    this.dialogRef.close({
      data: {
        crf: this.crf(),
        preset: this.preset(),
        frameRate: this.frameRate(),
        resolutionWidth: this.resolutionWidth(),
        resolutionHeight: this.resolutionHeight(),
      },
    });
  }
}
