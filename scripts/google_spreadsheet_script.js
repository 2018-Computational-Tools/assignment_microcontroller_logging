/*
SETUP:
1. Resources --> Libraries --> Search for MYB7yzedMbnJaMKECt6Sm7FLDhaBgl_dE --> Select newest version in the dropdown of the BetterLog library
2. Run --> Run function --> setup
3. Publish --> Deploy as web app
    - Projection Version: select "New"
    - Who has access to the app: select "anyone, even anonymously"
4. Copy the "Current web app URL" to set up the webhook with custom JSON data
5. [OPTIONAL] Test that it works via curl, run the following from terminal with <<URL>> replaced by the URL copied in step 4 above
    curl -d '{"published_at":"2018-01-03T00:00:00Z","payload":{"sheet":"test","value":5}}' -H "Content-Type: application/json" -L <<URL>>
*/


/**
CODE
*/
var script_props = PropertiesService.getScriptProperties(); // use to get spreadsheet ID (set during setup function call)

/**
 * Add data by post
 * POST data must be valid JSON with the following structure (published_at and payload.sheet are required):
 {
  "published_at": "2018-01-03T03:50:22.070Z",
  "payload":{
     "sheet":"testing",
     "col1": 5.3,
     "col2": "note"
  }
}
 */
function doPost(e){

  // doc key from script props
  doc_key = script_props.getProperty("key");

  // start logger
  logger = BetterLog.useSpreadsheet(doc_key);

  // define variables
  var sheet;

  // Try to access spreadsheet
  try {

    var webhook_data = JSON.parse(e.postData.contents);

    // safety checks
    if (webhook_data.payload == null)
      throw "No payload provided.";
    if (typeof webhook_data.payload !== 'object')
      throw "Incorrectly formatted payload (not JSON).";
    if (webhook_data.payload.sheet == null)
      throw "No payload.sheet provided.";
    if (webhook_data.published_at == null)
      throw "No published_at timestamp provided.";

    // sheet
    sheet = webhook_data.payload.sheet;
    delete webhook_data.payload.sheet;

    // keys
    var keys = Object.keys(webhook_data.payload);
    keys.unshift("published_at");

    // spreadsheet
    var gs = SpreadsheetApp.openById(doc_key);
    var ws = gs.getSheetByName(sheet);
    if (ws == null) {
      // sheet doesn't exist yet, create it
      ws = gs.insertSheet(sheet);
      ws.appendRow(keys);
      logger.info("Created new sheet with columns %s", keys);
    }
    var headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];

    // values consistent with headers
    var vals = [];
    var cols = ["published_at"];
    for (i in headers){
      if (headers[i] == "published_at") {
        vals.push(webhook_data.published_at);
      } else if (webhook_data.payload[headers[i]] != null) {
        vals.push(webhook_data.payload[headers[i]]);
        cols.push(headers[i]);
      } else {
        vals.push(null);
      }
    }

    // append row
    var new_row = ws.appendRow(vals).getLastRow();
    logger.info("Succesfully added row %d with data for colums %s to sheet \"%s\"", new_row, cols, sheet);

    // return
    return ContentService
          .createTextOutput(JSON.stringify({"result":"ok", "row": new_row}))
          .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    // deal with error
    err = (typeof err === 'string') ? new Error(err) : err;
    logger.severe(
      "%s (line %s): %s. While processing data %s for sheet '%s'.",
      err.name || '', err.lineNumber || '?', err.message || '',
      e.postData.contents || '', sheet || "UNDEFINED");

    // return
    return ContentService
           .createTextOutput(JSON.stringify({"result":"error", "error": err}))
           .setMimeType(ContentService.MimeType.JSON);

  }
}

/**
 * Setup function to run once to save the ID of the active spreadsheet.
 */
function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    script_props.setProperty("key", doc.getId());
}
