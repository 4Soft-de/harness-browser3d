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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Harness } from '../../api/alias';
import { HarnessBrowser3dLibraryAPI } from '../../api/api';
import { SetColorAPIStruct, SettingsAPIStruct } from '../../api/structs';
import { RenderService } from '../services/render.service';
import { CameraService } from '../services/camera.service';
import { AddHarnessesService } from '../services/add-harnesses.service';
import { SelectionService } from '../services/selection.service';
import { SettingsService } from '../services/settings.service';
import { ColorService } from '../services/color.service';
import { EnableService } from '../services/enable.service';
import Stats from 'stats.js';
import { BordnetMeshService } from '../services/bordnet-mesh.service';
import { LightsService } from '../services/lights.service';
import { PickingService } from '../services/picking.service';

@Component({
  selector: 'lib-harness-browser3d',
  templateUrl: './harness-browser3d-library.component.html',
  styleUrls: ['./harness-browser3d-library.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarnessBrowser3dLibraryComponent
  implements AfterViewInit, OnDestroy
{
  @ViewChild('harness3dBrowserCanvas')
  private canvasElementRef!: ElementRef<HTMLCanvasElement>;
  @Output() initialized = new EventEmitter<HarnessBrowser3dLibraryAPI>();
  private isInitialized = false;
  private stats?: Stats;

  constructor(
    private readonly ngZone: NgZone,
    private readonly addHarnessesService: AddHarnessesService,
    private readonly api: HarnessBrowser3dLibraryAPI,
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly enableService: EnableService,
    private readonly lightsService: LightsService,
    private readonly pickingService: PickingService,
    private readonly renderService: RenderService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService
  ) {}

  ngAfterViewInit(): void {
    const canvasElement = this.canvasElementRef.nativeElement;
    this.renderService.initRenderer(canvasElement);
    this.cameraService.initControls(canvasElement);
    this.pickingService.initPickingEvents(canvasElement);
    this.renderService.resizeRendererToCanvasSize();
    this.lightsService.addLights(this.bordnetMeshService.getScene());
    this.initialized.emit(this.api);
    this.isInitialized = true;
    this.animate();
  }

  ngOnDestroy(): void {
    this.api.clear();
  }

  private animateImplementation() {
    this.stats?.begin();
    this.renderService.mainLoop();
    this.stats?.end();
    requestAnimationFrame(() => this.animateImplementation());
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => this.animateImplementation());
  }

  private checkInput<Input>(
    exec: (input: Input) => void,
    input: Input | null | undefined
  ) {
    if (!this.isInitialized && input) {
      console.warn('harness-browser3d is not initialized yet');
    }
    if (input) {
      exec(input);
    }
  }

  @Input()
  set addHarnesses(harnesses: Harness[] | null | undefined) {
    this.checkInput(
      this.addHarnessesService.addHarnesses.bind(this.addHarnessesService),
      harnesses
    );
  }

  @Input()
  set selectedIds(ids: string[] | null | undefined) {
    this.checkInput(
      this.selectionService.selectElements.bind(this.selectionService),
      ids
    );
  }

  @Input()
  set enableIds(ids: string[] | null | undefined) {
    this.checkInput(
      this.enableService.enableElements.bind(this.enableService),
      ids
    );
  }

  @Input()
  set disableIds(ids: string[] | null | undefined) {
    this.checkInput(
      this.enableService.disableElements.bind(this.enableService),
      ids
    );
  }

  @Input()
  set colors(colors: SetColorAPIStruct[] | null | undefined) {
    this.checkInput(
      this.colorService.setColors.bind(this.colorService),
      colors
    );
  }

  @Input()
  set settings(additionalSettings: SettingsAPIStruct | null | undefined) {
    if (additionalSettings) {
      this.settingsService.set(additionalSettings);
      if (this.isInitialized) {
        this.settingsService.apply();
      }
    }
  }

  @Input()
  set showStats(parent: HTMLElement | null | undefined) {
    if (parent && !this.stats) {
      this.stats = new Stats();
      this.stats.dom.style.position = 'inherit';
      this.stats.dom.style.removeProperty('top');
      this.stats.dom.style.removeProperty('left');
      parent.appendChild(this.stats.dom);
      this.stats.showPanel(0);
    }
  }
}
