interface PackMCMeta {
    pack: {
        pack_format: number;
        description: string;
        author: string | undefined;
        x_mc_version: string | undefined;
    }
}

export { PackMCMeta };
