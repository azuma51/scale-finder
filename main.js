// SCALE FINDER
// Copyright (c) 2018 azuma51


// interval : 0~11
// degree   : R, b2, 2....
// note     : C, C#/Db, D....

var MAX_INTERVAL = 12;

var Settings = {};
Settings.key = 0;
Settings.fret = 15+1;
Settings.lang = 'ja'
Settings.level = 'adv'//'beg' //or 'adv'
Settings.ghost = true;//false;

var Data = {};
var Scaels = {};


//
// setup
//
$(document).ready(function(){
    $.getJSON('./data.json', loadedData);
    loadScales();

    $('#Status button').click(clickStatus);
    $('#Type').change(changeType);
    $('#Key').change(changeKey);
    $('#Chord button').click(clickChord);
    $('#Tuning').change(changeTuning);
    $('#Fret').change(changeFret);
    $('#Level').change(changeLevel);
    $('#Check-ghost').change(changeGhost);

    $('#Btn-Degree').click(clickBtnDegree);
    $('#Btn-Note').click(clickBtnNote);
    $('#Boards button.close').click(clickClose);

    $('#Btn-Advanced').click(clickAdvanced);
    $('#Btn-Info').click(clickInfo);

    $('#Btn-Lang').click(clickLang);

    $('.board-pin').click(clickPin);
})

function loadedData(json) {
    Data = Object.assign(Data, json);
    console.log('loadedData', Data);

    setupDefault();
    setupResizeBoards();
}

function loadScales() {
    var filename = $.format('./scale_{0}.json', Settings.level);
    $.getJSON(filename, loadedScale);
}

function loadedScale(json) {
    Scales = json.scales;
    console.log('loadedScale', Scales);
    setupScales();
}

// format like a python
$.format = function(fmt) {
    for (var i=0, len=arguments.length; i<len; i++) {
        var ptn = new RegExp('\\{' + (i-1) + '\\}', 'g');
        fmt = fmt.replace(ptn, arguments[i]);
    }
    return fmt;
}


//
// click/change
//
function clickStatus() {
    $(this).button('toggle');
    updateScales();
}

function clickChord() {
    //Chordボタンの値に合わせて#Status>button を toggle する
    var chord = $(this).val().split(",");
    var intervals = DegreeToInterval(chord);

    $('#Status button').each(function(index, element){
        var item = $(element);
        item.removeClass('active');//check off

        var value = Number(item.val());
        if (intervals.indexOf(value) != -1) {
            item.button('toggle'); //check on
        }
    });
    updateScales();
}

function changeKey() {
    Settings.key = Number($(this).val());
    console.log('changeKey', Settings.key);
    updateStatus();
    updateBoards();
}

function changeType() {
    Settings.type = $(this).val();
    console.log('changeType', Settings.type);
    updateStatus();
    updateBoards();//only DegreeBoard
}

function changeTuning(handler, name=undefined) {
    if (name != undefined) {
        Settings.tuning = name;
    }
    else {
        Settings.tuning = $(this).val();
    }
    console.log('changeTuning', Settings.tuning);

    var obj = Data.tuning.find(function(value){
        return (value.name == Settings.tuning);
    });
    if (obj) {
        //console.log(obj);
        Settings.tuning_notes = [].concat(obj.notes).reverse();//1to6
        Settings.tuning_interval = NoteToInterval(Settings.tuning_notes);
        Settings.string = obj.notes.length;
        updateBoards();
    }
}

function changeFret() {
    Settings.fret = Number($(this).val()) +1;
    console.log('changeFret', Settings.fret);
    updateBoards();    
}

function changeLevel() {
    var level = $(this).val();
    console.log('changeLevel', level);
    Settings.level = level;
    loadScales();
    //updateStatus();
    setupStatus();//initialize #Status button
}
function changeGhost() {
    var ghost = $(this).is(':checked');
    console.log('changeGhost', ghost);
    Settings.ghost = ghost;
    updateBoards();
}

/*
function clickBtnDegree() {
    var target = '#DegreeBoard';
    collapseBoard(target, !$(target).hasClass('show'));
}
function clickBtnNote() {
    var target = '#NoteBoard';
    collapseBoard(target, !$(target).hasClass('show'));
}
function clickClose() {
    var obj = $(this);
    var target = obj.attr('data-target');
    console.log('clickClose', obj, target);
    //collapseBoard(target, false);
    $(target).collapse('hide');
}
function collapseBoard(target, show) {
    var board, btn;
    switch(target) {
        case '#DegreeBoard':
            board = $('[id^=DegreeBoard]');
            btn = $('#Btn-Degree');
            break;
        case '#NoteBoard':
            board = $('[id^=NoteBoard]');
            btn = $('#Btn-Note');
            break;
    }
    console.log('collapse', show, board, btn);
    if (show) {
        board.collapse('show');
        btn.addClass('active');
    }
    else {
        board.collapse('hide');
        btn.removeClass('active');
    }
}
*/
function clickBtnDegree() {
    var obj = $(this);
    obj.hasClass('active') ? obj.removeClass('active') : obj.addClass('active');
    shownBoard(obj, $('#DegreeBoard'));
}
function clickBtnNote() {
    var obj = $(this);
    obj.hasClass('active') ? obj.removeClass('active') : obj.addClass('active');
    shownBoard(obj, $('#NoteBoard'));
}


function clickPin() {
    var obj = $(this);

    var r = obj.parentsUntil('#Boards');
    var src = $(r[r.length-1]);//ancestor #Board
    console.log('clickPin', src);
    
    //already pinned
    var id = src.attr('id');
    if (id.includes('-pinned')) {
        // i want switch pinned to ex-board,
        // but i can not keep consistency scale displayed.
        // #DegreeBoard.scale != #NoteBoard.scale sometimes.
        // but i think always #Degree/NoteBoard same scale displayed without pinned.
        /*
        var ex = $('#' + id.substr(0, id.indexOf('-pinned')));
        console.log(id.substr(0, id.indexOf('-pinned')), ex);
        if (!ex.hasClass('show')) {
            //ex.addClass('show');
            ex.remove();
            ex = src.clone(false);
            ex.find('button.close').click(clickClose);
            ex.find('.board-pin').click(clickPin);
            ex.attr('id', id.substr(0, id.indexOf('-pinned')));
            ex.find('.board-pin').removeClass('pinned');
            ex.find('.board-close').attr('data-target', '#'+ex.attr('id'));
            src.after(ex);
            src.remove();
            $('#Scales [class~="scale"][class~="pinned"]').removeClass('pinned');
        }
        else
        */
        removePinned(src);
        return;
    }

    //clone board
    var pinned = $('#Boards [id$="-pinned"]');
    if (pinned.length > 0) {
        // already exist other pinned board,
       removePinned(pinned);
    }

    Scales.pinned = Scales.selected;
    $('#Scales [class~="scale"][class~="active"]').addClass('pinned');
    pinned = src.clone(false);
    pinned.find('button.close').click(clickPinClose);
    pinned.find('.board-pin').click(clickPin);
    pinned.attr('id', pinned.attr('id') + '-pinned');
    pinned.find('.board-pin').addClass('pinned');
    pinned.find('.board-close').attr('data-target', '#'+pinned.attr('id'));
    src.before(pinned);
    //src.collapse('hide');
    src.removeClass('show');
}
function removePinned(target) {
    //remove pinned item and board
    $('#Scales [class~="scale"][class~="pinned"]').removeClass('pinned');
    //src.fadeOut(400, function(){ $(this).remove() });
    target.on('hidden.bs.collapse', function(){ $(this).remove() });//goodbye
    target.collapse('hide');
}

function clickClose() {
    var obj = $(this);
    var target = obj.attr('data-target');
    console.log('clickClose', obj, target);
    $(target).collapse('hide');
}

function clickPinClose() {
    var obj = $(this);
    var target = obj.attr('data-target');
    console.log('clickPinClose', obj, target);
    $('#Scales [class~="scale"][class~="pinned"]').removeClass('pinned');
    $(target).on('hidden.bs.collapse', function(){ $(this).remove() });//goodbye
    $(target).collapse('hide');
}






function clickAdvanced() {
    var obj = $('#Advanced');
    var show = obj.hasClass('show');
    obj.collapse(show ? 'hide' : 'show');
    show ? $(this).removeClass('active') : $(this).addClass('active');
}

function clickInfo() {
    var obj = $('#Info');
    var show = obj.hasClass('show');
    obj.collapse(show ? 'hide' : 'show');
    show ? $(this).removeClass('active') : $(this).addClass('active');
}

function clickLang() {
    console.log('clickLang');
    var str;
    if (Settings.lang == 'ja') {
        Settings.lang = 'en';
        str = 'en/ja'
    }
    else {
        Settings.lang = 'ja';
        str = 'ja/en'
    }
    $(this).text(str);
    updateLang();
}

function clickScaleItem() {
    var obj = $(this);
    //check off
    var a = $('#Scales [class~="scale"][class~="active"]');
    a.removeClass('active');
    //check on
    obj.addClass('active');

    var id = $(this).attr('id');
    Scales.selected = findScale(id);

    console.log('clickScaleItem', Scales.selected);
    updateBoards();
    updateBoardShown();
}
function findScale(id) {
    //指定idのスケールオブジェクトを返す、なければundefined
    var scales = getAllScales();
    return scales.find(function(value){
        return (value.id == id);
    });
}






//
// update
//
function updateStatus() {
    // type, key に合わせて#Statusボタンのラベルを変更する
    var items = $('#Status button');
    var templ = '<span class="status-degree">{0}</span><br><div class="status-note"><span>{1}</span></div>';
    var degrees = getDegrees();
    var notes = getNotes(Settings.key); //key shifted

    for (var i=0, len=items.length; i<len; i++) {
        var item = $(items[i]);
        var html = $.format(templ, degrees[i], notes[i]);
        item.html(html);
    }
}


function updateScales() {
    console.log('updateScales');

    var status = getStatus();
    var scales = getAllScales();

    for (var i=0, len=scales.length; i<len; i++) {
        var scale = scales[i];
        var r = containScale(scale.interval, status);
        var e = $('#'+scale.id);
        console.log(e);
        if (r) e.slideDown();//e.fadeIn(300)
        else e.slideUp();//e.fadeOut(300);
    }
}
function getStatus() {
    var r = [];
    $("#Status button[class~='active']").each(function(index, element) {
        r.push(Number($(element).val()));
    });
    return r;    
}
function containScale(scale, status) {
    return status.every(function(element){
        return (scale.indexOf(element) != -1);
    });
}


function updateBoards() {
    console.log('updateBoards');
    createDegreeBoard();
    createNoteBoard();
}


function updateBoardShown() {
   shownBoard($('#Btn-Degree'), $('#DegreeBoard'));
   shownBoard($('#Btn-Note'), $('#NoteBoard'));
}
function shownBoard(btn, board) {
    if (btn.hasClass('active'))
        board.collapse('show');
    else
        board.collapse('hide');
}


function updateLang() {
    if (Settings.lang == 'ja') {
        /*
        $('body :lang(ja)').css('display', 'none');
        $('body :lang(en)').css('display', '');
        */
        $('body :lang(ja)').show();
        $('body :lang(en)').hide();
    }
    else {
        $('body :lang(ja)').hide();
        $('body :lang(en)').show();
    }         
}




//
// setup
//
function setupDefault() {
    setupFret();
    setupTuning();
    setupLevel();
    setupGhost();
}

function setupFret() {
    $('#Fret').attr('value', Settings.fret -1);
}
function setupTuning() {
    var Tuning = $('#Tuning', Data.Tuning);
    var templ = '<option value="{0}">{1}</option>';
    var options = [];
    for (var i=0, len=Data.tuning.length; i<len; i++) {
        var item = Data.tuning[i]; 
        var name2 = item.name + ' (' + item.notes.join(',') + ')';

        options.push(
            $.format(templ, item.name, name2)
        );
    }
    Tuning.html(options.join(''));
    changeTuning(null, Data.tuning[0].name);//set default
}
function setupLevel() {
    $('#Level').val(Settings.level);
}
function setupGhost() {
    if (Settings.ghost)
        $('#Check-ghost').attr('checked', 'checked');
    else
        $('#Check-ghost').removeAttr('checked');
}

function setupStatus() {
    //initialize #Status button not active, without R.
    var buttons = $('#Status button');
    buttons.removeClass('active');
    $(buttons[0]).addClass('active');
}




// observe resize #Boards
function setupResizeBoards() {
    const param = {
        'attributes': true,
        'characterData': true,
        //'childList': true,
        'subtree': true,
    };

   var moBoards = new MutationObserver(resizeBoards);
   moBoards.observe($('#Boards')[0], param);
}
function resizeBoards() {
    var margin = 20;
    var size = $('#Boards').outerHeight(true);
    console.log('resize', size);

    $('body').css('margin-bottom', Number(size + margin) + 'px');
    //$(window).scrollTop($(window).scrollTop() +size);    
}


//
// setupScales
//
function setupScales() {
    // prepare Scales data
    var ptn = new RegExp('\\W', 'g');

    for (var c=0, max=Scales.length; c<max; c++) {
        var cat = Scales[c];
        //console.log(cat, c, max);
        cat.id = cat.name.replace(ptn, '_');
        for (var i=0, len=cat.scales.length; i<len; i++) {
            var scale = cat.scales[i];

            scale.id = scale.name.replace(ptn, '_');
            scale.interval = DegreeToInterval(scale.degree);
            scale.cnote = scale.cnote || [];
            scale.cnote_interval = DegreeToInterval(scale.cnote);
            scale.ghost = scale.ghost || [];
            scale.ghost_interval = DegreeToInterval(scale.ghost);
        }
    }
    console.log('setupScales', Scales);

    createScales();
    updateLang();
    //updateScales();
}

function createScales() {
    var templ_cat = '' +
        '<a class="anchor" id="{0}-anchor"></a>' +
        '<section class="category">' +
        '  <a data-toggle="collapse" href="#{0}-group">' +
        '    <h4 class="category-title"><i class="fa"></i>{1}</h4>' +
        '  </a>' +
        '  <div id="{0}-group" class="category-scales collapse show">' +
        '  {2}' +
        '  </div>' +
        '</section>';

    var templ_scale = '' +
        '<a class="anchor" id="{0}-anchor"></a>' +
        '<div id="{0}" class="scale list-group-item list-group-item-action flex-column">' +
        '  <div class="d-flex w-100 justify-content-between">' +
        '    <h5 class="scale-title">{1}</h5>' +
        '    <h5 class="scale-symbol">{2}</h5>' +
        '  </div>' +
        '  <h5 class="scale-degrees">{3}</h5>' +
        //'  <p class="scale-desc">{4}</p>' +
        '  {4}' +
        "</div>";
    
    var templ_premode = '' +
        '<span class="scale-title-premode">{0}.</span>{1}'
    
    var templ_desc = '' +
        '<p lang="{0}" class="scale-desc scale-desc--{0}">{1}</p>'
    
    var html_cats = [];
    for (var c=0, max=Scales.length; c<max; c++) {
        var cat = Scales[c];

        var html_scales = [];
        for (var i=0, len=cat.scales.length; i<len; i++) {
            var scale = cat.scales[i];

            // I am tired of thinking...
            var df = scale['desc'];
            var en = scale['desc-en'];
            var ja = scale['desc-ja'];
            /*
            if (en == undefined && df != undefined) en = df;
            if (ja == undefined && df != undefined) ja = df;
            if (ja == undefined && df == undefined) ja = en;

            var descs = [];
            descs.push($.format(templ_desc, 'en', en));
            descs.push( $.format(templ_desc, 'ja', ja));
            */
            var descs = [];
            if (df != undefined)
                descs.push($.format(templ_desc, '', df));
            else {
                descs.push($.format(templ_desc, 'en', en));
                descs.push($.format(templ_desc, 'ja', ja));
            }

            var scale_name = scale.name;
            if (scale.mode != undefined) {
                scale_name = $.format(templ_premode, scale.mode, scale.name);
                //console.log(scale.mode, scale.name, templ_premode);
            }
            var scale_symbol = (scale.symbol != undefined) ? scale.symbol : '';
            

            html_scales.push(
                $.format(templ_scale,
                    scale.id, scale_name, scale_symbol, scale.degree.join(', '), descs.join(''))
            );
        }

        html_cats.push(
            $.format(templ_cat,
                cat.id, cat.name, html_scales.join(''))
        );
    }

    $('#Scales').html(html_cats.join(''));
    //$('#Scales div[class~="list-group-item"]').click(clickScaleItem);
    $('#Scales div[class^="scale"]').click(clickScaleItem);
}



function getAllScales() {
    // Scales[{ scales:[{}] }]
    var all_scales = [];
    Scales.forEach(function(element){
        all_scales = all_scales.concat(element.scales);
    });
    return all_scales;
}



//
// createBoard
//
function getSelectedScale() {
    return Scales.selected;
}

function createDegreeBoard() {
   makeBoardHeader('Degree');
   makeBoardDiagram('Degree');
}

function createNoteBoard() {
   makeBoardHeader('Note');
   makeBoardDiagram('Note');
}


function makeBoardHeader(target) {
    scale = getSelectedScale();
    if (scale == undefined) return;

    //header
    var title = $( $.format('#{0}Board [class~="board-title"]', target) );
    var name = scale.name;
    title.html(name);

    var key = $( $.format('#{0}Board [class~="board-title-key"]', target) );
    var name = getNote(Settings.key);
    key.html(name);
}
function makeBoardDiagram(target) {
    scale = getSelectedScale();
    if (scale == undefined) return;

    //diagram
    var table = $( $.format('#{0}Board .diagram table', target) );
    var templ_table = '<table>{0}</table>';
    var templ_tr = '<tr><th>{0}</th>{1}</tr>';
    var templ_td = '<td class="{0}"><div class="{1}"><span class="{2}">{3}</span></div></td>';

    var key_shifted_tuning_interval = KeyShiftTuningInterval();
    var strs = ('Degree' == target) ? getDegrees() : getNotes(Settings.key);

    var trs = [];
    trs.push(makeFretHeaderTR(0, Settings.fret));

    for (var s=0; s<Settings.string; s++) {
        var tds = [];
        for (var f=0; f<Settings.fret; f++) {
            //0/12/24 fret
            var cls_td = '';
            if (0==f) cls_td = 'zero-fret';
            else if (12==f) cls_td = 'twelve-fret';
            else if (24==f) cls_td = 'twenty-four-fret';

            var interval = (key_shifted_tuning_interval[s]+f) % MAX_INTERVAL;
            var str = strs[interval];

            var cls_div = [];
            cls_div.push('maru');
            if (0==interval) cls_div.push('root');
            else if (scale.hasOwnProperty('cnote_interval') &&
                scale.cnote_interval.indexOf(interval) != -1) cls_div.push('cnote');
            if (Settings.ghost &&
                scale.hasOwnProperty('ghost_interval') &&
                scale.ghost_interval.indexOf(interval) != -1) cls_div.push('ghost');

            if (cls_div.length < 2 && //mean if has root/conte/ghost, without trans
                Scales.selected.hasOwnProperty('interval') &&
                scale.interval.indexOf(interval) == -1) cls_div.push('trans');


            var cls_span = '';
            if (str.length >= 3) {
                cls_span = 'small';
                if ('Note' == target) {
                    str = str.replace('/', '<br>');
                }
            }

            tds.push(
                $.format(templ_td, cls_td, cls_div.join(' '), cls_span, str)
            );
        }
        
        trs.push(
            $.format(templ_tr, s+1, tds.join(''))
        );
    }

    trs.push(makeFretHeaderTR(12, Settings.fret));
    var html = $.format(templ_table, trs.join(''));
    table.html(html);
    console.log(table);
}
function makeFretHeaderTR(start, count) {
    var templ_tr = "<tr>{0}</tr>";
    var templ_th = "<th>{0}</th>";
    var text = ['0','','','3','','5','','7','','9','','','12',
                '','','15','','17','','19','','21','','','24',
                '','','27','','29','','31','','33','','','36',
                '','','39','','41','','43','','45','','','48'];
    var ths = [];
    ths.push('<th></th>'); //add string th
    for (var i=start, max=start+count; i<max; i++) {
        ths.push($.format(templ_th, text[i]));
    }
    return $.format(templ_tr, ths.join(''));
}



//
// toInterval, Degrees, Notes
//
function DegreeToInterval(array) {
    return array.map(function(element){
        var interval = -1;
        Data.define_degrees.some(function(elements, index){
            interval = index;
            return (elements.indexOf(element) != -1);
        });
        return interval;
    });    
}

function NoteToInterval(array) {
    var notes = getNotes();
    return array.map(function(element){
        if (element.length <= 1) { //C,D,E,F,G,A,B
            return notes.indexOf(element);
        }
        else {
            return notes.findIndex(function(value){ //C#,Db...
                return (value.indexOf(element) != -1);
            });
        }
    })
}


// return array by key shifted tuning intervals[1toX]
function KeyShiftTuningInterval() {
    return Settings.tuning_interval.map(function(element){
        return (element - Settings.key + MAX_INTERVAL) % MAX_INTERVAL;
    });
}

function getDegrees() {
    var type = Settings.type;
    var r = Data.types.findIndex(function(value){
        return (value.name == type);
    });
    if (r == -1) r = 0;

    var degrees = [].concat(Data.types[r].degrees);//shallow copy
    if ("scale" == type) {
        //選択中のスケール度名で置き換えたもの、を返す
        degrees = degrees.map(function(element, index){//index eq interval
            var scale_idx = Scales.selected.interval.indexOf(index);
            if (scale_idx != -1) {
                return Scales.selected.degree[scale_idx];
            }
            return element;
        });
    }
    return degrees;
}

function getNotes(key) {
    var notes = [].concat(Data.define_notes);//shallow copy
    if (key) {
        //key shift
        for (var i=0, len=key; i<len; i++) {
            notes.push(notes.shift());
        }
    }
    return notes;
}

function getNote(interval) {
    return Data.define_notes[interval];
}

//debug
function showEventList() {
    var allTags = document.body.getElementsByTagName('*');
    var tag;
    var i = 0;
    var l = allTags.length;
    for (; i < l; i++) {
        tag = $._data(allTags[i], 'events');
        if (tag !== undefined && tag !== null) {
          console.log(allTags[i], tag);
        }
    }
}