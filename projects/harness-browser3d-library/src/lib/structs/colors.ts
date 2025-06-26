/*
  Copyright (C) 2025 4Soft GmbH
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

import { Color } from 'three';
import { PartType } from '../../api/alias';

export class GeometryColors {
  public static readonly node = new Color('grey');
  public static readonly segment = new Color('grey');
  public static readonly connector = new Color('yellow');
  public static readonly other = new Color('green');
  public static readonly fixing = new Color('blue');
  public static readonly protection = new Color(0x3b3b3b);
  public static readonly notFound = new Color('black');
  public static readonly empty = new Color(0, 0, 0);
  public static readonly selection = new Color('orange');

  public static getColor(type: string) {
    switch (PartType[type as keyof typeof PartType]) {
      case PartType.Connector:
        return GeometryColors.connector;
      case PartType.Protection:
        return GeometryColors.protection;
      case PartType.Fixing:
        return GeometryColors.fixing;
      case PartType.Other:
        return GeometryColors.other;
    }
  }
}
