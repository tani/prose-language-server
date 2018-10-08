#!/usr/bin/env node
// -*- mode: typescript -*-
import { createConnection, TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity, ProposedFeatures } from "vscode-languageserver";
const { exec } = require("child-process-promise");
const FileUriToPath = require('file-uri-to-path');
const WriteGood = require("write-good");

const languagetoolCommandline = process.argv[process.argv.indexOf("--languagetool")+1];

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments();

connection.onInitialize(() => ({
    capabilities: {
	textDocumentSync: documents.syncKind,
    }
}));

documents.onDidChangeContent(async (change) => {
    const warnings = WriteGood(change.document.getText());
    const result = await exec(`java -jar ${languagetoolCommandline} --json ${FileUriToPath(change.document.uri)}`);
    const errors = JSON.parse(result.stdout).matches;
    const diagnostics: Diagnostic[] = [].concat(warnings.map((warning: any)=>({
	severity: DiagnosticSeverity.Hint,
	code: change.document.getText().slice(warning.index, warning.index+warning.offset),
	range: {
	    start: change.document.positionAt(warning.index),
	    end: change.document.positionAt(warning.index + warning.offset)
	},
	message: warning.reason,
	srouce: "write-good"
    })), errors.map((error: any)=>({
	severity: DiagnosticSeverity.Error,
	code: change.document.getText().slice(error.offset, error.offset+error.length),
	range: {
	    start: change.document.positionAt(error.offset),
	    end: change.document.positionAt(error.offset+error.length)
	},
	message: error.message,
	source: "LanguageTool"
    })));
    
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});
			
documents.listen(connection);

connection.listen();
