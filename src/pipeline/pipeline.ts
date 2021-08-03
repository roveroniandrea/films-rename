export type PipelineStep = (filmName: string) => string;

export function pipeline(films: string[], ...steps: PipelineStep[]): string[] {
    return films.map(film => {
        let [filmName, filmExt] = splitExtension(film);
        steps.forEach(step => {
            filmName = step(filmName)
        })
        return [filmName, filmExt].join('');
    })
}




export function splitExtension(film: string): [string, string] {
    const startExt = film.lastIndexOf('.');
    return [film.slice(0, startExt), film.slice(startExt)];
}