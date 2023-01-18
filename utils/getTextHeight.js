const { fabric } = require('fabric');
const { Width, FontSize } = require('../const.js');

function getTextHeight(text, width = Width, fontSize = FontSize) {
  const Text = new fabric.Textbox(text, {
    width,
    fontSize,
    splitByGrapheme: true, // 中文换行
  });
  const textHeight = Text.calcTextHeight();
  console.log('textHeight:', textHeight, ' boxWidth:', width);
  return textHeight;
}

module.exports = getTextHeight;
