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
   * class A {
   *   public size?: number;
   *   private setSize!: Function = () => {}
   * }
   * ```
   * ⏭️  `?: number`
   *
   * ⏭️  `!: Function`
   */
  CLASS_PROPERTY_DECLARATION_TYPE = 'class-property-declaration-type',

  /**
   * ```ts
   * const num: any = 77;
   * const num1 = (<number>num).toFixed(2);
   * ```
   * ⏭️  `<number>`
   */
  ANGLE_BRACKETS_TYPE_ASSERTION = 'angle-brackets-type-assertion',

  /**
   * ```ts
   * fn() as any;
   * ```
   * ⏭️  ` as any`
   */
  AS_EXPRESSION = 'as-expression',

  /**
   * ```ts
   * const user = { ... } satisfies UserModel;
   * ```
   * ⏭️  ` satisfies UserModel`
   */
  SATISFIES_EXPRESSION = 'satisfies-expression',
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
   * ⏭️  ↑↑ All statements that begin with `declare`
   */
  DECLARE_STATEMENT = 'declare-statement',

  /**
   * ```ts
   * const a: number = 1;
   * ```
   * ⏭️  `: number`
   */
  VARIABLE_TYPE_DECLARATION = 'variable-type-declaration'
}
