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

import { Vector2 } from 'three';

export function getMousePosition(
  event: Event,
  canvas: HTMLCanvasElement,
): Vector2 | undefined {
  const rect = canvas.getBoundingClientRect();
  return extractPosition(event)
    ?.sub(new Vector2(rect.left, rect.top))
    .multiply(new Vector2(canvas.width, canvas.height))
    .divide(new Vector2(rect.width, rect.height));
}

function extractPosition(event: Event): Vector2 | undefined {
  if (window.MouseEvent && event instanceof MouseEvent) {
    return new Vector2(event.clientX, event.clientY);
  }
  if (window.TouchEvent && event instanceof TouchEvent) {
    const touch = event.touches[0];
    return new Vector2(touch.clientX, touch.clientY);
  }
  return undefined;
}

export function getCtrlPressed(event: Event): boolean {
  return (
    window.KeyboardEvent && event instanceof KeyboardEvent && event.ctrlKey
  );
}
