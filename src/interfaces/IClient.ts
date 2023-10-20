import { Collection } from "discord.js";
import { ISlashCommand } from "./ISlashCommand";
import { ICommand } from "./ICommand";
//moet Client blijven anders wordt het niet herkend als type van de module

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, ISlashCommand>
        commands: Collection<string, ICommand>,
        cooldowns: Collection<string, number>
    }
}