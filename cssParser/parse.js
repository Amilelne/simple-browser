const nmstart = "[_a-z]";
const nmchar = "[_a-z0-9]";
const name = new RegExp(`^${nmchar}+`);
const ident = new RegExp(`^${nmstart}${nmchar}*`);
const identList = new RegExp(`^(${nmstart}${nmchar}*)(,${nmstart}${nmchar}*)+`);
const startBlock = /^{/;
const endBlock = /^}/;
const escape = /\s/;
const attribute = new RegExp(`^(${nmchar}+):(?:[ ]*)(${nmchar}+)(?:;)?`);

function parse(css, options) {
    function advance(num) {
        css = css.slice(num);
    }

    while (css) {
        const attributeMatch = css.match(attribute);
        if (attributeMatch) {
            options.onAttribute({
                name: attributeMatch[1],
                value: attributeMatch[2],
            });
            advance(attributeMatch[0].length);
            continue;
        }
        const identListMatch = css.match(identList);
        if (identListMatch) {
            options.onIdentList({
                idents: identListMatch[0].split(","),
            });
            advance(identListMatch[0].length);
            continue;
        }

        const identMatch = css.match(ident);
        if (identMatch) {
            options.onIdent({
                ident: identMatch[0],
            });
            advance(identMatch[0].length);
            continue;
        }

        const startBlockMatch = css.match(startBlock);
        if (startBlockMatch) {
            options.onStartBlock();
            advance(startBlockMatch[0].length);
            continue;
        }

        const endBlockMatch = css.match(endBlock);
        if (endBlockMatch) {
            options.onEndBlock();
            advance(endBlockMatch[0].length);
            continue;
        }

        const escapeMatch = css.match(escape);
        if (escapeMatch) {
            advance(escapeMatch[0].length);
            continue;
        }
    }
}

function cssParser(css) {
    const ast = {};
    let curTags = [];
    const cssTree = parse(css, {
        onIdent(token) {
            if (!ast[token.ident]) {
                ast[token.ident] = [];
            }
            curTags.push(token.ident);
        },
        onIdentList(token) {
            const idents = token.idents;
            for (let ident of idents) {
                if (ast[ident]) {
                    continue;
                } else {
                    ast[ident] = [];
                }
                curTags.push(ident);
            }
        },
        onStartBlock() {},
        onEndBlock() {
            curTags = [];
        },
        onAttribute(token) {
            const { name, value } = token;
            for (let tag of curTags) {
                ast[tag].push({
                    name,
                    value,
                });
            }
        },
    });

    return ast;
}

module.exports = cssParser;
