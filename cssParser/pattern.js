const nmstart = "[_a-z]";
const nmchar = "[_a-z0-9]";
const name = new RegExp(`${nmchar}+`);
const ident = new RegExp(`${nmstart}${nmchar}*`);
console.log(name);

const css = "div {margin: 10px;}";

console.log(css.match(name));

// module.exports = [nmstart, nmchar, name, ident];
// const name = /(nmchar)+/;
// const ident = /(nmstart)(nmchar)*/;
