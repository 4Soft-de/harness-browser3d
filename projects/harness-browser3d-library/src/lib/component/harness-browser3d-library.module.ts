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

import { NgModule } from '@angular/core';
import { BuildingBlockService } from '../services/building-block.service';
import { BordnetMeshService } from '../services/bordnet-mesh.service';
import { CameraService } from '../services/camera.service';
import { ColorService } from '../services/color.service';
import { CoordinateSystemService } from '../services/coordinate-system.service';
import { CurveService } from '../services/curve.service';
import { DefaultGeometryCreationService } from '../services/default-geometries.service';
import { GeometryService } from '../services/geometry.service';
import { HarnessBrowser3dLibraryAPI } from '../../api/api';
import { AddHarnessesService } from '../services/add-harnesses.service';
import { LoadingService } from '../services/loading.service';
import { MappingService } from '../services/mapping.service';
import { PositionService } from '../services/position.service';
import { EffectComposerService } from '../services/effect-composer.service';
import { SelectionService } from '../services/selection.service';
import { SettingsService } from '../services/settings.service';
import { ViewService } from '../services/view.service';
import { HarnessBrowser3dLibraryComponent } from './harness-browser3d-library.component';
import { EnableService } from '../services/enable.service';
import { PreprocessService } from '../services/preprocess.service';
import { LightsService } from '../services/lights.service';
import { DiffService } from '../services/diff.service';
import { PickingService } from '../services/picking.service';
import { AnimateService } from '../services/animate.service';
import { PassService } from '../services/pass.service';

@NgModule({
  declarations: [HarnessBrowser3dLibraryComponent],
  imports: [],
  exports: [HarnessBrowser3dLibraryComponent],
  providers: [
    AddHarnessesService,
    AnimateService,
    BuildingBlockService,
    BordnetMeshService,
    CameraService,
    ColorService,
    CoordinateSystemService,
    CurveService,
    DefaultGeometryCreationService,
    DiffService,
    EffectComposerService,
    EnableService,
    GeometryService,
    HarnessBrowser3dLibraryAPI,
    LightsService,
    LoadingService,
    MappingService,
    PassService,
    PickingService,
    PositionService,
    PreprocessService,
    SelectionService,
    SettingsService,
    ViewService,
  ],
})
export class HarnessBrowser3dLibraryModule {}
