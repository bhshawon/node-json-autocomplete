import { DefinitionProvider, TextDocument, Position, ReferenceContext, CancellationToken, Location, Uri, Range } from 'vscode';
import { getImportedJsonPaths } from './utils';
import { readFileSync } from 'fs';
import { parse, stringify } from 'json-source-map';

export class JsonDefinitionProvider implements DefinitionProvider {
  provideDefinition(document: TextDocument, position: Position, token: CancellationToken) {
    const jsonSequence = this.getJsonSequence(document, position);

    if (!jsonSequence || !jsonSequence.length) {
      return null;
    }

    const importedJsonPaths = getImportedJsonPaths(document);

    const jsonPath = importedJsonPaths[jsonSequence[0]];

    if (!jsonPath) {
      return null;
    }
    try {
      const json = readFileSync(jsonPath, 'utf-8');
      const parsedJson = parse(json);

      const pointerPath = '/' + jsonSequence
        .slice(1)
        .join('/');

      const definitionPointer = parsedJson.pointers[pointerPath];

      if (!definitionPointer) {
        return null;
      }

      const jsonFileUri = Uri.file(jsonPath);
      const definitionPosition = new Position(definitionPointer.key.line, definitionPointer.key.column);

      return [new Location(jsonFileUri, definitionPosition)];
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  getJsonSequence(document: TextDocument, position: Position): Array<string> | null {
    const wordRange = document.getWordRangeAtPosition(position);
    const rangeFromStart = new Range(new Position(0, 0), wordRange.end);
    const textFromStart = document.getText(rangeFromStart);

    const jsonSequenceRegex = /[\w\d-_$]+(\s*\.\s*[\w\d-_$]+)*$/;
    const jsonSequenceMatch = textFromStart.match(jsonSequenceRegex);

    if (!jsonSequenceMatch) {
      return null;
    }

    const jsonSequenceText = jsonSequenceMatch[0];

    const jsonSequence = jsonSequenceText
      .split('.')
      .filter(word => word)
      .map(word => word.trim());

    return jsonSequence;
  }
}