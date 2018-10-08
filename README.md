# Prose Language Server
A Language server for LanguageTool and write-good

## Installation

```shell
$ npm install -g xtaniguchimasaya/prose-language-server
```

## Usage

```shell
$ prose-language-server --stdio --languagetool /path/to/languagetool-commandline.jar
$ prose-language-server --socket=4567 --languagetool /path/to/languagetool-commandline.jar
```

### Emacs

For `eglot`, append your `init.el` or `.emacs`

```emacs-lisp
(add-to-list eglot-server-program `(text-mode . ("prose-language-server" "--stdio" "--languagetool" ,(expand-file-name "~/.emacs.d/LanguageTool-4.3/languagetool-commandline.jar"))))
```

and type the following commands

```shell
$ cd ~/.emacs.d
$ wget https://www.languagetool.org/download/LanguageTool-4.3.zip
$ unzip LanguageTool-4.3.zip
```
