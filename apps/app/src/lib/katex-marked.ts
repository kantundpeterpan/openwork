import katex from "katex";
import type { MarkedExtension } from "marked";

const katexDisplay = {
  name: "katexDisplay",
  level: "block" as const,
  tokenizer(src: string) {
    const match = /^\$\$\n?([\s\S]+?)\n?\$\$/.exec(src);
    if (match) {
      return {
        type: "katexDisplay",
        raw: match[0],
        text: match[1].trim(),
        tokens: [],
      };
    }
  },
  renderer(token: { text: string; raw: string }) {
    try {
      return `<div class="my-4 overflow-x-auto">${katex.renderToString(token.text, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<pre><code>${token.raw}</code></pre>`;
    }
  },
};

const katexInline = {
  name: "katexInline",
  level: "inline" as const,
  start(src: string) {
    let i = src.indexOf("$");
    while (i !== -1 && src[i + 1] === "$") {
      i = src.indexOf("$", i + 2);
    }
    return i;
  },
  tokenizer(src: string) {
    const match = /^\$(?![$\s])([^$\n]+?)\$/.exec(src);
    if (match) {
      return {
        type: "katexInline",
        raw: match[0],
        text: match[1].trim(),
        tokens: [],
      };
    }
  },
  renderer(token: { text: string; raw: string }) {
    try {
      return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
    } catch {
      return token.raw;
    }
  },
};

export const katexMarkedExtension: MarkedExtension = {
  extensions: [katexDisplay, katexInline],
};
