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

import { Injectable, OnDestroy } from '@angular/core';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { BufferGeometry, Mesh, Raycaster, Scene, Vector2 } from 'three';
import { getMousePosition } from '../utils/mouse-utils';
import { CameraService } from './camera.service';
import { SelectionService } from './selection.service';
import { SettingsService } from './settings.service';

@Injectable()
export class PickingService implements OnDestroy {
  private mousePosition?: Vector2;
  private previousMousePosition?: Vector2;
  private previousHoverGeo?: BufferGeometry;
  private harnessElementGeos: BufferGeometry[] = [];
  private readonly scene = new Scene();
  private readonly subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService
  ) {
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(
        this.clearGeos.bind(this)
      )
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public initPickingEvents(canvas: HTMLCanvasElement): void {
    if (this.settingsService.enablePicking) {
      this.initMouseEvents(canvas);
      this.initTouchEvents(canvas);
    }
  }

  public animate() {
    if (this.mousePosition !== this.previousMousePosition) {
      this.previousMousePosition = this.mousePosition;
      this.hoverGeo(this.determineGeo(this.mousePosition));
    }
  }

  public addGeos(geos: BufferGeometry[]) {
    this.harnessElementGeos = geos;
    geos.forEach((geo) => {
      this.scene.add(new Mesh(geo));
    });
  }

  public clearGeos() {
    this.harnessElementGeos.forEach((geo) => geo.dispose());
    this.harnessElementGeos = [];
    this.clearMousePosition();
    this.scene.clear();
  }

  private initMouseEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'click', (event) => {
      const pos = getMousePosition(event, canvas);
      this.pickGeo(this.determineGeo(pos));
    });
    this.addEventListener(
      canvas,
      'mousemove',
      (event) => (this.mousePosition = getMousePosition(event, canvas))
    );
    this.addEventListener(
      canvas,
      'mouseout',
      this.clearMousePosition.bind(this)
    );
    this.addEventListener(
      canvas,
      'mouseleave',
      this.clearMousePosition.bind(this)
    );
  }

  private initTouchEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'touchstart', (event) => {
      event.preventDefault();
      const pos = getMousePosition(event, canvas);
      this.pickGeo(this.determineGeo(pos));
    });
    this.addEventListener(
      canvas,
      'touchmove',
      this.clearMousePosition.bind(this)
    );
    this.addEventListener(
      canvas,
      'touchend',
      this.clearMousePosition.bind(this)
    );
  }

  private addEventListener(
    canvas: HTMLCanvasElement,
    name: string,
    listener: (event: Event) => void
  ): void {
    this.subscription.add(
      fromEvent(canvas, name).pipe(debounceTime(10)).subscribe(listener)
    );
  }

  private clearMousePosition(): void {
    this.mousePosition = undefined;
  }

  private determineGeo(pos: Vector2 | undefined): BufferGeometry | undefined {
    if (pos) {
      const raycaster = new Raycaster();
      raycaster.setFromCamera(pos, this.cameraService.getCamera());
      const intersection = raycaster.intersectObjects(this.scene.children)[0];
      return (intersection?.object as Mesh).geometry;
    }
    return undefined;
  }

  private hoverGeo(geo?: BufferGeometry): void {
    if (geo && geo.name !== this.previousHoverGeo?.name) {
      this.previousHoverGeo = geo;
    }
  }

  private pickGeo(geo?: BufferGeometry): void {
    if (geo) {
      this.selectionService.selectElements(
        [geo.name],
        this.settingsService.zoomPicking
      );
    }
  }
}
