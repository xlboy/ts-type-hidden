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
      { range: { pos: 14, end: 48 }, text: 'function a<B extends 222>(): void;' },
      { range: { pos: 49, end: 77 }, text: 'function b<A>(o: A): string;' }
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
      const analyzer = new TypeAnalyzer(`n
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
        { range: { pos: 14, end: 20 }, text: ': A111' },
        { range: { pos: 36, end: 42 }, text: ': B111' },
        { range: { pos: 70, end: 76 }, text: ': C111' },
        { range: { pos: 97, end: 103 }, text: ': D111' },
        { range: { pos: 114, end: 120 }, text: ': E111' }
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
    { range: { pos: 1, end: 15 }, text: 'interface t {}' },
    {
      range: { pos: 17, end: 81 },
      text: 'interface A111 {\n  a: number;\n  b: string;\n  c: {\n    e: 1\n  }\n}'
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
    { range: { pos: 1, end: 17 }, text: 'type t = number;' },
    { range: { pos: 18, end: 58 }, text: 'type A111  = {\n  a: number;\n} | 123 & {}' }
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
    { range: { pos: 14, end: 49 }, text: 'declare const b: number, c: string;' },
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
    { range: { pos: 1, end: 25 }, text: 'declare const a: number;' },
    { range: { pos: 26, end: 55 }, text: 'declare function b(): number;' },
    { range: { pos: 56, end: 74 }, text: 'declare class c {}' },
    { range: { pos: 75, end: 94 }, text: 'declare module d {}' },
    { range: { pos: 95, end: 117 }, text: 'declare namespace e {}' },
    { range: { pos: 118, end: 135 }, text: 'declare enum f {}' },
    { range: { pos: 136, end: 153 }, text: 'declare global {}' },
    { range: { pos: 154, end: 175 }, text: "declare module 'g' {}" }
  ]);
});

it('as expression', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1 as number;
const b = 1 as number | string;
const c = 1 as number | string | null as 111 as 3;

// const d = () => {
  // return 333 as any
// }
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 12, end: 22 }, text: ' as number' },
    { range: { pos: 35, end: 54 }, text: ' as number | string' },
    { range: { pos: 67, end: 93 }, text: ' as number | string | null' },
    { range: { pos: 93, end: 100 }, text: ' as 111' },
    { range: { pos: 100, end: 105 }, text: ' as 3' }
  ]);
});

it('satisfies expression', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1 satisfies number;
const b = 1 satisfies number | string;
const c = 1 satisfies number | string | null;

const d = () => {
  return 333 satisfies any
}
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 12, end: 29 }, text: ' satisfies number' },
    { range: { pos: 42, end: 68 }, text: ' satisfies number | string' },
    { range: { pos: 81, end: 114 }, text: ' satisfies number | string | null' },
    { range: { pos: 147, end: 161 }, text: ' satisfies any' }
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

it('call expression', () => {
  const analyzer = new TypeAnalyzer(`
b<number>();
new d<number, string>();
f<number, string, null>();
new Set<PersistListener<S>>()
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    { range: { pos: 2, end: 10 }, text: '<number>' },
    { range: { pos: 19, end: 35 }, text: '<number, string>' },
    { range: { pos: 40, end: 62 }, text: '<number, string, null>' },
    { range: { end: 93, pos: 73 }, text: '<PersistListener<S>>' }
  ]);
});

describe('class', () => {
  it('property declaration', () => {
    const analyzer = new TypeAnalyzer(`
class A {
  a: number;
  public b: string;
  protected c: {
    e: 1
  }
  private d: () => void = () => {}
}
  `);

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 14, end: 22 }, text: ': number' },
      { range: { pos: 34, end: 42 }, text: ': string' },
      { range: { pos: 57, end: 73 }, text: ': {\n    e: 1\n  }' },
      { range: { pos: 85, end: 97 }, text: ': () => void' }
    ]);
  });

  it('method declaration', () => {
    const analyzer = new TypeAnalyzer(`
class A {
  public a(p: 1): boolean;
  public a(p: 2): number;
  public a(p: 1 | 2): boolean | number {
    return '' as any;
  }
  public b(a: number): string;
  protected c(b: number | 1): {
    e: 1
  }
  protected get compileUtils(): any | 'compileUtils' {
    const abc = {
      getConfig: (): ReadonlyDeep<InnerCompilerConfig> => {
        return getCurrentCompileConfig() as any as unknown;
      },
      b(): void {}
    }
  }
}
  `);

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 11, end: 37 }, text: '  public a(p: 1): boolean;' },
      { range: { pos: 38, end: 63 }, text: '  public a(p: 2): number;' },
      { range: { pos: 76, end: 83 }, text: ': 1 | 2' },
      { range: { pos: 84, end: 102 }, text: ': boolean | number' },
      { range: { pos: 118, end: 125 }, text: ' as any' },
      { range: { pos: 131, end: 161 }, text: '  public b(a: number): string;' },
      {
        range: { pos: 162, end: 206 },
        text: '  protected c(b: number | 1): {\n    e: 1\n  }'
      },
      { range: { pos: 237, end: 259 }, text: ": any | 'compileUtils'" },
      { range: { pos: 299, end: 334 }, text: ': ReadonlyDeep<InnerCompilerConfig>' },
      { range: { pos: 380, end: 387 }, text: ' as any' },
      { range: { pos: 387, end: 398 }, text: ' as unknown' },
      { range: { pos: 418, end: 424 }, text: ': void' }
    ]);
  });

  it('constructor', () => {
    const analyzer = new TypeAnalyzer(`
class A {
  constructor(a: number) {}
}
  `);

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 26, end: 34 }, text: ': number' }
    ]);
  });
});

describe('tsx', () => {
  it('generic arguments', () => {
    const analyzer = new TypeAnalyzer(
      `
  const a = <Component<number> />
  const b = <A<number, string> />
  const c = <A<number, string, null> />
  const d = <A
    <number, string, null, 1, 2 | 3, [22]>
  />
  `,
      true
    );

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 23, end: 31 }, text: '<number>' },
      { range: { pos: 49, end: 65 }, text: '<number, string>' },
      { range: { pos: 83, end: 105 }, text: '<number, string, null>' },
      { range: { pos: 128, end: 166 }, text: '<number, string, null, 1, 2 | 3, [22]>' }
    ]);
  });

  it('integration', () => {
    const analyzer = new TypeAnalyzer(
      `
  const a = <Component<number>
      name
      test={111 as any}
      t2={\`...\${11 as string}\`}
      {...test as object}
    />

  `,
      true
    );

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      { range: { pos: 23, end: 31 }, text: '<number>' },
      { range: { pos: 58, end: 65 }, text: ' as any' },
      { range: { pos: 85, end: 95 }, text: ' as string' },
      { range: { pos: 113, end: 123 }, text: ' as object' }
    ]);
  });
});
