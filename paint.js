const { fabric } = require('fabric');
const fs = require('fs');
const { Width, Height } = require('./const.js');

const out = fs.createWriteStream(__dirname + '/output/helloworld.png');

const canvas = new fabric.Canvas(null, { width: Width, height: Height });

function get_specifiedValue(layout_box, name) {
  return layout_box.node.value(name);
}

function paint(box) {
  renderLayoutBox(box);
  canvas.renderAll();
  const stream = canvas.createPNGStream();
  stream.on('data', function (chunk) {
    out.write(chunk);
  });
}

function renderLayoutBox(box) {
  const dimensions = box.dimensions;
  const border_box = dimensions.border_box();
  const { x, y, height, width } = border_box;
  const borderColor = get_specifiedValue(box, 'border');
  const backgroundColor = get_specifiedValue(box, 'background') || 'white';

  console.log(x, y, width, height, borderColor, backgroundColor);

  const rect = new fabric.Rect({
    left: x,
    top: y,
    width,
    height,
    fill: backgroundColor,
    stroke: borderColor,
    strokeWidth: 2,
  });
  canvas.add(rect);

  // 文本节点
  renderTextBox(box);

  // 子节点
  box.children.forEach((child) => {
    renderLayoutBox(child);
  });
}

function renderTextBox(box) {
  const node = box.node.node;
  const { tagName, text } = node;
  if (!text) return;

  const dimensions = box.dimensions;
  const content_box = dimensions.content_box();
  const { x, y, height, width } = content_box;
  const color = get_specifiedValue(box, 'color') || 'black';
  const textAlign = get_specifiedValue(box, 'text-align') || 'left';

  const Text = new fabric.Textbox(text, {
    width,
    left: x,
    top: y,
    fill: color,
    fontSize: 20,
    textAlign,
    splitByGrapheme: true, // 中文换行
  });
  const textSize = Text.calcTextHeight();
  console.log('textSize 2:', textSize);
  canvas.add(Text);
}

module.exports = paint;
