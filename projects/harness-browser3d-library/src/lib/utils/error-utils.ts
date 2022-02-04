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
