# qscachewarm
Qlik Sense Cache Warming Script

# This script connects to a Qlik Sense Engine instance as an authorized user and loops over all the apps, preload them and also loop their containing visualization objects to cache them in RAM.
# The main benefit of this script is to eliminate first loading time when an app is clicked in the Hub and to decrease response time when browsing through sheets.

# Extract all files into a folder in Qlik Sense Server Machine.
# Modify settings in config.js file.
# Run run.bat
# You can also create a scheduled task on this bat file.

