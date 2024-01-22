import { Collection } from "discord.js";
import * as answer from "./answer/mod";
import { ISlashCommand } from "src/interfaces/ISlashCommand";

const mods = [answer]

function generate_commands_table(){
    return mods.map(item => item.default.data.toJSON())
}
function generate_slash_command_table(){
    let slashCommands = new Collection<string, ISlashCommand>();
    for (const mod of mods){
        let commands = mod.default as any;
        slashCommands.set(commands.data.name, commands)
    }
    return slashCommands;
}

export const commands = generate_commands_table();
export const slash_commands = generate_slash_command_table();
