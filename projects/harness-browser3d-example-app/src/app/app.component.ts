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
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {
  GeometryModeAPIEnum,
  HarnessBrowser3dLibraryAPI,
  SetColorAPIStruct,
  SettingsAPIStruct,
  defaultView,
  diffView,
  diffViewSettings,
  Node,
  Segment,
  Occurrence,
} from 'harness-browser3d-library';
import { MatTableDataSource } from '@angular/material/table';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ColorService } from '../services/color.service';
import { DataService } from '../services/data.service';
import { HarnessSelectionStruct, ViewSelectionStruct } from '../structs';
import { Subject } from 'rxjs';
import { Color } from 'three';

type HarnessElement = Node | Segment | Occurrence;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  title = 'harness-browser3d-example-app';
  api?: HarnessBrowser3dLibraryAPI;
  selectedIds$: Subject<string[]> = new Subject();
  disableIds$: Subject<string[]> = new Subject();
  enableIds$: Subject<string[]> = new Subject();
  colors$: Subject<SetColorAPIStruct[] | undefined> = new Subject();
  settings: SettingsAPIStruct = {
    backgroundColor: new Color('white'),
  };

  displayedColumns: string[] = ['actions', 'module'];
  dataSource = new MatTableDataSource<HarnessElement>();
  selection: HarnessElement[] = [];

  selectableHarnesses: HarnessSelectionStruct[];
  uploadedHarness: HarnessSelectionStruct = new HarnessSelectionStruct(
    'Uploaded'
  );
  selectedHarnessInternal?: HarnessSelectionStruct;
  addedHarnesses = 0;

  selectableViews: ViewSelectionStruct[] = [
    new ViewSelectionStruct(defaultView, 'Default'),
    new ViewSelectionStruct(diffView, 'Diff'),
  ];
  selectedViewInternal: ViewSelectionStruct = this.selectableViews[0];

  file: File | null = null;

  constructor(
    public readonly colorService: ColorService,
    public readonly dataService: DataService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.selectableHarnesses = [
      new HarnessSelectionStruct('Debug', dataService.getDebugHarness()),
      new HarnessSelectionStruct('Broken', dataService.getBrokenHarness()),
      new HarnessSelectionStruct(
        'Protection',
        dataService.getProtectionHarness()
      ),
      this.uploadedHarness,
    ];
  }

  ngAfterViewInit(): void {
    this.selectedHarness = this.selectableHarnesses[0];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async uploadHarness(files: FileList | null) {
    if (files) {
      const file = files.item(0);
      if (file) {
        try {
          await this.dataService.parseData(file).then((harness) => {
            this.uploadedHarness.harness = harness;
            this.selectedHarness = this.uploadedHarness;
            this.changeDetectorRef.detectChanges();
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private setTableData() {
    if (!this.selectedHarness?.harness) {
      this.dataSource = new MatTableDataSource<HarnessElement>([]);
      return;
    }

    const geometryData: HarnessElement[] = [
      ...this.selectedHarness.harness.nodes,
      ...this.selectedHarness.harness.segments,
      ...this.selectedHarness.harness.occurrences,
    ];

    this.dataSource = new MatTableDataSource<HarnessElement>(geometryData);
    this.dataSource.filterPredicate = function (
      module: HarnessElement,
      filter: string
    ): boolean {
      return module.id.toLowerCase().includes(filter);
    };
  }

  clearScene() {
    this.selectedHarness = undefined;
    this.resetSelection();
    this.api?.clear();
    this.dataSource = new MatTableDataSource<HarnessElement>();
    this.addedHarnesses = 0;
  }

  toggleRowHighlighting(row: HarnessElement, event: MouseEvent) {
    const target = event.target as Element;
    if (
      target.classList.contains('mat-mini-fab') ||
      target.classList.contains('mat-checkbox-inner-container')
    ) {
      return;
    }
    const index = this.selection.indexOf(row);
    if (index > -1) {
      this.selection.splice(index, 1);
    } else {
      this.selection.push(row);
    }

    if (this.selection.length > 0) {
      this.selectedIds$.next(this.selection.map((module) => module.id));
    } else {
      this.selectedIds$.next([]);
    }
  }

  enableElements(harnessElement: HarnessElement, enabled: boolean) {
    if (enabled) {
      this.enableIds$.next([harnessElement.id]);
    } else {
      this.disableIds$.next([harnessElement.id]);
    }
  }

  resetCamera() {
    this.api?.resetCamera();
  }

  resetSelection() {
    this.selectedIds$.next([]);
    this.selection = [];
  }

  geometry(event: MatSlideToggleChange) {
    if (event.checked) {
      this.settings = { geometryMode: GeometryModeAPIEnum.default };
    } else {
      this.settings = { geometryMode: GeometryModeAPIEnum.loaded };
    }
  }

  set selectedHarness(selectedHarness: HarnessSelectionStruct | undefined) {
    this.selectedHarnessInternal = selectedHarness;
    this.selectedHarnessInternal?.harness?.buildingBlocks.forEach(
      (buildingBlock) => {
        if (!buildingBlock.position) {
          buildingBlock.position = { x: 0, y: 0, z: 0 };
        }
        buildingBlock.position.z += this.addedHarnesses * 100;
      }
    );
    this.setTableData();
    this.addedHarnesses++;
  }

  get selectedHarness(): HarnessSelectionStruct | undefined {
    return this.selectedHarnessInternal;
  }

  set selectedView(selectedView: ViewSelectionStruct) {
    this.api?.setView(selectedView.view);
    this.selectedViewInternal = selectedView;
  }

  get selectedView() {
    return this.selectedViewInternal;
  }

  addAPI(api: HarnessBrowser3dLibraryAPI) {
    this.api = api;
  }

  setToColor1(module: HarnessElement) {
    this.colorService.addToColorArray(this.colorService.color1Modules, module);
  }

  setToColor2(module: HarnessElement) {
    this.colorService.addToColorArray(this.colorService.color2Modules, module);
  }

  setToColor3(module: HarnessElement) {
    this.colorService.addToColorArray(this.colorService.color3Modules, module);
  }

  setColors() {
    if (!this.selectedHarness?.harness) {
      return;
    }

    this.colors$.next(this.colorService.setColors());
  }

  resetColors() {
    if (!this.selectedHarness?.harness) {
      return;
    }

    this.api?.resetColors();
    this.colors$.next(this.colorService.resetColors());
  }

  removeColor(module: HarnessElement) {
    this.colorService.removeColor(module);

    if (this.colorService.colorsAreEmpty()) {
      this.resetColors();
    }
  }

  displayUnmodified(display: boolean) {
    diffViewSettings.displayUnmodified = display;
    this.api?.refreshView();
  }

  displayAdded(display: boolean) {
    diffViewSettings.displayAdded = display;
    this.api?.refreshView();
  }

  displayRemoved(display: boolean) {
    diffViewSettings.displayRemoved = display;
    this.api?.refreshView();
  }

  displayModifiedNew(display: boolean) {
    diffViewSettings.displayModifiedNew = display;
    this.api?.refreshView();
  }

  displayModifiedOld(display: boolean) {
    diffViewSettings.displayModifiedOld = display;
    this.api?.refreshView();
  }
}
