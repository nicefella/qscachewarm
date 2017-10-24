# qscachewarm
Qlik Sense Cache Warming Script

### About
This script connects to a Qlik Sense Engine instance as an authorized user and loops over all the apps, preload them and also loop their containing visualization objects to cache them in RAM.
The main benefit of this script is to eliminate first loading time when an app is clicked in the Hub and to decrease response time when browsing through sheets.

### Installation
1. Extract all files into a folder in Qlik Sense Server Machine.
2. Modify settings in config.js file.
3. Run run.bat
4. You can also create a scheduled task on this bat file.

