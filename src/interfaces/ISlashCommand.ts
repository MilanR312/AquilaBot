import {AutocompleteInteraction, CommandInteraction, SlashCommandBuilder} from "discord.js";

export interface ISlashCommand {
    command: SlashCommandBuilder | any,
    execute: (interaction : CommandInteraction) => void,
    autocomplete?: (interaction: AutocompleteInteraction) => void,
    cooldown?: number // in seconds
}