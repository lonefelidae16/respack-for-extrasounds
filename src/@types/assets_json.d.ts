interface AssetsJson {
    objects: {
        [path: string]: {
            hash: string;
            size: number;
        };
    };
}

export { AssetsJson };
