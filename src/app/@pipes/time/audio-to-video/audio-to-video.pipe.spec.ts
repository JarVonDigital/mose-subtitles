import { AudioToVideoPipe } from './audio-to-video.pipe';

describe('AudioToVideoPipe', () => {
  it('create an instance', () => {
    const pipe = new AudioToVideoPipe();
    expect(pipe).toBeTruthy();
  });
});
