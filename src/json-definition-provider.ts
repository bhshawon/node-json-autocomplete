import { DefinitionProvider, TextDocument, Position, ReferenceContext, CancellationToken, Location, Uri, Range } from 'vscode';
import * as path from 'path';
import { readFileSync } from 'fs';
import { parse, stringify } from 'json-source-map';

export class JsonDefinitionProvider implements DefinitionProvider {
  provideDefinition(document: TextDocument, position: Position, token: CancellationToken) {
    const jsonSequence = this.getJsonSequence(document, position);

    if (!jsonSequence || !jsonSequence.length) {
      return null;
    }

    const importedJsonPaths = this.getImportedJsonPaths(document);

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

  getJsonSequence(document: TextDocument, position: Position) {
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

  getImportedJsonPaths(document: TextDocument): Object {
    const jsonPaths = {};
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

        jsonPaths[jsonName] = jsonAbsolutePath;
      });
    }

    return jsonPaths;
  }
}