# Prose Language Server
A Language server for LanguageTool and write-good

## Installation

```shell
$ npm install -g xtaniguchimasaya/prose-language-server
```

## Usage

```shell
$ prose-language-server --stdio
$ prose-language-server --socket=4567
```

### Emacs

For `eglot`, append this to your `init.el` or `.emacs` files.

```emacs-lisp
(add-to-list 'eglot-server-program `(text-mode . ("prose-language-server" "--stdio")))
(add-to-list 'eglot-server-program `(markdown-mode . ("prose-language-server" "--stdio" "--markdown")))
(add-to-list 'eglot-server-program `(LaTeX-mode . ("prose-language-server" "--stdio" "--latex")))
```
