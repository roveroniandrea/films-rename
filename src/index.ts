import readline from 'readline';
import fs from 'fs';
import { pipeline, removePrefix, removeSuffix, replace } from './pipeline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const supportedFilmExtensions = ['.mp4', '.avi', '.m4v'];

rl.question('Trascina qui la cartella e premi invio:\n', (folderPath) => {
    if (folderPath.startsWith('"')) {
        folderPath = folderPath.slice(1, folderPath.length - 1);
    }
    fs.lstat(folderPath, (err, stats) => {
        if (!err) {
            if (stats.isDirectory()) {
                fs.readdir(folderPath, (err, files) => {
                    if (!err) {
                        const films = files.filter((f) => {
                            return supportedFilmExtensions.some((ex) => f.endsWith(ex));
                        });

                        processFilms(folderPath, films);
                    } else {
                        console.log('Errore lettura cartella');
                        process.exit(0);
                    }
                });
            }
            else {
                if (stats.isFile()) {
                    console.log('Il singolo film non è supportato, devi trascinare la cartella')
                }
                console.log('Errore, uscita in corso')
                process.exit(0);
            }
        } else {
            if (err) {
                console.log('La cartella non è valida', err);
            } else {
                console.log('Non hai selezionato una cartella');
            }
            process.exit(0);
        }
    });
});

async function processFilms(folderPath: string, films: string[]): Promise<void> {

    const oldFilms = films;
    let someChanges = false;

    if (films.length > 0) {
        let continuePromise: Promise<boolean> | null = null;
        do {
            const convertedFilms = await singleProcessStep(films);
            printChanges(films, convertedFilms)
            continuePromise = new Promise<boolean>((res, _) => {
                rl.question('Accetti le modifiche? (Y/n):\n', (accept) => {
                    if (accept === 'y' || accept === 'Y' || !accept) {
                        films = convertedFilms;
                        someChanges = true;
                    }
                    rl.question('Applicare un altro step? (y/N): \n', (anotherStep) => {
                        res(anotherStep === 'y' || anotherStep === 'Y');
                    })
                })
            })
        }
        while (await continuePromise)
    }

    printChanges(oldFilms, films)

    if (someChanges) {
        rl.question('Vuoi scrivere le modifiche su disco? (Y/n):\n', async (accept) => {
            if (accept === 'y' || accept === 'Y' || !accept) {
                try {
                    await saveChanges(oldFilms.map(f => [folderPath, f].join('/')), films.map(f => [folderPath, f].join('/')))
                    console.log('Modifiche salvate correttamente!')
                }
                catch (err) {
                    console.log('Errore salvataggio modifiche: ', err)
                }
                process.exit(0)
            }
        })
    }
    else{
        console.log('Nessuna modifica da salvare');
        process.exit(0);
    }
}

async function saveChanges(oldFilms: string[], newFilms: string[]): Promise<any> {
    const promises = newFilms.map((f, i) => {
        return new Promise<void>((res, rej) => {
            fs.rename(oldFilms[i], f, err => {
                if (err) {
                    rej(`Error writing ${f}: ${err.message}`);
                }
                else {
                    res()
                }
            })
        })
    })
    return Promise.all(promises)
}


async function singleProcessStep(films: string[]): Promise<string[]> {
    const options = [
        'Correzione automatica (rimozione suffisso standard e punteggiatura) (default)',
        'Rimozione suffisso personalizzato',
        'Rimozione punteggiatura personalizzata',
        'Rimozione prefisso personalizzato',
        'Rimpiazzo di stringa personalizzato',
        'Esci'
    ];

    const convertedFilmsPromise: Promise<string[]> = new Promise((res, _) => {
        rl.question(`\nCosa vuoi fare?:\n\n${options.map((op, i) => `${i}: ${op}`).join('\n')}\n\n`, (answer) => {
            console.log('');
            let intAnswer = parseInt(answer) || 0;
            switch (intAnswer) {
                case 1:
                    rl.question('Inserisci l\'inizio del suffisso da rimuovere:\n', (suff) => {
                        res(pipeline(films, removeSuffix(suff)))
                    })
                    break;
                case 2:
                    rl.question('Inserisci la punteggiatura da rimuovere:\n', (punct) => {
                        res(pipeline(films, replace(punct, ' ')))
                    })
                    break;
                case 3:
                    rl.question('Inserisci la fine del prefisso da rimuovere:\n', (prefix) => {
                        res(pipeline(films, removePrefix(prefix)))
                    })
                    break;
                case 4:
                    rl.question('Inserisci la stringa da cercare:\n', (search) => {
                        rl.question('Inserisci la stringa con cui sostituire:\n', (replaceStr) => {
                            res(pipeline(films, replace(search, replaceStr)))
                        })
                    })
                    break;
                case 5:
                    res(films)
                default:
                    res(pipeline(films, removeSuffix('.ITA'), replace('.', ' ')))
                    break;
            }
        });
    })
    return convertedFilmsPromise
}

function printChanges(before: string[], after: string[]): void {
    console.table(before.map((f, i) => ({
        Prima: f,
        Dopo: after[i]
    })))
}