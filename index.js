#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const child_process_1 = require("child_process");
const node_fetch_1 = __importDefault(require("node-fetch"));
const qs_1 = __importDefault(require("qs"));
const getPort = require("get-port");
const fileUrlToPath = require("file-uri-to-path");
const writeGood = require("write-good");
const { checkSpellingAsync } = require("spellchecker");
let languageToolClient = async (text) => [];
const languageToolServer = {
    listen(port) {
        const server = child_process_1.spawn("java", ["-cp", `${__dirname}/LanguageTool-4.3/languagetool-server.jar`, "org.languagetool.server.HTTPServer", "--port", `${port}`]);
        server.stdout.on("data", (data) => {
            console.warn(data.toString());
            if (data.toString().match(/Server started/)) {
                languageToolClient = async (text) => {
                    const language = 'en-US';
                    const response = await node_fetch_1.default(`http://localhost:${port}/v2/check?${qs_1.default.stringify({ language, text })}`);
                    const json = await response.json();
                    return json.matches;
                };
            }
        });
        server.stderr.on("data", (data) => {
            console.warn(data.toString());
        });
        process.on('exit', () => server.kill());
    }
};
const connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
const documents = new vscode_languageserver_1.TextDocuments();
connection.onInitialize(() => ({
    capabilities: {
        textDocumentSync: documents.syncKind,
    }
}));
const removeMarkdown = (markdown) => {
    return markdown
        .replace(/```[\s\S]*?```/mg, (s) => " ".repeat(s.length))
        .replace(/~~~[\s\S]*?~~~/mg, (s) => " ".repeat(s.length))
        .replace(/\$\$?[\s\S]*?\$\$?/mg, (s) => " ".repeat(s.length))
        .replace(/(\[)(.*?)(\]\(.*?\))/mg, (_, s, t, u) => " ".repeat(s.length) + t + " ".repeat(u.length))
        .replace(/[-=>`*_ ]*/mg, (s) => " ".repeat(s.length))
        .replace(/#*/mg, (s) => " ".repeat(s.length));
};
const validateTextDocumentChange = async (change) => {
    const text = process.argv.indexOf("--markdown") > 0 ? removeMarkdown(change.document.getText()) : change.document.getText();
    const writeGoodWarnings = process.argv.indexOf("--style") > 0 ? writeGood(text) : [];
    const spellCheckerErrors = process.argv.indexOf("--spelling") > 0 ? await checkSpellingAsync(text) : [];
    const languageToolErrors = process.argv.indexOf("--grammar") > 0 ? await languageToolClient(text) : [];
    const diagnostics = []
        .concat(writeGoodWarnings.map((warning) => ({
        severity: vscode_languageserver_1.DiagnosticSeverity.Hint,
        code: text.slice(warning.index, warning.index + warning.offset),
        range: {
            start: change.document.positionAt(warning.index),
            end: change.document.positionAt(warning.index + warning.offset)
        },
        message: warning.reason,
        srouce: "write-good"
    })), spellCheckerErrors.map((error) => ({
        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
        code: text.slice(error.start, error.end),
        range: {
            start: change.document.positionAt(error.start),
            end: change.document.positionAt(error.end)
        },
        message: `${text.slice(error.start, error.end)} is misspelled.`,
        source: "spellchecker",
    })), languageToolErrors.filter((error) => {
        return !error.message.match(/repeated a whitespace/);
    }).map((error) => ({
        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
        code: text.slice(error.offset, error.offset + error.length),
        range: {
            start: change.document.positionAt(error.offset),
            end: change.document.positionAt(error.offset + error.length)
        },
        message: error.message,
        source: "languagetool"
    })));
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
};
documents.onDidChangeContent(validateTextDocumentChange);
(async () => { languageToolServer.listen(await getPort()); })();
documents.listen(connection);
connection.listen();
