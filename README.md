# Microcontrollers Logging

This is a continuation of the Microcontrollers Intro exercise and assumes you have the light detection circuit already in place.

## Exercise #4: Logging data

The last exercise finished with exposing variables to the cloud via, e.g. `Particle.variable("cds", cds_reading)`. The value of these variables is only actually sent to the cloud if someone requests (**pulls**) the information. Data logging is usually accomplished more easily by having the microcontroller publish (**push**) data to the cloud on a regular basis.

### Publishing values

- publish information to the cloud:
- in the **loop** function of your light sensor, ***inside your interval if statement***, add:
```C++
char data[255]; // maximum length of single publish
snprintf(data, sizeof(data),
    "\"sheet\":\"light\",\"location\":\"my desk\",\"cds\":%d",
    cds_reading);
Serial.printf("INFO: sending log (%s)... ", data);
bool success = Particle.publish("gs_logger", data);
(success) ? Serial.println("successful.") : Serial.println("failed.");
```
- you may want to adjust the interval to a little less frequent e.g. 10s (10000ms)
- once flashed, check the device's output on your [Particle Devices Console](https://console.particle.io/devices)

### Using Webhooks

Now that your microcontroller publishes to the cloud, you can set up a webhook that automatically forwards the information to various destinations (e.g. a database, text messaging service, email, etc.). Here we will set up a generic webhook that can forward information from any of your devices that publishes with this webhook to a google spreadsheet.

#### Setup the google spreadsheet

- in your google drive, create a new google spreadsheet and give it an informative name (e.g. **Super Awesome Data Logger**), which one does not matter
- go to `Tools` -> `Script Editor`
- give the new script a title (e.g. **Super Awesome Data Logging Script**), again the exact name does not matter
- open the file `scripts/google_spreadsheet_script.js` in this repo and copy its entire content into your new google script
- save the google script and follow the steps in the comments at the beginning to set it up, make sure to copy the URL you get at then end!
- Note: testing it with the program `curl` (short for copy URL) is a good check if you have `curl` already installed, if not it may not be worth the trouble

#### Setup the webhook

- go to your [Particle Integrations](https://console.particle.io/integrations)
- click **New Integration** --> **Webhook**, create a new Webhook:
  - Event Name: `gs_logger` (or whatever you want to use in your `Particle.publish` call)
  - URL: enter the URL you copide from your published google script
  - Request Type: `POST`
  - Request Format: `JSON`
  - Device: `any`
  - Advanced Settings ->  JSON DATA: select `Custom` and paste the following code:
    ```Javascript
    {
      "published_at":"{{PARTICLE_PUBLISHED_AT}}",
      "payload":{
          {{{PARTICLE_EVENT_VALUE}}}
      }
    }
    ```
  - Enfore SSL: `yes`
  - Save the new webhook and click the `Test` button at the top to check communication with the google spreadsheet
  - Now go to your [Particle Events Console](https://console.particle.io/events) and watch for the next event to come from your microcontroller, get picked up by the webhook and appear in your google spreadsheet, yay!
  - Pull the data directly from the google spreadsheet using [googlesheets in R](https://github.com/jennybc/googlesheets#google-sheets-r-api) or [gspread in Python](https://github.com/burnash/gspread)

## Exercise #5: New sensors



### How to add library

- use the **Browse and manage Particle libraries** button to search for libraries of interest and add them to your project
- alternatively:
  - search for a library in the terminal, e.g. `particle library search LiquidCrystal`
  - add a library in the terminal `particle library add LiquidCrystal_I2C_Spark`
- check your `project.properties` file to see all dependencies
- add include statement to your `.ino` file, e.g. `#include "LiquidCrystal_I2C_Spark.h"`
- Note: to include a local copy of the source code of a library (e.g. for extension or other modifications), use the following command: `particle library copy LiquidCrystal_I2C_Spark` which will add it to the `lib` folder. This can be useful even just to look at the code or the examples that are usually provided with any library and you can remove the library simply by deleting the entire library folder (or the line in `project.properties` if using a remote copy).
