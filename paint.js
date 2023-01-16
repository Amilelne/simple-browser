const { fabric } = require('fabric');
const fs = require('fs');
const { Width, Height } = require('./const.js');

const out = fs.createWriteStream(__dirname + '/output/helloworld.png');

const canvas = new fabric.Canvas(null, { width: Width, height: Height });

function get_color(layout_box, name) {
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
  const borderColor = get_color(box, 'border');
  const backgroundColor = get_color(box, 'background');

  console.log(x, y, width, height, borderColor, backgroundColor);

  const rect = new fabric.Rect({
    left: x,
    top: y,
    width,
    height,
    fill: backgroundColor ? backgroundColor : 'white',
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
      fill: '#000000',
      fontSize: 20,
    });
    canvas.add(Text);
  }
  box.children.forEach((child) => {
    renderLayoutBox(child);
  });
}

module.exports = paint;
