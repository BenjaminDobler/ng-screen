import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-device-chooser',
  imports: [],
  templateUrl: './device-chooser.component.html',
  styleUrl: './device-chooser.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceChooserComponent {
  data = inject(DIALOG_DATA);
  dialogRef = inject<DialogRef<{ data: MediaDeviceInfo }>>(DialogRef<{ data: MediaDeviceInfo }>);

  devices = signal<MediaDeviceInfo[]>([]);

  constructor() {
    this.getDevices();
  }

  async getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter((device) => device.kind === this.data);
    this.devices.set(audioDevices);
  }

  selectDevice(device: MediaDeviceInfo) {
    this.dialogRef.close({data: device});
  }
}
