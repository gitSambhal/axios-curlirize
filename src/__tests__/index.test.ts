import { isEven } from '../index';

describe('valid Even', () => {
  test('should be true', () => {
    expect(isEven(2)).toBeTruthy();
  });
});

describe('invalid Even', () => {
  test('should be false', () => {
    expect(isEven(3)).toBeFalsy();
  });
});
