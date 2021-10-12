# Pomodoro Writer 

Pomodoro timer combined with an optional word count goal for each session.

## Features

Simply start the timer from the status bar (or via command "Start pomodoro"):

![Timer and word count in status bar](images/start_timer.gif)

To change the work time or word count goal, click each item and enter the value (or via command "Set pomodoro time" and "Set pomodoro word count goal" respectively):

![Change work time or word count goal](images/change_settings.gif)


## Extension Settings

This extension contributes the following settings:

* `pomodoroWriter.statusBar.showTimer`: whether the timer countdown should be visible in the status bar
* `pomodoroWriter.statusBar.showWordCountGoal`: whether the timer countdown should be visible in the status bar


It is also recommended to show the status bar and allow notifications in Zen Mode (if you use that) to know when the timer ends and the word count goal is reached:
```json
 "zenMode.hideStatusBar": false,
 "zenMode.silentNotifications": false
 ```


#### Icon
The icon of this extension is a derivative of "Pen by VectorsLab from the Noun Project" and "Tomato Timer by Nick Bluth from the Noun Project", used under CC BY.
