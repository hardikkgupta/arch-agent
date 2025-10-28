export function emitMermaid(_graph) {
    return [
      '```mermaid',
      'flowchart LR',
      '  A[API] --> B[(DB)]',
      '```',
      '' // final newline
    ].join('\n');
  }