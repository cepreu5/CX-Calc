@echo off
setlocal enabledelayedexpansion

:: Папки
set "INPUT=sounds0"
set "OUTPUT=sounds"

:: Създаване на изходната папка, ако не съществува
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

:: Генериране на 100ms тишина
ffmpeg -f lavfi -t 0.2 -i anullsrc=r=44100:cl=mono "%OUTPUT%\silence.mp3"

:: Обработка на всички mp3 файлове
for %%F in (%INPUT%\*.mp3) do (
    set "filename=%%~nxF"
    ffmpeg -y -i "concat:%OUTPUT%\silence.mp3|%%F" -acodec copy "%OUTPUT%\!filename!"
    echo Обработен: !filename!
)

:: Премахване на временния файл
del "%OUTPUT%\silence.mp3"

echo Готово!
pause
