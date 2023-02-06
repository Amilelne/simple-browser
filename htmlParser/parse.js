const endTag = /^<\/([a-zA-Z0-9\-]+)>/;
const startTag = /^<([a-zA-Z0-9\-]+)(?:(\s)+([a-zA-Z0-9\-]+=[^>]+))*>/;
const commentTag = /^<!--[\s\S]*-->/;
const docTypeTag = /^<!doctype [^>]*>/i;
const htmlStartTag = /^<html [^>]*>/;
const htmlBodyEndTag = /^(<\/html>|<\/body>|<\/head>)/;
const headTag = /(\s*<head>)([\s\S]*)(<\/head>)/;
const metaTag = /\s*<meta ([^>]*) \/>/;
const titleTag = /\s*<title>([\s\S]*)<\/title>/;
const bodyStartTag = /^<body>/;
const attributeTag = /^(?:\s)+([a-zA-Z0-9\- ]+=[^> ]+)/;
const emptyTag = /^[\s]*$/;

let parse_result = [];
function parse(html, options) {
  function advance(num) {
    html = html.slice(num);
  }

  while (html) {
    if (html.startsWith('<')) {
      const commentMatch = html.match(commentTag);
      if (commentMatch) {
        options.onComment({
          type: 'comment',
          value: html.slice(0, commentMatch[0].length),
        });
        advance(commentMatch[0].length);
        continue;
      }

      const doctypeMatch = html.match(docTypeTag);
      if (doctypeMatch) {
        options.onDoctype({
          type: 'doctype',
          value: html.slice(0, doctypeMatch[0].length),
        });
        advance(doctypeMatch[0].length);
        continue;
      }

      const htmlTagMatch = html.match(htmlStartTag);
      if (htmlTagMatch) {
        advance(htmlTagMatch[0].length);
        continue;
      }

      const bodyTagMatch = html.match(bodyStartTag);
      if (bodyTagMatch) {
        advance(bodyTagMatch[0].length);
        continue;
      }

      const htmlBodyEndMatch = html.match(htmlBodyEndTag);
      if (htmlBodyEndMatch) {
        advance(htmlBodyEndMatch[0].length);
        continue;
      }

      const headMatch = html.match(headTag);
      if (headMatch) {
        options.onHeadType({
          type: 'headType',
          value: html.slice(0, headMatch[0].length),
        });
        advance(headMatch[1].length);

        let metaMatch;
        while ((metaMatch = html.match(metaTag))) {
          const [type, value] = metaMatch[1].split('=');
          options.onMetaType({
            type,
            value: value.replace(/^['"]/, '').replace(/['"]$/, ''),
          });
          advance(metaMatch[0].length);
        }

        const titleMatch = html.match(titleTag);
        if (titleMatch) {
          options.onTitle(titleMatch[1]);
          advance(titleMatch[0].length);
        }
        continue;
      }

      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        options.onEndTag({
          type: 'endtag',
          value: endTagMatch[1],
        });
        advance(endTagMatch[0].length);
        continue;
      }

      const startTagMatch = html.match(startTag);
      if (startTagMatch) {
        options.onStartTag({
          type: 'starttag',
          value: startTagMatch[1],
        });

        advance(startTagMatch[1].length + 1);
        let attributeMatch;
        while ((attributeMatch = html.match(attributeTag))) {
          options.onAttribute({
            type: 'attr',
            value: attributeMatch[1],
          });
          advance(attributeMatch[0].length);
        }
        advance(1);
        continue;
      }
    } else {
      let textEndIndex = html.indexOf('<');
      const text = html.slice(0, textEndIndex);
      const emptyMatch = text && text.match(emptyTag);
      if (emptyMatch) {
        advance(emptyMatch[0].length);
      } else {
        options.onText({
          type: 'text',
          value: html.slice(0, textEndIndex),
        });
        textEndIndex = textEndIndex === -1 ? html.length : textEndIndex;
        advance(textEndIndex);
      }
    }
  }
}

function htmlParser(str) {
  const ast = {
    children: [],
  };
  let curParent = ast;
  let prevParent = null;
  const domTree = parse(str, {
    onComment(node) {},
    onStartTag(token) {
      const tag = {
        tagName: token.value,
        attributes: [],
        text: '',
        children: [],
      };
      curParent.children.push(tag);
      prevParent = curParent;
      curParent = tag;
    },
    onAttribute(token) {
      const [name, value] = token.value.split('=');
      let attrValue = value.replace(/^['"]/, '').replace(/['"]$/, '');
      if (name === 'class') {
        attrValue = '.' + attrValue;
      } else if (name === 'id') {
        attrValue = '#' + attrValue;
      }
      curParent.attributes.push({
        name,
        value: attrValue,
      });
    },
    onEndTag(token) {
      curParent = prevParent;
    },
    onDoctype(token) {},
    onHtmlStart(token) {},
    onHtmlEnd(token) {},
    onHeadType(token) {
      ast.head = {
        meta: [],
        title: 'title',
      };
    },
    onMetaType(token) {
      ast.head.meta.push(token);
    },
    onTitle(token) {
      ast.head.title = token;
    },
    onText(token) {
      curParent.text = token.value;
    },
  });
  return ast.children;
}

module.exports = htmlParser;
