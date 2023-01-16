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
  const borderColor = get_specifiedValue(box, 'border') || 'none';
  const backgroundColor = get_specifiedValue(box, 'background') || 'white';
  const color = get_specifiedValue(box, 'color') || 'black';

  console.log(x, y, width, height, borderColor, backgroundColor, color);

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

  const node = box.node.node;
  const { tagName, text } = node;
  if (text) {
    const Text = new fabric.Text(text, {
      left: x,
      top: y,
      fill: color,
      fontSize: 20,
    });
    canvas.add(Text);
  }
  box.children.forEach((child) => {
    renderLayoutBox(child);
  });
}

module.exports = paint;
