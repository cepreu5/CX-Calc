import subprocess
import os

input_folder = "sounds"
output_folder = "sounds_with_silence"
os.makedirs(output_folder, exist_ok=True)

for filename in os.listdir(input_folder):
    if filename.endswith(".mp3"):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)

        # Добавяне на 0.1 секунда тишина в началото
        command = [
            "ffmpeg",
            "-f", "lavfi",
            "-i", "anullsrc=r=44100:cl=mono",
            "-i", input_path,
            "-filter_complex", "[0][1]concat=n=2:v=0:a=1",
            "-t", "00:00:02",  # обща дължина (по избор)
            "-y", output_path
        ]
        subprocess.run(command)
        print(f"Обработен: {filename}")
        