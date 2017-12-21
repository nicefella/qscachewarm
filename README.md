# qscachewarm
Qlik Sense Cache Warming Script

![alt text](https://github.com/nicefella/qscachewarm/blob/master/cw.png "Qlik Sense Cache Warming Preload Script")

### About
This script provides and establishes a live connection to a Qlik Sense Engine instance as an authorized user and loops over all the apps, load them into memory and also loop their containing visualization objects to cache them to memory as well.
The main benefit of this script is to eliminate the initial waiting time when an app is being loaded and to decrease response time when browsing through sheets.

### Installation
1. Create a virtual proxy which is using *Forms* as Windows Authentication Pattern
2. Extract all files into a folder in Qlik Sense Server Machine.
3. Modify settings in config.js file.
4. Run run.bat
5. You can also create a scheduled task on this bat file.

