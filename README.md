# Prose Language Server
A Language server for LanguageTool and write-good

## Installation

```shell
$ npm install -g xtaniguchimasaya/prose-language-server#release
```

Prose language server uses Windows and macOS native spell-check API.
For Linux, since it uses hunspell, you have to install it. For example `apt install hunspell hunspell-en-us`.

## Usage

```shell
$ prose-language-server --stdio --style --grammar --spelling
$ prose-language-server --socket=4567 --style --grammar --spelling
```

### Emacs

For `eglot`, append your `init.el` or `.emacs`

```emacs-lisp
(add-to-list eglot-server-program `(text-mode . ("prose-language-server" "--stdio" "--style" "--grammar" "--spelling")))
```
