import { createConnection, TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity, ProposedFeatures } from "vscode-languageserver";
import { readFile, appendFileSync } from "fs";
import { promisify } from "util";
const WriteGood: (text: string) => {
    reason: string,
    index: number,
    offset: number
}[] = require("write-good");

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments();

connection.onInitialize(() => ({
    capabilities: {
	textDocumentSync: documents.syncKind,
    }
}));

documents.onDidChangeContent(async (change) => {
    const text = change.document.getText();
    const suggestions = WriteGood(text);
    const diagnostics: Diagnostic[] = suggestions.map(warning=>({
	severity: DiagnosticSeverity.Hint,
	code: change.document.getText().slice(warning.index, warning.index+warning.offset),
	range: {
	    start: change.document.positionAt(warning.index),
	    end: change.document.positionAt(warning.index + warning.offset)
	},
	message: warning.reason,
	srouce: "write-good"
    }));
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});
			
documents.listen(connection);

connection.listen();
