import {ChatInputCommandInteraction} from "discord.js";
import { Result } from "src/types/result/result";

export interface IAnswers {
    save(): Promise<Result<void, number>>
}