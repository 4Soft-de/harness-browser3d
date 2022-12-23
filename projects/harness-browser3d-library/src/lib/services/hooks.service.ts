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

import { Injectable } from '@angular/core';
import { Scene } from 'three';
import { HooksAPIStruct } from '../../public-api';

@Injectable()
export class HooksService {
  public geometryParser?: (data: string) => Scene;
  public animateBegin?: () => void;
  public animateEnd?: () => void;

  public add(additionalHooks: HooksAPIStruct) {
    Object.assign(this, additionalHooks);
  }
}
