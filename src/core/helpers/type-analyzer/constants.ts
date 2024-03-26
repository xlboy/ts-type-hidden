export enum TYPE_KIND {
  /**
   * ```ts
   * type A  = ({ ... } & { ... }) | string[]
   * ```
   * ⏭️  `type A = ({ ... } & { ... }) | string[]`
   */
  TYPE_ALIAS = 'type-alias',
  /**
   * ```ts
   * interface A {
   *   ...
   * }
   * ```
   * ⏭️  `interface A { ... }`
   */
  INTERFACE = 'interface',
  /**
   * ```ts
   * function fn(a: number): number[];
   * function fn(a: number[], opts: { ... }): number[];
   * ```
   * ⏭️  `function fn(a: number): number[];`
   *
   * ⏭️  `function fn(a: number[], opts: { ... }): number[];`
   */
  FUNCTION_OVERLOAD = 'function-overload',

  /**
   * ```ts
   * function fn(): number {}
   * ```
   * ⏭️  `: number`
   */
  FUNCTION_RETURN = 'function-return',
  /**
   * ```ts
   * function fn(a: any): a is number {}
   * ```
   * ⏭️  `: a is number`
   */
  FUNCTION_TYPE_PREDICATE = 'function-type-predicate',
  /**
   * ```ts
   * function fn<A extends string>(a: A, b: number) {}
   * ```
   * ⏭️  `: A`
   *
   * ⏭️  `: number`
   */
  FUNCTION_PARAMETER = 'function-parameter',
  /**
   * ```ts
   * function fn<A extends string, B = [A, '']>() {}
   * ```
   * ⏭️  `<A extends string, B = [A, '']>`
   */
  FUNCTION_GENERIC_DEFINITION = 'function-generic-definition',

  /**
   * ```ts
   * const name = get<UserModule>(userModule, 'info.name');
   * const userModel = new UserModel<UserEntity>({ ... });
   * ```
   * ⏭️  `<UserModule>`
   *
   * ⏭️  `<UserEntity>`
   */
  FUNCTION_CALL_GENERIC = 'function-call-generic',
  /**
   * ```ts
   * const EditUserForm = <ProForm<UserModel> id={userId} />;
   * ```
   * ⏭️  `<UserModel>`
   */
  TSX_COMPONENT_GENERIC = 'tsx-component-generic',

  /**
   * ```ts
   * const a: number = 1;
   * ```
   * ⏭️  `: number`
   */
  VARIABLE_TYPE_DEFINITION = 'variable-type-definition',

  /**
   * ```ts
   * class A {
   *   public size?: number;
   *   private setSize!: Function = () => {}
   * }
   * ```
   * ⏭️  `?: number`
   *
   * ⏭️  `!: Function`
   */
  CLASS_PROPERTY_TYPE_DEFINITION = 'class-property-type-definition',

  /**
   * ```ts
   * const num: any = 77;
   * const num1 = (<number>num).toFixed(2);
   * ```
   * ⏭️  `<number>`
   */
  ANGLE_BRACKETS_ASSERTION = 'angle-brackets-assertion',

  /**
   * ```ts
   * fn() as any;
   * ```
   * ⏭️  ` as any`
   */
  AS_ASSERTION = 'as-assertion',

  /**
   * ```ts
   * const user = { ... } satisfies UserModel;
   * ```
   * ⏭️  ` satisfies UserModel`
   */
  SATISFIES_OPERATOR = 'satisfies-operator',
  /**
   * ```ts
   * declare const a: number;
   * declare function b(): number;
   * declare class c {}
   * declare module d {}
   * declare namespace e {}
   * declare enum f {}
   * declare global {}
   * declare module 'g' {}
   * ```
   * ⏭️  👆 All statements that begin with `declare`
   */
  DECLARE_STATEMENT = 'declare-statement',
  /**
   * ```ts
   * import type { a1 } from 'a';
   * import type * as b1 from 'b';
   * ```
   * ⏭️  `import type ...;`
   */
  TYPE_ONLY_IMPORT_DECLARATION = 'type-only-import-declaration',
  /**
   * ```ts`
   * import { type c1, c2 } from 'c'; 
   * ```
   * ⏭️  `type c`
   */
  IMPORT_TYPE_SPECIFIER = 'import-type-specifier',
   /**
   * ```ts
   * export type { a } from 'a';
   * export type * from 'b';
   * ```
   * ⏭️  `export type ...;`
   */
  TYPE_ONLY_EXPORT_DECLARATION = 'type-only-export-declaration',
  /**
   * ```ts
   * export { type c1, c2 } from 'c'; 
   * ```
   * ⏭️  `type c1`
   */
  EXPORT_TYPE_SPECIFIER = 'export-type-specifier'
}
