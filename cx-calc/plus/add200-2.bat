@echo off
cls
setlocal enabledelayedexpansion

set "INPUT=sounds0"
set "OUTPUT=sounds"
mkdir "%OUTPUT%" 2>nul

:: Генериране на 100ms тишина
ffmpeg -f lavfi -t 0.2 -i anullsrc=r=44100:cl=mono "%OUTPUT%\silence.mp3"

for %%F in (%INPUT%\*.mp3) do (
    set "filename=%%~nxF"
    echo file 'silence.mp3' > "%OUTPUT%\list.txt"
    echo file '%%F' >> "%OUTPUT%\list.txt"

    ffmpeg -f concat -safe 0 -i "%OUTPUT%\list.txt" -c copy "%OUTPUT%\!filename!" 2>nul
    echo Processed: !filename!
)

del "%OUTPUT%\silence.mp3"
del "%OUTPUT%\list.txt"
echo Ready!
pause
