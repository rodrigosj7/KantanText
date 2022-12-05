const { ipcRenderer } = require('electron');
const marked = require('marked');

const textarea = document.getElementById('text');
const hideMd   = document.getElementById('hide-md');
const markdown = document.querySelector('#markdown');
const $title   = document.getElementById('head-title');

const setData = (__, data) => {
  textarea.value = data.content;
  $title.textContent = data.name || 'KantanNotes';
  markdown.innerHTML = marked.parse(data.content);

  updateStatusbar(data.saved)
}

ipcRenderer.on('set-file', setData)

const updateStatusbar = (saved=false) => {
  const data = {
    lines: textarea.value.split(/\r|\r\n|\n/),
    currentFile: $title.textContent == 'KantanText' ? 'untitled.md' : $title.textContent,
    saved
  };

  data['count'] = data.lines.length;

  const savedInfo    = document.getElementById('saved-info')
  const linesInfos   = document.getElementById('lines-info');
  const filenameInfo = document.getElementById('filename-info');

  linesInfos.textContent = data.count;
  filenameInfo.textContent = data.currentFile;
  savedInfo.textContent = data.saved;
}

function handleChangeText() {
  const textValue = textarea.value;

  ipcRenderer.send('update-content', textValue);
  markdown.innerHTML = marked.parse(textValue);

  updateStatusbar();
}

function toggleMarkdown(isChecked) {
  const defaultWidth = { textarea: '50%' };

  markdown.classList.toggle('activate');

  if (isChecked) {
    markdown.style.display = 'none';
    textarea.style.width = '100%';
    return
  }

  markdown.style.display = 'block';
  textarea.style.width = defaultWidth.textarea
}

hideMd.addEventListener('change', (event) => {
  const isChecked = event.target.checked;
  toggleMarkdown(isChecked);
})

textarea.addEventListener('keyup', handleChangeText);