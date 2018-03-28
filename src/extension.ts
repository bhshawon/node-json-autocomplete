'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JsonCompletionProvider } from './json-completion-provider';
import { JsonDefinitionProvider } from './json-definition-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const jsonAutoProviderJS = vscode.languages.registerCompletionItemProvider('javascript', new JsonCompletionProvider(), '.');
    const jsonAutoProviderTS = vscode.languages.registerCompletionItemProvider('typescript', new JsonCompletionProvider(), '.');

    const jsonDefinitionProviderJS = vscode.languages.registerDefinitionProvider('javascript', new JsonDefinitionProvider());
    const jsonDefinitionProviderTS = vscode.languages.registerDefinitionProvider('typescript', new JsonDefinitionProvider());

    context.subscriptions.push(jsonAutoProviderJS, jsonAutoProviderTS, jsonDefinitionProviderJS, jsonDefinitionProviderTS);
}

// this method is called when your extension is deactivated
export function deactivate() {
}