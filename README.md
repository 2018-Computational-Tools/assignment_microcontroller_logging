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

## Exercise #5: Digital temperature & humidity sensor (DHT11)

For this exercise we will use a simple temperature & humidity sensor, the DHT11 ([Technical Specs](https://www.mouser.com/ds/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf)). It is not particularly accurate (5% Humidity, 2C) but easy to use and has a well-developed library provided by the awesome open-hardware company [Adafruit](https://www.adafruit.com/).

Start by creating a new project (e.g. clone this repository, open it in the Particle ID, and use the **Start new project** button to turn it into a project).

### Add the `Adafruit_DHT` library

- use the **Browse and manage Particle libraries** button to search for libraries of interest and add them to your project (clicking on the `Use` -> `Add to current project` button)
- alternatively:
  - search for a library in the terminal, e.g. `particle library search Adafruit_DHT`
  - add a library in the terminal `particle library add Adafruit_DHT`
- check your `project.properties` file to see all dependencies
- add include statement to your `.ino` file, e.g. `#include "LiquidCrystal_I2C_Spark.h"`
- Note: to include a local copy of the source code of a library (e.g. for extension or other modifications), hit `Use` - > `Copy to current project` in the library browser instead or use the following command: `particle library copy Adafruit_DHT` which will add it to the `lib` folder. This can be useful even just to look at the code or the examples that are usually provided with any library and you can remove the library simply by deleting the entire library folder (or the line in `project.properties` if using a remote copy).

### Setup the [circuit](http://www.electronicwings.com/particle/dht11-sensor-interfacing-with-particle-photon)

![](images/particle_photon_DHT11.png)

### Run the example

- in the Library browser, click on `View source` to pull up the source code of the `Adafruit_DHT` library
- go into the `example/dht-test` folder and open the `dht-test.ino` file, copy its contents into your own new project (`src/???.ino` file)
- uncomment the line `#define DHTTYPE DHT11` and comment out the other `#define DHTTYPE ...` lines
- compile & flash to your photon, open the serial monitor to see the OUTPUT
- now simplify the output by replacing all the `Serial.print` statements at the end of the `loop` with the following line:
- `Serial.printf("%s: Humidity = %.2f%%, Temp = %.2f C\n", Time.timeStr().c_str(), h, t);`
- re-flash and check the serial monitor, breathe on the sensor to check that it works

### Challenge

- can you set it up to report the readings on a new tab in your google spreadsheet? (once again, you may want to reduce your log interval a little bit, maybe to every 10 seconds)

## Exercise #6:

### Add the library `MPU6050`

### Setup the [circuit](http://www.electronicwings.com/particle/mpu6050-interfacing-with-particle-photon)

![](images/particle_photon_gyro.png)

### Run the Example

 - copy the example code in `example-mpu-dump-to-serial` from the `MPU6050` library to your project `src/???.info` file.
 - replace the line `while(!Serial.available()) SPARK_WLAN_Loop();` with `delay(5000)`
 - compile and flash, see what happens on serial
 - now you may want to simplify the output a little bit by replacing all the `Serial.print` statements again with the following line:
 - `Serial.printf("ax = %5d, ay = %6d, az = %5d | gx = %5d, gy = %5d, gz = %5d\n", ax, ay, az, gx, gy, gz);`
 - you may also want to put a little delay into the loop to see better how the data change

### Challenge

 1. can you figure out from the source code of the `MPU6050` library how to get the temperature reading? Hint: you want to look in the library's `src/MPU6050.h` file. Make a variable that stores the temperature reading, read it in every loop step and include it in the serial output.
 2. convert the digitized readings to their actual values using the following conversion:
  - **Accelerometer values in g (g force)** :
  - Acceleration along the X/Y/Z axis = (Accelerometer X/Y/Z axis raw data/16384) g.
  - **Gyroscope values in °/s (degree per second)**:
  - Angular velocity along the X/Y/Z axis = (Gyroscope X/Y/Z axis raw data/131) °/s.
  - **Temperature value in °/c (degree per Celsius)**:
  - Temperature in degrees C = ((temperature sensor data)/340 + 36.53) °/c.
 3. output the converted values to the Serial output. What do you get? Do these make sense?

Note: additional information on this sophisticated motion sensor module is available [here](http://www.electronicwings.com/sensors-modules/mpu6050-gyroscope-accelerometer-temperature-sensor-module).
