#!/usr/bin/env python3
"""
Génère des ambiances sonores libres de droits, bouclées SANS couture audible.

Pourquoi : la plainte n°1 sur les apps concurrentes est "le son boucle/coupe".
On synthétise chaque son et on applique un fondu enchaîné (crossfade) à la
jointure de la boucle. Comme expo-av lit ces fichiers avec `isLooping`, la
lecture devient continue et imperceptible. Aucun sample copyrighté n'est utilisé.

Usage : python3 tools/generate_sounds.py
Sortie : assets/sounds/*.wav  (mono, 22050 Hz, 16-bit)
"""
import math
import os
import random
import struct
import wave

SR = 22050
LOOP_SECONDS = 12
CROSSFADE_SECONDS = 1.0
N = SR * LOOP_SECONDS
CF = int(SR * CROSSFADE_SECONDS)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")


# ---- briques DSP -------------------------------------------------------------

def white():
    return random.uniform(-1.0, 1.0)


class LowPass:
    def __init__(self, cutoff):
        self.a = max(0.0, min(1.0, 2 * math.pi * cutoff / SR))
        self.y = 0.0

    def __call__(self, x):
        self.y += self.a * (x - self.y)
        return self.y


class Pink:
    def __init__(self):
        self.b = [0.0] * 7

    def __call__(self):
        w = white()
        b = self.b
        b[0] = 0.99886 * b[0] + w * 0.0555179
        b[1] = 0.99332 * b[1] + w * 0.0750759
        b[2] = 0.96900 * b[2] + w * 0.1538520
        b[3] = 0.86650 * b[3] + w * 0.3104856
        b[4] = 0.55000 * b[4] + w * 0.5329522
        b[5] = -0.7616 * b[5] - w * 0.0168980
        out = sum(b[:6]) + w * 0.5362
        b[6] = w * 0.115926
        return out * 0.11


# ---- générateurs (rendent une liste de floats de longueur "length") ----------

def gen_white(length):
    return [white() * 0.5 for _ in range(length)]


def gen_pink(length):
    p = Pink()
    return [p() for _ in range(length)]


def gen_brown(length):
    last = 0.0
    out = []
    for _ in range(length):
        last = (last + 0.02 * white()) / 1.02
        out.append(max(-1.0, min(1.0, last * 3.5)))
    return out


def gen_rain(length, intensity=0.6):
    body = LowPass(420)
    hiss = LowPass(2600 + 2000 * intensity)
    drop_env = 0.0
    drop_phase = 0.0
    drop_freq = 900.0
    drop_chance = 0.0018 + 0.004 * intensity
    out = []
    for _ in range(length):
        w = white()
        s = body(w) * 1.4 + hiss(w) * (0.35 + 0.25 * intensity)
        if random.random() < drop_chance:
            drop_env = 0.5 + random.random() * 0.5
            drop_freq = 600 + random.random() * 1400
            drop_phase = 0.0
        if drop_env > 0.0005:
            drop_phase += 2 * math.pi * drop_freq / SR
            s += math.sin(drop_phase) * drop_env * 0.5
            drop_env *= 0.992
        out.append(max(-1.0, min(1.0, s * 0.5)))
    return out


def gen_ocean(length):
    # 2 cycles de houle sur la boucle -> raccord périodique parfait.
    rate = 2.0 / LOOP_SECONDS
    lp = LowPass(900)
    last = 0.0
    out = []
    for i in range(length):
        last = (last + 0.02 * white()) / 1.02
        noise = lp(last * 3.5)
        swell = 0.5 + 0.5 * math.sin(2 * math.pi * rate * i / SR)
        out.append(max(-1.0, min(1.0, noise * swell * swell * 1.6)))
    return out


def gen_wind(length):
    rate = 2.0 / LOOP_SECONDS
    lp = LowPass(500)
    out = []
    for i in range(length):
        n = lp(white())
        gust = 0.4 + 0.6 * (0.5 + 0.5 * math.sin(2 * math.pi * rate * i / SR))
        out.append(max(-1.0, min(1.0, n * gust * 1.5)))
    return out


def gen_fan(length):
    rate = 24.0  # 24*12 = 288 cycles entiers sur la boucle
    lp = LowPass(800)
    out = []
    for i in range(length):
        n = lp(white())
        mod = 0.85 + 0.15 * math.sin(2 * math.pi * rate * i / SR)
        out.append(max(-1.0, min(1.0, n * mod * 1.6)))
    return out


def gen_stream(length):
    hp = LowPass(3000)
    prev = 0.0
    bubble_env = 0.0
    bubble_phase = 0.0
    bubble_freq = 1200.0
    out = []
    for _ in range(length):
        w = white()
        lp = hp(w)
        high = w - lp
        s = high * 0.5 + (lp - prev) * 2.0
        prev = lp
        if random.random() < 0.01:
            bubble_env = 0.3 + random.random() * 0.4
            bubble_freq = 800 + random.random() * 1600
        if bubble_env > 0.0005:
            bubble_phase += 2 * math.pi * bubble_freq / SR
            s += math.sin(bubble_phase) * bubble_env * 0.3
            bubble_env *= 0.985
        out.append(max(-1.0, min(1.0, s * 0.4)))
    return out


def gen_womb(length):
    # 60 bpm -> 1 battement / s -> 12 battements entiers sur la boucle.
    bpm = 60.0
    period = SR * 60.0 / bpm
    lp = LowPass(350)
    last = 0.0
    out = []
    for i in range(length):
        last = (last + 0.02 * white()) / 1.02
        s = lp(last * 3.5) * 0.9
        pos = (i % period) / period
        s += _beat(pos, 0.00, 1.0, period)
        s += _beat(pos, 0.14, 0.7, period)
        out.append(max(-1.0, min(1.0, s * 0.6)))
    return out


def _beat(pos, at, gain, period):
    d = pos - at
    if d < 0 or d > 0.10:
        return 0.0
    seconds = d * period / SR
    env = math.exp(-d * 45)
    return math.sin(2 * math.pi * 55 * seconds) * env * gain * 0.5


# ---- bouclage sans couture + écriture WAV ------------------------------------

def seamless(samples):
    """samples a une longueur N+CF ; renvoie N échantillons bouclables."""
    out = samples[:N]
    for i in range(CF):
        w = i / CF
        out[i] = samples[i] * w + samples[i + N] * (1 - w)
    return out


def write_wav(path, samples):
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = int(max(-1.0, min(1.0, s)) * 32767)
            frames += struct.pack("<h", v)
        f.writeframes(bytes(frames))


GENERATORS = {
    "rain": lambda n: gen_rain(n, 0.55),
    "heavy_rain": lambda n: gen_rain(n, 1.0),
    "womb": gen_womb,
    "white": gen_white,
    "pink": gen_pink,
    "brown": gen_brown,
    "ocean": gen_ocean,
    "wind": gen_wind,
    "stream": gen_stream,
    "fan": gen_fan,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, gen in GENERATORS.items():
        random.seed(hash(name) & 0xFFFFFFFF)
        raw = gen(N + CF)
        looped = seamless(raw)
        path = os.path.join(OUT_DIR, f"{name}.wav")
        write_wav(path, looped)
        print(f"  {name}.wav  ({len(looped)} samples)")
    print("Terminé.")


if __name__ == "__main__":
    main()
