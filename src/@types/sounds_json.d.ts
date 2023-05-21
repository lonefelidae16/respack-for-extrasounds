interface SoundEntry {
    name: string;
    volume: number | undefined;
    pitch: number | undefined;
    weight: number | undefined;
    stream: boolean | undefined;
    attenuation_distance: number | undefined;
    preload: boolean | undefined;
    type: 'event' | 'sound' | undefined;
}

interface Sounds {
    sounds: SoundEntry[] | string[];
    replace: boolean | undefined;
    subtitle: string | undefined;
}

interface SoundsJson {
    [entry: string]: Sounds;
}

export { SoundEntry, Sounds, SoundsJson };
