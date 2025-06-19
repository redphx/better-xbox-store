type FiltersResponse = {
    $schemaVersion: number;
    data: {
        [key: string]: {
            _translation: string;
            _placement: number;

            developers: string[];
            ids: string[];
            publishers: string[];
        };
    };
}
