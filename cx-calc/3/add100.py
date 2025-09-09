from pydub import AudioSegment
import os

# Път до директорията със звуците
input_folder = "sounds"
output_folder = "sounds_with_silence"
os.makedirs(output_folder, exist_ok=True)

# Продължителност на тишината в милисекунди
silence_duration = 100  # 100ms

# Създаване на тишина
silence = AudioSegment.silent(duration=silence_duration)

# Обработка на всички mp3 файлове
for filename in os.listdir(input_folder):
    if filename.endswith(".mp3"):
        filepath = os.path.join(input_folder, filename)
        sound = AudioSegment.from_mp3(filepath)
        combined = silence + sound
        output_path = os.path.join(output_folder, filename)
        combined.export(output_path, format="mp3")
        print(f"Обработен: {filename}")
