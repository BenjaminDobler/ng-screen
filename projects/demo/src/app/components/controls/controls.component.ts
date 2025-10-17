import { Component, inject } from '@angular/core';
import { RecordingService } from '../../service/recording.service';

@Component({
  selector: 'app-controls',
  imports: [],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss',
})
export class ControlsComponent { 


  protected readonly recordingService = inject(RecordingService); 
}
