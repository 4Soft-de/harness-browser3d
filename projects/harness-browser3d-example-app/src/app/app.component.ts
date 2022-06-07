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

import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
  GeometryModeAPIEnum,
  HarnessBrowser3dLibraryAPI,
  SetColorAPIStruct,
  SettingsAPIStruct,
  Harness,
  Identifiable,
  Bordnet,
  defaultView,
  diffView,
} from 'harness-browser3d-library';
import { MatTableDataSource } from '@angular/material/table';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ColorService } from '../services/color.service';
import { DataService } from '../services/data.service';
import * as exampleHarness from '../assets/exampleHarness.json';
import { debugView } from '../views/debug.view';
import { ViewSelectionStruct } from '../structs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'harness-browser3d-example-app';
  api?: HarnessBrowser3dLibraryAPI;
  data?: Harness;
  selectedIds$: Subject<string[] | undefined> = new Subject();
  colors$: Subject<SetColorAPIStruct[] | undefined> = new Subject();
  settings?: SettingsAPIStruct;

  displayedColumns: string[] = ['actions', 'module'];
  dataSource = new MatTableDataSource<Identifiable>();
  selection: Identifiable[] = [];

  selectableViews: ViewSelectionStruct[] = [
    new ViewSelectionStruct(defaultView, 'Default'),
    new ViewSelectionStruct(debugView, 'Debug'),
    new ViewSelectionStruct(diffView, 'Diff'),
  ];
  selectedViewInternal: ViewSelectionStruct = this.selectableViews[0];

  colorService = new ColorService();
  dataService = new DataService();

  file: File | null = null;

  ngOnInit(): void {
    const bordnet: Bordnet = exampleHarness;
    this.data = bordnet.harnesses[0];
    this.setTableData();
  }

  ngAfterViewInit(): void {
    if (this.api) {
      this.api.resetCamera();
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  copyHarness() {
    if (this.data == undefined) {
      return;
    }

    this.data = this.dataService.copyHarness(this.data);
  }

  async addHarness(files: FileList | null) {
    if (files == null || files.item(0) == null) {
      return;
    }

    // @ts-ignore
    const file: File = files.item(0);

    try {
      this.data = await this.dataService.parseData(file);
      this.setTableData();
    } catch (e) {
      console.log(e);
    }
  }

  private setTableData() {
    if (this.data == null) {
      return;
    }

    const geometryData: Identifiable[] = [
      ...this.data.connectors,
      ...this.data.accessories,
      ...this.data.fixings,
      ...this.data.protections,
      ...this.data.segments,
    ];

    this.dataSource = new MatTableDataSource<Identifiable>(geometryData);
    this.dataSource.filterPredicate = function (
      module: Identifiable,
      filter: string
    ): boolean {
      return module.id.toLowerCase().includes(filter);
    };
  }

  clearScene() {
    if (this.api) {
      this.data = undefined;
      this.api.clear();
      this.dataSource = new MatTableDataSource<Identifiable>();
    }
  }

  toggleRowHighlighting(row: Identifiable, event: MouseEvent) {
    if ((event.target as Element).classList.contains('mat-mini-fab')) {
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
      this.selectedIds$.next(undefined);
      this.api?.resetCamera();
    }
  }

  resetCamera() {
    if (this.api) {
      this.api.resetCamera();
      this.selection = [];
    }
  }

  geometry(event: MatSlideToggleChange) {
    if (event.checked) {
      this.settings = { geometryMode: GeometryModeAPIEnum.default };
    } else {
      this.settings = { geometryMode: GeometryModeAPIEnum.loaded };
    }
  }

  set selectedView(selectedView: ViewSelectionStruct) {
    if (this.api && this.data) {
      this.api.disposeView(this.selectedViewInternal.view, this.data.id);
      this.api.setView(selectedView.view, this.data.id);
    }
    this.selectedViewInternal = selectedView;
  }

  get selectedView() {
    return this.selectedViewInternal;
  }

  addAPI(api: HarnessBrowser3dLibraryAPI) {
    this.api = api;
  }

  setToColor1(module: Identifiable) {
    this.colorService.addToColorArray(this.colorService.color1Modules, module);
  }

  setToColor2(module: Identifiable) {
    this.colorService.addToColorArray(this.colorService.color2Modules, module);
  }

  setToColor3(module: Identifiable) {
    this.colorService.addToColorArray(this.colorService.color3Modules, module);
  }

  setColors() {
    if (!this.data) {
      return;
    }

    this.colors$.next(this.colorService.setColors());
  }

  resetColors() {
    if (!this.data) {
      return;
    }

    this.api?.resetColors(this.data.id);
    this.colors$.next(this.colorService.resetColors());
  }

  removeColor(module: Identifiable) {
    this.colorService.removeColor(module);

    if (this.colorService.colorsAreEmpty()) {
      this.resetColors();
    }
  }
}
