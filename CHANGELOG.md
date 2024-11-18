# 0.6.0 (2024-11-18)

- fix(type-analyzer): add missing generic parameters in class declarations (#11)

- feat: add import/export type hidden (#9)

# 0.5.0 (2023-08-26)

- feat: support TypeScript 5.2 (`using`)

- fix(type-analyzer): support operator(`?`/`!`) when defining type of `variable/class-property`

# 0.4.0 (2023-08-22)

- feat: support for ignoring specified type kinds when hiding (#5)

- fix(editor-context): fix inaccurate cursor when opening a new file

- fix(editor-context): type flicker problem when editing current line code

# 0.3.0 (2023-05-27)

- refactor: improve the icon next to the line of type code
  - support custom icon(`svg/png/jpg/jpeg/...` file format)

# 0.2.0 (2023-05-10)

- fix: fold issue of multi-line type code

- feat: add `status-bar`

# 0.1.1 (2023-04-27)

- fix: adjust keybindings.command(`ts-type-hidden.toggleHiddenMode` -> `ts-type-hidden.toogle`)

# 0.1.0 (2023-04-27)

First release
