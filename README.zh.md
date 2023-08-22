# TS Type Hidden 

将那些熟悉的类型代码隐藏起来吧！让代码片段回到最简洁的模样！

[English](./README.md) | 简体中文

<img width="1422" alt="example" src="https://github.com/xlboy/ts-type-hidden/assets/63690944/b5842800-169e-491e-8cd2-5690caeb5990">

---

## 特性

- 一键**隐藏/显示**类型代码
- 自定义需要隐藏的类型种类（`interface`, `type-alias`, ...）
- 光标移入隐藏的类型代码处时会取消隐藏，以便对相关类型进行操作
- 隐藏的类型代码行旁会有一个小蓝点，以便于区分
- 多行形式的类型代码在隐藏模式下会被折叠成一行
- 状态栏处显示当前隐藏模式的状态，点击可切换

## 命令

- `ts-type-hidden.toggle`: 切换当前隐藏模式
  - 默认绑定的快捷键：
    - mac: `cmd + shift + t`
    - windows: `ctrl + shift + t`
  
- `ts-type-hidden.open`: 打开隐藏模式

- `ts-type-hidden.close`: 关闭隐藏模式

## 设置

- `ts-type-hidden.enable`: 是否启用插件

- `ts-type-hidden.typeIconPath`: 类型代码行旁的图标文件路径（支持 `svg/png/jpg/jpeg/...` 文件格式）

- `ts-type-hidden.ignoreTypeKinds`: 不需要隐藏的类型种类👇

  <details>
  <summary>查看示例</summary><br>
  <video src="https://github.com/xlboy/ts-type-hidden/assets/63690944/2e8da4d0-360c-44c9-8059-252eb7829da8" />
  </details>

  <details>
  <summary>查看配置项</summary>

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
    ⏭️ 👆所有以 `declare` 开头的语句
  </details>


## CHANGELOG

[CHANGELOG.md](https://github.com/xlboy/ts-type-hidden/blob/master/CHANGELOG.md)

## License

MIT License © 2023-PRESENT  [xlboy](https://github.com/xlboy)
