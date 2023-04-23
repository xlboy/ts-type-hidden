import { describe, expect, it } from 'vitest';
import { TypeAnalyzer } from './';

describe('function', () => {
  it('overloading', () => {
    const analyzer = new TypeAnalyzer(`
const t = 1

function a<B extends 222>(): void;
function b<A>(o: A): string;
`);
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 12, end: 48 }, text: '\n\nfunction a<B extends 222>(): void;' },
      { range: { pos: 48, end: 77 }, text: '\nfunction b<A>(o: A): string;' }
    ]);
  });

  it('type parameter - a`<B extends ...>`()', () => {
    const analyzer = new TypeAnalyzer(
      `
function a<B extends 111, C extends 111>() {}
const b = <B extends 222, C extends 222>() => {};
const c = function<B extends 333, C extends 333>() {}
const d = {
  a<B extends 444, C extends 444>() {}
}
`
    );
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 11, end: 41 }, text: '<B extends 111, C extends 111>' },
      { range: { pos: 57, end: 87 }, text: '<B extends 222, C extends 222>' },
      { range: { pos: 115, end: 145 }, text: '<B extends 333, C extends 333>' },
      { range: { pos: 166, end: 196 }, text: '<B extends 444, C extends 444>' }
    ]);
  });

  it('fn parameter - (`a: number, b: string, ...`)', () => {
    const analyzer = new TypeAnalyzer(`
function a(a1: A111, a2?: A222) {}
const b = (b1: B111, b2?: B222) => {};
const c = function(c1: C111, c2?: C222) {}
const d = {
  e(d1: E111, d2?: E222) {}
  f: (f1: F111, f2?: F222) => {}
}
`);
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 14, end: 20 }, text: ': A111' },
      { range: { pos: 24, end: 31 }, text: '?: A222' },
      { range: { pos: 49, end: 55 }, text: ': B111' },
      { range: { pos: 59, end: 66 }, text: '?: B222' },
      { range: { pos: 96, end: 102 }, text: ': C111' },
      { range: { pos: 106, end: 113 }, text: '?: C222' },
      { range: { pos: 136, end: 142 }, text: ': E111' },
      { range: { pos: 146, end: 153 }, text: '?: E222' },
      { range: { pos: 166, end: 172 }, text: ': F111' },
      { range: { pos: 176, end: 183 }, text: '?: F222' }
    ]);
  });

  describe('fn return type - ()`: number`', () => {
    it('normal', () => {
      const analyzer = new TypeAnalyzer(`
function a(): A111 {}
const b = (): B111 => {};
const c = function(): C111 {}
const d = {
  d(): D111 {}
  e: (): E111 => {}
}
`);
      analyzer.analyze();

      expect(analyzer.analyzedTypes).toMatchObject([
        { range: { pos: 13, end: 19 }, text: ': A111' },
        { range: { pos: 35, end: 41 }, text: ': B111' },
        { range: { pos: 69, end: 75 }, text: ': C111' },
        { range: { pos: 96, end: 102 }, text: ': D111' },
        { range: { pos: 113, end: 119 }, text: ': E111' }
      ]);
    });

    it('asserts or is', () => {
      const analyzer = new TypeAnalyzer(`
function a(value): asserts a is aaa {}

const b = (value): asserts b is bbb => {};

const c = function (value): asserts d is ddd {};

const d = {
  e(value): asserts e is eee {},
  f: (value): asserts f is fff => {}
};
`);
      analyzer.analyze();

      expect(analyzer.analyzedTypes).toMatchObject([
        { range: { pos: 18, end: 36 }, text: ': asserts a is aaa' },
        { range: { pos: 58, end: 76 }, text: ': asserts b is bbb' },
        { range: { pos: 111, end: 129 }, text: ': asserts d is ddd' },
        { range: { pos: 157, end: 175 }, text: ': asserts e is eee' },
        { range: { pos: 192, end: 210 }, text: ': asserts f is fff' }
      ]);
    });
  });
});

it('interface', () => {
  const analyzer = new TypeAnalyzer(`
interface t {};
interface A111 {
  a: number;
  b: string;
  c: {
    e: 1
  }
}`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 0, end: 15 }, text: '\ninterface t {}' },
    {
      range: { pos: 16, end: 81 },
      text: '\ninterface A111 {\n  a: number;\n  b: string;\n  c: {\n    e: 1\n  }\n}'
    }
  ]);
});

it('type alias', () => {
  const analyzer = new TypeAnalyzer(`
type t = number;
type A111  = {
  a: number;
} | 123 & {}`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 0, end: 17 }, text: '\ntype t = number;' },
    { range: { pos: 17, end: 58 }, text: '\ntype A111  = {\n  a: number;\n} | 123 & {}' }
  ]);
});

it('variable statement', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1;
declare const b: number, c: string;
const d: number, e: string;
const eee: null | string = ''
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 13, end: 49 }, text: '\ndeclare const b: number, c: string;' },
    { range: { pos: 57, end: 65 }, text: ': number' },
    { range: { pos: 68, end: 76 }, text: ': string' },
    { range: { pos: 87, end: 102 }, text: ': null | string' }
  ]);
});

it('declare statement', () => {
  const analyzer = new TypeAnalyzer(`
declare const a: number;
declare function b(): number;
declare class c {}
declare module d {}
declare namespace e {}
declare enum f {}
declare global {}
declare module 'g' {}
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 0, end: 25 }, text: '\ndeclare const a: number;' },
    { range: { pos: 25, end: 55 }, text: '\ndeclare function b(): number;' },
    { range: { pos: 55, end: 74 }, text: '\ndeclare class c {}' },
    { range: { pos: 74, end: 94 }, text: '\ndeclare module d {}' },
    { range: { pos: 94, end: 117 }, text: '\ndeclare namespace e {}' },
    { range: { pos: 117, end: 135 }, text: '\ndeclare enum f {}' },
    { range: { pos: 135, end: 153 }, text: '\ndeclare global {}' },
    { range: { pos: 153, end: 175 }, text: "\ndeclare module 'g' {}" }
  ]);
});

it('as expression', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1 as number;
const b = 1 as number | string;
const c = 1 as number | string | null;

const d = () => {
  return 333 as any
}
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 12, end: 22 }, text: ' as number' },
    { range: { pos: 35, end: 54 }, text: ' as number | string' },
    { range: { pos: 67, end: 93 }, text: ' as number | string | null' },
    { range: { pos: 126, end: 133 }, text: ' as any' }
  ]);
});

it('type assertion', () => {
  const analyzer = new TypeAnalyzer(`
const a =<number>1;
const b = <number | string>1;
const c = <number | string | null>1;
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 10, end: 18 }, text: '<number>' },
    { range: { pos: 31, end: 48 }, text: '<number | string>' },
    { range: { pos: 61, end: 85 }, text: '<number | string | null>' }
  ]);
});
