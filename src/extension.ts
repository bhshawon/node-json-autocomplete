'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JsonCompletionProvider } from './json-completion-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const jsonAutoProvider1 = vscode.languages.registerCompletionItemProvider('javascript', new JsonCompletionProvider(), '.');
    const jsonAutoProvider2 = vscode.languages.registerCompletionItemProvider('typescript', new JsonCompletionProvider(), '.');

    context.subscriptions.push(jsonAutoProvider1, jsonAutoProvider2);
}

// this method is called when your extension is deactivated
export function deactivate() {
}