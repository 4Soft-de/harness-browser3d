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
  ElementRef,
  OnDestroy,
  ViewChild,
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
  Harness,
  Bordnet,
  HooksAPIStruct,
} from 'harness-browser3d-library';
import { MatTableDataSource } from '@angular/material/table';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ColorService } from '../services/color.service';
import { DataService } from '../services/data.service';
import {
  HarnessSelectionStruct as BordnetSelectionStruct,
  ViewSelectionStruct,
} from '../structs';
import { Subject, Subscription } from 'rxjs';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import Stats from 'stats.js';

type HarnessElement = Node | Segment | Occurrence;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  subscription: Subscription = new Subscription();

  @ViewChild('stats')
  private stats!: ElementRef<HTMLDivElement>;

  title = 'harness-browser3d-example-app';
  api?: HarnessBrowser3dLibraryAPI;
  addHarnesses$: Subject<Harness[]> = new Subject();
  selectedIds$: Subject<string[]> = new Subject();
  disableIds$: Subject<string[]> = new Subject();
  enableIds$: Subject<string[]> = new Subject();
  colors$: Subject<SetColorAPIStruct[] | undefined> = new Subject();
  settings?: SettingsAPIStruct;
  hooks: HooksAPIStruct = {
    geometryParser: (data: string) => new VRMLLoader().parse(data, ''),
  };

  displayedColumns: string[] = ['actions', 'module'];
  dataSource = this.initializeDataSource();
  selection: string[] = [];
  pick: string[] = [];

  selectableBordnets: BordnetSelectionStruct[];
  uploadedBordnet: BordnetSelectionStruct = new BordnetSelectionStruct(
    'Uploaded'
  );
  selectedBordnetInternal?: BordnetSelectionStruct;
  addedBordnets = 0;

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
    this.selectableBordnets = [
      new BordnetSelectionStruct('Debug', dataService.debugHarness),
      new BordnetSelectionStruct('Diff', dataService.diffHarness),
      new BordnetSelectionStruct('Broken', dataService.brokenHarness),
      new BordnetSelectionStruct('Protection', dataService.protectionHarness),
      this.uploadedBordnet,
    ];
    this.subscription.add(
      dataService.exampleBordnet.subscribe((bordnet) =>
        this.selectableBordnets.push(
          new BordnetSelectionStruct('Example', bordnet)
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.stats;
    const stats = new Stats();
    stats.dom.style.position = 'inherit';
    stats.dom.style.removeProperty('top');
    stats.dom.style.removeProperty('left');
    this.stats.nativeElement.appendChild(stats.dom);
    stats.showPanel(0);
    this.hooks = {
      animateBegin: () => stats.begin(),
      animateEnd: () => stats.end(),
    };

    this.selectedBordnet = this.selectableBordnets[0];
    this.changeDetectorRef.detectChanges();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async uploadBordnet(files: FileList | null) {
    if (files) {
      const file = files.item(0);
      if (file) {
        try {
          await this.dataService.parseData(file).then((bordnet) => {
            this.uploadedBordnet.bordnet = bordnet;
            this.selectedBordnet = this.uploadedBordnet;
            this.changeDetectorRef.detectChanges();
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private initializeDataSource(data?: HarnessElement[]) {
    const dataSource = new MatTableDataSource<HarnessElement>(data);
    dataSource.filterPredicate = (module: HarnessElement, filter: string) =>
      module.id.toLowerCase().includes(filter);
    return dataSource;
  }

  private addTableData(bordnet?: Bordnet) {
    const harnessElements = this.dataSource.data;
    bordnet?.harnesses.forEach((harness: Harness) => {
      harness.nodes.forEach((node) => harnessElements.push(node));
      harness.segments.forEach((segment) => harnessElements.push(segment));
      harness.occurrences.forEach((occurrence) =>
        harnessElements.push(occurrence)
      );
    });
    this.dataSource = this.initializeDataSource(harnessElements);
  }

  clearScene() {
    this.selectedBordnet = undefined;
    this.dataSource = this.initializeDataSource();
    this.resetSelection();
    this.api?.clear();
    this.addedBordnets = 0;
  }

  toggleRowHighlighting(row: HarnessElement, event: MouseEvent) {
    const target = event.target as Element;
    if (
      target.classList.contains('mat-mini-fab') ||
      target.classList.contains('mat-checkbox-inner-container')
    ) {
      return;
    }
    const index = this.selection.indexOf(row.id);
    if (index > -1) {
      this.selection.splice(index, 1);
    } else {
      this.selection.push(row.id);
    }

    this.pick.forEach((id) => this.selection.push(id));
    this.pick = [];

    if (this.selection.length > 0) {
      this.selectedIds$.next(this.selection.map((id) => id));
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
    this.pick = [];
  }

  geometry(event: MatSlideToggleChange) {
    if (event.checked) {
      this.settings = { geometryMode: GeometryModeAPIEnum.loaded };
    } else {
      this.settings = { geometryMode: GeometryModeAPIEnum.default };
    }
    this.clearScene();
  }

  set selectedBordnet(selectedBordnet: BordnetSelectionStruct | undefined) {
    if (selectedBordnet?.bordnet) {
      selectedBordnet.bordnet.harnesses
        .flatMap((harness) => harness.buildingBlocks)
        .forEach((buildingBlock) => {
          if (!buildingBlock.position) {
            buildingBlock.position = { x: 0, y: 0, z: 0 };
          }
          buildingBlock.position.z += this.addedBordnets * 100;
        });
      this.addTableData(selectedBordnet?.bordnet);
      this.addedBordnets++;
    }
    this.addHarnesses$.next(selectedBordnet?.bordnet?.harnesses ?? []);
    this.selectedBordnetInternal = selectedBordnet;
  }

  get selectedBordnet(): BordnetSelectionStruct | undefined {
    return this.selectedBordnetInternal;
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

  pickIds(ids: string[]) {
    this.pick = ids;
    this.selection = [];
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
    this.colors$.next(this.colorService.setColors());
  }

  resetColors() {
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
    this.api?.setView(diffView);
  }

  displayAdded(display: boolean) {
    diffViewSettings.displayAdded = display;
    this.api?.setView(diffView);
  }

  displayRemoved(display: boolean) {
    diffViewSettings.displayRemoved = display;
    this.api?.setView(diffView);
  }

  displayModifiedNew(display: boolean) {
    diffViewSettings.displayModifiedNew = display;
    this.api?.setView(diffView);
  }

  displayModifiedOld(display: boolean) {
    diffViewSettings.displayModifiedOld = display;
    this.api?.setView(diffView);
  }
}
