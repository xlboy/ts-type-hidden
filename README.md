

# TS Type Hidden

Hide those familiar type codes! Get the snippet back to its simplest form!

English | [简体中文](./README.zh.md)

<img width="1422" alt="example" src="https://github.com/xlboy/ts-type-hidden/assets/63690944/b5842800-169e-491e-8cd2-5690caeb5990">

## Features

- One-click **hide/show** type code
- Customize the type kinds that need to be hidden (`interface`, `type-alias`, ...)
- Type code will be displayed when cursor active the line
- There are small blue dots that means relative line exist hidden type code
- Under hidden mode, Multi-line type code will be folded into one line
- Status bar shows the current hidden mode status, click to toggle

## Commands

- `ts-type-hidden.toogle`: Toggle the current hidden mode
  - Default keyboard shortcuts：
    - mac: `cmd + shift + t`
    - windows: `ctrl + shift + t`
  
- `ts-type-hidden.open`: Open the hidden mode

- `ts-type-hidden.close`: Close the hidden mode

## Settings

- `ts-type-hidden.enable`: Enable the plugin or not

- `ts-type-hidden.typeIconPath`: The path to the Icon file next to a line of type code(support `svg/png/jpg/jpeg/...` file format)

- `ts-type-hidden.ignoreTypeKinds`: Type kinds that do not need to be hidden👇

  <details>
  <summary>View example</summary><br>
  <video src="https://github.com/xlboy/ts-type-hidden/assets/63690944/2e8da4d0-360c-44c9-8059-252eb7829da8" />
  </details>

  <details>
  <summary>View configuration options</summary>

  - `type-alias`:
    ```ts                                        
    type A  = ({ ... } & { ... }) | string[]
    ```
    ⏭️  `type A = ({ ... } & { ... }) | string[]` 

  - `interface`:
    ```ts                    
    interface A { ... }
    ```
    ⏭️  `interface A { ... }` 

  - `function-overload`:
    ```ts 
    function fn(a: number): number[];
    function fn(a: number[], opts: { ... }): number[];
    ```
    ⏭️  `function fn(a: number): number[];`

    ⏭️  `function fn(a: number[], opts: { ... }): number[];`

  - `function-return`:
    ```ts 
    function fn(): number {}
    ```
    ⏭️  `: number`

  - `function-type-predicate`:
    ```ts 
    function fn(a: any): a is number {}
    ```
    ⏭️  `: a is number`

  - `function-parameter`:
    ```ts 
    function fn<A extends string>(a: A, b: number) {}
    ```
    ⏭️  `: A`

    ⏭️  `: number`

  - `function-generic-definition`:
    ```ts 
    function fn<A extends string, B = [A, '']>() {}
    ```
    ⏭️  `<A extends string, B = [A, '']>`

  - `function-call-generic`:
    ```ts 
    const name = get<UserModule>(userModule, 'info.name');
    const userModel = new UserModel<UserEntity>({ ... });
    ```
    ⏭️  `<UserModule>`

    ⏭️  `<UserEntity>`

  - `tsx-component-generic`:
    ```ts 
    const EditUserForm = <ProForm<UserModel> id={userId} />;
    ```
    ⏭️  `<UserModel>`

  - `variable-type-definition`:
    ```ts 
    const a: number = 1;
    ```
    ⏭️  `: number`

  - `class-property-type-definition`:
    ```ts 
    class A {
      public size?: number;
      private setSize!: Function = () => {}
    }
    ```
    ⏭️  `?: number`

    ⏭️  `!: Function`

  - `angle-brackets-assertion`:
    ```ts 
    const num: any = 77;
    const num1 = (<number>num).toFixed(2);
    ```
    ⏭️  `<number>`

  - `as-assertion`:
    ```ts
    fn() as any;
    ```
    ⏭️  ` as any`

  - `satisfies-operator`:
    ```ts
    const user = { ... } satisfies UserModel;
    ```
    ⏭️  ` satisfies UserModel`

  - `declare-statement`:
    ```ts
    declare const a: number;
    declare function b(): number;
    declare class c {}
    declare module d {}
    declare namespace e {}
    declare enum f {}
    declare global {}
    declare module 'g' {}
    ```
    ⏭️ 👆All statements that begin with `declare`
  
  - `type-only-import-declaration`:
    ```ts
    import type * as a from 'a';
    import type { b1 } from 'b';
    ```
    ⏭️  `import type * as a from 'a';`

    ⏭️  `import type { b1 } from 'b';`

  - `import-type-specifier`:
    ```ts
    import {type a1, a2} from 'a';
    ```
    ⏭️  `type a1`
  
  - `type-only-export-declaration`:
    ```ts
    export type * as a from 'a';
    export type { b1 } from 'b';
    ```
    ⏭️  `export type * from 'a';`

    ⏭️  `export type { b1 } from 'b';`

  - `export-type-specifier`:
    ```ts
    export {a1, type a2} from 'a';
    ```
    ⏭️  ` type a2`

  </details>

## CHANGELOG

[CHANGELOG.md](https://github.com/xlboy/ts-type-hidden/blob/master/CHANGELOG.md)

## License

MIT License © 2023-PRESENT  [xlboy](https://github.com/xlboy)
