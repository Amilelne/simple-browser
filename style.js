const cssParser = require('./cssParser/parse.js');
const htmlParser = require('./htmlParser/parse.js');
const paint = require('./paint.js');
const fs = require('fs');
const { createCanvas } = require('canvas');
const { Width, Height } = require('./const.js');


const html = fs.readFileSync('index.html', 'utf-8');
const css =
  'div {padding: 2; margin: 2;border: red;}  p {height: 50;padding: 2; margin: 2;border:yellow;background: blue;}';

const htmlNode = htmlParser(html);
const cssStyle = cssParser(css);

console.log(htmlNode, cssStyle);

function to_px(num) {
  return Number(num) || 0;
}

class StyleNode {
  constructor(node, specified_values = {}, children = []) {
    this.node = node;
    this.specified_values = specified_values;
    this.children = children;
  }

  value(name) {
    return this.specified_values[name];
  }

  lookup(name, fallback_name, defau) {
    return this.value(name) || this.value(fallback_name) || defau;
  }
}

function styleTree(root, stylesheet) {
  if (!root) return;
  return root.map(
    (node) =>
      new StyleNode(
        node,
        matchSimpleSelector(node, stylesheet),
        styleTree(node.children, stylesheet)
      )
  );
}

function matchSimpleSelector(element, selector) {
  const result = {};
  for (let tagName in selector) {
    if (tagName === element.tagName) {
      const pairs = selector[tagName];
      for (const pair of pairs) {
        result[pair.name] = pair.value;
      }
    }
  }
  return result;
}

const style_root = styleTree(htmlNode, cssStyle);

class Dimensions {
  constructor(
    content = new Rect(),
    padding = new EdgeSizes(),
    border = new EdgeSizes(),
    margin = new EdgeSizes()
  ) {
    this.content = content;
    this.padding = padding;
    this.border = border;
    this.margin = margin;
  }

  padding_box() {
    return this.content.expanded_by(this.padding);
  }

  border_box() {
    return this.padding_box().expanded_by(this.border);
  }

  margin_box() {
    return this.border_box().expanded_by(this.margin);
  }
}

class Rect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  expanded_by(edge) {
    return new Rect(
      this.x - edge.left,
      this.y - edge.top,
      this.width + edge.left + edge.right,
      this.height + edge.top + edge.bottom
    );
  }
}

class EdgeSizes {
  constructor(left = 0, right = 0, top = 0, bottom = 0) {
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
  }
}

class LayoutBox {
  constructor(node) {
    this.dimensions = new Dimensions();
    this.children = [];
    this.node = node;
  }

  layout_block(containing_block) {
    this.calculate_block_width(containing_block);
    this.calculate_block_position(containing_block);
    this.layout_block_children();
    this.calculate_block_height();
  }

  calculate_block_height() {
    const height = to_px(this.node.value('height'));
    if (height) {
      this.dimensions.content.height = height;
    }
  }

  calculate_block_width(containing_block) {
    let style = this.node;

    let width = to_px(style.lookup('width')) || 'auto';

    let margin_left = to_px(style.lookup('margin-left', 'margin', 0));
    let margin_right = to_px(style.lookup('margin-right', 'margin', 0));

    let border_left = to_px(style.lookup('border-left', 'border', 0));
    let border_right = to_px(style.lookup('border-right', 'border', 0));

    let padding_left = to_px(style.lookup('padding-left', 'padding', 0));
    let padding_right = to_px(style.lookup('padding-right', 'padding', 0));

    let total =
      to_px(width) +
      margin_left +
      margin_right +
      border_left +
      border_right +
      padding_left +
      padding_right;

    let underflow = containing_block.content.width - total;

    if (width !== 'auto' && total > containing_block.content.width) {
      if (margin_left === 'auto') margin_left = 0;
      if (margin_right === 'auto') margin_right = 0;
    }

    if (width === 'auto') {
      if (margin_left === 'auto') margin_left = 0;
      if (margin_right === 'auto') margin_right = 0;

      if(underflow >= 0){
        width = underflow;
      } else {
        width = 0;
        margin_right = margin_right + underflow;
      }
    }

    let d = this.dimensions;
    d.content.width = to_px(width);

    d.margin.left = margin_left;
    d.margin.right = margin_right;
    d.border.left = border_left;
    d.border.right = border_right;
    d.padding.left = padding_left;
    d.padding.right = padding_right;
  }

  calculate_block_position(containing_block) {
    let style = this.node;
    let d = this.dimensions;

    d.margin.top = to_px(style.lookup('margin-top', 'margin', 0));
    d.margin.bottom = to_px(style.lookup('margin-bottom', 'margin', 0));

    d.border.top = to_px(style.lookup('border-top', 'border', 0));
    d.border.bottom = to_px(style.lookup('border-bottom', 'border', 0));

    d.padding.top = to_px(style.lookup('padding-top', 'padding', 0));
    d.padding.bottom = to_px(style.lookup('padding-bottom', 'padding', 0));

    d.content.x =
      containing_block.content.x +
      d.margin.left +
      d.border.left +
      d.padding.left;

    d.content.y =
      containing_block.content.height +
      containing_block.content.y +
      d.margin.top +
      d.border.top +
      d.padding.top;
  }

  layout_block_children() {
    let d = this.dimensions;
    for (let child of this.children) {
      child.layout_block(d);
      d.content.height += child.dimensions.margin_box().height;
    }
  }
}

function buildLayoutTree(node) {
  let root = new LayoutBox(node);
  for (let child of node.children) {
    root.children.push(buildLayoutTree(child));
  }
  return root;
}

function layout_tree(node, containing_block) {
  containing_block.content.height = 0;
  const root_box = buildLayoutTree(node);
  root_box.layout_block(containing_block);
  return root_box;
}


const viewport = new Dimensions();
viewport.content.width = Width;
viewport.content.height = Height;

const root_box = layout_tree(style_root[0], viewport);

function get_color(layout_box, name) {
  return layout_box.node.value(name);
}

paint(root_box);

module.exports = layout_tree;

