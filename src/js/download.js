__mods["js/download.js"] = (() => {
function downloadText(content,filename,type) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.append(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
return {downloadText};
})();
