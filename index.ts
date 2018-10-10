#!/usr/bin/env node
// -*- mode: typescript -*-
import { createConnection, TextDocuments, TextDocument, TextDocumentChangeEvent, Diagnostic, DiagnosticSeverity, ProposedFeatures } from "vscode-languageserver";
import { exec, spawn } from "child_process";
import fetch from "node-fetch";
import qs from "qs";
const getPort = require("get-port")
const fileUrlToPath = require("file-uri-to-path");
const writeGood = require("write-good");
const { checkSpellingAsync } = require("spellchecker");
let languageToolClient = async (text: string) => ([] as any[]);

const languageToolServer = {
    listen (port: number) {
	const server = spawn("java", ["-cp", `${__dirname}/LanguageTool-4.3/languagetool-server.jar`, "org.languagetool.server.HTTPServer", "--port", `${port}`]);
	server.stdout.on("data", (data)=>{
	    console.warn(data.toString());
	    if(data.toString().match(/Server started/)) {
		languageToolClient = async (text: string) => {
		    const language = 'en-US';
		    const response = await fetch(`http://localhost:${port}/v2/check?${qs.stringify({language, text})}`);
		    const json = await response.json();
		    return json.matches;
		}
	    }
	});
	server.stderr.on("data", (data)=>{
	    console.warn(data.toString());
	});
	process.on('exit', ()=>server.kill());
    }
};

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments();

connection.onInitialize(() => ({
    capabilities: {
	textDocumentSync: documents.syncKind,
    }
}));

const validateTextDocumentChange = async (change: TextDocumentChangeEvent) => {
    const text = change.document.getText();
    const writeGoodWarnings = process.argv.indexOf("--style") > 0 ? writeGood(text) : [];
    const spellCheckerErrors = process.argv.indexOf("--spelling") > 0 ? await checkSpellingAsync(text) : [];
    const languageToolErrors = process.argv.indexOf("--grammar") > 0 ? await languageToolClient(text) : [];
    const diagnostics: Diagnostic[] = ([] as Diagnostic[])
	.concat(writeGoodWarnings.map((warning: any)=>({
	    severity: DiagnosticSeverity.Hint,
	    code: text.slice(warning.index, warning.index+warning.offset),
	    range: {
		start: change.document.positionAt(warning.index),
		end: change.document.positionAt(warning.index + warning.offset)
	    },
	    message: warning.reason,
	    srouce: "write-good"
	})), spellCheckerErrors.map((error: any)=>({
	    severity: DiagnosticSeverity.Error,
	    code: text.slice(error.start, error.end),
	    range: {
		start: change.document.positionAt(error.start),
		end: change.document.positionAt(error.end)
	    },
	    message: `${text.slice(error.start, error.end)} is misspelled.`,
	    source: "spellchecker",
	})), languageToolErrors.map((error: any)=>({
	    severity: DiagnosticSeverity.Error,
	    code: text.slice(error.offset, error.offset+error.length),
	    range: {
		start: change.document.positionAt(error.offset),
		end: change.document.positionAt(error.offset+error.length)
	    },
	    message: error.message,
	    source: "languagetool"
	})));
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
}


documents.onDidChangeContent(validateTextDocumentChange);

languageToolServer.listen(getPort());

documents.listen(connection);

connection.listen();
