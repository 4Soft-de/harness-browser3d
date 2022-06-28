/*
  Copyright (C) 2022 4Soft GmbH
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as
  published by the Free Software Foundation, either version 2.1 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Lesser Public License for more details.

  You should have received a copy of the GNU General Lesser Public
  License along with this program. If not, see
  http://www.gnu.org/licenses/lgpl-2.1.html.
*/

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { Harness } from '../../api/alias';
import { HarnessBrowser3dLibraryAPI } from '../../api/api';
import { SetColorAPIStruct, SettingsAPIStruct } from '../../api/structs';
import { RenderService } from '../services/render.service';
import { CameraService } from '../services/camera.service';
import { SceneService } from '../services/scene.service';
import { HarnessService } from '../services/harness.service';
import { SelectionService } from '../services/selection.service';
import { SettingsService } from '../services/settings.service';
import { ColorService } from '../services/color.service';

@Component({
  selector: 'lib-harness-browser3d',
  templateUrl: './harness-browser3d-library.component.html',
  styleUrls: ['./harness-browser3d-library.component.scss'],
})
export class HarnessBrowser3dLibraryComponent implements AfterViewInit {
  @ViewChild('harness3dBrowserCanvas')
  private canvasElement!: ElementRef<HTMLCanvasElement>;
  @Output() initialized = new EventEmitter<HarnessBrowser3dLibraryAPI>();
  private isInitialized = false;

  constructor(
    private readonly ngZone: NgZone,
    private readonly api: HarnessBrowser3dLibraryAPI,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly harnessService: HarnessService,
    private readonly renderService: RenderService,
    private readonly sceneService: SceneService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService
  ) {}

  ngAfterViewInit(): void {
    this.renderService.initRenderer(this.canvasElement.nativeElement);
    this.renderService.resizeRendererToCanvasSize();
    this.cameraService.initControls(this.canvasElement.nativeElement);
    this.sceneService.setupScene();
    this.initialized.emit(this.api);
    this.isInitialized = true;
    this.animate();
  }

  private animateImplementation() {
    requestAnimationFrame(() => this.animateImplementation());
    this.renderService.mainLoop();
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => this.animateImplementation());
  }

  @Input()
  set addHarness(harness: Harness | undefined) {
    if (harness) {
      this.harnessService.addHarness(harness);
    }
  }

  // load corresponding harness beforehand
  // all ids are in same harness
  @Input()
  set selectedIds(ids: string[] | null | undefined) {
    this.selectionService.selectElements(ids ?? []);
  }

  // load corresponding harness beforehand
  // all ids are in same harness
  @Input()
  set colors(colors: SetColorAPIStruct[] | null | undefined) {
    const safeColors = colors ?? [];
    if (safeColors.length) {
      this.colorService.setColors(safeColors);
    }
  }

  @Input()
  set settings(additionalSettings: SettingsAPIStruct | undefined) {
    if (additionalSettings) {
      this.settingsService.set(additionalSettings);
      if (this.isInitialized) {
        this.settingsService.apply();
      }
    }
  }
}
