const { fabric } = require('fabric');
const fs = require('fs');
const out = fs.createWriteStream(__dirname + '/helloworld.png');

const canvas = new fabric.Canvas(null, { width: 600, height: 600 });

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

  const rect = new fabric.Rect({
    originX: x,
    originY: y,
    width,
    height,
    fill: backgroundColor ? backgroundColor : '#ff0000',
    borderColor: borderColor,
  });
  canvas.add(rect);
  box.children.forEach((child) => {
    renderLayoutBox(child);
  });
}

module.exports = paint;
