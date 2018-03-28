import {
  CompletionItemProvider,
  TextDocument,
  Position,
  CompletionItem,
  CompletionItemKind,
  CancellationToken,
  CompletionContext,
  workspace,
  Range
} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class JsonCompletionProvider implements CompletionItemProvider {
  label: string;
  provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, context: CompletionContext) {
    const jsons = this.getImportedJsons(document);

    this.getJsonCompletionItems(document, position, jsons);

    return Promise.resolve(this.getJsonCompletionItems(document, position, jsons));
  }

  getJsonCompletionItems(document: TextDocument, position: Position, jsons: Object): CompletionItem[] {
    const jsonSequenceRegex = /([\w\d-_$]+(\s*\.\s*[\w\d-_$]+\s*)*)\s*\.$/;
    const rangeFromStart = new Range(new Position(0, 0), position);
    const textFromStart = document.getText(rangeFromStart);
    const positionWordRange = document.getWordRangeAtPosition(position);
    const jsonSequenceMatch = textFromStart.match(jsonSequenceRegex);

    if (!jsonSequenceMatch) {
      return null;
    }

    const jsonSequenceText = jsonSequenceMatch[0];

    const jsonSequence = jsonSequenceText.split('.').map(str => str.trim());
    const propertySequence = jsonSequence.slice(0, -1);

    let currentObject = jsons;

    for (const property of propertySequence) {
      if (!currentObject[property] || typeof currentObject[property] !== 'object') {
        return [];
      } else {
        currentObject = currentObject[property];
      }
    }

    const completionItems = Object
      .keys(currentObject)
      .map((key, index) => {
        const completionItem = new CompletionItem(key, CompletionItemKind.Property);

        // Make completion item top suggestion
        completionItem.sortText = '0' + key;
        return completionItem;
      });

    return completionItems;
  }

  getImportedJsons(document: TextDocument): Object {
    const jsons = {};
    const importRegexGlobal = /[\w_$]*[\w\d_\-$]+\s*=\s*require\s*\(\s*'.*\.json'\s*\)|import\s+[\w_$]*[\w\d_\-$]+\s+from\s+'.*\.json'/g;
    const importRegex = /([\w_$]*[\w\d_\-$]+)\s*=\s*require\s*\(\s*'(.*\.json)'\s*|import\s+([\w_$]*[\w\d_\-$]+)\s+from\s+'(.*\.json)'/;

    const documentText = document.getText();

    const importedJsons = documentText.match(importRegexGlobal);
    if (Array.isArray(importedJsons)) {
      importedJsons.forEach(importText => {
        const importTextMatch = importText.match(importRegex);
        const jsonName = importTextMatch[1] || importTextMatch[3];
        const jsonPath = importTextMatch[2] || importTextMatch[4];

        const jsonAbsolutePath = jsonPath.startsWith('.')
          ? path.join(path.dirname(document.uri.fsPath), jsonPath)
          : jsonPath;

        jsons[jsonName] = require(jsonAbsolutePath);
      });
    }

    return jsons;
  }

}