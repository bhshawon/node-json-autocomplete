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
import { getImportedJsonPaths } from './utils';
import { mapValues } from 'lodash';
import { readFileSync } from 'fs';

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
    const jsonPaths = getImportedJsonPaths(document);

    return mapValues(jsonPaths, value => {
      const jsonString = readFileSync(value, 'utf-8');
      return JSON.parse(jsonString);
    });
  }
}