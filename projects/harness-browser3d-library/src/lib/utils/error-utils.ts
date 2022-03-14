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

import { Identifiable } from '../../api/alias';

export class ErrorUtils {
  public static isNull(name: string) {
    return `variable ${name} is null`;
  }

  public static isUndefined(name: string) {
    return `variable ${name} is undefined`;
  }

  public static notFound(key: any) {
    return `${key} cannot be found`;
  }

  public static invalidInput(input: any) {
    return `function input ${input} is invalid`;
  }

  public static notPlaced(element: Identifiable) {
    return `element ${element.id} is not placed`;
  }
}
