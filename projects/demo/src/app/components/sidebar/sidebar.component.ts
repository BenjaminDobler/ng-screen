import { Component, inject } from '@angular/core';
import { Settings } from '../../service/settings';
import { FormsModule } from '@angular/forms';
import { RecordingService } from '../../service/recording.service';
import { EditorService } from '../../service/editor.service';

@Component({
  selector: 'app-sidebar',
  imports: [FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  settings = inject(Settings);
  recordingService = inject(RecordingService);
  editorService = inject(EditorService);


}
