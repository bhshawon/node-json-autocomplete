import { TextDocument, Position, Range } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getImportedJsonPaths(document: TextDocument): Object {
  const jsonPaths = {};
  const importRegexGlobal = /[\w_$]*[\w\d_\-$]+\s*=\s*require\s*\(\s*'.*'\s*\)|import\s+[\w_$]*[\w\d_\-$]+\s+from\s+'.*'/g;
  const importRegex = /([\w_$]*[\w\d_\-$]+)\s*=\s*require\s*\(\s*'(.*)'\s*|import\s+([\w_$]*[\w\d_\-$]+)\s+from\s+'(.*)'/;

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

      if (isJsonFile(jsonAbsolutePath)) {
        jsonPaths[jsonName] = jsonAbsolutePath;
      }
    });
  }

  return jsonPaths;
}


function isJsonFile(absolutePath: string): boolean {
  const absolutePathWithExtension = absolutePath.endsWith('.json')
    ? absolutePath
    : absolutePath + '.json';

  return fs.existsSync(absolutePathWithExtension);
}
