$(document).ready(function() {
  const version = $('#version');
  const showConflicts = $('#showConflicts');
  const keybindsTableBody = $('#keybindsTable tbody');
  const keybindEditModal = $('#keybindEditModal');
  const ctrlCheckbox = $('#isCtrl');
  const shiftCheckbox = $('#isShift');
  const altCheckbox = $('#isAlt');
  const keysList = $('#keysList');
  const saveButton = $('#save');
  const deleteButton = $('#delete');
  const tooltip = $('#tooltip');


  function setKeybind(keybindTarget, keybindData) {
    keybindTarget.removeData().data(keybindData);

    var kbStr = '';
    if (keybindData.Ctrl === true)
      kbStr += 'Ctrl + ';
    if (keybindData.Shift === true)
      kbStr += 'Shift + ';
    if (keybindData.Alt === true)
      kbStr += 'Alt + ';

    var value = "";
    if ("K" in keybindData)
      value = 'K_' + keybindData.K;
    else if ("MB" in keybindData)
      value = 'MB_' + keybindData.MB;
    else if ("MS" in keybindData)
      value = 'MS_' + keybindData.MS;

    kbStr += keysList.find(`option[value="${value}"]`).text();
    keybindTarget.text(kbStr).attr('value', value).attr('kb-str', kbStr);
  }


  function checkForConflicts() {
    keybindsTableBody.find('span.keybind').removeClass('conflict').attr('conflicts', '');

    keybindsTableBody.find('tr').each(function() {
      const row = $(this);
      row.find('span.keybind').each(function() {
        const keybind = $(this);
        const kbStr = keybind.attr('kb-str');

        const conflicts = row.siblings('tr').find(`span.keybind[kb-str="${kbStr}"]`).map(function() { return $(this).parents('tr').find('td.action').text(); }).get();
        if (conflicts.length)
          keybind.addClass('conflict').attr('conflicts', conflicts.join(', '));
      });
    });
  }


  $('#keybindsFile').change(function(event) {
    const file = event.target.files[0];
    if (!file)
      return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const contents = e.target.result;
      try {
        const jsonData = JSON.parse(contents);
        version.text(jsonData.Version);

        keybindsTableBody.empty();
        Object.keys(jsonData.KeyBinds).forEach(function(action) {
          const row = $('<tr>').append($('<td class="action">').text(action)).appendTo(keybindsTableBody);
          const column = $('<td>').appendTo(row);
          jsonData.KeyBinds[action].forEach(function(keybind) {
            setKeybind($('<span class="keybind">').appendTo(column), keybind);
          });
          column.append($('<span class="add">').text('+'));
        });
        checkForConflicts();
      }
      catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    reader.readAsText(file);
  });


  $('#download').click(function() {
    const jsonData = { KeyBinds: {}, Version: parseInt(version.text(), 10) };
    keybindsTableBody.find('tr').each(function() {
      const row = $(this);
      jsonData.KeyBinds[row.find('td.action').text()] = row.find('span.keybind').map(function() { return $(this).data(); }).get();
    });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(new Blob([JSON.stringify(jsonData, null, 3)], { type: 'text/plain' }));
    downloadLink.download = 'keybinds.json';
    downloadLink.click();
  });


  showConflicts.change(function() {
    keybindsTableBody.toggleClass('show-conflicts', showConflicts.prop('checked'));
  });


  keybindsTableBody.on('click', 'span.keybind', function(event) {
    keybindEditModal.show();

    const keybindTarget = $(event.target);
    keybindEditModal.data('target', keybindTarget);
    
    $('#action').text(keybindTarget.parents('tr').find('td.action').text());
    ctrlCheckbox.prop('checked', keybindTarget.data('Ctrl') || false);
    shiftCheckbox.prop('checked', keybindTarget.data('Shift') || false);
    altCheckbox.prop('checked', keybindTarget.data('Alt') || false);
    keysList.val(keybindTarget.attr('value'));
    deleteButton.prop('disabled', false);
  }).on('click', 'span.add', function(event) {
    keybindEditModal.show();

    const keybindTarget = $(event.target);
    keybindEditModal.data('target', keybindTarget);

    $('#action').text(keybindTarget.parents('tr').find('td.action').text());
    ctrlCheckbox.prop('checked', false);
    shiftCheckbox.prop('checked', false);
    altCheckbox.prop('checked', false);
    keysList.val('');
    deleteButton.prop('disabled', true);
  }).on('mouseenter', 'span.keybind.conflict', function(event) {
    if (showConflicts.prop('checked'))
      tooltip.text($(this).attr('conflicts')).css({ top: event.clientY + window.scrollY + 10, left: event.clientX + 10 }).show();
  }).on('mouseleave', 'span.keybind.conflict', function() {
    tooltip.hide();
  });


  saveButton.click(function() {
    const keybindData = {};

    if (ctrlCheckbox.prop('checked'))
      keybindData.Ctrl = true;
    if (shiftCheckbox.prop('checked'))
      keybindData.Shift = true;
    if (altCheckbox.prop('checked'))
      keybindData.Alt = true;

    const key_value = keysList.val().split('_');
    keybindData[key_value[0]] = parseInt(key_value[1], 10);

    const keybindTarget = keybindEditModal.data('target');
    if (keybindTarget.is('span.keybind'))
      setKeybind(keybindTarget, keybindData);
    else if (keybindTarget.is('span.add'))
      setKeybind($('<span class="keybind">').insertBefore(keybindTarget), keybindData);

    checkForConflicts();
    keybindEditModal.hide();
  });

  
  deleteButton.click(function() {
    const keybindTarget = keybindEditModal.data('target');

    if (keybindTarget.is('span.keybind'))
      keybindTarget.remove();

    checkForConflicts();
    keybindEditModal.hide();
  });


  $(window).click(function(event) {
    if (event.target === keybindEditModal[0])
      keybindEditModal.hide();
  });


  $(document).keydown(function(event) {
    if (event.key === 'Escape')
      keybindEditModal.hide();
  });
});
