import { Result } from "../types/result/result";

export interface IAnswers {
    save(): Promise<Result<void, number>>
}