function dealWithHtml(html) {
  return html
    .replace(/(\s)*</g, '<')
    .replace(/>(\s)*/g, '>')
    .replace(/\n/g, '');
}

module.exports = dealWithHtml;
