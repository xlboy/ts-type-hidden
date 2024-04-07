import { describe, expect, it } from 'vitest';
import { TypeAnalyzer } from '.';
import { TYPE_KIND } from './constants';

describe('function', () => {
  it('overloading', () => {
    const analyzer = new TypeAnalyzer(`
const t = 1

function a<B extends 222>(): void;
function b<A>(o: A): string;
`);
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 14, end: 48 },
        text: 'function a<B extends 222>(): void;',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      },
      {
        range: { pos: 49, end: 77 },
        text: 'function b<A>(o: A): string;',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      }
    ]);
  });

  it('function-generic-definition - a`<B extends ...>`()', () => {
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
      {
        range: { pos: 11, end: 41 },
        text: '<B extends 111, C extends 111>',
        kind: TYPE_KIND.FUNCTION_GENERIC_DEFINITION
      },
      {
        range: { pos: 57, end: 87 },
        text: '<B extends 222, C extends 222>',
        kind: TYPE_KIND.FUNCTION_GENERIC_DEFINITION
      },
      {
        range: { pos: 115, end: 145 },
        text: '<B extends 333, C extends 333>',
        kind: TYPE_KIND.FUNCTION_GENERIC_DEFINITION
      },
      {
        range: { pos: 166, end: 196 },
        text: '<B extends 444, C extends 444>',
        kind: TYPE_KIND.FUNCTION_GENERIC_DEFINITION
      }
    ]);
  });

  it('function-parameter - (`a: number, b: string, ...`)', () => {
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
      {
        range: { pos: 14, end: 20 },
        text: ': A111',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 24, end: 31 },
        text: '?: A222',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 49, end: 55 },
        text: ': B111',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 59, end: 66 },
        text: '?: B222',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 96, end: 102 },
        text: ': C111',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 106, end: 113 },
        text: '?: C222',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 136, end: 142 },
        text: ': E111',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 146, end: 153 },
        text: '?: E222',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 166, end: 172 },
        text: ': F111',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 176, end: 183 },
        text: '?: F222',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      }
    ]);
  });

  it('function-return - ()`: number`', () => {
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
      {
        range: { pos: 14, end: 20 },
        text: ': A111',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 36, end: 42 },
        text: ': B111',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 70, end: 76 },
        text: ': C111',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 97, end: 103 },
        text: ': D111',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 114, end: 120 },
        text: ': E111',
        kind: TYPE_KIND.FUNCTION_RETURN
      }
    ]);
  });

  it('function-type-predicate - (a: any)`: asserts a is ...)`', () => {
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
      {
        range: { pos: 18, end: 36 },
        text: ': asserts a is aaa',
        kind: TYPE_KIND.FUNCTION_TYPE_PREDICATE
      },
      {
        range: { pos: 58, end: 76 },
        text: ': asserts b is bbb',
        kind: TYPE_KIND.FUNCTION_TYPE_PREDICATE
      },
      {
        range: { pos: 111, end: 129 },
        text: ': asserts d is ddd',
        kind: TYPE_KIND.FUNCTION_TYPE_PREDICATE
      },
      {
        range: { pos: 157, end: 175 },
        text: ': asserts e is eee',
        kind: TYPE_KIND.FUNCTION_TYPE_PREDICATE
      },
      {
        range: { pos: 192, end: 210 },
        text: ': asserts f is fff',
        kind: TYPE_KIND.FUNCTION_TYPE_PREDICATE
      }
    ]);
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
    {
      range: { pos: 1, end: 15 },
      text: 'interface t {}',
      kind: TYPE_KIND.INTERFACE
    },
    {
      range: { pos: 17, end: 81 },
      text: 'interface A111 {\n  a: number;\n  b: string;\n  c: {\n    e: 1\n  }\n}',
      kind: TYPE_KIND.INTERFACE
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
    {
      range: { pos: 1, end: 17 },
      text: 'type t = number;',
      kind: TYPE_KIND.TYPE_ALIAS
    },
    {
      range: { pos: 18, end: 58 },
      text: 'type A111  = {\n  a: number;\n} | 123 & {}',
      kind: TYPE_KIND.TYPE_ALIAS
    }
  ]);
});

it('variable type definition', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1;
declare const b: number, c: string;
const d: number, e: string;
const eee: null | string = ''
let fff!: string = ''
using ggg: usingAny = fn();
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    {
      range: { pos: 14, end: 49 },
      text: 'declare const b: number, c: string;',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 57, end: 65 },
      text: ': number',
      kind: TYPE_KIND.VARIABLE_TYPE_DEFINITION
    },
    {
      range: { pos: 68, end: 76 },
      text: ': string',
      kind: TYPE_KIND.VARIABLE_TYPE_DEFINITION
    },
    {
      range: { pos: 87, end: 102 },
      text: ': null | string',
      kind: TYPE_KIND.VARIABLE_TYPE_DEFINITION
    },
    {
      range: { pos: 115, end: 124 },
      text: '!: string',
      kind: TYPE_KIND.VARIABLE_TYPE_DEFINITION
    },
    {
      range: { pos: 139, end: 149 },
      text: ': usingAny',
      kind: TYPE_KIND.VARIABLE_TYPE_DEFINITION
    }
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
    {
      range: { pos: 1, end: 25 },
      text: 'declare const a: number;',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 26, end: 55 },
      text: 'declare function b(): number;',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 56, end: 74 },
      text: 'declare class c {}',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 75, end: 94 },
      text: 'declare module d {}',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 95, end: 117 },
      text: 'declare namespace e {}',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 118, end: 135 },
      text: 'declare enum f {}',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 136, end: 153 },
      text: 'declare global {}',
      kind: TYPE_KIND.DECLARE_STATEMENT
    },
    {
      range: { pos: 154, end: 175 },
      text: "declare module 'g' {}",
      kind: TYPE_KIND.DECLARE_STATEMENT
    }
  ]);
});

it('as expression', () => {
  const analyzer = new TypeAnalyzer(`
const a = 1 as number;
const b = 1 as number | string;
const c = 1 as number | string | null as 111 as 3;
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    {
      range: { pos: 12, end: 22 },
      text: ' as number',
      kind: TYPE_KIND.AS_ASSERTION
    },
    {
      range: { pos: 35, end: 54 },
      text: ' as number | string',
      kind: TYPE_KIND.AS_ASSERTION
    },
    {
      range: { pos: 67, end: 93 },
      text: ' as number | string | null',
      kind: TYPE_KIND.AS_ASSERTION
    },
    {
      range: { pos: 93, end: 100 },
      text: ' as 111',
      kind: TYPE_KIND.AS_ASSERTION
    },
    {
      range: { pos: 100, end: 105 },
      text: ' as 3',
      kind: TYPE_KIND.AS_ASSERTION
    }
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
    {
      range: { pos: 12, end: 29 },
      text: ' satisfies number',
      kind: TYPE_KIND.SATISFIES_OPERATOR
    },
    {
      range: { pos: 42, end: 68 },
      text: ' satisfies number | string',
      kind: TYPE_KIND.SATISFIES_OPERATOR
    },
    {
      range: { pos: 81, end: 114 },
      text: ' satisfies number | string | null',
      kind: TYPE_KIND.SATISFIES_OPERATOR
    },
    {
      range: { pos: 147, end: 161 },
      text: ' satisfies any',
      kind: TYPE_KIND.SATISFIES_OPERATOR
    }
  ]);
});

it('satisfies & as', () => {
  const analyzer = new TypeAnalyzer(`
const a = {} satisfies {} as const;
const b = {} as const satisfies {};
`);

  analyzer.analyze();

  expect(analyzer.analyzedTypes).toMatchObject([
    {
      kind: TYPE_KIND.SATISFIES_OPERATOR,
      range: { pos: 13, end: 26 },
      text: ' satisfies {}'
    },
    {
      kind: TYPE_KIND.AS_ASSERTION,
      range: { pos: 26, end: 35 },
      text: ' as const'
    },
    {
      kind: TYPE_KIND.AS_ASSERTION,
      range: { pos: 49, end: 58 },
      text: ' as const'
    },
    {
      kind: TYPE_KIND.SATISFIES_OPERATOR,
      range: { pos: 58, end: 71 },
      text: ' satisfies {}'
    }
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
    {
      range: { pos: 10, end: 18 },
      text: '<number>',
      kind: TYPE_KIND.ANGLE_BRACKETS_ASSERTION
    },
    {
      range: { pos: 31, end: 48 },
      text: '<number | string>',
      kind: TYPE_KIND.ANGLE_BRACKETS_ASSERTION
    },
    {
      range: { pos: 61, end: 85 },
      text: '<number | string | null>',
      kind: TYPE_KIND.ANGLE_BRACKETS_ASSERTION
    }
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
    {
      range: { pos: 2, end: 10 },
      text: '<number>',
      kind: TYPE_KIND.FUNCTION_CALL_GENERIC
    },
    {
      range: { pos: 19, end: 35 },
      text: '<number, string>',
      kind: TYPE_KIND.FUNCTION_CALL_GENERIC
    },
    {
      range: { pos: 40, end: 62 },
      text: '<number, string, null>',
      kind: TYPE_KIND.FUNCTION_CALL_GENERIC
    },
    {
      range: { end: 93, pos: 73 },
      text: '<PersistListener<S>>',
      kind: TYPE_KIND.FUNCTION_CALL_GENERIC
    }
  ]);
});

describe('class', () => {
  it('property type definition', () => {
    const analyzer = new TypeAnalyzer(`
class A {
  a: number;
  public b: string;
  protected c: {
    e: 1
  }
  private d: () => void = () => {}
  e!: boolean;
  g?: string; 
}
  `);

    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 14, end: 22 },
        text: ': number',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      },
      {
        range: { pos: 34, end: 42 },
        text: ': string',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      },
      {
        range: { pos: 57, end: 73 },
        text: ': {\n    e: 1\n  }',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      },
      {
        range: { pos: 85, end: 97 },
        text: ': () => void',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      },
      {
        range: { pos: 112, end: 122 },
        text: '!: boolean',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      },
      {
        range: { end: 136, pos: 127 },
        text: '?: string',
        kind: TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION
      }
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
      {
        range: { pos: 11, end: 37 },
        text: '  public a(p: 1): boolean;',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      },
      {
        range: { pos: 38, end: 63 },
        text: '  public a(p: 2): number;',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      },
      {
        range: { pos: 76, end: 83 },
        text: ': 1 | 2',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      },
      {
        range: { pos: 84, end: 102 },
        text: ': boolean | number',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 118, end: 125 },
        text: ' as any',
        kind: TYPE_KIND.AS_ASSERTION
      },
      {
        range: { pos: 131, end: 161 },
        text: '  public b(a: number): string;',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      },
      {
        range: { pos: 162, end: 206 },
        text: '  protected c(b: number | 1): {\n    e: 1\n  }',
        kind: TYPE_KIND.FUNCTION_OVERLOAD
      },
      {
        range: { pos: 237, end: 259 },
        text: ": any | 'compileUtils'",
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 299, end: 334 },
        text: ': ReadonlyDeep<InnerCompilerConfig>',
        kind: TYPE_KIND.FUNCTION_RETURN
      },
      {
        range: { pos: 380, end: 387 },
        text: ' as any',
        kind: TYPE_KIND.AS_ASSERTION
      },
      {
        range: { pos: 387, end: 398 },
        text: ' as unknown',
        kind: TYPE_KIND.AS_ASSERTION
      },
      {
        range: { pos: 418, end: 424 },
        text: ': void',
        kind: TYPE_KIND.FUNCTION_RETURN
      }
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
      {
        range: { pos: 26, end: 34 },
        text: ': number',
        kind: TYPE_KIND.FUNCTION_PARAMETER
      }
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
      {
        range: { pos: 23, end: 31 },
        text: '<number>',
        kind: TYPE_KIND.TSX_COMPONENT_GENERIC
      },
      {
        range: { pos: 49, end: 65 },
        text: '<number, string>',
        kind: TYPE_KIND.TSX_COMPONENT_GENERIC
      },
      {
        range: { pos: 83, end: 105 },
        text: '<number, string, null>',
        kind: TYPE_KIND.TSX_COMPONENT_GENERIC
      },
      {
        range: { pos: 128, end: 166 },
        text: '<number, string, null, 1, 2 | 3, [22]>',
        kind: TYPE_KIND.TSX_COMPONENT_GENERIC
      }
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
      {
        range: { pos: 23, end: 31 },
        text: '<number>',
        kind: TYPE_KIND.TSX_COMPONENT_GENERIC
      },
      {
        range: { pos: 58, end: 65 },
        text: ' as any',
        kind: TYPE_KIND.AS_ASSERTION
      },
      {
        range: { pos: 85, end: 95 },
        text: ' as string',
        kind: TYPE_KIND.AS_ASSERTION
      },
      {
        range: { pos: 113, end: 123 },
        text: ' as object',
        kind: TYPE_KIND.AS_ASSERTION
      }
    ]);
  });
});

describe('import', () => {
  it('import type ...', () => {
    const analyzer = new TypeAnalyzer(
      `
import type * as a from "a"
import type {b1, b2} from "b"
// NO import type * from "b"
`,
      true
    );
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      // KEY: ImportClause.isTypeOnly = true
      {
        range: { pos: 1, end: 28 },
        text: 'import type * as a from "a"',
        kind: TYPE_KIND.TYPE_ONLY_IMPORT_DECLARATION
      },
      {
        range: { pos: 29, end: 58 },
        text: 'import type {b1, b2} from "b"',
        kind: TYPE_KIND.TYPE_ONLY_IMPORT_DECLARATION
      }
    ]);
  });
  it('import {type ...} ...', () => {
    const analyzer = new TypeAnalyzer(
      `
import {type c1, c2} from "c"
import {type d1, type d2} from "d"
`,
      true
    );
    analyzer.analyze();
    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 9, end: 16 },
        text: 'type c1',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 39, end: 46 },
        text: 'type d1',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 47, end: 55 },
        text: ' type d2',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      }
    ]);
  });
  it('import {type ...} plus', () => {
    const analyzer = new TypeAnalyzer(
      `
import {e1, type e2} from "e"
import {type f1, f2, type f3} from "f"
`,
      true
    );
    analyzer.analyze();
    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 12, end: 20 },
        text: ' type e2',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 39, end: 46 },
        text: 'type f1',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 51, end: 59 },
        text: ' type f3',
        kind: TYPE_KIND.IMPORT_TYPE_SPECIFIER
      }
    ]);
  });
});


describe('export', () => {
  it('export type *', () => {
    const analyzer = new TypeAnalyzer(
      `
export type * from "a"
export type * as c1 from "c"
`,
      true
    );
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 1, end: 23 },
        text: 'export type * from "a"',
        kind: TYPE_KIND.TYPE_ONLY_EXPORT_DECLARATION
      },
      {
        range: { pos: 24, end: 52 },
        text: 'export type * as c1 from "c"',
        kind: TYPE_KIND.TYPE_ONLY_EXPORT_DECLARATION
      }
    ]);
  });
  it('export type {...}', () => {
    const analyzer = new TypeAnalyzer(
      `
export type {b1,b2} from "b"`,
      true
    );
    analyzer.analyze();

    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 1, end: 29 },
        text: 'export type {b1,b2} from "b"',
        kind: TYPE_KIND.TYPE_ONLY_EXPORT_DECLARATION
      }
    ]);
  });
  it('export {type...} ...', () => {
    const analyzer = new TypeAnalyzer(
      `
export {type c1, c2} from "c"
export {type d1, type d2} from "d"`,
      true
    );
    analyzer.analyze();
    expect(analyzer.analyzedTypes).toMatchObject([
      {
        range: { pos: 9, end: 16 },
        text: 'type c1',
        kind: TYPE_KIND.EXPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 39, end: 46 },
        text: 'type d1',
        kind: TYPE_KIND.EXPORT_TYPE_SPECIFIER
      },
      {
        range: { pos: 47, end: 55 },
        text: ' type d2',
        kind: TYPE_KIND.EXPORT_TYPE_SPECIFIER
      }
    ]);
  });
});
