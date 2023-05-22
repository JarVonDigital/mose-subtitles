import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'audioToVideo'
})
export class AudioToVideoPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): unknown {
    return new Date(value * 1000).toISOString().substring(11, 19)
  }

}
