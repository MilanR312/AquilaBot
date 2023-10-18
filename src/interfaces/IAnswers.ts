import {ChatInputCommandInteraction} from "discord.js";

export interface IAnswers {
    save(interaction: ChatInputCommandInteraction): Promise<void>
}