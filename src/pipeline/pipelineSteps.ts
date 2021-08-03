import { PipelineStep } from "./pipeline"

export function removeSuffix(suff: string): PipelineStep {
    return (filmName: string): string => {
        const lastIndex = filmName.lastIndexOf(suff);
        return lastIndex !== -1? filmName.slice(0, lastIndex): filmName;
    }
}

export function replace(search: string, replaceStr: string): PipelineStep {
    return (filmName: string): string => filmName.split(search).join(replaceStr)
}

export function removePrefix(prefix: string): PipelineStep {
    return (filmName: string): string => {
        const index = filmName.indexOf(prefix);
        return index !== -1? filmName.slice(filmName.indexOf(prefix) + prefix.length): filmName;
    }
}