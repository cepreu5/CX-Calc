@echo off
cls
setlocal enabledelayedexpansion

set "INPUT=sounds0"
set "OUTPUT=sounds"
mkdir "%OUTPUT%" 2>nul

:: Обработка на всички mp3 файлове
for %%F in (%INPUT%\*.mp3) do (
    set "filename=%%~nxF"

    ffmpeg -f lavfi -t 0.2 -i anullsrc=channel_layout=mono:sample_rate=24000 -i "%%F" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1" -ar 24000 -ac 1 -c:a libmp3lame "%OUTPUT%\!filename!" -y

    echo Processed: !filename!
)

echo Ready!
pause
