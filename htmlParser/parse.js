const endTag = /^<\/([a-zA-Z0-9\-]+)>/;
const startTag = /^<([a-zA-Z0-9\-]+)(?:[ ]+([a-zA-Z0-9\-]+=[^>]+))*>/;
const commentTag = /^<!--(.|\n)*-->/;
const docTypeTag = /^<!doctype [^>]*>/i;
const attributeTag = /^(?:[ ]+([a-zA-Z0-9\- ]+=[^> ]+))/;

let parse_result = [];
function parse(html, options) {
    function advance(num) {
        html = html.slice(num);
    }

    while (html) {
        if (html.startsWith("<")) {
            const commentMatch = html.match(commentTag);
            if (commentMatch) {
                options.onComment({
                    type: "comment",
                    value: html.slice(0, commentMatch[0].length),
                });
                advance(commentMatch[0].length);
                continue;
            }

            const doctypeMatch = html.match(docTypeTag);
            if (doctypeMatch) {
                options.onDoctype({
                    type: "doctype",
                    value: html.slice(0, doctypeMatch[0].length),
                });
                advance(doctypeMatch[0].length);
                continue;
            }

            const endTagMatch = html.match(endTag);
            if (endTagMatch) {
                options.onEndTag({
                    type: "endtag",
                    value: endTagMatch[1],
                });
                advance(endTagMatch[0].length);
                continue;
            }

            const startTagMatch = html.match(startTag);
            if (startTagMatch) {
                options.onStartTag({
                    type: "starttag",
                    value: startTagMatch[1],
                });

                advance(startTagMatch[1].length + 1);
                let attributeMatch;
                while ((attributeMatch = html.match(attributeTag))) {
                    options.onAttribute({
                        type: "attr",
                        value: attributeMatch[1],
                    });
                    advance(attributeMatch[0].length);
                }
                advance(1);
                continue;
            }
        } else {
            let textEndIndex = html.indexOf("<");
            options.onText({
                type: "text",
                value: html.slice(0, textEndIndex),
            });
            textEndIndex = textEndIndex === -1 ? html.length : textEndIndex;
            advance(textEndIndex);
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
                text: "",
                children: [],
            };
            curParent.children.push(tag);
            prevParent = curParent;
            curParent = tag;
        },
        onAttribute(token) {
            const [name, value] = token.value.split("=");
            let attrValue = value.replace(/^['"]/, "").replace(/['"]$/, "");
            if(name === 'class') {
                attrValue = '.' + attrValue;
            } else if(name === 'id') {
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
        onText(token) {
            curParent.text = token.value;
        },
    });
    return ast.children;
}

module.exports = htmlParser;
