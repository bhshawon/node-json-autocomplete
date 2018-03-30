import { TextDocument, Position, Range } from 'vscode';
import * as path from 'path';

export function getImportedJsonPaths(document: TextDocument): Object {
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
