(function() {

    //Settings
    const PAUSE_MIN_A_DAY = 30;

    const WORKING_HOURS_A_WEEK = 38;
    const WORKING_DAYS = 5;

    const BEGIN_EVENT_COLUMN = 3;
    const BEGIN_TIME_COLUMN = 4;
    const END_EVENT_COLUMN = 5;
    const END_TIME_COLUMN = 6;
    const DATE_COLUMN = 0;
    const START_WORK = 'KO';

    const MS_IN_HOUR = 60 * 60 * 1000;
    const MS_IN_MINUTE = 60 * 1000;
    const WORKING_TIME_MS = WORKING_HOURS_A_WEEK / WORKING_DAYS * MS_IN_HOUR;
    const PAUSE_TIME_MS = PAUSE_MIN_A_DAY * MS_IN_MINUTE;

    function getEventTime(oTable, r, c) {
        if (oTable.rows[r].cells[c].innerText != '') {
            let dDate = new Date(
                oTable.rows[r].cells[DATE_COLUMN].innerText.substring(10, 6) + '-' +
                oTable.rows[r].cells[DATE_COLUMN].innerText.substring(5, 3) + '-' +
                oTable.rows[r].cells[DATE_COLUMN].innerText.substring(0, 2) + ' ' +
                oTable.rows[r].cells[c].innerText
            );
            return dDate.getTime();
        }
    }

    function getEventType(oTable, r, c) {
        if (oTable.rows[r].cells[c].innerText != '') {
            return oTable.rows[r].cells[c].innerText.substring(0, 2);
        }
    }

    function getEventBegin(oTable, r) {
        let oReturn = {
            type: getEventType(oTable, r, BEGIN_EVENT_COLUMN),
            time: getEventTime(oTable, r, BEGIN_TIME_COLUMN)
        };
        if (oReturn.type && oReturn.time) return oReturn;
    }

    function getEventEnd(oTable, r) {
        let oReturn = {
            type: getEventType(oTable, r, END_EVENT_COLUMN),
            time: getEventTime(oTable, r, END_TIME_COLUMN)
        };
        if (oReturn.type && oReturn.time) return oReturn;

    }

    function calculateTime(oDocument) {
        var startTime, workingTime;

        var oTable = oDocument.getElementById('tvt_WPTPROT');

        for (var r = 1, n = oTable.rows.length; r < n; r++) {

            //Skip empty rows
            if (!getEventBegin(oTable, r)) {
                continue;
            }

            //Init new day
            if (getEventBegin(oTable, r).type == START_WORK) {
                startTime = getEventBegin(oTable, r).time;
                workingTime = 0;
            }

            if (startTime) {

                //If pause exists
                if (getEventEnd(oTable, r)) {
                    workingTime += getEventEnd(oTable, r).time - getEventBegin(oTable, r).time;
                } else { //Pause is empty
                    workingTime += Date.now() - getEventBegin(oTable, r).time;

                    var newdate = new Date(Date.now() + WORKING_TIME_MS - workingTime);

                    //If pause does not exists yet
                    if (getEventBegin(oTable, r).type == START_WORK) {
                        newdate = new Date(newdate.getTime() + PAUSE_TIME_MS)
                    };

                    var mi = newdate.getMinutes();
                    var hr = newdate.getHours();

                    text = ("00" + hr).slice(-2) + ':' + ("00" + mi).slice(-2);

                    if (getEventBegin(oTable, r).type == START_WORK) {
                        text = text + ' incl. ' + PAUSE_MIN_A_DAY + ' Min Pause'
                    };

                    oTable.rows[r].cells[END_EVENT_COLUMN].innerText = 'Gehen um';
                    oTable.rows[r].cells[END_TIME_COLUMN].innerText = text;
                }

            }
        }
    }

    function waitForDocument(oDocument, aFrames) {

        if (aFrames[0]) {
            var sContent = aFrames[0];
            var iframe = oDocument.getElementById(sContent);
            var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            if (iframeDoc.readyState == 'complete') {
                //check next iframe
                aFrames.shift();
                window.setTimeout(waitForDocument, 100, iframeDoc, aFrames)
                return;
            } else { //iframe loading
                window.setTimeout(waitForDocument, 100, oDocument, aFrames);
            }
        } else { //last iframe ready
            //start calculating time
            window.setTimeout(calculateTime, 1000, oDocument)
        }
    }

    waitForDocument(document, ['content', 'bridgeIframe']);

})();