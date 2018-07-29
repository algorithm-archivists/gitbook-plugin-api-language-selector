require(['gitbook', 'jquery'], function(gitbook, $) {
  var allowedLanguages = [],
    state = {
      toolbarBtnId: undefined,
      presentLanguages: [],
      currentLanguage: undefined,
      defaultLanguage: undefined
    };

  // Set up GitBook events
  gitbook.events.bind('start', function(e, config) {
    var opts = config['api-language-selector'];
    init(opts);
  });

  gitbook.events.on('page.change', function() {
    load();
    update(state);
  });

  // init
  function init(opts) {
    // set up variables
    allowedLanguages = opts.languages;

    load();
    hookUpEvents();
    hookUpBuildMenuDropdown();
    update(state);
  }

  // Hook up events
  function hookUpBuildMenuDropdown() {
    $(document).one('click', '.language-picker .btn', function(e) {
      buildLanguagePickerGrid($('.language-picker .dropdown-menu'), state, 3);
      update(state);
    });
  }

  function hookUpEvents() {
    $(document).on('click', '.language-picker-btn', function() {
      var lang = $(this).data('lang');
      var language = state.presentLanguages.find(function(l) {
        return l.lang === lang;
      });

      setCurrentLanguage(language);
      gitbook.storage.set('language-selector', {
        currentLanguage: language
      });
      update(state);
    });
  }

  function processCurrentLanguage() {
    var currentLanguage = state.currentLanguage;
    // Check if selected language is present
    if (
      !currentLanguage ||
      !state.presentLanguages.find(function(language) {
        return language.lang === currentLanguage.lang;
      })
    ) {
      // Check if default language is present
      var defaultLanguage = state.defaultLanguage;
      if (
        !defaultLanguage ||
        !state.presentLanguages.find(function(language) {
          return language.lang === defaultLanguage.lang;
        })
      ) {
        var firstLanguage = allowedLanguages[0] || undefined;
        if (firstLanguage) setCurrentLanguage(firstLanguage);
      } else {
        setCurrentLanguage(defaultLanguage);
      }
    }
  }

  function load() {
    loadDefaultLanguage();
    loadCurrentLanguage();
    loadPresentLanguages();
    processCurrentLanguage();

    if (state.presentLanguages.length > 0 && state.toolbarBtnId === undefined) {
      // Create toolbar btn
      state.toolbarBtnId = gitbook.toolbar.createButton({
        icon: 'fa fa-globe',
        label: 'Change language',
        className: 'language-picker',
        dropdown: []
      });
    } else if (state.presentLanguages.length === 0) {
      gitbook.toolbar.removeButton(state.toolbarBtnId);
      state.toolbarBtnId = undefined;
    }
  }

  function loadPresentLanguages() {
    var languages = [];
    $('.code-method-sample').each(function() {
      var lang = $(this).data('lang'),
        name = $(this).data('name'),
        isAdded = false;

      isAdded = languages.find(function(_lang) {
        return lang == _lang.lang;
      });

      if (!isAdded) {
        languages.push({
          name: name,
          lang: lang
        });
      }
    });

    state.presentLanguages = languages.sort(function(a, b) {
      return b.name.localeCompare(a.name);
    });
  }

  function loadCurrentLanguage() {
    var saved = gitbook.storage.get('language-selector', {
      currentLanguage: undefined
    });

    setCurrentLanguage(saved.currentLanguage);
  }

  function setCurrentLanguage(language) {
    state.currentLanguage = language;
  }

  function loadDefaultLanguage() {
    if (state.defaultLanguage !== undefined) return;
    if (allowedLanguages.length === 0) return;

    var defaultLanguage = allowedLanguages.find(function(language) {
      return language.default;
    });

    state.defaultLanguage = defaultLanguage;
  }

  // Build

  function buildLanguagePickerGrid(parent, pluginState, maxColumns) {
    var selectedLanguage = pluginState.currentLanguage;
    var languages = pluginState.presentLanguages;

    var table = $('<table>'),
      currentLanguageIdx = 0,
      maxRows = Math.ceil(languages.length / maxColumns);
    for (var rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      var rowEl = $('<tr>');
      for (
        var colIdx = 0;
        rowIdx * maxColumns + colIdx < languages.length && colIdx < maxColumns;
        colIdx++
      ) {
        var cell = $('<td>');
        var btn = $('<a>');
        var currentLanguage = languages[currentLanguageIdx];
        cell.addClass('language-picker-cell');
        btn.attr('data-lang', currentLanguage.lang);
        btn.attr('data-name', currentLanguage.name);
        btn.addClass('language-picker-btn');

        if (currentLanguage.lang === selectedLanguage.lang) {
          btn.addClass('active');
        }

        btn.html(currentLanguage.name);
        cell.append(btn);
        rowEl.append(cell);

        currentLanguageIdx++;
      }
      table.append(rowEl);
    }
    table.addClass('language-picker-grid');
    parent.empty();
    parent.append(table);
  }

  // Update parts
  function update(pluginState) {
    updateShowedCodeSamples(
      pluginState.currentLanguage,
      pluginState.defaultLanguage
    );
    updateActiveMenuItem(pluginState.currentLanguage);
    updateMenuLabel(pluginState.currentLanguage);
  }

  function updateShowedCodeSamples(currentLanguage) {
    var $codes = $('.code-method-sample');

    $codes.each(function() {
      var hidden = !($(this).data('lang') === currentLanguage.lang);
      $(this).toggleClass('hidden', hidden);
    });
  }

  function updateActiveMenuItem(currentLanguage) {
    var btns = $('.language-picker-btn');

    btns.each(function() {
      var active = $(this).data('lang') === currentLanguage.lang;
      $(this).toggleClass('active', active);
    });
  }

  function updateMenuLabel(currentLanguage) {
    if (currentLanguage) {
      $('span.active-name').remove();
      $('.dropdown.language-picker')
        .children('a')
        .append($('<span class="active-name">').text(currentLanguage.name));
    }
  }
});
