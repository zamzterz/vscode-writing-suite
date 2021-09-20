# pomodoro-writer 

Pomodoro timer combined with an optional word count goal for each session.

## Features

Simply start the timer from the status bar:
![Timer and word count in status bar](images/start_timer.gif)

To change the work time or word count goal, click each item and enter the value:
![Change work time or word count goal](images/change_settings.gif)


## Extension Settings

This extension contributes the following settings:

* `pomodoro-writer.autoZenMode`: enable/disable automatic toggling of Zen Mode when (re)starting the timer
* `pomodoro-writer.zenModeFontSize`: custom font size to use when in Zen Mode

It is also recommended to show the status bar and allow notifications in Zen Mode if you enable "auto Zen Mode":
```json
 "zenMode.hideStatusBar": false,
 "zenMode.silentNotifications": false
 ```


#### Icon
The icon of this extension is a derivative of "Pen by VectorsLab from the Noun Project" and "Tomato Timer by Nick Bluth from the Noun Project", used under CC BY.
