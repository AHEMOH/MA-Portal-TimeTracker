(function() {

    //Settings
    const PAUSE_MIN_A_DAY = 30;

    const WORKING_HOURS_A_WEEK = 38;
    const WORKING_DAYS = 5;

    const BEGIN_EVENT_COLUMN = 3;
    const BEGIN_TIME_COLUMN = 4;
    const END_EVENT_COLUMN = 5;
    const END_TIME_COLUMN = 6;
    const INFO_COLUMN = 7;
    const SALDO_COLUMN = 9;
    const DATE_COLUMN = 0;
    const START_WORK = 'KO';
    const APPROX_END_WORK = 'BIS';

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
        let oEvent = {
            type: getEventType(oTable, r, BEGIN_EVENT_COLUMN),
            time: getEventTime(oTable, r, BEGIN_TIME_COLUMN)
        };
        if (oEvent.type && oEvent.time) return oEvent;
    }

    function getEventEnd(oTable, r) {
        let oEvent = {
            type: getEventType(oTable, r, END_EVENT_COLUMN),
            time: getEventTime(oTable, r, END_TIME_COLUMN)
        };
        if (oEvent.type && oEvent.time) return oEvent;

    }

    function bold(sText) {
        return '<b>' + sText + '</b>';
    }

    function setInfo(oTable, r, sInfo) {
        oTable.rows[r].cells[INFO_COLUMN].innerText = sInfo;
    }

    function setSaldo(oTable, r, timeMs) {
        let saldoMs = Math.abs(WORKING_TIME_MS - timeMs);
        let leftTime = new Date(saldoMs).getTime();

        let sSaldo = (WORKING_TIME_MS > timeMs ? '- ' : '+ ') + getUTCHHMI(leftTime); //Saldo + / -

        oTable.rows[r].cells[SALDO_COLUMN].innerText = sSaldo;
    }

    function getHHMI(timeMs) {
        let oDate = new Date(timeMs);
        let mi = oDate.getMinutes();
        let hr = oDate.getHours();

        return ("00" + hr).slice(-2) + ':' + ("00" + mi).slice(-2);
    }
	
	function getUTCHHMI(timeMs) {
        let oDate = new Date(timeMs);
        let mi = oDate.getUTCMinutes();
        let hr = oDate.getUTCHours();

        return ("00" + hr).slice(-2) + ':' + ("00" + mi).slice(-2);
    }

    function setEndEvent(oTable, r, oEvent) {
        if (oEvent.type && oEvent.time) {
            oTable.rows[r].cells[END_EVENT_COLUMN].innerText = oEvent.type;
            oTable.rows[r].cells[END_TIME_COLUMN].innerText = getHHMI(oEvent.time);
        }
    }

    function calculateTime(oDocument) {
        let startTime, workingTime;

        let oTable = oDocument.getElementById('tvt_WPTPROT');

        for (let r = 1, n = oTable.rows.length; r < n; r++) {

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

                //If pause end exists
                if (getEventEnd(oTable, r)) {
                    workingTime += getEventEnd(oTable, r).time - getEventBegin(oTable, r).time;
                } else { //New working period
                    workingTime += Date.now() - getEventBegin(oTable, r).time;
                    endTime = new Date(Date.now() + WORKING_TIME_MS - workingTime).getTime();
                    //If pause does not exists yet
                    if (getEventBegin(oTable, r).type == START_WORK) {
                        endTime = new Date(endTime + PAUSE_TIME_MS).getTime()
                        setInfo(oTable, r, ' incl. ' + PAUSE_MIN_A_DAY + ' Min Pause');
                    };

                    setSaldo(oTable, r, workingTime);

                    let oEvent = {
                        type: APPROX_END_WORK,
                        time: endTime
                    };

                    setEndEvent(oTable, r, oEvent);
                }

            }
        }
    }

    function waitForDocument(oDocument, aFrames) {

        if (aFrames[0]) {
            let sContent = aFrames[0];
            let iframe = oDocument.getElementById(sContent);
            let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

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