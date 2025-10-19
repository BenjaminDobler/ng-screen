import { Component, inject } from '@angular/core';
import { Settings } from '../../service/settings';
import { FormsModule } from '@angular/forms';
import { RecordingService } from '../../service/recording.service';
import { EditorService } from '../../service/editor.service';
import { ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputComponent } from '@richapps/ui-components';

@Component({
  selector: 'app-sidebar',
  imports: [FormsModule, InputComponent, ColorComponent, EdSelectComponent, EdSelectOptionComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  settings = inject(Settings);
  recordingService = inject(RecordingService);
  editorService = inject(EditorService);


}
